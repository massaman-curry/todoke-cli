import { convertJapaneseEraToDate } from "../../common/csv";
import { eraMonthToDate, validateFormFields } from "../rules";
import { readAndValidateHeader } from "../validation/header";
import {
  addError,
  assertFieldCount,
  testDigits,
  testNonZeroDigits,
  testFieldLength,
  testNameSpace,
  testMyNumber,
  testAllowedOfficeSymbol,
} from "../validation/primitives";

function convertJapaneseEraToMonth(era: string, year: string, month: string): Date | undefined {
  if (!/^[79]$/.test(era) || !/^\d{2}$/.test(year) || !/^\d{2}$/.test(month)) return undefined;
  return eraMonthToDate(era, year, month);
}

function toNumber(value: string): number {
  if (value === "9999999") return 9999999;
  return Number(value || "0");
}

function sumAmount(left: string, right: string): number {
  if (left === "9999999" || right === "9999999") return 9999999;
  const total = toNumber(left) + toNumber(right);
  return total >= 10000000 ? 9999999 : total;
}

function expectedEligibleIndexes(days: number[], shortTime: boolean, partTime: boolean): number[] {
  const threshold = shortTime ? 11 : partTime && days.every((day) => day < 17) ? 15 : 17;
  return days.map((day, index) => ({ day, index })).filter((item) => item.day >= threshold).map((item) => item.index);
}

