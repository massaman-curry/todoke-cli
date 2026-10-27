// Validator-only primitives. Generator assertions remain independent.

export function addError(errors: string[], message: string): void {
  errors.push(message);
}

export function assertFieldCount(errors: string[], lineNo: number, fields: string[], expected: number, recordName: string): void {
  if (fields.length !== expected) {
    addError(errors, `${lineNo}: ${recordName} item count must be ${expected}; actual ${fields.length}`);
  }
}

export function testDigits(value: string | undefined, min: number, max: number, required = false): boolean {
  const text = value ?? "";
  if (text === "") return !required;
  return /^\d+$/.test(text) && text.length >= min && text.length <= max;
}

export function testNonZeroDigits(value: string | undefined, min: number, max: number, required = false): boolean {
  const text = value ?? "";
  if (!testDigits(text, min, max, required)) return false;
  if (text === "") return !required;
  return BigInt(text) !== 0n;
}

export function testFieldLength(value: string | undefined, min: number, max: number, required = false): boolean {
  const text = value ?? "";
  if (text === "") return !required;
  return text.length >= min && text.length <= max;
}

export function addDaysUtc(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function testNameSpace(value: string, kana = false): boolean {
  if (value === "") return true;
  if (kana) return /^[^ ]+ [^ ]+( [^ ]+)?$/.test(value);
  const parts = value.split("\u3000");
  return (parts.length === 2 || parts.length === 3) && !parts.includes("");
}

export function testMyNumber(value: string): boolean {
  if (value === "") return true;
  if (!/^\d{12}$/.test(value)) return false;

  let sum = 0;
  for (let n = 1; n <= 11; n += 1) {
    const p = Number(value[11 - n]);
    const q = n <= 6 ? n + 1 : n - 5;
    sum += p * q;
  }
  const r = sum % 11;
  const check = r <= 1 ? 0 : 11 - r;
  return check === Number(value[11]);
}

export function isRealYmd(value: string): boolean {
  if (!/^\d{8}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function hasBothOrNeither(left: string, right: string): boolean {
  return (left === "") === (right === "");
}

export function hasAnyValue(values: string[]): boolean {
  return values.some((value) => value !== "");
}

export function testAllowedOfficeSymbol(value: string): boolean {
  if (!testFieldLength(value, 1, 4, true)) return false;
  if (/^[0-9]+$/.test(value)) {
    return BigInt(value) !== 0n;
  }
  return true;
}
