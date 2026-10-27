import { convertJapaneseEraToDate } from "../../common/csv";
import { validateFormFields } from "../rules";
import { readAndValidateHeader } from "../validation/header";
import {
  addError,
  assertFieldCount,
  testDigits,
  testNonZeroDigits,
  testFieldLength,
  testNameSpace,
  testMyNumber,
  hasBothOrNeither,
  testAllowedOfficeSymbol,
} from "../validation/primitives";

function toAmount(value: string): number | undefined {
  if (!testDigits(value, 1, 7, true)) return undefined;
  return Number(value);
}

function expectedTotalBonus(cash: number, inKind: number): number {
  if (cash === 9999999 || inKind === 9999999 || cash + inKind >= 10000000) return 9999999;
  return Math.floor((cash + inKind) / 1000) * 1000;
}

export function validate(csvPath: string): string[] {
  const errors: string[] = [];
  const { lines, office } = readAndValidateHeader(csvPath, errors, testAllowedOfficeSymbol);

  for (let lineNo = 6; lineNo <= lines.length; lineNo += 1) {
    if (lines[lineNo - 1] === "") continue;
    const f = lines[lineNo - 1].split(",");
    assertFieldCount(errors, lineNo, f, 21, "bonus payment");
    if (f.length !== 21) continue;
    validateFormFields(errors, lineNo, f);

    if (f[0] !== "2265700") addError(errors, `${lineNo}: form code must be 2265700`);
    if (f[1] !== office[0] || f[2] !== office[1] || f[3] !== office[2]) {
      addError(errors, `${lineNo}: employee office ID must match office info`);
    }

    const onlyOver70 = f[20] === "1";
    const over70 = f[17] === "1";
    if (!testNonZeroDigits(f[4], 1, 6, !onlyOver70)) addError(errors, `${lineNo}: insured number is invalid`);
    if (!testFieldLength(f[5], 1, 25, true) || !testNameSpace(f[5], true)) addError(errors, `${lineNo}: kana name format is invalid`);
    if (!testFieldLength(f[6], 0, 12) || !testNameSpace(f[6])) addError(errors, `${lineNo}: kanji name format is invalid`);

    const birthDate = convertJapaneseEraToDate(f[7], f[8]);
    const bonusPaidDate = convertJapaneseEraToDate(f[9], f[10]);
    if (!birthDate) addError(errors, `${lineNo}: birth date is invalid`);
    if (!bonusPaidDate) addError(errors, `${lineNo}: bonus paid date is invalid`);
    if (!["7", "9"].includes(f[9])) addError(errors, `${lineNo}: bonus paid era must be Heisei or Reiwa`);
    if (birthDate && bonusPaidDate && bonusPaidDate <= birthDate) addError(errors, `${lineNo}: bonus paid date must be after birth date`);

    const cash = toAmount(f[11]);
    const inKind = toAmount(f[12]);
    const total = toAmount(f[13]);
    if (cash === undefined) addError(errors, `${lineNo}: cash bonus amount is invalid`);
    if (inKind === undefined) addError(errors, `${lineNo}: in-kind bonus amount is invalid`);
    if (total === undefined) {
      addError(errors, `${lineNo}: total bonus amount is invalid`);
    } else if (cash !== undefined && inKind !== undefined && total !== expectedTotalBonus(cash, inKind)) {
      addError(errors, `${lineNo}: total bonus amount must be cash plus in-kind rounded down to the nearest 1000 yen`);
    }

    if (!testMyNumber(f[14])) addError(errors, `${lineNo}: personal number check digit is invalid`);
    if (!hasBothOrNeither(f[15], f[16])) addError(errors, `${lineNo}: pension number parts must both be set or both empty`);
    if ((over70 || onlyOver70) && f[14] === "" && (f[15] === "" || f[16] === "")) {
      addError(errors, `${lineNo}: pension number is required for over-70 employee when personal number is empty`);
    }
    if (f[15] !== "" && (!testNonZeroDigits(f[15], 4, 4, true) || !testNonZeroDigits(f[16], 6, 6, true))) {
      addError(errors, `${lineNo}: pension number must be non-zero 4 and 6 digit parts`);
    }

    if (f[17] !== "" && f[17] !== "1") addError(errors, `${lineNo}: over-70 remark flag must be empty or 1`);
    if (f[18] !== "" && f[18] !== "1") addError(errors, `${lineNo}: multiple offices remark flag must be empty or 1`);
    if (f[19] !== "" && (!testDigits(f[19], 2, 2, true) || Number(f[19]) < 1 || Number(f[19]) > 31)) {
      addError(errors, `${lineNo}: same-month bonus first day must be 01-31 when set`);
    }
    if (f[19] !== "" && bonusPaidDate) {
      const firstDay = new Date(Date.UTC(bonusPaidDate.getUTCFullYear(), bonusPaidDate.getUTCMonth(), Number(f[19])));
      if (firstDay.getUTCMonth() !== bonusPaidDate.getUTCMonth() || firstDay >= bonusPaidDate) addError(errors, `${lineNo}: same-month first bonus day must be a real day before the final bonus payment`);
    }
    if (f[20] !== "" && f[20] !== "1") addError(errors, `${lineNo}: only over-70 bonus flag must be empty or 1`);
    if (onlyOver70 && f[17] !== "1") addError(errors, `${lineNo}: only over-70 bonus requires over-70 remark flag`);
    if (onlyOver70 && f[4] !== "") addError(errors, `${lineNo}: insured number must be empty when only over-70 bonus flag is set`);
  }

  return errors;
}
