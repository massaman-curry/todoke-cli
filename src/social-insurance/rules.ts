import { convertJapaneseEraToDate } from "../common/csv";
import iconv from "iconv-lite";

// Type and length tokens for pension-office CSV fields in 届書作成仕様書 17.0 / program Ver34.
// Compact encoding of published field widths. Not a copy of a checker data file.
// n: numeric lengths (comma=alternatives, dash=range); s: office symbol;
// k: half-width kana/ASCII; j: full-width text; b: mixed text maximum CP932 bytes.
// Ordered token groups follow the specification's 1-based item numbers.
// Keeping each form's tokens explicit makes column changes reviewable and keeps
// these validation tables independent of the generator's record construction.
function orderedRules(groups: string[]): string[] {
  return groups.flatMap((group) => group.split(" "));
}

const ACQUISITION_RULES = orderedRules([
  // Items 1–5: form code and office ID.
  "n7 n2 n2 s4 n1-5",
  // Items 6–12: insured number, names, birth date, sex and acquisition type.
  "n0 k25 j12 n1 n6 n1 n0,1",
  // Items 13–17: personal number, absence reason/note and pension number.
  "n0,12 n0,1 b75 n0,4 n0,6",
  // Items 18–20: acquisition date and dependents flag.
  "n1 n0,6 n1",
  // Items 21–23: cash, in-kind and total remuneration.
  "n1-7 n1-7 n1-7",
  // Items 24–29: remark flags and text.
  "n0,1 n0,1 n0,1 n0,1 n0,1 b75",
  // Items 30–33: postal code and addresses.
  "n0,3 n0,4 k75 j37",
  // Items 34–35: 70-or-over-only and insurance card flags.
  "n0,1 n0,1",
]);

const LOSS_RULES = orderedRules([
  // Items 1–5: form code and office ID.
  "n7 n2 n2 s4 n1-5",
  // Items 6–10: insured number, names and birth date.
  "n1-6 k25 j12 n1 n6",
  // Items 11–13: personal number and pension number.
  "n0,12 n0,4 n0,6",
  // Items 14–18: loss date/reason and retirement or death date.
  "n1 n0,6 n1-2 n1 n6",
  // Items 19–21: remark flags and text.
  "n0,1 n0,1 b75",
  // Items 22–23: insurance card counts.
  "n0-2 n0-2",
  // Items 24–27: 70-or-over non-applicable flags and date.
  "n1 n1 n6 n0,1",
]);

const BONUS_RULES = orderedRules([
  // Items 1–4: form code and office ID.
  "n7 n2 n2 s4",
  // Items 5–9: insured number, names and birth date.
  "n1-6 k25 j12 n1 n6",
  // Items 10–11: bonus payment date.
  "n1 n6",
  // Items 12–14: cash, in-kind and total bonus.
  "n1-7 n1-7 n1-7",
  // Items 15–17: personal number and pension number.
  "n0,12 n0,4 n0,6",
  // Items 18–21: 70-or-over flags, multiple offices and same-month first bonus day.
  "n0,1 n0,1 n0,2 n0,1",
]);

const STANDARD_REMUNERATION_RULES = orderedRules([
  // Items 1–4: form code and office ID.
  "n7 n2 n2 s4",
  // Items 5–9: insured number, names and birth date.
  "n1-6 k25 j12 n1 n6",
  // Items 10–12: application era, year and month.
  "n1 n2 n2",
  // Items 13–17: previous standard amounts and revision month.
  "n0,4 n0,4 n1 n2 n2",
  // Items 18–21: raise/reduction and retroactive payment.
  "n0,2 n0,1 n0,2 n0-7",
  // Items 22–27: payroll months and base days.
  "n2 n2 n2 n2 n2 n2",
  // Items 28–33: monthly cash and in-kind amounts.
  "n1-7 n1-7 n1-7 n1-7 n1-7 n1-7",
  // Items 34–39: monthly totals, grand total and averages.
  "n1-7 n1-7 n1-7 n1-7 n1-7 n0-7",
  // Items 40–42: personal number and pension number.
  "n0,12 n0,4 n0,6",
  // Items 43–44: 70-or-over flag and applicable months.
  "n0,1 n0,2,4",
  // Items 45–51: remaining remark flags.
  "n0,1 n0,1 n0,1 n0,1 n0,1 n0,1 n0,1",
  // Items 52–53: remarks text and 70-or-over-only flag.
  "b75 n0,1",
]);

