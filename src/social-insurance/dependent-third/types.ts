import type { BaseConfig, JsonValue } from "../shared/types";

export interface Insured {
  employer_confirmation?: JsonValue;
  received_date?: JsonValue;
  insured_number?: JsonValue;
  insured_kana?: JsonValue;
  insured_name?: JsonValue;
  birth_date?: JsonValue;
  sex_type?: JsonValue;
  personal_number?: JsonValue;
  basic_pension_office_code?: JsonValue;
  basic_pension_serial?: JsonValue;
  annual_income?: JsonValue;
  postal_code_parent?: JsonValue;
  postal_code_child?: JsonValue;
  address_name?: JsonValue;
}

export interface Spouse {
  notification_date?: JsonValue;
  kana?: JsonValue;
  name?: JsonValue;
  birth_date?: JsonValue;
  relationship_type?: JsonValue;
  personal_number?: JsonValue;
  basic_pension_office_code?: JsonValue;
  basic_pension_serial?: JsonValue;
  nationality?: JsonValue;
  alias_kana?: JsonValue;
  alias_name?: JsonValue;
  cohabitation_type?: JsonValue;
  address_prefecture_code?: JsonValue;
  postal_code_parent?: JsonValue;
  postal_code_child?: JsonValue;
  address_name?: JsonValue;
  phone_type?: JsonValue;
  phone_area?: JsonValue;
  phone_exchange?: JsonValue;
  phone_number?: JsonValue;
  became_dependent_date?: JsonValue;
  became_dependent_reason?: JsonValue;
  became_dependent_reason_other?: JsonValue;
  occupation_type?: JsonValue;
  annual_income?: JsonValue;
  no_longer_dependent_date?: JsonValue;
  no_longer_dependent_reason?: JsonValue;
  no_longer_dependent_reason_other?: JsonValue;
  death_date?: JsonValue;
  remarks?: JsonValue;
  relationship_confirmed?: JsonValue;
  overseas_exception?: JsonValue;
  overseas_applicable_date?: JsonValue;
  overseas_applicable_reason?: JsonValue;
  overseas_applicable_reason_other?: JsonValue;
  overseas_not_applicable_date?: JsonValue;
  overseas_not_applicable_reason?: JsonValue;
  overseas_not_applicable_reason_other?: JsonValue;
  overseas_return_date?: JsonValue;
  spouse_annual_income?: JsonValue;
  insurance_card_required?: JsonValue;
}

export interface OtherDependent {
  kana?: JsonValue;
  name?: JsonValue;
  birth_date?: JsonValue;
  sex_type?: JsonValue;
  relationship_code?: JsonValue;
  relationship_other?: JsonValue;
  personal_number?: JsonValue;
  cohabitation_type?: JsonValue;
  postal_code_parent?: JsonValue;
  postal_code_child?: JsonValue;
  address_name?: JsonValue;
  overseas_exception?: JsonValue;
  overseas_applicable_reason?: JsonValue;
  overseas_applicable_reason_other?: JsonValue;
  overseas_not_applicable_reason?: JsonValue;
  overseas_not_applicable_reason_other?: JsonValue;
  overseas_return_date?: JsonValue;
  became_dependent_date?: JsonValue;
  occupation_type?: JsonValue;
  address_prefecture_code?: JsonValue;
  annual_income?: JsonValue;
  became_dependent_reason?: JsonValue;
  became_dependent_reason_other?: JsonValue;
  no_longer_dependent_date?: JsonValue;
  no_longer_dependent_reason?: JsonValue;
  no_longer_dependent_reason_other?: JsonValue;
  remarks?: JsonValue;
  relationship_confirmed?: JsonValue;
  insurance_card_required?: JsonValue;
}

export interface Config extends BaseConfig {
  insured: Insured;
  movement_type?: JsonValue;
  spouse?: Spouse;
  other_dependents?: OtherDependent[];
}
