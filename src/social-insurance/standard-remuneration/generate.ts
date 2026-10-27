import { parseGregorianDate as parseDate } from "../../common/csv";
import { getString, newLine, assertDigits, assertField, assertNameSpacing } from "../shared/fields";
import { convertToJapaneseEraDate, getEra, pad2 } from "../shared/dates";
import { newEnvelope, finishCsv } from "../shared/envelope";
import type { CsvGenerationOptions, Office } from "../shared/types";
import type { Employee, Config } from "./types";

interface EraMonth {
  era: string;
  year: string;
  month: string;
}

function convertToJapaneseEraMonth(name: string, value: string, required = true): EraMonth {
  if (value === "" && !required) return { era: "", year: "", month: "" };
  if (/^[79]\d{4}$/.test(value)) {
    return { era: value.slice(0, 1), year: value.slice(1, 3), month: value.slice(3, 5) };
  }
  if (/^[79]:\d{4}$/.test(value)) {
    return { era: value.slice(0, 1), year: value.slice(2, 4), month: value.slice(4, 6) };
  }
  if (/^\d{4}-\d{2}$/.test(value) || /^\d{4}\/\d{2}$/.test(value)) {
    const date = parseDate(`${value.replace("/", "-")}-15`);
    const era = getEra(name, date);
    return { era: era.code, year: pad2(era.year), month: pad2(date.getUTCMonth() + 1) };
  }
  throw new Error(`Invalid era month: ${name}=${value}`);
}

function toNumber(value: string): number {
  if (!/^\d{1,7}$/.test(value)) throw new Error(`Invalid amount: ${value}; use 1-7 integer digits.`);
  return Number(value);
}

function sumAmount(left: string, right: string): string {
  const total = toNumber(left) + toNumber(right);
  return total >= 10000000 ? "9999999" : String(total);
}

function amount(employee: Employee, name: keyof Employee, fallback = "0"): string {
  const value = getString(employee, String(name), fallback);
  toNumber(value);
  return value;
}