const MONTHLY_CHANGE_RULES = orderedRules([
  // Items 1–4: form code and office ID.
  "n7 n2 n2 s4",
  // Items 5–9: insured number, names and birth date.
  "n1-6 k25 j12 n1 n6",
  // Items 10–12: revision era, year and month.
  "n1 n2 n2",
  // Items 13–17: previous standard amounts and revision month.
  "n0,4 n0,4 n1 n2 n2",
  // Items 18–21: raise/drop and retroactive payment.
  "n0,2 n0,1 n0,2 n0-7",
  // Items 22–27: payroll months and base days.
  "n2 n2 n2 n2 n2 n2",
  // Items 28–33: monthly cash and in-kind amounts.
  "n1-7 n1-7 n1-7 n1-7 n1-7 n1-7",
  // Items 34–39: monthly totals, grand total and averages.
  "n1-7 n1-7 n1-7 n1-7 n1-7 n0-7",
  // Items 40–42: personal number and pension number.
  "n0,12 n0,4 n0,6",
  // Items 43–45: 70-or-over, multiple offices and short-time flags.
  "n0,1 n0,1 n0,1",
  // Items 46–49: raise reason, health-only change, remarks and 70-or-over-only flag.
  "b75 n0,1 b75 n0,1",
]);

const KOKUNEN_THIRD_RULES = orderedRules([
  // Items 1–4: form code and office ID.
  "n7 n2 n2 s4",
  // Items 5–6: employer received date.
  "n1 n6",
  // Items 7–11: spouse names, birth date and sex.
  "k25 j12 n1 n6 n1",
  // Items 12–17: spouse identity and address.
  "n0,12 n0,4 n0,6 n0,3 n0,4 j37",
  // Items 18–19: third insured report date.
  "n1 n6",
  // Items 20–24: third insured names, birth date and relationship.
  "k25 j12 n1 n6 n1",
  // Items 25–30: third insured identity, nationality and aliases.
  "n0,12 n0,4 n0,6 k30 k25 j12",
  // Items 31–38: third insured cohabitation, address and phone.
  "n0,1 n0,3 n0,4 j37 n0,1 n0,2-5 n0,1-4 n0,4-5",
  // Items 39–44: movement type, became date/reason and spouse system.
  "n1 n0,1 n0,6 n0,1 b48 n0,2",
  // Items 45–50: lost date/reason, death date and other reason.
  "n1 n6 n0,1 n0,1 n0,6 b48",
  // Items 51–52: remarks and overseas special type.
  "b75 n0,1",
  // Items 53–56: overseas applicable date and reason.
  "n0,1 n0,6 n0,1 b48",
  // Items 57–60: overseas not-applicable date and reason.
  "n0,1 n0,6 n0,1 b48",
  // Items 61–63: overseas return date and declaration intent.
  "n0,1 n0,6 n0",
]);

const DEPENDENT_THIRD_RULES = orderedRules([
  // Items 1–4: form code and office ID.
  "n7 n2 n2 s4",
  // Items 5–7: employer confirmation and received date.
  "n0,1 n1 n6",
  // Items 8–13: insured number, names, birth date and sex.
  "n0-6 k25 j12 n1 n6 n1",
  // Items 14–20: insured identity, income and address.
  "n0,12 n0,4 n0,6 n0,7 n0,3 n0,4 j37",
  // Items 21–23: movement type and spouse notification date.
  "n1 n1 n6",
  // Items 24–28: spouse names, birth date and relationship.
  "k25 j12 n1 n6 n0,1",
  // Items 29–34: spouse identity, nationality and aliases.
  "n0,12 n0,4 n0,6 k30 k25 j12",
  // Items 35–43: spouse cohabitation, address and phone.
  "n1 n0,2 n0,3 n0,4 j37 n0,1 n0,2-5 n0,1-4 n0,4-5",
  // Items 44–49: spouse became date/reason, occupation and income.
  "n0,1 n0,6 n0,1 b48 n0,1 n0,7",
  // Items 50–57: spouse no-longer-dependent date/reason, death date, remarks and relationship confirmation.
  "n0,1 n0,6 n0,1 b48 n0,1 n0,6 b75 n0,1",
  // Items 58–62: spouse overseas exception and applicable date/reason.
  "n0,1 n0,1 n0,6 n0,1 b48",
  // Items 63–69: spouse overseas not-applicable date/reason, return date and income.
  "n0,1 n0,6 n0,1 b48 n0,1 n0,6 n0,7",
  // Items 70–78: other dependent 1: reserved, names, birth date, sex, relationship and identity.
  "n0 k25 j12 n1 n6 n0,1 n0,2 b24 n0,12",
  // Items 79–82: other dependent 1: cohabitation and address.
  "n1 n0,3 n0,4 j37",
  // Items 83–89: other dependent 1: overseas exception/reasons and return date.
  "n0,1 n0,1 b48 n0,1 b48 n0,1 n0,6",
  // Items 90–96: other dependent 1: became date, occupation, prefecture, income and reason.
  "n0,1 n0,6 n0,1 n0,2 n0,7 n0,1 b48",
  // Items 97–102: other dependent 1: no-longer-dependent date/reason, remarks and relationship confirmation.
  "n0,1 n0,6 n0,1 b48 b75 n0,1",
  // Items 103–111: other dependent 2: reserved, names, birth date, sex, relationship and identity.
  "n0 k25 j12 n1 n6 n0,1 n0,2 b24 n0,12",
  // Items 112–115: other dependent 2: cohabitation and address.
  "n1 n0,3 n0,4 j37",
  // Items 116–122: other dependent 2: overseas exception/reasons and return date.
  "n0,1 n0,1 b48 n0,1 b48 n0,1 n0,6",
  // Items 123–129: other dependent 2: became date, occupation, prefecture, income and reason.
  "n0,1 n0,6 n0,1 n0,2 n0,7 n0,1 b48",
  // Items 130–135: other dependent 2: no-longer-dependent date/reason, remarks and relationship confirmation.
  "n0,1 n0,6 n0,1 b48 b75 n0,1",
  // Items 136–139: declaration intent and spouse/other dependent insurance card flags.
  "n0 n0,1 n0,1 n0,1",
]);

