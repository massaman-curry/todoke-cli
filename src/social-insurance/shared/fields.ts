import type { JsonValue } from "./types";

export function getString(object: object | undefined, name: string, fallback = ""): string {
  if (!object) return fallback;
  const value = (object as Record<string, unknown>)[name];
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function assertNoDelimiter(name: string, value: string): void {
  if (value.includes(",") || value.includes("\r") || value.includes("\n")) {
    throw new Error(`${name} contains a comma or newline, which cannot be emitted in this CSV format.`);
  }
}

export function assertLength(name: string, value: string, min: number, max: number, required = false): void {
  if (required && value.length < min) {
    throw new Error(`${name} is required and must be at least ${min} character(s).`);
  }
  if (value.length > max) {
    throw new Error(`${name} must be at most ${max} character(s). Actual: ${value.length}.`);
  }
  if (!required && value.length > 0 && value.length < min) {
    throw new Error(`${name} must be empty or at least ${min} character(s).`);
  }
}

export function assertDigits(name: string, value: string, min: number, max: number, required = false): void {
  assertLength(name, value, min, max, required);
  if (value.length > 0 && !/^\d+$/.test(value)) {
    throw new Error(`${name} must contain digits only.`);
  }
}

export function assertField(name: string, value: string, min: number, max: number, required = false): void {
  assertNoDelimiter(name, value);
  assertLength(name, value, min, max, required);
}

export function assertNameSpacing(name: string, value: string, kana = false): void {
  if (value === "") return;
  if (kana) {
    if (!/^[^ ]+ [^ ]+( [^ ]+)?$/.test(value)) {
      throw new Error(`${name} must contain one half-width space between surname and given name.`);
    }
    return;
  }
  const parts = value.split("\u3000");
  if (!([2, 3].includes(parts.length)) || parts.includes("")) {
    throw new Error(`${name} must contain one full-width space between surname and given name.`);
  }
}

export function newLine(fields: string[]): string {
  fields.forEach((field, index) => assertNoDelimiter(`field[${index}]`, field));
  return fields.join(",");
}

export function getArrayString(values: JsonValue[] | undefined, index: number, fallback = ""): string {
  if (!values || values[index] === null || values[index] === undefined) return fallback;
  return String(values[index]);
}
