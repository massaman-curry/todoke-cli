import type { BaseConfig, JsonValue } from "../shared/types";

export interface PensionNumberPerson {
  personal_number?: JsonValue;
  basic_pension_office_code?: JsonValue;
  basic_pension_serial?: JsonValue;
}

export interface Spouse extends PensionNumberPerson {
  kana?: JsonValue;
  name?: JsonValue;
  birth_date?: JsonValue;
  sex_type?: JsonValue;
  postal_code_parent?: JsonValue;
  postal_code_child?: JsonValue;
  address?: JsonValue;
}

export interface ThirdInsured extends PensionNumberPerson {
  report_date?: JsonValue;
  kana?: JsonValue;
  name?: JsonValue;
  birth_date?: JsonValue;
  relationship_type?: JsonValue;
  nationality?: JsonValue;
  alias_kana?: JsonValue;
  alias_name?: JsonValue;
  cohabitation_type?: JsonValue;
  postal_code_parent?: JsonValue;
  postal_code_child?: JsonValue;
  address?: JsonValue;
  phone_type?: JsonValue;
  phone_area?: JsonValue;
  phone_exchange?: JsonValue;
  phone_number?: JsonValue;
  movement_type?: JsonValue;
  became_date?: JsonValue;
  became_reason?: JsonValue;
  became_reason_other?: JsonValue;
  spouse_system_type?: JsonValue;
  lost_date?: JsonValue;
  lost_reason?: JsonValue;
  death_date?: JsonValue;
  lost_reason_other?: JsonValue;
  remarks?: JsonValue;
  overseas_special_type?: JsonValue;
  overseas_applicable_date?: JsonValue;
  overseas_applicable_reason?: JsonValue;
  overseas_applicable_reason_other?: JsonValue;
  overseas_not_applicable_date?: JsonValue;
  overseas_not_applicable_reason?: JsonValue;
  overseas_not_applicable_reason_other?: JsonValue;
  overseas_return_date?: JsonValue;
}

export interface KokunenThirdRecord {
  employer_received_date?: JsonValue;
  spouse: Spouse;
  third_insured: ThirdInsured;
}

export interface Config extends BaseConfig {
  records: KokunenThirdRecord[];
}