const FORM_RULES: Record<string, string[]> = {
  "2200700": ACQUISITION_RULES,
  "2201700": LOSS_RULES,
  "2265700": BONUS_RULES,
  "2225700": STANDARD_REMUNERATION_RULES,
  "2221700": MONTHLY_CHANGE_RULES,
  "4300700": KOKUNEN_THIRD_RULES,
  "2202700": DEPENDENT_THIRD_RULES,
};

const OFFICE_RULES = orderedRules([
  // Items 1–3: prefecture, district and office symbol.
  "n2 n2 s4",
  // Items 4–6: office number and postal code.
  "n1-5 n3 n4",
  // Items 7–9: address, office name and owner.
  "b75 b50 b25",
  // Items 10–12: phone area, exchange and subscriber number.
  "n2-5 n1-4 n4-5",
]);

function matchesLength(value: string, spec: string): boolean {
  return spec.split(",").some((part) => {
    const [min, max = min] = part.split("-").map(Number);
    return value.length >= min && value.length <= max;
  });
}

// Specification 17.0 section 3.4 permits JIS X 0201 and selected JIS X 0208
// ranges only; CP932 vendor extensions and private-use glyphs are not permitted.
const DOUBLE_BYTE_RANGES = [
  [0x8140, 0x81ac], [0x824f, 0x8258], [0x8260, 0x8279], [0x8281, 0x829a],
  [0x829f, 0x82f1], [0x8340, 0x8396], [0x839f, 0x83b6], [0x83bf, 0x83d6],
  [0x8440, 0x8460], [0x8470, 0x8491], [0x889f, 0x9872], [0x989f, 0xeaa4],
];

function allowedCharacterCodes(value: string): boolean {
  const bytes = iconv.encode(value, "cp932");
  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index];
    if (byte <= 0x7f) {
      if (byte === 0x20 || byte === 0x2d || (byte >= 0x30 && byte <= 0x39) ||
          (byte >= 0x41 && byte <= 0x5a) || (byte >= 0x61 && byte <= 0x7a)) continue;
      return false;
    }
    if (byte >= 0xa6 && byte <= 0xdf) continue;
    const trail = bytes[++index];
    if (trail === undefined || trail < 0x40 || trail > 0xfc || trail === 0x7f || (byte >= 0xa0 && byte <= 0xdf)) return false;
    const code = (byte << 8) | trail;
    if (!DOUBLE_BYTE_RANGES.some(([min, max]) => code >= min && code <= max)) return false;
  }
  return true;
}

function validateFields(errors: string[], label: string, fields: string[], rules: string[]): void {
  fields.forEach((value, index) => {
    if (value === "") return; // Mandatory and conditional fields are checked by each form validator.
    const rule = rules[index];
    if (!rule) return;
    if (!allowedCharacterCodes(value)) errors.push(`${label}: field ${index + 1} contains a character prohibited by specification section 3.4`);
    const kind = rule[0];
    const limit = rule.slice(1);
    let valid: boolean;
    if (kind === "n") valid = /^\d+$/.test(value) && matchesLength(value, limit);
    else if (kind === "b") valid = iconv.encode(value, "cp932").length <= Number(limit);
    else if (kind === "s") valid = /^[A-Za-z0-9\uFF66-\uFF9F]+$/.test(value) && value.length <= Number(limit);
    else if (kind === "k") valid = /^[\x20-\x7E\uFF61-\uFF9F]+$/.test(value) && value.length <= Number(limit);
    else valid = !/[\x00-\x7F\uFF61-\uFF9F]/.test(value) && value.length <= Number(limit);
    if (!valid) errors.push(`${label}: field ${index + 1} violates Ver34 type/length rule ${rule}`);
  });
}

export function validateFormFields(errors: string[], lineNo: number, fields: string[]): void {
  const rules = FORM_RULES[fields[0]];
  if (rules) validateFields(errors, String(lineNo), fields, rules);
}

export function validateOfficeFields(errors: string[], fields: string[]): void {
  validateFields(errors, "office", fields, OFFICE_RULES);
}

/** Month fields describe the whole month, including the partial first/last era month. */
export function eraMonthToDate(era: string, year: string, month: string): Date | undefined {
  if (!/^[79]$/.test(era) || !/^\d{2}$/.test(year) || !/^(0[1-9]|1[0-2])$/.test(month)) return undefined;
  const date = convertJapaneseEraToDate(era, year + month + "15");
  if (!date) return undefined;
  date.setUTCDate(1);
  return date;
}

