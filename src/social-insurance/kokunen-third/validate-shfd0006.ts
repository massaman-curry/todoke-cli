import { convertJapaneseEraToDate } from "../../common/csv";
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
  testAllowedOfficeSymbol,
} from "../validation/primitives";

function validateDatePair(errors: string[], lineNo: number, label: string, era: string, ymd: string, required: boolean, allowedEras: string[]): Date | undefined {
  if ((era === "") !== (ymd === "")) {
    addError(errors, `${lineNo}: ${label} era and ymd must both be set or both be empty`);
    return undefined;
  }
  if (era === "" && ymd === "") {
    if (required) addError(errors, `${lineNo}: ${label} is required`);
    return undefined;
  }
  if (!allowedEras.includes(era)) addError(errors, `${lineNo}: ${label} era is invalid`);
  const date = convertJapaneseEraToDate(era, ymd);
  if (!date) addError(errors, `${lineNo}: ${label} date is invalid`);
  return date;
}

function validatePensionIdentity(errors: string[], lineNo: number, label: string, personalNumber: string, officeCode: string, serial: string): void {
  if (!testMyNumber(personalNumber)) addError(errors, `${lineNo}: ${label} personal number check digit is invalid`);
  if (!hasBothOrNeither(officeCode, serial)) {
    addError(errors, `${lineNo}: ${label} pension number parts must both be set or both empty`);
  }
  if (personalNumber === "" && (officeCode === "" || serial === "")) {
    addError(errors, `${lineNo}: ${label} pension number is required when personal number is empty`);
  }
  if (officeCode !== "" && (!testNonZeroDigits(officeCode, 4, 4, true) || !testNonZeroDigits(serial, 6, 6, true))) {
    addError(errors, `${lineNo}: ${label} pension number must be non-zero 4 and 6 digit parts`);
  }
}

