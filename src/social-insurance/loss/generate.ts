import { getString, newLine, assertDigits, assertField, assertNameSpacing } from "../shared/fields";
import { convertToJapaneseEraDate } from "../shared/dates";
import { newEnvelope, finishCsv } from "../shared/envelope";
import type { CsvGenerationOptions, Office } from "../shared/types";
import type { Employee, Config } from "./types";

function newEmployeeRecord(office: Office, employee: Employee): string {
  const onlyOver70 = getString(employee, "only_over_70_non_applicable");
  const birth = convertToJapaneseEraDate("birth_date", getString(employee, "birth_date"));
  const loss = convertToJapaneseEraDate("loss_date", getString(employee, "loss_date"), onlyOver70 !== "1");
  const retirementOrDeath = convertToJapaneseEraDate("retirement_or_death_date", getString(employee, "retirement_or_death_date"), false);
  const over70Date = convertToJapaneseEraDate("over_70_non_applicable_date", getString(employee, "over_70_non_applicable_date"), false);

  const fields = [
    "2201700", // 1
    getString(office, "prefecture_code"), // 2
    getString(office, "district_code"), // 3
    getString(office, "office_symbol"), // 4
    getString(office, "office_number"), // 5
    getString(employee, "insured_number"), // 6
    getString(employee, "insured_kana"), // 7
    getString(employee, "insured_name"), // 8
    birth.era, // 9
    birth.ymd, // 10
    getString(employee, "personal_number"), // 11
    getString(employee, "basic_pension_office_code"), // 12
    getString(employee, "basic_pension_serial"), // 13
    loss.era, // 14
    loss.ymd, // 15
    getString(employee, "loss_reason", "4"), // 16
    retirementOrDeath.era, // 17
    retirementOrDeath.ymd, // 18
    getString(employee, "remarks_multiple_offices"), // 19
    getString(employee, "remarks_reemployed"), // 20
    getString(employee, "remarks"), // 21
    getString(employee, "insurance_card_attached_count"), // 22
    getString(employee, "insurance_card_unreturned_count"), // 23
    getString(employee, "over_70_non_applicable"), // 24
    over70Date.era, // 25
    over70Date.ymd, // 26
    onlyOver70, // 27
  ];

  assertDigits("employee.form_code", fields[0], 7, 7, true);
  assertDigits("employee.prefecture_code", fields[1], 2, 2, true);
  assertDigits("employee.district_code", fields[2], 2, 2, true);
  assertField("employee.office_symbol", fields[3], 1, 4, true);
  assertDigits("employee.office_number", fields[4], 1, 5, true);
  assertDigits("employee.insured_number", fields[5], 0, 6, onlyOver70 !== "1");
  assertField("employee.insured_kana", fields[6], 1, 25, true);
  assertField("employee.insured_name", fields[7], 0, 12);
  assertNameSpacing("employee.insured_kana", fields[6], true);
  assertNameSpacing("employee.insured_name", fields[7]);
  assertDigits("employee.birth_era", fields[8], 1, 1, true);
  assertDigits("employee.birth_ymd", fields[9], 6, 6, true);
  assertDigits("employee.personal_number", fields[10], 0, 12);
  assertDigits("employee.basic_pension_office_code", fields[11], 0, 4);
  assertDigits("employee.basic_pension_serial", fields[12], 0, 6);
  assertDigits("employee.loss_era", fields[13], 1, 1, onlyOver70 !== "1");
  assertDigits("employee.loss_ymd", fields[14], 6, 6, onlyOver70 !== "1");
  assertDigits("employee.loss_reason", fields[15], 1, 2, true);
  assertDigits("employee.retirement_or_death_era", fields[16], 0, 1);
  assertDigits("employee.retirement_or_death_ymd", fields[17], 0, 6);
  assertDigits("employee.remarks_multiple_offices", fields[18], 0, 1);
  assertDigits("employee.remarks_reemployed", fields[19], 0, 1);
  assertField("employee.remarks", fields[20], 0, 75);
  assertDigits("employee.insurance_card_attached_count", fields[21], 0, 2);
  assertDigits("employee.insurance_card_unreturned_count", fields[22], 0, 2);
  assertDigits("employee.over_70_non_applicable", fields[23], 0, 1);
  assertDigits("employee.over_70_non_applicable_era", fields[24], 0, 1);
  assertDigits("employee.over_70_non_applicable_ymd", fields[25], 0, 6);
  assertDigits("employee.only_over_70_non_applicable", fields[26], 0, 1);

  if (fields[10] === "" && (fields[11] === "" || fields[12] === "")) {
    throw new Error("employee.personal_number is empty, so basic_pension_office_code and basic_pension_serial are required.");
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
