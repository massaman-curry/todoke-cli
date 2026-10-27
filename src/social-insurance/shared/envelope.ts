import { formatYmd } from "../../common/csv";
import { assertDigits, assertField, assertNameSpacing, getString, newLine } from "./fields";
import type { BaseConfig, CsvGenerationOptions } from "./types";

/** Construct and check the shared envelope before any form-specific records. */
export function newEnvelope(config: BaseConfig, options: CsvGenerationOptions = {}): string[] {
  const office = config.office;
  const outputLines: string[] = [];
  const createdOn = formatYmd(getString(config, "created_on", (options.now ?? (() => new Date()))().toISOString().slice(0, 10)));
  const mediaSerial = getString(config, "media_serial", "001");

  outputLines.push(newLine([
    getString(office, "prefecture_code"),
    getString(office, "district_code"),
    getString(office, "office_symbol"),
    mediaSerial,
    createdOn,
    "22223",
  ]));
  outputLines.push("[kanri]");
  outputLines.push(newLine(["", "001"]));
  outputLines.push(newLine([
    getString(office, "prefecture_code"),
    getString(office, "district_code"),
    getString(office, "office_symbol"),
    getString(office, "office_number"),
    getString(office, "postal_code_parent"),
    getString(office, "postal_code_child"),
    getString(office, "address"),
    getString(office, "name"),
    getString(office, "owner_name"),
    getString(office, "phone_area"),
    getString(office, "phone_exchange"),
    getString(office, "phone_number"),
  ]));
  outputLines.push("[data]");

  assertDigits("office.prefecture_code", getString(office, "prefecture_code"), 2, 2, true);
  assertDigits("office.district_code", getString(office, "district_code"), 2, 2, true);
  assertField("office.office_symbol", getString(office, "office_symbol"), 1, 4, true);
  assertDigits("office.office_number", getString(office, "office_number"), 1, 5, true);
  assertDigits("office.postal_code_parent", getString(office, "postal_code_parent"), 3, 3, true);
  assertDigits("office.postal_code_child", getString(office, "postal_code_child"), 4, 4, true);
  assertField("office.address", getString(office, "address"), 1, 75, true);
  assertField("office.name", getString(office, "name"), 1, 50, true);
  assertField("office.owner_name", getString(office, "owner_name"), 1, 25, true);
  assertNameSpacing("office.owner_name", getString(office, "owner_name"));
  assertDigits("office.phone_area", getString(office, "phone_area"), 2, 5, true);
  assertDigits("office.phone_exchange", getString(office, "phone_exchange"), 1, 4, true);
  assertDigits("office.phone_number", getString(office, "phone_number"), 4, 5, true);

  return outputLines;
}

/** Every record ends in CRLF; an optional DOS EOF follows the final CRLF. */
export function finishCsv(config: BaseConfig, outputLines: string[]): string {
  let content = `${outputLines.join("\r\n")}\r\n`;
  if (getString(config, "add_eof", "false") === "true") {
    content += "\x1A";
  }
  return content;
}
