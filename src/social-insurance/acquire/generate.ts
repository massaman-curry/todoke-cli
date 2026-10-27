import { getString, newLine, assertDigits, assertField, assertNameSpacing } from "../shared/fields";
import { convertToJapaneseEraDate } from "../shared/dates";
import { newEnvelope, finishCsv } from "../shared/envelope";
import type { CsvGenerationOptions, Office } from "../shared/types";
import type { Employee, Config } from "./types";

function newEmployeeRecord(office: Office, employee: Employee): string {
  const birth = convertToJapaneseEraDate("birth_date", getString(employee, "birth_date"));
  const acquired = convertToJapaneseEraDate("acquisition_date", getString(employee, "acquisition_date"), getString(employee, "remarks_special_reduction") !== "1");
  const cashText = getString(employee, "cash_amount", "0");
  const inKindText = getString(employee, "in_kind_amount", "0");
  assertDigits("employee.cash_amount", cashText, 1, 7, true);
  assertDigits("employee.in_kind_amount", inKindText, 1, 7, true);
  const cash = Number(cashText);
  const inKind = Number(inKindText);
  let total = getString(employee, "total_amount");
  if (total === "") total = String(Math.min(9999999, cash + inKind));

  const fields = [
    "2200700", // 1
    getString(office, "prefecture_code"), // 2
    getString(office, "district_code"), // 3
    getString(office, "office_symbol"), // 4
    getString(office, "office_number"), // 5
    getString(employee, "insured_number"), // 6
    getString(employee, "insured_kana"), // 7
    getString(employee, "insured_name"), // 8
    birth.era, // 9
    birth.ymd, // 10
    getString(employee, "sex_type"), // 11
    getString(employee, "acquisition_type", getString(employee, "only_70_or_over") === "1" ? "" : "1"), // 12
    getString(employee, "personal_number"), // 13
    getString(employee, "resident_address_absence_reason"), // 14
    getString(employee, "personal_number_note"), // 15
    getString(employee, "basic_pension_office_code"), // 16
    getString(employee, "basic_pension_serial"), // 17
    acquired.era, // 18
    acquired.ymd, // 19
    getString(employee, "has_dependents", "0"), // 20
    cashText, // 21
    inKindText, // 22
    total, // 23
    getString(employee, "remarks_70_or_over"), // 24
    getString(employee, "remarks_multiple_offices"), // 25
    getString(employee, "remarks_short_time"), // 26
    getString(employee, "remarks_reemployed"), // 27
    getString(employee, "remarks_special_reduction"), // 28
    getString(employee, "remarks"), // 29
    getString(employee, "postal_code_parent"), // 30
    getString(employee, "postal_code_child"), // 31
    getString(employee, "address_kana"), // 32
    getString(employee, "address_name"), // 33
    getString(employee, "only_70_or_over"), // 34
    getString(employee, "insurance_card_required"), // 35
  ];

  assertDigits("employee.form_code", fields[0], 7, 7, true);
  assertDigits("employee.prefecture_code", fields[1], 2, 2, true);
  assertDigits("employee.district_code", fields[2], 2, 2, true);
  assertField("employee.office_symbol", fields[3], 1, 4, true);
  assertDigits("employee.office_number", fields[4], 1, 5, true);
  assertField("employee.insured_number", fields[5], 0, 6);
  assertField("employee.insured_kana", fields[6], 1, 25, true);
  assertField("employee.insured_name", fields[7], 0, 12);
  assertNameSpacing("employee.insured_kana", fields[6], true);
  assertNameSpacing("employee.insured_name", fields[7]);
  assertDigits("employee.birth_era", fields[8], 1, 1, true);
  assertDigits("employee.birth_ymd", fields[9], 6, 6, true);
  assertDigits("employee.sex_type", fields[10], 0, 1);
  assertDigits("employee.acquisition_type", fields[11], 0, 1);
  assertDigits("employee.personal_number", fields[12], 0, 12);
  assertDigits("employee.resident_address_absence_reason", fields[13], 0, 1);
  assertField("employee.personal_number_note", fields[14], 0, 75);
  assertDigits("employee.basic_pension_office_code", fields[15], 0, 4);
  assertDigits("employee.basic_pension_serial", fields[16], 0, 6);
  assertDigits("employee.acquisition_era", fields[17], 1, 1, fields[27] !== "1");
  assertDigits("employee.acquisition_ymd", fields[18], 6, 6, fields[27] !== "1");
  assertDigits("employee.has_dependents", fields[19], 1, 1, true);
  assertDigits("employee.cash_amount", fields[20], 1, 7, true);
  assertDigits("employee.in_kind_amount", fields[21], 1, 7, true);
  assertDigits("employee.total_amount", fields[22], 1, 7, true);
  for (let index = 23; index <= 27; index += 1) assertDigits(`employee.remark_flag_${index}`, fields[index], 0, 1);
  assertField("employee.remarks", fields[28], 0, 75);
  assertDigits("employee.postal_code_parent", fields[29], 0, 3);
  assertDigits("employee.postal_code_child", fields[30], 0, 4);
  assertField("employee.address_kana", fields[31], 0, 75);
  assertField("employee.address_name", fields[32], 0, 37);
  assertDigits("employee.only_70_or_over", fields[33], 0, 1);
  assertDigits("employee.insurance_card_required", fields[34], 0, 1);

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
