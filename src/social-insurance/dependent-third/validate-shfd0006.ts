import { birthAnniversary as addYearsUtc, convertJapaneseEraToDate } from "../../common/csv";
import { validateFormFields } from "../rules";
import { readAndValidateHeader } from "../validation/header";
import {
  addError,
  assertFieldCount,
  testDigits,
  testNonZeroDigits,
  testFieldLength,
  addDaysUtc,
  testNameSpace,
  testMyNumber,
  hasBothOrNeither,
  hasAnyValue,
  testAllowedOfficeSymbol,
} from "../validation/primitives";

function validateDatePair(errors: string[], lineNo: number, fields: string[], eraIndex: number, ymdIndex: number, label: string, required = false, allowedEras = ["7", "9"]): Date | undefined {
  const era = fields[eraIndex];
  const ymd = fields[ymdIndex];
  if (era === "" && ymd === "") {
    if (required) addError(errors, `${lineNo}: ${label} is required`);
    return undefined;
  }
  if ((era === "") !== (ymd === "")) {
    addError(errors, `${lineNo}: ${label} era and ymd must both be set or both empty`);
    return undefined;
  }
  const date = convertJapaneseEraToDate(era, ymd);
  if (!date) addError(errors, `${lineNo}: ${label} is invalid`);
  if (date && !allowedEras.includes(era)) addError(errors, `${lineNo}: ${label} era is invalid`);
  return date;
}

function validatePersonNumber(errors: string[], lineNo: number, personal: string, pensionOffice: string, pensionSerial: string, label: string, pensionRequired: boolean): void {
  if (!testMyNumber(personal)) addError(errors, `${lineNo}: ${label} personal number check digit is invalid`);
  if (!hasBothOrNeither(pensionOffice, pensionSerial)) addError(errors, `${lineNo}: ${label} pension number parts must both be set or both empty`);
  if (pensionRequired && personal === "" && (pensionOffice === "" || pensionSerial === "")) addError(errors, `${lineNo}: ${label} pension number is required when personal number is empty`);
  if (pensionOffice !== "" && (!testNonZeroDigits(pensionOffice, 4, 4, true) || !testNonZeroDigits(pensionSerial, 6, 6, true))) {
    addError(errors, `${lineNo}: ${label} pension number must be non-zero 4 and 6 digit parts`);
  }
}

function validateOverseas(errors: string[], lineNo: number, fields: string[], base: number, label: string, hasBecameDate: boolean, hasNoLongerDate: boolean): void {
  const flag = fields[base];
  const applicableReason = fields[base + 1];
  const applicableOther = fields[base + 2];
  const notApplicableReason = fields[base + 3];
  const notApplicableOther = fields[base + 4];
  const returnDate = validateDatePair(errors, lineNo, fields, base + 5, base + 6, `${label} overseas return date`, false, ["9"]);

  if (flag !== "" && !["1", "2"].includes(flag)) addError(errors, `${lineNo}: ${label} overseas exception must be empty, 1, or 2`);
  if (hasBecameDate && flag === "2") addError(errors, `${lineNo}: ${label} overseas exception cannot be 2 when became date is set`);
  if (hasNoLongerDate && flag !== "") addError(errors, `${lineNo}: ${label} overseas exception must be empty when no-longer date is set`);
  if (flag === "1") {
    if (!["1", "2", "3", "4", "5"].includes(applicableReason)) addError(errors, `${lineNo}: ${label} overseas applicable reason is invalid`);
    if (applicableReason === "5" && applicableOther === "") addError(errors, `${lineNo}: ${label} overseas applicable other reason is required`);
    if (applicableReason !== "5" && applicableOther !== "") addError(errors, `${lineNo}: ${label} overseas applicable other reason must be empty`);
    if (notApplicableReason !== "" || notApplicableOther !== "" || returnDate) addError(errors, `${lineNo}: ${label} overseas not-applicable fields must be empty`);
  } else if (flag === "2") {
    if (notApplicableReason !== "1" && (fields[base + 5] !== "" || fields[base + 6] !== "")) addError(errors, `${lineNo}: ${label} overseas return date requires domestic return reason`);
    if (!["1", "2"].includes(notApplicableReason)) addError(errors, `${lineNo}: ${label} overseas not-applicable reason is invalid`);
    if (notApplicableReason === "2" && notApplicableOther === "") addError(errors, `${lineNo}: ${label} overseas not-applicable other reason is required`);
    if (notApplicableReason !== "2" && notApplicableOther !== "") addError(errors, `${lineNo}: ${label} overseas not-applicable other reason must be empty`);
    if (notApplicableReason === "1" && !returnDate) addError(errors, `${lineNo}: ${label} overseas return date is required for domestic return`);
    if (applicableReason !== "" || applicableOther !== "") addError(errors, `${lineNo}: ${label} overseas applicable fields must be empty`);
  } else if (hasAnyValue([applicableReason, applicableOther, notApplicableReason, notApplicableOther, fields[base + 5], fields[base + 6]])) {
    addError(errors, `${lineNo}: ${label} overseas detail fields require overseas exception`);
  }
}

