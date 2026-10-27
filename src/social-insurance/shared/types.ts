/** Scalar values understood by the legacy JSON-to-CSV field accessors. */
export type JsonValue = string | number | boolean | null | undefined;

export interface Office {
  prefecture_code?: JsonValue;
  district_code?: JsonValue;
  office_symbol?: JsonValue;
  office_number?: JsonValue;
  postal_code_parent?: JsonValue;
  postal_code_child?: JsonValue;
  address?: JsonValue;
  name?: JsonValue;
  owner_name?: JsonValue;
  phone_area?: JsonValue;
  phone_exchange?: JsonValue;
  phone_number?: JsonValue;
}

/** Common JSON configuration; output remains supported by the command-line tools. */
export interface BaseConfig {
  output?: JsonValue;
  media_serial?: JsonValue;
  created_on?: JsonValue;
  add_eof?: JsonValue;
  office: Office;
}

export interface CsvGenerationOptions {
  /** Defaults to the current date in UTC, matching the command-line generators. */
  now?: () => Date;
}
