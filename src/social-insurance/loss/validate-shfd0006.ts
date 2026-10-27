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
  testAllowedOfficeSymbol,
} from "../validation/primitives";

export function validate(csvPath: string): string[] {
  const errors: string[] = [];
  const { lines, office } = readAndValidateHeader(csvPath, errors, testAllowedOfficeSymbol);

  for (let lineNo = 6; lineNo <= lines.length; lineNo += 1) {
    if (lines[lineNo - 1] === "") continue;
    const f = lines[lineNo - 1].split(",");
    assertFieldCount(errors, lineNo, f, 27, "qualification loss");
    if (f.length !== 27) continue;
    validateFormFields(errors, lineNo, f);

    if (f[0] !== "2201700") addError(errors, `${lineNo}: form code must be 2201700`);
    if (f[1] !== office[0] || f[2] !== office[1] || f[3] !== office[2] || f[4] !== office[3]) {
      addError(errors, `${lineNo}: employee office ID must match office info`);
    }

    const onlyOver70 = f[26] === "1";
    if (!testNonZeroDigits(f[5], 1, 6, !onlyOver70)) addError(errors, `${lineNo}: insured number is invalid`);
    if (!testFieldLength(f[6], 1, 25, true) || !testNameSpace(f[6], true)) addError(errors, `${lineNo}: kana name format is invalid`);
    if (!testFieldLength(f[7], 0, 12) || !testNameSpace(f[7])) addError(errors, `${lineNo}: kanji name format is invalid`);

    const birthDate = convertJapaneseEraToDate(f[8], f[9]);
    if (!birthDate) addError(errors, `${lineNo}: birth date is invalid`);
    if (!testMyNumber(f[10])) addError(errors, `${lineNo}: personal number check digit is invalid`);
    if (!hasBothOrNeither(f[11], f[12])) addError(errors, `${lineNo}: pension number parts must both be set or both empty`);
    if (f[10] === "" && (f[11] === "" || f[12] === "")) addError(errors, `${lineNo}: pension number is required when personal number is empty`);
    if (f[11] !== "" && (!testNonZeroDigits(f[11], 4, 4, true) || !testNonZeroDigits(f[12], 6, 6, true))) {
      addError(errors, `${lineNo}: pension number must be non-zero 4 and 6 digit parts`);
    }

    const lossDate = convertJapaneseEraToDate(f[13], f[14]);
    if (onlyOver70) {
      if (f[13] !== "" || f[14] !== "") addError(errors, `${lineNo}: loss date must be empty when only over-70 non-applicable is set`);
    } else if (!lossDate) {
      addError(errors, `${lineNo}: loss date is invalid`);
    } else if (!["7", "9"].includes(f[13])) {
      addError(errors, `${lineNo}: loss era must be Heisei or Reiwa`);
    }
    if (birthDate && lossDate && lossDate <= birthDate) addError(errors, `${lineNo}: loss date must be after birth date`);

    if (!["4", "5", "7", "9", "11", "12"].includes(f[15])) addError(errors, `${lineNo}: loss reason is invalid`);

    const retirementOrDeathDate = convertJapaneseEraToDate(f[16], f[17]);
    if (["4", "5"].includes(f[15])) {
      if (!retirementOrDeathDate) addError(errors, `${lineNo}: retirement/death date is required for loss reason 4 or 5`);
      if (!["7", "9"].includes(f[16])) addError(errors, `${lineNo}: retirement/death era must be Heisei or Reiwa`);
    } else if (f[16] !== "" || f[17] !== "") {
      addError(errors, `${lineNo}: retirement/death date must be empty unless loss reason is 4 or 5`);
    }

    if (f[15] === "4" && lossDate && retirementOrDeathDate) {
      const nextDay = addDaysUtc(retirementOrDeathDate, 1);
      if (lossDate.getTime() !== nextDay.getTime()) addError(errors, `${lineNo}: loss date must be the day after retirement date`);
    }
    if (f[15] === "5" && lossDate && retirementOrDeathDate) {
      const nextDay = addDaysUtc(retirementOrDeathDate, 1);
      if (lossDate.getTime() !== nextDay.getTime()) addError(errors, `${lineNo}: loss date must be the day after death date`);
    }
    if (f[15] === "7" && birthDate && lossDate) {
      const seventyFifthBirthday = addYearsUtc(birthDate, 75);
      if (seventyFifthBirthday && lossDate.getTime() !== seventyFifthBirthday.getTime()) {
        addError(errors, `${lineNo}: loss reason 7 requires loss date to be the 75th birthday`);
      }
    }

    for (let index = 18; index <= 19; index += 1) {
      if (f[index] !== "" && f[index] !== "1") addError(errors, `${lineNo}: remark flag field ${index + 1} must be empty or 1`);
    }
    if (!testFieldLength(f[20], 0, 75)) addError(errors, `${lineNo}: remarks length is invalid`);
    if (!testDigits(f[21], 0, 2) || !testDigits(f[22], 0, 2)) addError(errors, `${lineNo}: insurance card counts are invalid`);

    const over70Date = convertJapaneseEraToDate(f[24], f[25]);
    if (f[23] !== "" && f[23] !== "1") addError(errors, `${lineNo}: over-70 non-applicable flag must be empty or 1`);
    if (f[26] !== "" && f[26] !== "1") addError(errors, `${lineNo}: only over-70 non-applicable flag must be empty or 1`);
    if (f[23] === "1") {
      if (!over70Date) addError(errors, `${lineNo}: over-70 non-applicable date is required`);
      if (!["7", "9"].includes(f[24])) addError(errors, `${lineNo}: over-70 non-applicable era must be Heisei or Reiwa`);
    } else if (f[24] !== "" || f[25] !== "") {
      addError(errors, `${lineNo}: over-70 non-applicable date must be empty unless its flag is 1`);
    }
    if (onlyOver70 && f[23] !== "1") addError(errors, `${lineNo}: only over-70 non-applicable requires over-70 non-applicable flag`);
    if (["4", "5"].includes(f[15]) && f[23] === "1" && over70Date && retirementOrDeathDate) {
      if (over70Date.getTime() !== retirementOrDeathDate.getTime()) {
        addError(errors, `${lineNo}: over-70 non-applicable date must equal retirement/death date`);
      }
    }
  }

  return errors;
}