function validatePrefecture(errors: string[], lineNo: number, value: string, required: boolean, label: string): void {
  if (required ? !/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(value) : value !== "") addError(errors, `${lineNo}: ${label} prefecture is required only for loss reasons 4 or 5 and must be 01-47`);
}

function validateOtherDependent(errors: string[], lineNo: number, f: string[], start: number, movementType: string, label: string): boolean {
  const values = f.slice(start, start + 33);
  const present = hasAnyValue(values);
  if (!present) return false;

  if (f[start] !== "") addError(errors, `${lineNo}: ${label} dependent number must be empty`);
  if (!testFieldLength(f[start + 1], 1, 25, true) || !testNameSpace(f[start + 1], true)) addError(errors, `${lineNo}: ${label} kana name format is invalid`);
  if (!testFieldLength(f[start + 2], 0, 12) || !testNameSpace(f[start + 2])) addError(errors, `${lineNo}: ${label} kanji name format is invalid`);
  const birth = validateDatePair(errors, lineNo, f, start + 3, start + 4, `${label} birth date`, true, ["5", "7", "9"]);
  if (!["1", "2"].includes(f[start + 5])) addError(errors, `${lineNo}: ${label} sex type is invalid`);
  if (!/^(0[1-9]|10)$/.test(f[start + 6])) addError(errors, `${lineNo}: ${label} relationship code is invalid`);
  if (f[start + 6] === "10" && f[start + 7] === "") addError(errors, `${lineNo}: ${label} relationship other is required`);
  if (f[start + 6] !== "10" && f[start + 7] !== "") addError(errors, `${lineNo}: ${label} relationship other must be empty`);
  if (!testMyNumber(f[start + 8])) addError(errors, `${lineNo}: ${label} personal number check digit is invalid`);

  if (["1", "2"].includes(movementType) && (!testNonZeroDigits(f[start + 10], 3, 3, true) || !testDigits(f[start + 11], 4, 4, true) || !testFieldLength(f[start + 12], 1, 37, true))) addError(errors, `${lineNo}: ${label} postal code and address are required`);
  if (movementType === "1") {
    if (!["1", "2"].includes(f[start + 9])) addError(errors, `${lineNo}: ${label} cohabitation type is required`);
  } else if (f[start + 9] !== "") {
    addError(errors, `${lineNo}: ${label} cohabitation type must be empty unless movement type is 1`);
  }

  const became = validateDatePair(errors, lineNo, f, start + 20, start + 21, `${label} became dependent date`, movementType === "1");
  if (movementType === "1") {
    if (!["1", "2", "3", "4", "5"].includes(f[start + 25])) addError(errors, `${lineNo}: ${label} became reason is invalid`);
    if (!["1", "2", "3", "4", "5", "6"].includes(f[start + 22])) addError(errors, `${lineNo}: ${label} occupation is invalid`);
    if (!testDigits(f[start + 24], 7, 7, true)) addError(errors, `${lineNo}: ${label} annual income is required`);
  } else if (hasAnyValue([f[start + 22], f[start + 24], f[start + 25], f[start + 26]])) {
    addError(errors, `${lineNo}: ${label} became detail fields must be empty unless movement type is 1`);
  }
  if (f[start + 25] === "5" && f[start + 26] === "") addError(errors, `${lineNo}: ${label} became other reason is required`);
  if (f[start + 25] !== "5" && f[start + 26] !== "") addError(errors, `${lineNo}: ${label} became other reason must be empty`);

  const noLonger = validateDatePair(errors, lineNo, f, start + 27, start + 28, `${label} no-longer dependent date`, movementType === "2");
  if (movementType === "2") {
    if (!["1", "2", "3", "4", "5", "6"].includes(f[start + 29])) addError(errors, `${lineNo}: ${label} no-longer reason is invalid`);
  } else if (hasAnyValue([f[start + 29], f[start + 30]]) || (movementType !== "3" && hasAnyValue([f[start + 27], f[start + 28]]))) {
    addError(errors, `${lineNo}: ${label} no-longer fields must be empty unless movement type is 2`);
  }
  if (f[start + 29] === "6" && f[start + 30] === "") addError(errors, `${lineNo}: ${label} no-longer other reason is required`);
  if (f[start + 29] !== "6" && f[start + 30] !== "") addError(errors, `${lineNo}: ${label} no-longer other reason must be empty`);
  if (movementType === "3" && f[start + 31] === "") addError(errors, `${lineNo}: ${label} remarks are required for movement type 3`);
  if (!testFieldLength(f[start + 31], 0, 75)) addError(errors, `${lineNo}: ${label} remarks length is invalid`);
  if (birth && became && became < birth) addError(errors, `${lineNo}: ${label} became date must be on or after birth date`);
  if (birth && noLonger && noLonger < birth) addError(errors, `${lineNo}: ${label} no-longer date must be on or after birth date`);
  if (became && noLonger && noLonger <= became) addError(errors, `${lineNo}: ${label} no-longer date must be after became date`);
  if (f[start + 29] === "4" && birth && noLonger) {
    const seventyFifthBirthday = addYearsUtc(birth, 75);
    if (seventyFifthBirthday && noLonger.getTime() !== seventyFifthBirthday.getTime()) addError(errors, `${lineNo}: ${label} no-longer reason 4 requires 75th birthday`);
  }

  if (movementType === "2" && (became || f[start + 20] !== "" || f[start + 21] !== "")) addError(errors, `${lineNo}: ${label} became date must be empty when movement type is 2`);
  validatePrefecture(errors, lineNo, f[start + 23], movementType === "2" && ["4", "5"].includes(f[start + 29]), label);
  validateOverseas(errors, lineNo, f, start + 13, label, Boolean(became), Boolean(noLonger));
  if (f[start + 32] !== "" && f[start + 32] !== "1") addError(errors, `${lineNo}: ${label} relationship confirmation must be empty or 1`);
  return true;
}

