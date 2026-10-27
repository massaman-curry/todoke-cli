import { getString, newLine, assertDigits, assertField, assertNameSpacing, getArrayString } from "../shared/fields";
import { convertToJapaneseEraDate, getEra, pad2 } from "../shared/dates";
import { newEnvelope, finishCsv } from "../shared/envelope";
import type { CsvGenerationOptions, Office } from "../shared/types";
import type { Employee, Config } from "./types";

interface EraMonth {
  era: string;
  year: string;
  month: string;
}

function convertToJapaneseEraMonth(name: string, value: string): EraMonth {
  if (/^[79]\d{4}$/.test(value)) {
    return { era: value.slice(0, 1), year: value.slice(1, 3), month: value.slice(3, 5) };
  }
  if (/^[79]:\d{4}$/.test(value)) {
    return { era: value.slice(0, 1), year: value.slice(2, 4), month: value.slice(4, 6) };
  }
  if (/^\d{4}-\d{2}$/.test(value) || /^\d{4}\/\d{2}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(5, 7));
    const date = new Date(Date.UTC(year, month - 1, 15));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1) throw new Error(`Invalid month: ${value}`);
    const era = getEra(name, date);
    if (!["7", "9"].includes(era.code)) throw new Error(`${name} must be Heisei or Reiwa.`);
    return { era: era.code, year: pad2(era.year), month: pad2(month) };
  }

  throw new Error(`Invalid month: ${value}`);
}

function addMonths(month: number, delta: number): string {
  const normalized = ((month - 1 + delta) % 12 + 12) % 12;
  return pad2(normalized + 1);
}

function cappedAmount(value: number): string {
  return value >= 10000000 ? "9999999" : String(value);
}

function numeric(value: string): number {
  if (!/^\d{1,7}$/.test(value)) throw new Error(`Invalid amount: ${value}; use 1-7 integer digits.`);
  return Number(value);
}

