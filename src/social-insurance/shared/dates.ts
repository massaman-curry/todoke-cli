import { parseGregorianDate as parseDate } from "../../common/csv";

export interface EraDate {
  era: string;
  ymd: string;
}

// Most recent first. Keep the historical boundaries used by all seven generators.
const ERAS = [
  { code: "9", start: new Date(Date.UTC(2019, 4, 1)) },
  { code: "7", start: new Date(Date.UTC(1989, 0, 8)) },
  { code: "5", start: new Date(Date.UTC(1926, 11, 25)) },
  { code: "3", start: new Date(Date.UTC(1912, 6, 30)) },
  { code: "1", start: new Date(Date.UTC(1868, 0, 25)) },
];

/** Era notation passes through unchanged; the form validator checks its date parts. */
export function convertToJapaneseEraDate(name: string, value: string, required = true): EraDate {
  if (value === "" && !required) return { era: "", ymd: "" };
  if (/^[13579]\d{6}$/.test(value)) {
    return { era: value.slice(0, 1), ymd: value.slice(1, 7) };
  }
  if (/^[13579]:\d{6}$/.test(value)) {
    return { era: value.slice(0, 1), ymd: value.slice(2, 8) };
  }

  const date = parseDate(value);
  const era = getEra(name, date);
  return { era: era.code, ymd: `${pad2(era.year)}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` };
}

export function getEra(name: string, date: Date): { code: string; year: number } {
  for (const era of ERAS) {
    if (date >= era.start) {
      return { code: era.code, year: date.getUTCFullYear() - era.start.getUTCFullYear() + 1 };
    }
  }

  throw new Error(`${name} is before supported eras.`);
}

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