export function validate(csvPath: string): string[] {
  const errors: string[] = [];
  const { lines, office } = readAndValidateHeader(csvPath, errors, testAllowedOfficeSymbol);

  for (let lineNo = 6; lineNo <= lines.length; lineNo += 1) {
    if (lines[lineNo - 1] === "") continue;
    const f = lines[lineNo - 1].split(",");
    assertFieldCount(errors, lineNo, f, 139, "dependent third");
    if (f.length !== 139) continue;
    validateFormFields(errors, lineNo, f);

    if (f[0] !== "2202700") addError(errors, `${lineNo}: form code must be 2202700`);
    if (f[1] !== office[0] || f[2] !== office[1] || f[3] !== office[2]) addError(errors, `${lineNo}: record office ID must match office info`);
    if (f[4] !== "" && !["0", "1"].includes(f[4])) addError(errors, `${lineNo}: employer confirmation must be empty, 0, or 1`);
    validateDatePair(errors, lineNo, f, 5, 6, "received date", false);

    const movementType = f[20];
    if (!["1", "2", "3"].includes(movementType)) addError(errors, `${lineNo}: movement type must be 1, 2, or 3`);
    if (!testNonZeroDigits(f[7], 1, 6, movementType !== "1")) addError(errors, `${lineNo}: insured number is invalid`);
    if (!testFieldLength(f[8], 1, 25, true) || !testNameSpace(f[8], true)) addError(errors, `${lineNo}: insured kana name format is invalid`);
    if (!testFieldLength(f[9], 0, 12) || !testNameSpace(f[9])) addError(errors, `${lineNo}: insured kanji name format is invalid`);
    const insuredBirth = validateDatePair(errors, lineNo, f, 10, 11, "insured birth date", true, ["5", "7", "9"]);
    if (!["1", "2"].includes(f[12])) addError(errors, `${lineNo}: insured sex type is invalid`);
    validatePersonNumber(errors, lineNo, f[13], f[14], f[15], "insured", true);
    if (movementType !== "1" && (f[16] !== "" || f[68] !== "")) addError(errors, `${lineNo}: annual income fields must be empty unless movement type is 1`);
    if (!testDigits(f[16], 7, 7)) addError(errors, `${lineNo}: insured annual income is invalid`);
    if (!hasBothOrNeither(f[17], f[18])) addError(errors, `${lineNo}: insured postal code parts must both be set or both empty`);
    if (!testDigits(f[17], 0, 3) || !testDigits(f[18], 0, 4) || !testFieldLength(f[19], 0, 37)) addError(errors, `${lineNo}: insured address fields are invalid`);
    if (f[13] !== "" && hasAnyValue([f[17], f[18], f[19]])) addError(errors, `${lineNo}: insured address fields must be empty when personal number is set`);

    const hasSpouse = hasAnyValue(f.slice(21, 68)) || f[136] !== "";
    if (hasSpouse) {
      const notificationDate = validateDatePair(errors, lineNo, f, 21, 22, "spouse notification date", true);
      if (!testFieldLength(f[23], 1, 25, true) || !testNameSpace(f[23], true)) addError(errors, `${lineNo}: spouse kana name format is invalid`);
      if (!testFieldLength(f[24], 0, 12) || !testNameSpace(f[24])) addError(errors, `${lineNo}: spouse kanji name format is invalid`);
      const spouseBirth = validateDatePair(errors, lineNo, f, 25, 26, "spouse birth date", true, ["5", "7", "9"]);
      if (!["1", "2", "3", "4"].includes(f[27])) addError(errors, `${lineNo}: spouse relationship type is invalid`);
      validatePersonNumber(errors, lineNo, f[28], f[29], f[30], "spouse", true);
      if (!testFieldLength(f[31], 0, 30)) addError(errors, `${lineNo}: spouse nationality length is invalid`);
      if (!testFieldLength(f[32], 0, 25) || !testNameSpace(f[32], true)) addError(errors, `${lineNo}: spouse alias kana format is invalid`);
      if (!testFieldLength(f[33], 0, 12) || !testNameSpace(f[33])) addError(errors, `${lineNo}: spouse alias kanji format is invalid`);

      if (movementType === "1") {
        if (!["1", "2"].includes(f[34])) addError(errors, `${lineNo}: spouse cohabitation type is required`);
      } else if (f[34] !== "") {
        addError(errors, `${lineNo}: spouse cohabitation type must be empty unless movement type is 1`);
      }
      if (!testNonZeroDigits(f[36], 3, 3, true) || !testDigits(f[37], 4, 4, true) || !testFieldLength(f[38], 1, 37, true)) {
        addError(errors, `${lineNo}: spouse postal code and address are required`);
      }
      if (f[39] !== "" && !["1", "2", "3", "4"].includes(f[39])) addError(errors, `${lineNo}: spouse phone type is invalid`);
      if (hasAnyValue([f[39], f[40], f[41], f[42]]) && (!testDigits(f[40], 2, 5, true) || !testDigits(f[41], 1, 4, true) || !testDigits(f[42], 4, 5, true))) {
        addError(errors, `${lineNo}: spouse phone fields are invalid`);
      }

      if ((f[39] === "") !== !hasAnyValue([f[40], f[41], f[42]])) addError(errors, `${lineNo}: spouse phone type and number must be supplied together`);
      validatePrefecture(errors, lineNo, f[35], movementType === "2" && ["4", "5"].includes(f[51]), "spouse");
      if (f[33] !== "" && f[32] === "") addError(errors, `${lineNo}: spouse alias kanji requires alias kana`);
      if ((f[31] === "") !== (f[32] === "")) addError(errors, `${lineNo}: spouse nationality and alias kana must be supplied together`);
      const became = validateDatePair(errors, lineNo, f, 43, 44, "spouse became dependent date", movementType === "1");
      if (movementType === "1") {
        if (!["1", "2", "3", "4", "5"].includes(f[45])) addError(errors, `${lineNo}: spouse became reason is invalid`);
        if (!["1", "2", "3", "4"].includes(f[47])) addError(errors, `${lineNo}: spouse occupation is invalid`);
        if (!testDigits(f[48], 7, 7, true)) addError(errors, `${lineNo}: spouse annual income is required`);
      } else if (hasAnyValue([f[45], f[46], f[47], f[48]]) || (movementType !== "3" && hasAnyValue([f[43], f[44]]))) {
        addError(errors, `${lineNo}: spouse became detail fields must be empty unless movement type is 1`);
      }
      if (f[45] === "5" && f[46] === "") addError(errors, `${lineNo}: spouse became other reason is required`);
      if (f[45] !== "5" && f[46] !== "") addError(errors, `${lineNo}: spouse became other reason must be empty`);

      const noLonger = validateDatePair(errors, lineNo, f, 49, 50, "spouse no-longer dependent date", movementType === "2");
      if (movementType === "2") {
        if (!["1", "2", "3", "4", "5", "6"].includes(f[51])) addError(errors, `${lineNo}: spouse no-longer reason is invalid`);
      } else if (hasAnyValue([f[51], f[52], f[53], f[54]]) || (movementType !== "3" && hasAnyValue([f[49], f[50]]))) {
        addError(errors, `${lineNo}: spouse no-longer fields must be empty unless movement type is 2`);
      }
      if (f[51] === "6" && f[52] === "") addError(errors, `${lineNo}: spouse no-longer other reason is required`);
      if (f[51] !== "6" && f[52] !== "") addError(errors, `${lineNo}: spouse no-longer other reason must be empty`);
      const death = validateDatePair(errors, lineNo, f, 53, 54, "spouse death date", f[51] === "1");
      if (f[51] !== "1" && (f[53] !== "" || f[54] !== "")) addError(errors, `${lineNo}: spouse death date must be empty unless no-longer reason is 1`);
      if (f[51] === "1" && death && noLonger && noLonger.getTime() !== addDaysUtc(death, 1).getTime()) addError(errors, `${lineNo}: spouse no-longer date must be the day after death date`);
      if (f[51] === "4" && spouseBirth && noLonger) {
        const seventyFifthBirthday = addYearsUtc(spouseBirth, 75);
        if (seventyFifthBirthday && noLonger.getTime() !== seventyFifthBirthday.getTime()) addError(errors, `${lineNo}: spouse no-longer reason 4 requires 75th birthday`);
      }
      if (movementType === "3" && f[55] === "") addError(errors, `${lineNo}: spouse remarks are required for movement type 3`);
      if (!testFieldLength(f[55], 0, 75)) addError(errors, `${lineNo}: spouse remarks length is invalid`);
      if (f[56] !== "" && f[56] !== "1") addError(errors, `${lineNo}: spouse relationship confirmation must be empty or 1`);
      if (insuredBirth && notificationDate && notificationDate < insuredBirth) addError(errors, `${lineNo}: notification date must be on or after insured birth date`);
      if (spouseBirth && became && became < spouseBirth) addError(errors, `${lineNo}: spouse became date must be on or after birth date`);
      if (spouseBirth && noLonger && noLonger < spouseBirth) addError(errors, `${lineNo}: spouse no-longer date must be on or after birth date`);
      if (became && noLonger && noLonger <= became) addError(errors, `${lineNo}: spouse no-longer date must be after became date`);
      if (["1", "3"].includes(f[27]) && f[12] !== "2") addError(errors, `${lineNo}: insured sex must be female when spouse relationship is husband`);
      if (["2", "4"].includes(f[27]) && f[12] !== "1") addError(errors, `${lineNo}: insured sex must be male when spouse relationship is wife`);

      validateDatePair(errors, lineNo, f, 58, 59, "spouse overseas applicable date", f[57] === "1", ["9"]);
      validateDatePair(errors, lineNo, f, 62, 63, "spouse overseas not-applicable date", f[57] === "2", ["9"]);
      if (f[57] !== "1" && (f[58] !== "" || f[59] !== "")) addError(errors, `${lineNo}: spouse overseas applicable date requires overseas flag 1`);
      if (f[57] !== "2" && (f[62] !== "" || f[63] !== "")) addError(errors, `${lineNo}: spouse overseas not-applicable date requires overseas flag 2`);
      const overseas = [f[57], f[60], f[61], f[64], f[65], f[66], f[67]];
      validateOverseas(errors, lineNo, overseas, 0, "spouse", Boolean(became), Boolean(noLonger));
    }
    if (hasSpouse && f[68] !== "") addError(errors, `${lineNo}: non-dependent spouse income must be empty when a dependent spouse is supplied`);
    if (!testDigits(f[68], 7, 7)) addError(errors, `${lineNo}: spouse annual income field 69 is invalid`);
    const hasOther1 = validateOtherDependent(errors, lineNo, f, 69, movementType, "other dependent 1");
    const hasOther2 = validateOtherDependent(errors, lineNo, f, 102, movementType, "other dependent 2");
    if ((!hasOther1 && f[137] !== "") || (!hasOther2 && f[138] !== "")) addError(errors, `${lineNo}: insurance card request requires the corresponding other dependent`);
    if (!hasOther1 && hasOther2) addError(errors, `${lineNo}: other dependent 2 cannot be set when other dependent 1 is empty`);
    if (!hasOther1 && !hasOther2 && f[23] === "") addError(errors, `${lineNo}: at least one dependent must be set`);
    if (f[135] !== "") addError(errors, `${lineNo}: intention confirmation field must be empty`);
    for (const [index, label] of [[136, "spouse"], [137, "other dependent 1"], [138, "other dependent 2"]] as const) {
      if (f[index] !== "" && f[index] !== "1") addError(errors, `${lineNo}: ${label} insurance card required must be empty or 1`);
    }
  }

  return errors;
}
