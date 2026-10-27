import { getString, newLine, assertDigits, assertField, assertNameSpacing } from "../shared/fields";
import { convertToJapaneseEraDate } from "../shared/dates";
import { newEnvelope, finishCsv } from "../shared/envelope";
import type { CsvGenerationOptions, Office } from "../shared/types";
import type { PensionNumberPerson, Spouse, ThirdInsured, KokunenThirdRecord, Config } from "./types";

function assertPensionNumber(prefix: string, personalNumber: string, officeCode: string, serial: string): void {
  assertDigits(`${prefix}.personal_number`, personalNumber, 0, 12);
  assertDigits(`${prefix}.basic_pension_office_code`, officeCode, 0, 4);
  assertDigits(`${prefix}.basic_pension_serial`, serial, 0, 6);
  if (personalNumber === "" && (officeCode === "" || serial === "")) {
    throw new Error(`${prefix}.personal_number is empty, so basic_pension_office_code and basic_pension_serial are required.`);
  }
}

function assertOptionalDateParts(name: string, era: string, ymd: string, required = false): void {
  assertDigits(`${name}_era`, era, 0, 1, required);
  assertDigits(`${name}_ymd`, ymd, 0, 6, required);
  if ((era === "") !== (ymd === "")) {
    throw new Error(`${name} era and ymd must both be set or both be empty.`);
  }
}