export function validate(csvPath: string): string[] {
  const errors: string[] = [];
  const { lines, office } = readAndValidateHeader(csvPath, errors, testAllowedOfficeSymbol);

  for (let lineNo = 6; lineNo <= lines.length; lineNo += 1) {
    if (lines[lineNo - 1] === "") continue;
    const f = lines[lineNo - 1].split(",");
    assertFieldCount(errors, lineNo, f, 63, "kokunen third");
    if (f.length !== 63) continue;
    validateFormFields(errors, lineNo, f);

    if (f[0] !== "4300700") addError(errors, `${lineNo}: form code must be 4300700`);
    if (f[1] !== office[0] || f[2] !== office[1] || f[3] !== office[2]) {
      addError(errors, `${lineNo}: record office ID must match office info`);
    }

    validateDatePair(errors, lineNo, "employer received", f[4], f[5], true, ["7", "9"]);
    if (!testFieldLength(f[6], 1, 25, true) || !testNameSpace(f[6], true)) addError(errors, `${lineNo}: spouse kana name format is invalid`);
    if (!testFieldLength(f[7], 0, 12) || !testNameSpace(f[7])) addError(errors, `${lineNo}: spouse kanji name format is invalid`);
    const spouseBirth = validateDatePair(errors, lineNo, "spouse birth", f[8], f[9], true, ["5", "7", "9"]);
    if (!["1", "2"].includes(f[10])) addError(errors, `${lineNo}: spouse sex must be 1 or 2`);
    validatePensionIdentity(errors, lineNo, "spouse", f[11], f[12], f[13]);
    if (!hasBothOrNeither(f[14], f[15])) addError(errors, `${lineNo}: spouse postal code parts must both be set or both empty`);
    if (!testDigits(f[14], 3, 3) || !testDigits(f[15], 4, 4)) addError(errors, `${lineNo}: spouse postal code is invalid`);
    if (f[11] !== "" && (f[14] !== "" || f[15] !== "" || f[16] !== "")) addError(errors, `${lineNo}: spouse address fields must be empty when personal number is set`);
    if (!testFieldLength(f[16], 0, 37)) addError(errors, `${lineNo}: spouse address length is invalid`);

    validateDatePair(errors, lineNo, "third report", f[17], f[18], true, ["7", "9"]);
    if (!testFieldLength(f[19], 1, 25, true) || !testNameSpace(f[19], true)) addError(errors, `${lineNo}: third insured kana name format is invalid`);
    if (!testFieldLength(f[20], 0, 12) || !testNameSpace(f[20])) addError(errors, `${lineNo}: third insured kanji name format is invalid`);
    const thirdBirth = validateDatePair(errors, lineNo, "third insured birth", f[21], f[22], true, ["5", "7", "9"]);
    if (!["1", "2", "3", "4"].includes(f[23])) addError(errors, `${lineNo}: third insured relationship type is invalid`);
    validatePensionIdentity(errors, lineNo, "third insured", f[24], f[25], f[26]);
    if (!testFieldLength(f[27], 0, 30)) addError(errors, `${lineNo}: nationality length is invalid`);
    if (!testFieldLength(f[28], 0, 25) || !testNameSpace(f[28], true)) addError(errors, `${lineNo}: alias kana name format is invalid`);
    if (f[29] !== "" && f[28] === "") addError(errors, `${lineNo}: alias kanji requires alias kana`);
    if ((f[27] === "") !== (f[28] === "")) addError(errors, `${lineNo}: nationality and alias kana must be supplied together`);
    if (!testFieldLength(f[29], 0, 12) || !testNameSpace(f[29])) addError(errors, `${lineNo}: alias kanji name format is invalid`);
    if (f[30] !== "" && !["1", "2"].includes(f[30])) addError(errors, `${lineNo}: cohabitation type must be empty, 1, or 2`);
    if (!hasBothOrNeither(f[31], f[32])) addError(errors, `${lineNo}: third insured postal code parts must both be set or both empty`);
    if (!testDigits(f[31], 3, 3) || !testDigits(f[32], 4, 4)) addError(errors, `${lineNo}: third insured postal code is invalid`);
    if (!testFieldLength(f[33], 0, 37)) addError(errors, `${lineNo}: third insured address length is invalid`);
    if (f[34] !== "" && !["1", "2", "3", "4"].includes(f[34])) addError(errors, `${lineNo}: third insured phone type is invalid`);
    if (!testDigits(f[35], 0, 5) || !testDigits(f[36], 0, 4) || !testDigits(f[37], 0, 5)) addError(errors, `${lineNo}: third insured phone number is invalid`);

    if (["1", "3"].includes(f[23]) && f[10] !== "2") addError(errors, `${lineNo}: spouse sex must be 2 when third insured is husband`);
    if (["2", "4"].includes(f[23]) && f[10] !== "1") addError(errors, `${lineNo}: spouse sex must be 1 when third insured is wife`);

    const phonePresent = [f[34], f[35], f[36], f[37]].some((value) => value !== "");
    if (phonePresent && (f[34] === "" || !testDigits(f[35], 2, 5, true) || !testDigits(f[36], 1, 4, true) || !testDigits(f[37], 4, 5, true))) addError(errors, `${lineNo}: phone type and all phone number parts are required together`);
    if (f[38] !== "1" && f[30] !== "") addError(errors, `${lineNo}: cohabitation type must be empty unless movement type is 1`);
    if (!["1", "2", "3"].includes(f[38])) addError(errors, `${lineNo}: movement type must be 1, 2, or 3`);
    const becameDate = validateDatePair(errors, lineNo, "third insured became", f[39], f[40], f[38] === "1", ["7", "9"]);
    const lostDate = validateDatePair(errors, lineNo, "third insured lost", f[44], f[45], f[38] === "2", ["7", "9"]);
    if (thirdBirth && becameDate && becameDate < thirdBirth) addError(errors, `${lineNo}: became date must be on or after third insured birth date`);
    if (thirdBirth && lostDate && lostDate <= thirdBirth) addError(errors, `${lineNo}: lost date must be after third insured birth date`);
    if (spouseBirth && thirdBirth && spouseBirth.getTime() === thirdBirth.getTime() && f[10] === (["1", "3"].includes(f[23]) ? "1" : "2")) {
      addError(errors, `${lineNo}: spouse and third insured sex relationship is inconsistent`);
    }

    if (f[38] === "1") {
      if (!["1", "2", "3", "4", "5"].includes(f[41])) addError(errors, `${lineNo}: became reason is invalid`);
      if (f[41] === "5" && f[42] === "") addError(errors, `${lineNo}: became reason other is required when reason is 5`);
      if (f[41] !== "5" && f[42] !== "") addError(errors, `${lineNo}: became reason other must be empty unless reason is 5`);
      if (f[43] !== "31") addError(errors, `${lineNo}: spouse system type must be 31 when movement is applicable`);
      if (f[44] !== "" || f[45] !== "" || f[46] !== "" || f[47] !== "" || f[48] !== "" || f[49] !== "") {
        addError(errors, `${lineNo}: lost fields must be empty when movement is applicable`);
      }
      if (!["1", "2"].includes(f[30])) addError(errors, `${lineNo}: cohabitation type is required when movement is applicable`);
    }

    if (f[38] === "2") {
      if (!["1", "2", "3", "6"].includes(f[46])) addError(errors, `${lineNo}: lost reason is invalid`);
      const deathDate = validateDatePair(errors, lineNo, "death", f[47], f[48], f[46] === "1", ["7", "9"]);
      if (f[46] === "1" && lostDate && deathDate && lostDate.getTime() !== addDaysUtc(deathDate, 1).getTime()) {
        addError(errors, `${lineNo}: lost date must be the day after death date`);
      }
      if (f[46] !== "1" && (f[47] !== "" || f[48] !== "")) addError(errors, `${lineNo}: death date must be empty unless lost reason is death`);
      if (f[46] === "6" && f[49] === "") addError(errors, `${lineNo}: lost reason other is required when reason is 6`);
      if (f[46] !== "6" && f[49] !== "") addError(errors, `${lineNo}: lost reason other must be empty unless reason is 6`);
      if (f[39] !== "" || f[40] !== "" || f[41] !== "" || f[42] !== "" || f[43] !== "") {
        addError(errors, `${lineNo}: became fields must be empty when movement is non-applicable`);
      }
    } else if (f[47] !== "" || f[48] !== "") {
      addError(errors, `${lineNo}: death date must be empty unless lost reason is death`);
    }

    if (f[38] === "3" && [f[41], f[42], f[43], f[46], f[49]].some((value) => value !== "")) addError(errors, `${lineNo}: movement type 3 requires became/lost detail fields to be empty`);
    if (f[38] === "3" && f[50] === "") addError(errors, `${lineNo}: remarks are required when movement is change`);
    if (!testFieldLength(f[50], 0, 75)) addError(errors, `${lineNo}: remarks length is invalid`);

    if (f[51] !== "" && !["1", "2"].includes(f[51])) addError(errors, `${lineNo}: overseas special type must be empty, 1, or 2`);
    if (f[40] !== "" && f[51] === "2") addError(errors, `${lineNo}: overseas special type cannot be 2 when became date is set`);
    if (f[45] !== "" && f[51] !== "") addError(errors, `${lineNo}: overseas special type must be empty when lost date is set`);

    validateDatePair(errors, lineNo, "overseas applicable", f[52], f[53], f[51] === "1", ["9"]);
    if (f[51] === "1") {
      if (!["1", "2", "3", "4", "5"].includes(f[54])) addError(errors, `${lineNo}: overseas applicable reason is invalid`);
      if (f[54] === "5" && f[55] === "") addError(errors, `${lineNo}: overseas applicable reason other is required when reason is 5`);
      if (f[54] !== "5" && f[55] !== "") addError(errors, `${lineNo}: overseas applicable reason other must be empty unless reason is 5`);
    } else if (f[52] !== "" || f[53] !== "" || f[54] !== "" || f[55] !== "") {
      addError(errors, `${lineNo}: overseas applicable fields must be empty unless overseas special type is 1`);
    }

    validateDatePair(errors, lineNo, "overseas not applicable", f[56], f[57], f[51] === "2", ["9"]);
    if (f[51] === "2") {
      if (!["1", "2"].includes(f[58])) addError(errors, `${lineNo}: overseas not applicable reason is invalid`);
      if (f[58] === "2" && f[59] === "") addError(errors, `${lineNo}: overseas not applicable reason other is required when reason is 2`);
      if (f[58] !== "2" && f[59] !== "") addError(errors, `${lineNo}: overseas not applicable reason other must be empty unless reason is 2`);
      validateDatePair(errors, lineNo, "overseas return", f[60], f[61], f[58] === "1", ["9"]);
      if (f[58] !== "1" && (f[60] !== "" || f[61] !== "")) addError(errors, `${lineNo}: overseas return date requires domestic return reason`);
    } else if (f[56] !== "" || f[57] !== "" || f[58] !== "" || f[59] !== "" || f[60] !== "" || f[61] !== "") {
      addError(errors, `${lineNo}: overseas not applicable fields must be empty unless overseas special type is 2`);
    }

    if (f[62] !== "") addError(errors, `${lineNo}: declaration intent confirmed field must be empty`);
  }

  return errors;
}