function newEmployeeRecord(office: Office, employee: Employee): string {
  const birth = convertToJapaneseEraDate("birth_date", getString(employee, "birth_date"));
  const application = convertToJapaneseEraMonth("application_date", getString(employee, "application_date", getString(employee, "application_year")));
  const previousRevision = convertToJapaneseEraMonth("previous_revision_month", getString(employee, "previous_revision_month"));
  const aprilCash = amount(employee, "april_cash_amount");
  const mayCash = amount(employee, "may_cash_amount");
  const juneCash = amount(employee, "june_cash_amount");
  const aprilInKind = amount(employee, "april_in_kind_amount");
  const mayInKind = amount(employee, "may_in_kind_amount");
  const juneInKind = amount(employee, "june_in_kind_amount");
  const aprilTotal = getString(employee, "april_total_amount", sumAmount(aprilCash, aprilInKind));
  const mayTotal = getString(employee, "may_total_amount", sumAmount(mayCash, mayInKind));
  const juneTotal = getString(employee, "june_total_amount", sumAmount(juneCash, juneInKind));
  const days = [
    Number(getString(employee, "april_base_days", "0")),
    Number(getString(employee, "may_base_days", "0")),
    Number(getString(employee, "june_base_days", "0")),
  ];
  const shortTime = getString(employee, "remarks_short_time_worker") === "1";
  const partTime = getString(employee, "remarks_part_time") === "1";
  const actualTotals = [toNumber(aprilCash) + toNumber(aprilInKind), toNumber(mayCash) + toNumber(mayInKind), toNumber(juneCash) + toNumber(juneInKind)];
  const threshold = shortTime ? 11 : partTime && days.every((day) => day < 17) ? 15 : 17;
  const eligible = actualTotals.filter((_, index) => days[index] >= threshold);
  const actualGrandTotal = eligible.reduce((sum, value) => sum + value, 0);
  const grandTotal = getString(employee, "grand_total_amount", String(Math.min(9999999, actualGrandTotal)));
  const expectedAverage = eligible.length ? Math.min(9999999, Math.floor(actualGrandTotal / eligible.length)) : 0;
  const average = getString(employee, "average_amount", String(expectedAverage));
  if (!/^\d{1,7}$/.test(average) || Number(average) !== expectedAverage) throw new Error("average_amount must match the actual eligible monthly remuneration average before capping.");

  const fields = [
    "2225700", // 1
    getString(office, "prefecture_code"), // 2
    getString(office, "district_code"), // 3
    getString(office, "office_symbol"), // 4
    getString(employee, "insured_number"), // 5
    getString(employee, "insured_kana"), // 6
    getString(employee, "insured_name"), // 7
    birth.era, // 8
    birth.ymd, // 9
    application.era, // 10
    application.year, // 11
    application.month, // 12
    getString(employee, "previous_health_standard_monthly_amount"), // 13
    getString(employee, "previous_pension_standard_monthly_amount"), // 14
    previousRevision.era, // 15
    previousRevision.year, // 16
    previousRevision.month, // 17
    getString(employee, "raise_or_reduction_month"), // 18
    getString(employee, "raise_or_reduction_type"), // 19
    getString(employee, "retroactive_payment_month"), // 20
    getString(employee, "retroactive_payment_amount"), // 21
    "04", // 22
    "05", // 23
    "06", // 24
    getString(employee, "april_base_days"), // 25
    getString(employee, "may_base_days"), // 26
    getString(employee, "june_base_days"), // 27
    aprilCash, // 28
    mayCash, // 29
    juneCash, // 30
    aprilInKind, // 31
    mayInKind, // 32
    juneInKind, // 33
    aprilTotal, // 34
    mayTotal, // 35
    juneTotal, // 36
    grandTotal, // 37
    average, // 38
    getString(employee, "corrected_average_amount"), // 39
    getString(employee, "personal_number"), // 40
    getString(employee, "basic_pension_office_code"), // 41
    getString(employee, "basic_pension_serial"), // 42
    getString(employee, "remarks_70_or_over"), // 43
    getString(employee, "over_70_months"), // 44
    getString(employee, "remarks_multiple_offices"), // 45
    getString(employee, "remarks_monthly_change_planned"), // 46
    getString(employee, "remarks_partial_month"), // 47
    getString(employee, "remarks_leave"), // 48
    getString(employee, "remarks_short_time_worker"), // 49
    getString(employee, "remarks_part_time"), // 50
    getString(employee, "remarks_annual_average"), // 51
    getString(employee, "remarks"), // 52
    getString(employee, "only_70_or_over"), // 53
  ];

  assertDigits("employee.form_code", fields[0], 7, 7, true);
  assertDigits("employee.prefecture_code", fields[1], 2, 2, true);
  assertDigits("employee.district_code", fields[2], 2, 2, true);
  assertField("employee.office_symbol", fields[3], 1, 4, true);
  assertDigits("employee.insured_number", fields[4], 0, 6, fields[52] !== "1");
  assertField("employee.insured_kana", fields[5], 1, 25, true);
  assertField("employee.insured_name", fields[6], 0, 12);
  assertNameSpacing("employee.insured_kana", fields[5], true);
  assertNameSpacing("employee.insured_name", fields[6]);
  for (const index of [7, 9, 14]) assertDigits(`employee.era_${index + 1}`, fields[index], 1, 1, true);
  for (const index of [8]) assertDigits(`employee.date_${index + 1}`, fields[index], 6, 6, true);
  for (const index of [10, 11, 15, 16, 24, 25, 26]) assertDigits(`employee.month_field_${index + 1}`, fields[index], 2, 2, true);
  for (const index of [17, 19]) assertDigits(`employee.optional_month_field_${index + 1}`, fields[index], 0, 2);
  for (const index of [12, 13]) assertDigits(`employee.standard_amount_${index + 1}`, fields[index], 0, 4);
  assertDigits("employee.raise_or_reduction_type", fields[18], 0, 1);
  for (const index of [20, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37]) {
    assertDigits(`employee.amount_${index + 1}`, fields[index], 1, 7, index !== 20);
  }
  assertDigits("employee.corrected_average_amount", fields[38], 0, 7);
  assertDigits("employee.personal_number", fields[39], 0, 12);
  assertDigits("employee.basic_pension_office_code", fields[40], 0, 4);
  assertDigits("employee.basic_pension_serial", fields[41], 0, 6);
  for (let index = 42; index <= 50; index += 1) assertDigits(`employee.remark_flag_${index + 1}`, fields[index], 0, index === 43 ? 4 : 1);
  assertField("employee.remarks", fields[51], 0, 75);
  assertDigits("employee.only_70_or_over", fields[52], 0, 1);

  if ((fields[42] === "1" || fields[52] === "1") && fields[39] === "" && (fields[40] === "" || fields[41] === "")) {
    throw new Error("employee is over 70 and personal_number is empty, so basic_pension_office_code and basic_pension_serial are required.");
  }

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