function newKokunenThirdRecord(office: Office, record: KokunenThirdRecord): string {
  const spouse = record.spouse;
  const third = record.third_insured;
  const employerReceived = convertToJapaneseEraDate("employer_received_date", getString(record, "employer_received_date"));
  const spouseBirth = convertToJapaneseEraDate("spouse.birth_date", getString(spouse, "birth_date"));
  const thirdReport = convertToJapaneseEraDate("third_insured.report_date", getString(third, "report_date"));
  const thirdBirth = convertToJapaneseEraDate("third_insured.birth_date", getString(third, "birth_date"));
  const movement = getString(third, "movement_type", "1");
  const became = convertToJapaneseEraDate("third_insured.became_date", getString(third, "became_date"), movement === "1");
  const lost = convertToJapaneseEraDate("third_insured.lost_date", getString(third, "lost_date"), movement === "2");
  const death = convertToJapaneseEraDate("third_insured.death_date", getString(third, "death_date"), false);
  const overseasApplicable = convertToJapaneseEraDate("third_insured.overseas_applicable_date", getString(third, "overseas_applicable_date"), false);
  const overseasNotApplicable = convertToJapaneseEraDate("third_insured.overseas_not_applicable_date", getString(third, "overseas_not_applicable_date"), false);
  const overseasReturn = convertToJapaneseEraDate("third_insured.overseas_return_date", getString(third, "overseas_return_date"), false);

  const fields = [
    "4300700", // 1
    getString(office, "prefecture_code"), // 2
    getString(office, "district_code"), // 3
    getString(office, "office_symbol"), // 4
    employerReceived.era, // 5
    employerReceived.ymd, // 6
    getString(spouse, "kana"), // 7
    getString(spouse, "name"), // 8
    spouseBirth.era, // 9
    spouseBirth.ymd, // 10
    getString(spouse, "sex_type"), // 11
    getString(spouse, "personal_number"), // 12
    getString(spouse, "basic_pension_office_code"), // 13
    getString(spouse, "basic_pension_serial"), // 14
    getString(spouse, "postal_code_parent"), // 15
    getString(spouse, "postal_code_child"), // 16
    getString(spouse, "address"), // 17
    thirdReport.era, // 18
    thirdReport.ymd, // 19
    getString(third, "kana"), // 20
    getString(third, "name"), // 21
    thirdBirth.era, // 22
    thirdBirth.ymd, // 23
    getString(third, "relationship_type"), // 24
    getString(third, "personal_number"), // 25
    getString(third, "basic_pension_office_code"), // 26
    getString(third, "basic_pension_serial"), // 27
    getString(third, "nationality"), // 28
    getString(third, "alias_kana"), // 29
    getString(third, "alias_name"), // 30
    getString(third, "cohabitation_type"), // 31
    getString(third, "postal_code_parent"), // 32
    getString(third, "postal_code_child"), // 33
    getString(third, "address"), // 34
    getString(third, "phone_type"), // 35
    getString(third, "phone_area"), // 36
    getString(third, "phone_exchange"), // 37
    getString(third, "phone_number"), // 38
    movement, // 39
    became.era, // 40
    became.ymd, // 41
    getString(third, "became_reason", movement === "1" ? "1" : ""), // 42
    getString(third, "became_reason_other"), // 43
    getString(third, "spouse_system_type", movement === "1" ? "31" : ""), // 44
    lost.era, // 45
    lost.ymd, // 46
    getString(third, "lost_reason"), // 47
    death.era, // 48
    death.ymd, // 49
    getString(third, "lost_reason_other"), // 50
    getString(third, "remarks"), // 51
    getString(third, "overseas_special_type"), // 52
    overseasApplicable.era, // 53
    overseasApplicable.ymd, // 54
    getString(third, "overseas_applicable_reason"), // 55
    getString(third, "overseas_applicable_reason_other"), // 56
    overseasNotApplicable.era, // 57
    overseasNotApplicable.ymd, // 58
    getString(third, "overseas_not_applicable_reason"), // 59
    getString(third, "overseas_not_applicable_reason_other"), // 60
    overseasReturn.era, // 61
    overseasReturn.ymd, // 62
    "", // 63
  ];

  assertDigits("record.form_code", fields[0], 7, 7, true);
  assertDigits("record.prefecture_code", fields[1], 2, 2, true);
  assertDigits("record.district_code", fields[2], 2, 2, true);
  assertField("record.office_symbol", fields[3], 1, 4, true);
  assertDigits("record.employer_received_era", fields[4], 1, 1, true);
  assertDigits("record.employer_received_ymd", fields[5], 6, 6, true);
  assertField("spouse.kana", fields[6], 1, 25, true);
  assertField("spouse.name", fields[7], 0, 12);
  assertNameSpacing("spouse.kana", fields[6], true);
  assertNameSpacing("spouse.name", fields[7]);
  assertDigits("spouse.birth_era", fields[8], 1, 1, true);
  assertDigits("spouse.birth_ymd", fields[9], 6, 6, true);
  assertDigits("spouse.sex_type", fields[10], 1, 1, true);
  assertPensionNumber("spouse", fields[11], fields[12], fields[13]);
  assertDigits("spouse.postal_code_parent", fields[14], 0, 3);
  assertDigits("spouse.postal_code_child", fields[15], 0, 4);
  assertField("spouse.address", fields[16], 0, 37);
  assertDigits("third_insured.report_era", fields[17], 1, 1, true);
  assertDigits("third_insured.report_ymd", fields[18], 6, 6, true);
  assertField("third_insured.kana", fields[19], 1, 25, true);
  assertField("third_insured.name", fields[20], 0, 12);
  assertNameSpacing("third_insured.kana", fields[19], true);
  assertNameSpacing("third_insured.name", fields[20]);
  assertDigits("third_insured.birth_era", fields[21], 1, 1, true);
  assertDigits("third_insured.birth_ymd", fields[22], 6, 6, true);
  assertDigits("third_insured.relationship_type", fields[23], 1, 1, true);
  assertPensionNumber("third_insured", fields[24], fields[25], fields[26]);
  assertField("third_insured.nationality", fields[27], 0, 30);
  assertField("third_insured.alias_kana", fields[28], 0, 25);
  assertField("third_insured.alias_name", fields[29], 0, 12);
  assertDigits("third_insured.cohabitation_type", fields[30], 0, 1);
  assertDigits("third_insured.postal_code_parent", fields[31], 0, 3);
  assertDigits("third_insured.postal_code_child", fields[32], 0, 4);
  assertField("third_insured.address", fields[33], 0, 37);
  assertDigits("third_insured.phone_type", fields[34], 0, 1);
  assertDigits("third_insured.phone_area", fields[35], 0, 5);
  assertDigits("third_insured.phone_exchange", fields[36], 0, 4);
  assertDigits("third_insured.phone_number", fields[37], 0, 5);
  assertDigits("third_insured.movement_type", fields[38], 1, 1, true);
  assertOptionalDateParts("third_insured.became_date", fields[39], fields[40], movement === "1");
  assertDigits("third_insured.became_reason", fields[41], 0, 1, movement === "1");
  assertField("third_insured.became_reason_other", fields[42], 0, 48);
  assertDigits("third_insured.spouse_system_type", fields[43], 0, 2, movement === "1");
  assertOptionalDateParts("third_insured.lost_date", fields[44], fields[45], movement === "2");
  assertDigits("third_insured.lost_reason", fields[46], 0, 1, movement === "2");
  assertOptionalDateParts("third_insured.death_date", fields[47], fields[48], fields[46] === "1");
  assertField("third_insured.lost_reason_other", fields[49], 0, 48);
  assertField("third_insured.remarks", fields[50], 0, 75);
  assertDigits("third_insured.overseas_special_type", fields[51], 0, 1);
  assertOptionalDateParts("third_insured.overseas_applicable_date", fields[52], fields[53], fields[51] === "1");
  assertDigits("third_insured.overseas_applicable_reason", fields[54], 0, 1, fields[51] === "1");
  assertField("third_insured.overseas_applicable_reason_other", fields[55], 0, 48);
  assertOptionalDateParts("third_insured.overseas_not_applicable_date", fields[56], fields[57], fields[51] === "2");
  assertDigits("third_insured.overseas_not_applicable_reason", fields[58], 0, 1, fields[51] === "2");
  assertField("third_insured.overseas_not_applicable_reason_other", fields[59], 0, 48);
  assertOptionalDateParts("third_insured.overseas_return_date", fields[60], fields[61], fields[58] === "1");

  return newLine(fields);
}

/** Assemble CSV text without file IO; the CLI handles CSV validation and CP932 publication. */
export function buildCsv(config: Config, options: CsvGenerationOptions = {}): string {
  const office = config.office;
  const outputLines = newEnvelope(config, options);

  for (const record of config.records) {
    outputLines.push(newKokunenThirdRecord(office, record));
  }

  if (outputLines.length <= 5) {
    throw new Error("At least one kokunen third record is required.");
  }

  return finishCsv(config, outputLines);
}
