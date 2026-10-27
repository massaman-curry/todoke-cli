import { convertJapaneseEraToDate } from "../../common/csv";
import { eraMonthToDate, validateFormFields } from "../rules";
import { readAndValidateHeader } from "../validation/header";
import {
  addError,
  assertFieldCount,
  testDigits,
  testNonZeroDigits,
  testFieldLength,
  testNameSpace,
  testMyNumber,
  hasBothOrNeither,
  testAllowedOfficeSymbol,
} from "../validation/primitives";

function convertJapaneseEraMonthToComparable(era: string, year: string, month: string): number | undefined {
  const date = eraMonthToDate(era, year, month);
  return date ? date.getUTCFullYear() * 12 + date.getUTCMonth() + 1 : undefined;
}
function monthBack(month: string, count: number): string {
  const monthNumber = Number(month);
  const normalized = ((monthNumber - 1 - count) % 12 + 12) % 12;
  return String(normalized + 1).padStart(2, "0");
}

function amount(value: string): number {
  if (value === "9999999") return 9999999;
  return Number(value);
}

function amountSum(left: string, right: string): string {
  const sum = amount(left) + amount(right);
  return sum >= 10000000 ? "9999999" : String(sum);
}

export function validate(csvPath: string): string[] {
  const errors: string[] = [];
  const { lines, office } = readAndValidateHeader(csvPath, errors, testAllowedOfficeSymbol);

  for (let lineNo = 6; lineNo <= lines.length; lineNo += 1) {
    if (lines[lineNo - 1] === "") continue;
    const f = lines[lineNo - 1].split(",");
    assertFieldCount(errors, lineNo, f, 49, "monthly change");
    if (f.length !== 49) continue;
    validateFormFields(errors, lineNo, f);

    if (f[0] !== "2221700") addError(errors, `${lineNo}: form code must be 2221700`);
    if (f[1] !== office[0] || f[2] !== office[1] || f[3] !== office[2]) {
      addError(errors, `${lineNo}: employee office ID must match office info`);
    }

    const onlyOver70 = f[48] === "1";
    if (!testDigits(f[4], 1, 6, !onlyOver70) || /^0+$/.test(f[4])) addError(errors, `${lineNo}: insured number is invalid`);
    if (!testFieldLength(f[5], 1, 25, true) || !testNameSpace(f[5], true)) addError(errors, `${lineNo}: kana name format is invalid`);
    if (!testFieldLength(f[6], 0, 12) || !testNameSpace(f[6])) addError(errors, `${lineNo}: kanji name format is invalid`);

    const birthDate = convertJapaneseEraToDate(f[7], f[8]);
    if (!birthDate) addError(errors, `${lineNo}: birth date is invalid`);

    const revision = convertJapaneseEraMonthToComparable(f[9], f[10], f[11]);
    if (!revision) addError(errors, `${lineNo}: revision month is invalid`);
    if (revision && birthDate && revision < birthDate.getUTCFullYear() * 12 + birthDate.getUTCMonth() + 1) addError(errors, `${lineNo}: revision month must not precede birth`);
    const previousRevision = convertJapaneseEraMonthToComparable(f[14], f[15], f[16]);
    if (!previousRevision) addError(errors, `${lineNo}: previous revision month is invalid`);
    if (revision && previousRevision && previousRevision >= revision) addError(errors, `${lineNo}: previous revision month must be before revision month`);

    if (!testNonZeroDigits(f[12], 4, 4) || !testNonZeroDigits(f[13], 4, 4)) {
      addError(errors, `${lineNo}: standard monthly remuneration must be empty or non-zero 4 digits`);
    }
    if (f[12] === "" && f[13] === "") addError(errors, `${lineNo}: health or pension standard monthly remuneration is required`);

    if (!hasBothOrNeither(f[17], f[18])) addError(errors, `${lineNo}: raise/drop month and type must both be set or both empty`);
    if (f[17] !== "" && !/^(0[1-9]|1[0-2])$/.test(f[17])) addError(errors, `${lineNo}: raise/drop month is invalid`);
    if (f[18] !== "" && !["1", "2"].includes(f[18])) addError(errors, `${lineNo}: raise/drop type must be 1 or 2`);
    if (f[19] !== "" && !/^(0[1-9]|1[0-2])$/.test(f[19])) addError(errors, `${lineNo}: retroactive payment month is invalid`);
    if (!testDigits(f[20], 0, 7)) addError(errors, `${lineNo}: retroactive payment amount is invalid`);
    if (f[19] === "" && f[20] !== "") addError(errors, `${lineNo}: retroactive payment month is required when amount is set`);

    if (![f[21], f[22], f[23]].every((value) => /^(0[1-9]|1[0-2])$/.test(value))) {
      addError(errors, `${lineNo}: payroll months must be 01-12`);
    }
    if (f[21] !== monthBack(f[11], 3) || f[22] !== monthBack(f[11], 2) || f[23] !== monthBack(f[11], 1)) {
      addError(errors, `${lineNo}: payroll months must be the three months before revision month`);
    }

    const shortTime = f[44] === "1";
    const minimumDays = shortTime ? 11 : 17;
    for (let index = 24; index <= 26; index += 1) {
      if (!testDigits(f[index], 2, 2, true) || Number(f[index]) < minimumDays || Number(f[index]) > 31) {
        addError(errors, `${lineNo}: base days field ${index + 1} must be ${minimumDays}-31`);
      }
    }

    for (let index = 27; index <= 38; index += 1) {
      const required = index !== 38;
      if (!testDigits(f[index], required ? 1 : 0, 7, required)) addError(errors, `${lineNo}: amount field ${index + 1} is invalid`);
    }
    if (amount(f[33]) !== amount(amountSum(f[27], f[30]))) addError(errors, `${lineNo}: total for three months before revision must equal cash plus in-kind`);
    if (amount(f[34]) !== amount(amountSum(f[28], f[31]))) addError(errors, `${lineNo}: total for two months before revision must equal cash plus in-kind`);
    if (amount(f[35]) !== amount(amountSum(f[29], f[32]))) addError(errors, `${lineNo}: total for one month before revision must equal cash plus in-kind`);
    const calculatedGrandTotal = amount(f[33]) + amount(f[34]) + amount(f[35]);
    const expectedGrandTotal = calculatedGrandTotal >= 10000000 ? "9999999" : String(calculatedGrandTotal);
    if (amount(f[36]) !== amount(expectedGrandTotal)) addError(errors, `${lineNo}: grand total must equal the three total amount fields`);
    const components = f.slice(27, 33);
    const minimumAverage = Math.min(9999999, Math.floor(components.reduce((sum, value) => sum + amount(value), 0) / 3));
    const unknownComponents = components.some((value) => Number(value) === 9999999);
    if ((!unknownComponents || minimumAverage === 9999999) ? amount(f[37]) !== minimumAverage : amount(f[37]) < minimumAverage) addError(errors, `${lineNo}: average amount is inconsistent with monthly remuneration before capping`);

    if (!testMyNumber(f[39])) addError(errors, `${lineNo}: personal number check digit is invalid`);
    if (!hasBothOrNeither(f[40], f[41])) addError(errors, `${lineNo}: pension number parts must both be set or both empty`);
    if (f[40] !== "" && (!testNonZeroDigits(f[40], 4, 4, true) || !testNonZeroDigits(f[41], 6, 6, true))) {
      addError(errors, `${lineNo}: pension number must be non-zero 4 and 6 digit parts`);
    }
    if ((onlyOver70 || f[42] === "1") && f[39] === "" && (f[40] === "" || f[41] === "")) {
      addError(errors, `${lineNo}: personal number or pension number is required for over-70 records`);
    }

    for (let index = 42; index <= 44; index += 1) {
      if (f[index] !== "" && f[index] !== "1") addError(errors, `${lineNo}: remark flag field ${index + 1} must be empty or 1`);
    }
    if (!testFieldLength(f[45], 0, 75)) addError(errors, `${lineNo}: raise/drop reason length is invalid`);
    if (f[46] !== "" && f[46] !== "1") addError(errors, `${lineNo}: health-only monthly change flag must be empty or 1`);
    if (!testFieldLength(f[47], 0, 75)) addError(errors, `${lineNo}: remarks length is invalid`);
    if (f[48] !== "" && f[48] !== "1") addError(errors, `${lineNo}: only over-70 flag must be empty or 1`);
    if (onlyOver70 && f[42] !== "1") addError(errors, `${lineNo}: only over-70 records require over-70 remark flag`);
  }

  return errors;
}
