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
  hasAnyValue,
} from "../validation/primitives";

function testAllowedOfficeSymbol(value: string): boolean {
  if (!testFieldLength(value, 1, 4, true)) return false;
  if (/^[A-Za-z0-9]+$/.test(value)) {
    return /[A-Za-z]/.test(value) || BigInt(value) !== 0n;
  }
  return true;
}

function testKanaAddressSpace(value: string): boolean {
  return !value.includes("\u3000") && !value.includes("  ");
}

function testKanjiAddressSpace(value: string): boolean {
  return !value.includes(" ") && !value.includes("\u3000\u3000");
}

export function validate(csvPath: string): string[] {
  const errors: string[] = [];
  const { lines, office } = readAndValidateHeader(csvPath, errors, testAllowedOfficeSymbol);

  for (let lineNo = 6; lineNo <= lines.length; lineNo += 1) {
    if (lines[lineNo - 1] === "") continue;
    const f = lines[lineNo - 1].split(",");
    assertFieldCount(errors, lineNo, f, 35, "qualification acquisition");
    if (f.length !== 35) continue;
    validateFormFields(errors, lineNo, f);

    if (f[0] !== "2200700") addError(errors, `${lineNo}: form code must be 2200700`);
    if (f[1] !== office[0] || f[2] !== office[1] || f[3] !== office[2] || f[4] !== office[3]) {
      addError(errors, `${lineNo}: employee office ID must match office info`);
    }
    if (f[5] !== "") addError(errors, `${lineNo}: insured number should be empty for ordinary acquisition records`);
    if (!testFieldLength(f[6], 1, 25, true) || !testNameSpace(f[6], true)) addError(errors, `${lineNo}: kana name format is invalid`);
    if (!testFieldLength(f[7], 0, 12) || !testNameSpace(f[7])) addError(errors, `${lineNo}: kanji name format is invalid`);

    const birthDate = convertJapaneseEraToDate(f[8], f[9]);
    if (!birthDate) addError(errors, `${lineNo}: birth date is invalid`);
    if (f[33] !== "1" && !["1", "2", "3", "5", "6", "7"].includes(f[10])) addError(errors, `${lineNo}: sex type is invalid`);
    if (f[33] !== "1" && !["1", "3", "4", "6", "7"].includes(f[11])) addError(errors, `${lineNo}: acquisition type is invalid`);
    if (!testMyNumber(f[12])) addError(errors, `${lineNo}: personal number check digit is invalid`);
    if (f[12] !== "" && (f[13] !== "" || f[14] !== "" || f[29] !== "" || f[30] !== "" || f[31] !== "" || f[32] !== "")) {
      addError(errors, `${lineNo}: reason/note/address fields must be empty when personal number is set`);
    }
    if ((f[15] === "") !== (f[16] === "")) addError(errors, `${lineNo}: pension number parts must both be set or both empty`);
    if (f[15] !== "" && (!testNonZeroDigits(f[15], 4, 4, true) || !testNonZeroDigits(f[16], 6, 6, true))) {
      addError(errors, `${lineNo}: pension number must be non-zero 4 and 6 digit parts`);
    }
    const acquisitionDate = convertJapaneseEraToDate(f[17], f[18]);
    if ((!acquisitionDate && (f[27] !== "1" || f[17] !== "" || f[18] !== "")) || ((f[17] === "") !== (f[18] === ""))) addError(errors, `${lineNo}: acquisition date is invalid`);
    if (f[17] !== "" && !["7", "9"].includes(f[17])) addError(errors, `${lineNo}: acquisition era must be Heisei or Reiwa`);
    if (birthDate && acquisitionDate && acquisitionDate < birthDate) addError(errors, `${lineNo}: acquisition date must be on or after birth date`);
    if (["3", "4"].includes(f[11]) && !["1", "2"].includes(f[10])) {
      addError(errors, `${lineNo}: sex type must be 1 or 2 when acquisition type is 3 or 4`);
    }
    if (!["0", "1"].includes(f[19])) addError(errors, `${lineNo}: dependents flag must be 0 or 1`);
    if (!testDigits(f[20], 1, 7, true) || !testDigits(f[21], 1, 7, true) || !testDigits(f[22], 1, 7, true)) {
      addError(errors, `${lineNo}: remuneration amounts must be 1-7 digits`);
    } else if (Number(f[22]) !== Math.min(9999999, Number(f[20]) + Number(f[21]))) {
      addError(errors, `${lineNo}: total remuneration must equal cash + in-kind`);
    }
    for (let index = 23; index <= 27; index += 1) {
      if (f[index] !== "" && f[index] !== "1") addError(errors, `${lineNo}: remark flag field ${index + 1} must be empty or 1`);
    }
    if (!testFieldLength(f[28], 0, 75)) addError(errors, `${lineNo}: remarks length is invalid`);
    if (!testDigits(f[29], 0, 3) || !testDigits(f[30], 0, 4)) addError(errors, `${lineNo}: postal code parts are invalid`);
    if (!testFieldLength(f[31], 0, 75)) addError(errors, `${lineNo}: kana address length is invalid`);
    if (!testFieldLength(f[32], 0, 37)) addError(errors, `${lineNo}: kanji address length is invalid`);

    const hasAddress = hasAnyValue([f[29], f[30], f[31], f[32]]);
    if (f[12] === "" && !hasAddress && !["1", "2", "3"].includes(f[13])) {
      addError(errors, `${lineNo}: personal number absence reason must be 1, 2, or 3 when personal number and address are empty`);
    }
    if (f[13] !== "" && !["1", "2", "3"].includes(f[13])) addError(errors, `${lineNo}: personal number absence reason is invalid`);
    if (f[13] === "3" && f[14] === "") addError(errors, `${lineNo}: personal number note is required when absence reason is 3`);
    if (f[13] !== "" && f[13] !== "3" && f[14] !== "") addError(errors, `${lineNo}: personal number note must be empty unless absence reason is 3`);
    if (hasAddress && (f[13] !== "" || f[14] !== "")) {
      addError(errors, `${lineNo}: personal number absence reason and note must be empty when address is set`);
    }
    if ((f[29] === "") !== (f[30] === "")) addError(errors, `${lineNo}: postal code parts must both be set or both empty`);
    if (f[29] !== "" && !testNonZeroDigits(f[29], 3, 3, true)) addError(errors, `${lineNo}: postal parent must be non-zero 3 digits`);
    if ((f[29] !== "" || f[30] !== "") && f[31] === "") addError(errors, `${lineNo}: kana address is required when postal code is set`);
    if (f[31] !== "" && !testKanaAddressSpace(f[31])) addError(errors, `${lineNo}: kana address spacing is invalid`);
    if (f[32] !== "" && !testKanjiAddressSpace(f[32])) addError(errors, `${lineNo}: kanji address spacing is invalid`);

    if (f[25] === "1" && f[27] === "1") addError(errors, `${lineNo}: short-time and special-reduction flags are mutually exclusive`);
    if (f[33] !== "" && f[33] !== "1") addError(errors, `${lineNo}: only 70-or-over flag must be empty or 1`);
    if (f[33] === "1" && (f[10] !== "" || f[11] !== "")) addError(errors, `${lineNo}: sex and acquisition type must be empty for 70-or-over-only records`);
    if (f[33] === "1" && f[23] !== "1") addError(errors, `${lineNo}: 70+ only requires remark item 1`);
    if (f[23] === "1" && birthDate && acquisitionDate) {
      const seventiethBirthday = addYearsUtc(birthDate, 70);
      if (seventiethBirthday && acquisitionDate < addDaysUtc(seventiethBirthday, -1)) {
        addError(errors, `${lineNo}: 70+ remark requires acquisition date on or after the day before the 70th birthday`);
      }
    }
    if (f[34] !== "" && f[34] !== "1") addError(errors, `${lineNo}: insurance card required must be empty or 1`);
  }

  return errors;
}
