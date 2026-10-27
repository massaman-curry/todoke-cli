import { readCsvText } from "../../common/csv";
import { validateOfficeFields } from "../rules";
import { addError, assertFieldCount, isRealYmd, testDigits, testFieldLength, testNonZeroDigits } from "./primitives";

/** Read the five header records, preserving diagnostics in file/field order. */
export function readAndValidateHeader(
  csvPath: string,
  errors: string[],
  testAllowedOfficeSymbol: (value: string) => boolean,
): { lines: string[]; office: string[] } {
  const text = readCsvText(csvPath, errors);

  if (!text.endsWith("\r\n") && !text.endsWith("\r\n\x1A")) {
    addError(errors, "last data record must end with CRLF");
  }

  const lines = text.replace(/\x1A+$/, "").split("\n").map((line) => line.replace(/\r$/, ""));
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  if (lines.length < 6) {
    addError(errors, "file must contain media, [kanri], office count, office info, [data], and at least one data record");
  }

  const media = (lines[0] ?? "").split(",");
  assertFieldCount(errors, 1, media, 6, "media management");
  if (media.length === 6) {
    if (!testDigits(media[0], 2, 2, true)) addError(errors, "media prefecture code must be 2 digits");
    if (!testNonZeroDigits(media[1], 2, 2, true) || media[1] === "99") addError(errors, "media district code must be 2 non-zero digits except 99");
    if (!testAllowedOfficeSymbol(media[2])) addError(errors, "media office symbol is invalid");
    if (!testDigits(media[3], 3, 3, true) || Number(media[3]) < 1) addError(errors, "media serial must be 001-999");
    if (!isRealYmd(media[4])) addError(errors, "created_on must be a real yyyyMMdd date");
    if (media[5] !== "22223") addError(errors, "representative form code must be 22223");
  }

  if (lines[1] !== "[kanri]") addError(errors, "line 2 must be [kanri]");
  const officeCount = (lines[2] ?? "").split(",");
  assertFieldCount(errors, 3, officeCount, 2, "office count");
  if (officeCount.length === 2) {
    if (officeCount[0] !== "") addError(errors, "office count reserved field must be empty");
    if (!["1", "01", "001"].includes(officeCount[1])) addError(errors, "office count must be 1, 01, or 001");
  }

  const office = (lines[3] ?? "").split(",");
  assertFieldCount(errors, 4, office, 12, "office info");
  if (office.length === 12) {
    validateOfficeFields(errors, office);
    if (office[0] !== media[0] || office[1] !== media[1] || office[2] !== media[2]) {
      addError(errors, "media office ID and office info ID must match");
    }
    if (!testNonZeroDigits(office[3], 1, 5, true)) addError(errors, "office number must be non-zero digits");
    if (!testNonZeroDigits(office[4], 3, 3, true)) addError(errors, "office postal parent must be non-zero 3 digits");
    if (!testDigits(office[5], 4, 4, true)) addError(errors, "office postal child must be 4 digits");
    if (!testFieldLength(office[6], 1, 75, true)) addError(errors, "office address length is invalid");
    if (!testFieldLength(office[7], 1, 50, true)) addError(errors, "office name length is invalid");
    if (!testFieldLength(office[8], 1, 25, true)) addError(errors, "office owner length is invalid");
    if (!testDigits(office[9], 2, 5, true)) addError(errors, "phone area is invalid");
    if (!testDigits(office[10], 1, 4, true)) addError(errors, "phone exchange is invalid");
    if (!testDigits(office[11], 4, 5, true)) addError(errors, "phone number is invalid");
  }

  if (lines[4] !== "[data]") addError(errors, "line 5 must be [data]");

  return { lines, office };
}
