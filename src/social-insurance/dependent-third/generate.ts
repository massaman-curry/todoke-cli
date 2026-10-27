import { getString, newLine, assertDigits, assertField, assertNameSpacing, assertNoDelimiter } from "../shared/fields";
import { convertToJapaneseEraDate, type EraDate } from "../shared/dates";
import { newEnvelope, finishCsv } from "../shared/envelope";
import type { CsvGenerationOptions, Office } from "../shared/types";
import type { Insured, Spouse, OtherDependent, Config } from "./types";

function income(object: object | undefined, name: string): string {
  const value = getString(object, name);
  if (value === "") return "";
  if (!/^\d+$/.test(value)) throw new Error(`${name} must contain integer digits only.`);
  return (BigInt(value) >= 10000000n ? "9999999" : value).padStart(7, "0");
}

function optionalEraDate(object: object | undefined, name: string): EraDate {
  return convertToJapaneseEraDate(name, getString(object, name), false);
}

function appendOtherDependentFields(fields: string[], dependent: OtherDependent | undefined): void {
  const birth = convertToJapaneseEraDate("other_dependent.birth_date", getString(dependent, "birth_date"), dependent !== undefined);
  const overseasReturn = optionalEraDate(dependent, "overseas_return_date");
  const became = optionalEraDate(dependent, "became_dependent_date");
  const noLonger = optionalEraDate(dependent, "no_longer_dependent_date");

  // 33 columns per dependent: 70–102 for the first, 103–135 for the second.
  fields.push(
    "",
    getString(dependent, "kana"),
    getString(dependent, "name"),
    birth.era,
    birth.ymd,
    getString(dependent, "sex_type"),
    getString(dependent, "relationship_code"),
    getString(dependent, "relationship_other"),
    getString(dependent, "personal_number"),
    getString(dependent, "cohabitation_type"),
    getString(dependent, "postal_code_parent"),
    getString(dependent, "postal_code_child"),
    getString(dependent, "address_name"),
    getString(dependent, "overseas_exception"),
    getString(dependent, "overseas_applicable_reason"),
    getString(dependent, "overseas_applicable_reason_other"),
    getString(dependent, "overseas_not_applicable_reason"),
    getString(dependent, "overseas_not_applicable_reason_other"),
    overseasReturn.era,
    overseasReturn.ymd,
    became.era,
    became.ymd,
    getString(dependent, "occupation_type"),
    getString(dependent, "address_prefecture_code"),
    income(dependent, "annual_income"),
    getString(dependent, "became_dependent_reason"),
    getString(dependent, "became_dependent_reason_other"),
    noLonger.era,
    noLonger.ymd,
    getString(dependent, "no_longer_dependent_reason"),
    getString(dependent, "no_longer_dependent_reason_other"),
    getString(dependent, "remarks"),
    getString(dependent, "relationship_confirmed"),
  );
}

function newDependentThirdRecord(office: Office, config: Config): string {
  const insured = config.insured;
  const spouse = config.spouse;
  const movementType = getString(config, "movement_type", "1");
  const otherDependents = config.other_dependents ?? [];

  if (!Array.isArray(otherDependents) || otherDependents.length > 2) throw new Error("At most two other_dependents can be represented in one record.");
  const hasSpouse = Boolean(spouse && Object.keys(spouse).some((key) => key !== "spouse_annual_income" && getString(spouse, key) !== ""));
  const received = optionalEraDate(insured, "received_date");
  const insuredBirth = convertToJapaneseEraDate("insured.birth_date", getString(insured, "birth_date"));
  const notification = convertToJapaneseEraDate("spouse.notification_date", getString(spouse, "notification_date"), hasSpouse);
  const spouseBirth = convertToJapaneseEraDate("spouse.birth_date", getString(spouse, "birth_date"), hasSpouse);
  const spouseBecame = optionalEraDate(spouse, "became_dependent_date");
  const spouseNoLonger = optionalEraDate(spouse, "no_longer_dependent_date");
  const spouseDeath = optionalEraDate(spouse, "death_date");
  const overseasApplicable = optionalEraDate(spouse, "overseas_applicable_date");
  const overseasNotApplicable = optionalEraDate(spouse, "overseas_not_applicable_date");
  const overseasReturn = optionalEraDate(spouse, "overseas_return_date");

  const fields = [
    "2202700", // 1
    getString(office, "prefecture_code"), // 2
    getString(office, "district_code"), // 3
    getString(office, "office_symbol"), // 4
    getString(insured, "employer_confirmation"), // 5
    received.era, // 6
    received.ymd, // 7
    getString(insured, "insured_number"), // 8
    getString(insured, "insured_kana"), // 9
    getString(insured, "insured_name"), // 10
    insuredBirth.era, // 11
    insuredBirth.ymd, // 12
    getString(insured, "sex_type"), // 13
    getString(insured, "personal_number"), // 14
    getString(insured, "basic_pension_office_code"), // 15
    getString(insured, "basic_pension_serial"), // 16
    income(insured, "annual_income"), // 17
    getString(insured, "postal_code_parent"), // 18
    getString(insured, "postal_code_child"), // 19
    getString(insured, "address_name"), // 20
    movementType, // 21
    notification.era, // 22
    notification.ymd, // 23
    getString(spouse, "kana"), // 24
    getString(spouse, "name"), // 25
    spouseBirth.era, // 26
    spouseBirth.ymd, // 27
    getString(spouse, "relationship_type"), // 28
    getString(spouse, "personal_number"), // 29
    getString(spouse, "basic_pension_office_code"), // 30
    getString(spouse, "basic_pension_serial"), // 31
    getString(spouse, "nationality"), // 32
    getString(spouse, "alias_kana"), // 33
    getString(spouse, "alias_name"), // 34
    getString(spouse, "cohabitation_type"), // 35
    getString(spouse, "address_prefecture_code"), // 36
    getString(spouse, "postal_code_parent"), // 37
    getString(spouse, "postal_code_child"), // 38
    getString(spouse, "address_name"), // 39
    getString(spouse, "phone_type"), // 40
    getString(spouse, "phone_area"), // 41
    getString(spouse, "phone_exchange"), // 42
    getString(spouse, "phone_number"), // 43
    spouseBecame.era, // 44
    spouseBecame.ymd, // 45
    getString(spouse, "became_dependent_reason"), // 46
    getString(spouse, "became_dependent_reason_other"), // 47
    getString(spouse, "occupation_type"), // 48
    income(spouse, "annual_income"), // 49
    spouseNoLonger.era, // 50
    spouseNoLonger.ymd, // 51
    getString(spouse, "no_longer_dependent_reason"), // 52
    getString(spouse, "no_longer_dependent_reason_other"), // 53
    spouseDeath.era, // 54
    spouseDeath.ymd, // 55
    getString(spouse, "remarks"), // 56
    getString(spouse, "relationship_confirmed"), // 57
    getString(spouse, "overseas_exception"), // 58
    overseasApplicable.era, // 59
    overseasApplicable.ymd, // 60
    getString(spouse, "overseas_applicable_reason"), // 61
    getString(spouse, "overseas_applicable_reason_other"), // 62
    overseasNotApplicable.era, // 63
    overseasNotApplicable.ymd, // 64
    getString(spouse, "overseas_not_applicable_reason"), // 65
    getString(spouse, "overseas_not_applicable_reason_other"), // 66
    overseasReturn.era, // 67
    overseasReturn.ymd, // 68
    income(spouse, "spouse_annual_income"), // 69
  ];

  appendOtherDependentFields(fields, otherDependents[0]);
  appendOtherDependentFields(fields, otherDependents[1]);
  // Columns 136–139: reserved and insurance-card requests.
  fields.push("", getString(spouse, "insurance_card_required"), getString(otherDependents[0], "insurance_card_required"), getString(otherDependents[1], "insurance_card_required"));

  assertDependentThirdFields(fields, movementType);
  return newLine(fields);
}