export function validate(csvPath: string): string[] {
  const errors: string[] = [];
  const { lines, office } = readAndValidateHeader(csvPath, errors, testAllowedOfficeSymbol);

  for (let lineNo = 6; lineNo <= lines.length; lineNo += 1) {
    if (lines[lineNo - 1] === "") continue;
    const f = lines[lineNo - 1].split(",");
    assertFieldCount(errors, lineNo, f, 53, "standard remuneration");
    if (f.length !== 53) continue;
    validateFormFields(errors, lineNo, f);

    if (f[0] !== "2225700") addError(errors, `${lineNo}: form code must be 2225700`);
    if (f[1] !== office[0] || f[2] !== office[1] || f[3] !== office[2]) {
      addError(errors, `${lineNo}: employee office ID must match office info`);
    }

    const onlyOver70 = f[52] === "1";
    if (!testNonZeroDigits(f[4], 1, 6, !onlyOver70)) addError(errors, `${lineNo}: insured number is invalid`);
    if (!testFieldLength(f[5], 1, 25, true) || !testNameSpace(f[5], true)) addError(errors, `${lineNo}: kana name format is invalid`);
    if (!testFieldLength(f[6], 0, 12) || !testNameSpace(f[6])) addError(errors, `${lineNo}: kanji name format is invalid`);
    const birthDate = convertJapaneseEraToDate(f[7], f[8]);
    if (!birthDate) addError(errors, `${lineNo}: birth date is invalid`);

    const applicationMonth = convertJapaneseEraToMonth(f[9], f[10], f[11]);
    if (!applicationMonth) addError(errors, `${lineNo}: application month is invalid`);
    if (birthDate && applicationMonth && applicationMonth.getUTCFullYear() * 12 + applicationMonth.getUTCMonth() < birthDate.getUTCFullYear() * 12 + birthDate.getUTCMonth()) addError(errors, `${lineNo}: application month must not precede birth`);
    if (f[11] !== "09") addError(errors, `${lineNo}: application month must be 09`);

    if (!testNonZeroDigits(f[12], 4, 4) || !testNonZeroDigits(f[13], 4, 4)) addError(errors, `${lineNo}: previous standard monthly amounts are invalid`);
    if (f[12] === "" && f[13] === "") addError(errors, `${lineNo}: at least one previous standard monthly amount is required`);
    const previousRevision = convertJapaneseEraToMonth(f[14], f[15], f[16]);
    if (!previousRevision) addError(errors, `${lineNo}: previous revision month is invalid`);
    if (applicationMonth && previousRevision && previousRevision >= applicationMonth) addError(errors, `${lineNo}: previous revision month must be before application month`);

    if (f[17] !== "" && !["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].includes(f[17])) addError(errors, `${lineNo}: raise/reduction month is invalid`);
    if (f[18] !== "" && !["1", "2"].includes(f[18])) addError(errors, `${lineNo}: raise/reduction type must be empty, 1, or 2`);
    if ((f[17] === "") !== (f[18] === "")) addError(errors, `${lineNo}: raise/reduction month and type must both be set or both empty`);
    if (f[19] !== "" && !["04", "05", "06"].includes(f[19])) addError(errors, `${lineNo}: retroactive payment month must be empty, 04, 05, or 06`);
    if (!testDigits(f[20], 0, 7)) addError(errors, `${lineNo}: retroactive payment amount is invalid`);
    if ((f[19] === "") !== (f[20] === "")) addError(errors, `${lineNo}: retroactive payment month and amount must both be set or both empty`);

    if (f[21] !== "04" || f[22] !== "05" || f[23] !== "06") addError(errors, `${lineNo}: payment months must be 04, 05, 06`);
    for (const index of [24, 25, 26]) {
      if (!testDigits(f[index], 2, 2, true) || Number(f[index]) > 31) addError(errors, `${lineNo}: base day field ${index + 1} is invalid`);
    }
    for (const index of [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37]) {
      if (!testDigits(f[index], 1, 7, true)) addError(errors, `${lineNo}: amount field ${index + 1} is invalid`);
    }
    if (!testDigits(f[38], 0, 7)) addError(errors, `${lineNo}: corrected average amount is invalid`);

    const cash = [f[27], f[28], f[29]];
    const inKind = [f[30], f[31], f[32]];
    const totals = [f[33], f[34], f[35]];
    for (let i = 0; i < 3; i += 1) {
      const expected = sumAmount(cash[i], inKind[i]);
      if (toNumber(totals[i]) !== expected) addError(errors, `${lineNo}: monthly total field ${34 + i} must equal cash plus in-kind amount`);
    }

    const days = [Number(f[24]), Number(f[25]), Number(f[26])];
    const shortTime = f[48] === "1";
    const partTime = f[49] === "1";
    const eligible = expectedEligibleIndexes(days, shortTime, partTime);
    const expectedGrandTotal = Math.min(9999999, eligible.reduce((sum, index) => sum + toNumber(totals[index]), 0));
    if (toNumber(f[36]) !== expectedGrandTotal) addError(errors, `${lineNo}: grand total must equal eligible monthly totals`);
    const lowerTotal = eligible.reduce((sum, index) => sum + toNumber(cash[index]) + toNumber(inKind[index]), 0);
    const minimumAverage = eligible.length === 0 ? 0 : Math.min(9999999, Math.floor(lowerTotal / eligible.length));
    const unknownComponents = eligible.some((index) => [cash[index], inKind[index]].some((value) => Number(value) === 9999999));
    if ((!unknownComponents || minimumAverage === 9999999) ? toNumber(f[37]) !== minimumAverage : toNumber(f[37]) < minimumAverage) addError(errors, `${lineNo}: average amount is inconsistent with eligible remuneration before capping`);

    if (!testMyNumber(f[39])) addError(errors, `${lineNo}: personal number check digit is invalid`);
    if ((f[40] === "") !== (f[41] === "")) addError(errors, `${lineNo}: pension number parts must both be set or both empty`);
    if (f[40] !== "" && (!testNonZeroDigits(f[40], 4, 4, true) || !testNonZeroDigits(f[41], 6, 6, true))) {
      addError(errors, `${lineNo}: pension number must be non-zero 4 and 6 digit parts`);
    }
    if ((f[42] === "1" || onlyOver70) && f[39] === "" && (f[40] === "" || f[41] === "")) {
      addError(errors, `${lineNo}: pension number is required for over-70 employee when personal number is empty`);
    }

    for (const index of [42, 44, 45, 46, 47, 48, 49, 50, 52]) {
      if (f[index] !== "" && f[index] !== "1") addError(errors, `${lineNo}: remark flag field ${index + 1} must be empty or 1`);
    }
    if (f[43] !== "" && !["04", "05", "06", "0405", "0406", "0506"].includes(f[43])) addError(errors, `${lineNo}: over-70 basis months must be empty or 04/05/06 combination`);
    if (!testFieldLength(f[51], 0, 75)) addError(errors, `${lineNo}: remarks length is invalid`);
    if (onlyOver70 && f[42] !== "1") addError(errors, `${lineNo}: only over-70 submission requires over-70 remark flag`);
  }

  return errors;
}
