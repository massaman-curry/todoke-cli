import { getString, newLine, assertDigits, assertField, assertNameSpacing } from "../shared/fields";
import { convertToJapaneseEraDate } from "../shared/dates";
import { newEnvelope, finishCsv } from "../shared/envelope";
import type { CsvGenerationOptions, Office } from "../shared/types";
import type { Employee, Config } from "./types";

function computeTotalBonus(cashText: string, inKindText: string): string {
  assertDigits("employee.cash_amount", cashText, 1, 7, true);
  assertDigits("employee.in_kind_amount", inKindText, 1, 7, true);
  const cash = Number(cashText);
  const inKind = Number(inKindText);
  if (cash === 9999999 || inKind === 9999999 || cash + inKind >= 10000000) return "9999999";
  return String(Math.floor((cash + inKind) / 1000) * 1000);
}

function newEmployeeRecord(office: Office, employee: Employee): string {
  const onlyOver70 = getString(employee, "only_over_70_bonus");
  const over70 = getString(employee, "remarks_over_70");
  const birth = convertToJapaneseEraDate("birth_date", getString(employee, "birth_date"));
  const bonusPaid = convertToJapaneseEraDate("bonus_paid_date", getString(employee, "bonus_paid_date"));
  const cash = getString(employee, "cash_amount");
  const inKind = getString(employee, "in_kind_amount", "0");
  let total = getString(employee, "total_amount");
  if (total === "") total = computeTotalBonus(cash, inKind);

  const fields = [
    "2265700", // 1
    getString(office, "prefecture_code"), // 2
    getString(office, "district_code"), // 3
    getString(office, "office_symbol"), // 4
    getString(employee, "insured_number"), // 5
    getString(employee, "insured_kana"), // 6
    getString(employee, "insured_name"), // 7
    birth.era, // 8
    birth.ymd, // 9
    bonusPaid.era, // 10
    bonusPaid.ymd, // 11
    cash, // 12
    inKind, // 13
    total, // 14
    getString(employee, "personal_number"), // 15
    getString(employee, "basic_pension_office_code"), // 16
    getString(employee, "basic_pension_serial"), // 17
    over70, // 18
    getString(employee, "remarks_multiple_offices"), // 19
    getString(employee, "same_month_bonus_first_day"), // 20
    onlyOver70, // 21
  ];

  assertDigits("employee.form_code", fields[0], 7, 7, true);
  assertDigits("employee.prefecture_code", fields[1], 2, 2, true);
  assertDigits("employee.district_code", fields[2], 2, 2, true);
  assertField("employee.office_symbol", fields[3], 1, 4, true);
  assertDigits("employee.insured_number", fields[4], 0, 6, onlyOver70 !== "1");
  assertField("employee.insured_kana", fields[5], 1, 25, true);
  assertField("employee.insured_name", fields[6], 0, 12);
  assertNameSpacing("employee.insured_kana", fields[5], true);
  assertNameSpacing("employee.insured_name", fields[6]);
  assertDigits("employee.birth_era", fields[7], 1, 1, true);
  assertDigits("employee.birth_ymd", fields[8], 6, 6, true);
  assertDigits("employee.bonus_paid_era", fields[9], 1, 1, true);
  assertDigits("employee.bonus_paid_ymd", fields[10], 6, 6, true);
  assertDigits("employee.cash_amount", fields[11], 1, 7, true);
  assertDigits("employee.in_kind_amount", fields[12], 1, 7, true);
  assertDigits("employee.total_amount", fields[13], 1, 7, true);
  assertDigits("employee.personal_number", fields[14], 0, 12);
  assertDigits("employee.basic_pension_office_code", fields[15], 0, 4);
  assertDigits("employee.basic_pension_serial", fields[16], 0, 6);
  assertDigits("employee.remarks_over_70", fields[17], 0, 1);
  assertDigits("employee.remarks_multiple_offices", fields[18], 0, 1);
  assertDigits("employee.same_month_bonus_first_day", fields[19], 0, 2);
  assertDigits("employee.only_over_70_bonus", fields[20], 0, 1);

  if ((over70 === "1" || onlyOver70 === "1") && fields[14] === "" && (fields[15] === "" || fields[16] === "")) {
    throw new Error("employee is over 70, so personal_number or both basic pension number parts are required.");
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
