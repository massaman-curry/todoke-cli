import type { BaseConfig, JsonValue } from "../shared/types";

export interface Employee {
  insured_number?: JsonValue;
  insured_kana?: JsonValue;
  insured_name?: JsonValue;
  birth_date?: JsonValue;
  personal_number?: JsonValue;
  basic_pension_office_code?: JsonValue;
  basic_pension_serial?: JsonValue;
  loss_date?: JsonValue;
  loss_reason?: JsonValue;
  retirement_or_death_date?: JsonValue;
  remarks_multiple_offices?: JsonValue;
  remarks_reemployed?: JsonValue;
  remarks?: JsonValue;
  insurance_card_attached_count?: JsonValue;
  insurance_card_unreturned_count?: JsonValue;
  over_70_non_applicable?: JsonValue;
  over_70_non_applicable_date?: JsonValue;
  only_over_70_non_applicable?: JsonValue;
}

export interface Config extends BaseConfig {
  employees: Employee[];
}