function newEmployeeRecord(office: Office, employee: Employee): string {
  const birth = convertToJapaneseEraDate("birth_date", getString(employee, "birth_date"));
  const revision = convertToJapaneseEraMonth("revision_month", getString(employee, "revision_month"));
  const previousRevision = convertToJapaneseEraMonth("previous_revision_month", getString(employee, "previous_revision_month"));
  const revisionMonthNumber = Number(revision.month);
  const payrollMonths = [
    getArrayString(employee.payroll_months, 0, addMonths(revisionMonthNumber, -3)),
    getArrayString(employee.payroll_months, 1, addMonths(revisionMonthNumber, -2)),
    getArrayString(employee.payroll_months, 2, addMonths(revisionMonthNumber, -1)),
  ];
  const baseDays = [0, 1, 2].map((index) => getArrayString(employee.base_days, index));
  const cash = [0, 1, 2].map((index) => getArrayString(employee.cash_amounts, index, "0"));
  const inKind = [0, 1, 2].map((index) => getArrayString(employee.in_kind_amounts, index, "0"));
  cash.forEach(numeric);
  inKind.forEach(numeric);
  const actualGrandTotal = cash.reduce((sum, value, index) => sum + numeric(value) + numeric(inKind[index]), 0);
  const totals = [0, 1, 2].map((index) => {
    const configured = getArrayString(employee.total_amounts, index);
    if (configured !== "") return configured;
    return cappedAmount(numeric(cash[index]) + numeric(inKind[index]));
  });
  let grandTotal = getString(employee, "grand_total");
  if (grandTotal === "") grandTotal = cappedAmount(actualGrandTotal);
  let averageAmount = getString(employee, "average_amount");
  const expectedAverage = cappedAmount(Math.floor(actualGrandTotal / 3));
  if (averageAmount === "") averageAmount = expectedAverage;
  else if (!/^\d{1,7}$/.test(averageAmount) || Number(averageAmount) !== Number(expectedAverage)) throw new Error("average_amount must match the actual monthly remuneration average before capping.");

  const fields = [
    "2221700", // 1
    getString(office, "prefecture_code"), // 2
    getString(office, "district_code"), // 3
    getString(office, "office_symbol"), // 4
    getString(employee, "insured_number"), // 5
    getString(employee, "insured_kana"), // 6
    getString(employee, "insured_name"), // 7
    birth.era, // 8
    birth.ymd, // 9
    revision.era, // 10
    revision.year, // 11
    revision.month, // 12
    getString(employee, "previous_standard_monthly_health"), // 13
    getString(employee, "previous_standard_monthly_pension"), // 14
    previousRevision.era, // 15
    previousRevision.year, // 16
    previousRevision.month, // 17
    getString(employee, "raise_or_drop_month"), // 18
    getString(employee, "raise_or_drop_type"), // 19
    getString(employee, "retroactive_payment_month"), // 20
    getString(employee, "retroactive_payment_amount"), // 21
    payrollMonths[0], // 22
    payrollMonths[1], // 23
    payrollMonths[2], // 24
    baseDays[0], // 25
    baseDays[1], // 26
    baseDays[2], // 27
    cash[0], // 28
    cash[1], // 29
    cash[2], // 30
    inKind[0], // 31
    inKind[1], // 32
    inKind[2], // 33
    totals[0], // 34
    totals[1], // 35
    totals[2], // 36
    grandTotal, // 37
    averageAmount, // 38
    getString(employee, "corrected_average_amount"), // 39
    getString(employee, "personal_number"), // 40
    getString(employee, "basic_pension_office_code"), // 41
    getString(employee, "basic_pension_serial"), // 42
    getString(employee, "remarks_70_or_over"), // 43
    getString(employee, "remarks_multiple_offices"), // 44
    getString(employee, "remarks_short_time"), // 45
    getString(employee, "remarks_raise_reason"), // 46
    getString(employee, "remarks_health_only_change"), // 47
    getString(employee, "remarks"), // 48
    getString(employee, "only_70_or_over"), // 49
  ];

  assertDigits("employee.form_code", fields[0], 7, 7, true);
  assertDigits("employee.prefecture_code", fields[1], 2, 2, true);
  assertDigits("employee.district_code", fields[2], 2, 2, true);
  assertField("employee.office_symbol", fields[3], 1, 4, true);
  assertDigits("employee.insured_number", fields[4], 1, 6, getString(employee, "only_70_or_over") !== "1");
  assertField("employee.insured_kana", fields[5], 1, 25, true);
  assertField("employee.insured_name", fields[6], 0, 12);
  assertNameSpacing("employee.insured_kana", fields[5], true);
  assertNameSpacing("employee.insured_name", fields[6]);
  assertDigits("employee.birth_era", fields[7], 1, 1, true);
  assertDigits("employee.birth_ymd", fields[8], 6, 6, true);
  assertDigits("employee.revision_era", fields[9], 1, 1, true);
  assertDigits("employee.revision_year", fields[10], 2, 2, true);
  assertDigits("employee.revision_month", fields[11], 2, 2, true);
  assertDigits("employee.previous_standard_monthly_health", fields[12], 0, 4);
  assertDigits("employee.previous_standard_monthly_pension", fields[13], 0, 4);
  assertDigits("employee.previous_revision_era", fields[14], 1, 1, true);
  assertDigits("employee.previous_revision_year", fields[15], 2, 2, true);
  assertDigits("employee.previous_revision_month", fields[16], 2, 2, true);
  assertDigits("employee.raise_or_drop_month", fields[17], 0, 2);
  assertDigits("employee.raise_or_drop_type", fields[18], 0, 1);
  assertDigits("employee.retroactive_payment_month", fields[19], 0, 2);
  assertDigits("employee.retroactive_payment_amount", fields[20], 0, 7);
  for (let index = 21; index <= 26; index += 1) assertDigits(`employee.month_or_days_${index}`, fields[index], 2, 2, true);
  for (let index = 27; index <= 38; index += 1) assertDigits(`employee.amount_${index}`, fields[index], index === 38 ? 0 : 1, 7, index !== 38);
  assertDigits("employee.personal_number", fields[39], 0, 12);
  assertDigits("employee.basic_pension_office_code", fields[40], 0, 4);
  assertDigits("employee.basic_pension_serial", fields[41], 0, 6);
  for (let index = 42; index <= 44; index += 1) assertDigits(`employee.remark_flag_${index}`, fields[index], 0, 1);
  assertField("employee.remarks_raise_reason", fields[45], 0, 75);
  assertDigits("employee.remarks_health_only_change", fields[46], 0, 1);
  assertField("employee.remarks", fields[47], 0, 75);
  assertDigits("employee.only_70_or_over", fields[48], 0, 1);

  return newLine(fields);
}

/** Assemble CSV text without file IO; the CLI handles CSV validation and CP932 publication. */
export function buildCsv(config: Config, options: CsvGenerationOptions = {}): string {
  const office = config.office;
  const outputLines = newEnvelope(config, options);

  for (const employee of config.employees) {
    outputLines.push(newEmployeeRecord(office, employee));
  }

  if (outputLines.length <= 5) {
    throw new Error("At least one employee record is required.");
  }

  return finishCsv(config, outputLines);
}
