import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import iconv from "iconv-lite";

/** Reject substitutions, including characters which CP932 maps to a different Unicode character. */
export function encodeCp932Strict(text: string): Buffer {
  const encoded = iconv.encode(text, "cp932");
  const decoded = iconv.decode(encoded, "cp932");
  if (decoded !== text) {
    const original = Array.from(text);
    const restored = Array.from(decoded);
    const index = original.findIndex((character, offset) => character !== restored[offset]);
    const character = original[index] ?? "";
    const code = character.codePointAt(0)?.toString(16).toUpperCase() ?? "unknown";
    throw new Error(`Cannot represent character ${JSON.stringify(character)} (U+${code}) losslessly in CP932.`);
  }
  return encoded;
}

/** Common file-level checks; field and relationship checks belong to each form's validator. */
export function readCsvText(csvPath: string, errors: string[]): string {
  const bytes = fs.readFileSync(path.resolve(csvPath));
  if (bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])) ||
      bytes.subarray(0, 2).equals(Buffer.from([0xff, 0xfe])) ||
      bytes.subarray(0, 2).equals(Buffer.from([0xfe, 0xff]))) {
    errors.push("CSV must be CP932 without a byte order mark (BOM).");
  }
  const text = iconv.decode(bytes, "cp932");
  if (text.includes("\ufffd")) errors.push("CSV contains invalid CP932 byte sequences.");
  const body = text.endsWith("\x1a") ? text.slice(0, -1) : text;
  if (body.includes("\x1a")) errors.push("EOF (0x1A) is allowed only once, at the end of the file.");
  if (!body.endsWith("\r\n")) errors.push("Last record must end with CRLF.");
  if (/(?<!\r)\n|\r(?!\n)/.test(body)) errors.push("Every record must use CRLF line endings.");
  if (/[\x00-\x09\x0b\x0c\x0e-\x1f\x7f]/.test(body)) errors.push("CSV contains a forbidden control character.");
  const lines = body.split("\r\n");
  if (lines[lines.length - 1] === "") lines.pop();
  if (lines.some((line) => line === "")) errors.push("Empty CSV records are not allowed.");
  if (bytes.length === 0) errors.push("CSV must contain records.");
  return text;
}

/** Validate an isolated candidate first. An invalid candidate never replaces the destination. */
export function writeValidatedCsv(outputPath: string, content: string, validate: (csvPath: string) => string[]): void {
  const encoded = encodeCp932Strict(content);
  const output = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const temporary = path.join(path.dirname(output), `.${path.basename(output)}.${randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporary, encoded, { flag: "wx" });
    const errors = validate(temporary);
    if (errors.length > 0) throw new Error(`CSV validation failed:\n${errors.join("\n")}`);
    fs.renameSync(temporary, output);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}

export function parseGregorianDate(value: string): Date {
  const match = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(value);
  if (!match || (value[4] !== value[7])) throw new Error(`Invalid date: ${value}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (year < 1 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
}

export function formatYmd(value: string): string {
  const expanded = /^\d{8}$/.test(value) ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : value;
  const date = parseGregorianDate(expanded);
  return `${String(date.getUTCFullYear()).padStart(4, "0")}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
}

const ERAS = [
  { code: "1", start: "1868-01-25", end: "1912-07-29" },
  { code: "3", start: "1912-07-30", end: "1926-12-24" },
  { code: "5", start: "1926-12-25", end: "1989-01-07" },
  { code: "7", start: "1989-01-08", end: "2019-04-30" },
  { code: "9", start: "2019-05-01", end: undefined },
] as const;

export function convertJapaneseEraToDate(era: string, ymd: string): Date | undefined {
  const definition = ERAS.find((candidate) => candidate.code === era);
  if (!definition || !/^\d{6}$/.test(ymd) || Number(ymd.slice(0, 2)) === 0) return undefined;
  const year = Number(definition.start.slice(0, 4)) + Number(ymd.slice(0, 2)) - 1;
  try {
    const date = parseGregorianDate(`${year}-${ymd.slice(2, 4)}-${ymd.slice(4, 6)}`);
    if (date < parseGregorianDate(definition.start) || (definition.end && date > parseGregorianDate(definition.end))) return undefined;
    return date;
  } catch {
    return undefined;
  }
}

/** A February 29 anniversary falls on March 1 in a non-leap year. */
export function birthAnniversary(birth: Date, years: number): Date {
  if (!Number.isFinite(birth.getTime()) || !Number.isSafeInteger(years) || years < 0 || birth.getUTCFullYear() + years > 9999) {
    throw new Error("Invalid birth anniversary arguments.");
  }
  const anniversary = new Date(0);
  anniversary.setUTCHours(0, 0, 0, 0);
  anniversary.setUTCFullYear(birth.getUTCFullYear() + years, birth.getUTCMonth(), birth.getUTCDate());
  return anniversary;
}
