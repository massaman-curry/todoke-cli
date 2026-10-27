import type { BaseConfig, JsonValue } from "../shared/types";

export interface Employee {
  insured_number?: JsonValue;
  insured_kana?: JsonValue;
  insured_name?: JsonValue;
  birth_date?: JsonValue;
  revision_month?: JsonValue;
  previous_standard_monthly_health?: JsonValue;
  previous_standard_monthly_pension?: JsonValue;
  previous_revision_month?: JsonValue;
  raise_or_drop_month?: JsonValue;
  raise_or_drop_type?: JsonValue;
  retroactive_payment_month?: JsonValue;
  retroactive_payment_amount?: JsonValue;
  payroll_months?: JsonValue[];
  base_days?: JsonValue[];
  cash_amounts?: JsonValue[];
  in_kind_amounts?: JsonValue[];
  total_amounts?: JsonValue[];
  grand_total?: JsonValue;
  average_amount?: JsonValue;
  corrected_average_amount?: JsonValue;
  personal_number?: JsonValue;
  basic_pension_office_code?: JsonValue;
  basic_pension_serial?: JsonValue;
  remarks_70_or_over?: JsonValue;
  remarks_multiple_offices?: JsonValue;
  remarks_short_time?: JsonValue;
  remarks_raise_reason?: JsonValue;
  remarks_health_only_change?: JsonValue;
  remarks?: JsonValue;
  only_70_or_over?: JsonValue;
}

export interface Config extends BaseConfig {
  employees: Employee[];
}
