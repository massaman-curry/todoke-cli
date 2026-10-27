import type { BaseConfig, JsonValue } from "../shared/types";

export interface Employee {
  insured_number?: JsonValue;
  insured_kana?: JsonValue;
  insured_name?: JsonValue;
  birth_date?: JsonValue;
  bonus_paid_date?: JsonValue;
  cash_amount?: JsonValue;
  in_kind_amount?: JsonValue;
  total_amount?: JsonValue;
  personal_number?: JsonValue;
  basic_pension_office_code?: JsonValue;
  basic_pension_serial?: JsonValue;
  remarks_over_70?: JsonValue;
  remarks_multiple_offices?: JsonValue;
  same_month_bonus_first_day?: JsonValue;
  only_over_70_bonus?: JsonValue;
}

export interface Config extends BaseConfig {
  employees: Employee[];
}
