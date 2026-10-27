import type { BaseConfig, JsonValue } from "../shared/types";

export interface Employee {
  insured_number?: JsonValue;
  insured_kana?: JsonValue;
  insured_name?: JsonValue;
  birth_date?: JsonValue;
  application_date?: JsonValue;
  application_year?: JsonValue;
  previous_health_standard_monthly_amount?: JsonValue;
  previous_pension_standard_monthly_amount?: JsonValue;
  previous_revision_month?: JsonValue;
  raise_or_reduction_month?: JsonValue;
  raise_or_reduction_type?: JsonValue;
  retroactive_payment_month?: JsonValue;
  retroactive_payment_amount?: JsonValue;
  april_base_days?: JsonValue;
  may_base_days?: JsonValue;
  june_base_days?: JsonValue;
  april_cash_amount?: JsonValue;
  may_cash_amount?: JsonValue;
  june_cash_amount?: JsonValue;
  april_in_kind_amount?: JsonValue;
  may_in_kind_amount?: JsonValue;
  june_in_kind_amount?: JsonValue;
  april_total_amount?: JsonValue;
  may_total_amount?: JsonValue;
  june_total_amount?: JsonValue;
  grand_total_amount?: JsonValue;
  average_amount?: JsonValue;
  corrected_average_amount?: JsonValue;
  personal_number?: JsonValue;
  basic_pension_office_code?: JsonValue;
  basic_pension_serial?: JsonValue;
  remarks_70_or_over?: JsonValue;
  over_70_months?: JsonValue;
  remarks_multiple_offices?: JsonValue;
  remarks_monthly_change_planned?: JsonValue;
  remarks_partial_month?: JsonValue;
  remarks_leave?: JsonValue;
  remarks_short_time_worker?: JsonValue;
  remarks_part_time?: JsonValue;
  remarks_annual_average?: JsonValue;
  remarks?: JsonValue;
  only_70_or_over?: JsonValue;
}

export interface Config extends BaseConfig {
  employees: Employee[];
}