function assertDependentThirdFields(fields: string[], movementType: string): void {
  if (fields.length !== 139) throw new Error(`dependent-third record must contain 139 fields. Actual: ${fields.length}.`);

  assertDigits("form_code", fields[0], 7, 7, true);
  assertDigits("prefecture_code", fields[1], 2, 2, true);
  assertDigits("district_code", fields[2], 2, 2, true);
  assertField("office_symbol", fields[3], 1, 4, true);
  assertDigits("employer_confirmation", fields[4], 0, 1);
  assertDigits("received_era", fields[5], 0, 1);
  assertDigits("received_ymd", fields[6], 0, 6);
  assertDigits("insured_number", fields[7], 0, 6, movementType !== "1");
  assertField("insured_kana", fields[8], 1, 25, true);
  assertField("insured_name", fields[9], 0, 12);
  assertNameSpacing("insured_kana", fields[8], true);
  assertNameSpacing("insured_name", fields[9]);
  assertDigits("insured_birth_era", fields[10], 1, 1, true);
  assertDigits("insured_birth_ymd", fields[11], 6, 6, true);
  assertDigits("insured_sex_type", fields[12], 1, 1, true);
  assertDigits("insured_personal_number", fields[13], 0, 12);
  assertDigits("insured_pension_office_code", fields[14], 0, 4);
  assertDigits("insured_pension_serial", fields[15], 0, 6);
  assertDigits("insured_annual_income", fields[16], 0, 7);
  assertDigits("insured_postal_parent", fields[17], 0, 3);
  assertDigits("insured_postal_child", fields[18], 0, 4);
  assertField("insured_address", fields[19], 0, 37);
  assertDigits("movement_type", fields[20], 1, 1, true);

  for (let index = 21; index <= 68; index += 1) assertNoDelimiter(`spouse_field_${index + 1}`, fields[index]);
  const hasSpouse = fields.slice(21, 68).some((value) => value !== "");
  assertField("spouse_kana", fields[23], 1, 25, hasSpouse);
  assertField("spouse_name", fields[24], 0, 12);
  assertNameSpacing("spouse_kana", fields[23], true);
  assertNameSpacing("spouse_name", fields[24]);

  if (fields[13] === "" && (fields[14] === "" || fields[15] === "")) {
    throw new Error("insured.personal_number is empty, so insured pension number parts are required.");
  }
  if (hasSpouse && fields[28] === "" && (fields[29] === "" || fields[30] === "")) {
    throw new Error("spouse.personal_number is empty, so spouse pension number parts are required.");
  }
  if (hasSpouse && movementType === "1" && (fields[43] === "" || fields[44] === "" || fields[45] === "" || fields[47] === "" || fields[48] === "")) {
    throw new Error("movement_type 1 requires spouse became date, reason, occupation, and income.");
  }
  if (hasSpouse && movementType === "2" && (fields[49] === "" || fields[50] === "" || fields[51] === "")) {
    throw new Error("movement_type 2 requires spouse no-longer date and reason.");
  }
}

/** Assemble CSV text without file IO; the CLI handles CSV validation and CP932 publication. */
export function buildCsv(config: Config, options: CsvGenerationOptions = {}): string {
  const office = config.office;
  const outputLines = newEnvelope(config, options);

  outputLines.push(newDependentThirdRecord(office, config));

  return finishCsv(config, outputLines);
}
