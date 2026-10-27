import type { BaseConfig, JsonValue } from "../shared/types";

export interface Employee {
  insured_number?: JsonValue;
  insured_kana?: JsonValue;
  insured_name?: JsonValue;
  birth_date?: JsonValue;
  sex_type?: JsonValue;
  acquisition_type?: JsonValue;
  personal_number?: JsonValue;
  resident_address_absence_reason?: JsonValue;
  personal_number_note?: JsonValue;
  basic_pension_office_code?: JsonValue;
  basic_pension_serial?: JsonValue;
  acquisition_date?: JsonValue;
  has_dependents?: JsonValue;
  cash_amount?: JsonValue;
  in_kind_amount?: JsonValue;
  total_amount?: JsonValue;
  remarks_70_or_over?: JsonValue;
  remarks_multiple_offices?: JsonValue;
  remarks_short_time?: JsonValue;
  remarks_reemployed?: JsonValue;
  remarks_special_reduction?: JsonValue;
  remarks?: JsonValue;
  postal_code_parent?: JsonValue;
  postal_code_child?: JsonValue;
  address_kana?: JsonValue;
  address_name?: JsonValue;
  only_70_or_over?: JsonValue;
  insurance_card_required?: JsonValue;
}

export interface Config extends BaseConfig {
  employees: Employee[];
}
