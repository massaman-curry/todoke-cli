// The accepted JSON keys mirror each generator's input interfaces. Reject unknown
// keys and unexpected shapes before defaults or String() can discard input data.
interface InputNode {
  scalars: string;
  required: string[];
  objects: Record<string, string>;
  arrays: Record<string, [string, number, number | null]>;
}
const OFFICE_SCHEMA: InputNode = {
  "scalars": "prefecture_code district_code office_symbol office_number postal_code_parent postal_code_child address name owner_name phone_area phone_exchange phone_number",
  "required": [],
  "objects": {},
  "arrays": {}
};

const INPUT_SCHEMAS: Record<string, Record<string, InputNode>> = {
  "acquire": {
    "Office": OFFICE_SCHEMA,
    "Employee": {
      "scalars": "insured_number insured_kana insured_name birth_date sex_type acquisition_type personal_number resident_address_absence_reason personal_number_note basic_pension_office_code basic_pension_serial acquisition_date has_dependents cash_amount in_kind_amount total_amount remarks_70_or_over remarks_multiple_offices remarks_short_time remarks_reemployed remarks_special_reduction remarks postal_code_parent postal_code_child address_kana address_name only_70_or_over insurance_card_required",
      "required": [],
      "objects": {},
      "arrays": {}
    },
    "Config": {
      "scalars": "output media_serial created_on add_eof",
      "required": [
        "office",
        "employees"
      ],
      "objects": {
        "office": "Office"
      },
      "arrays": {
        "employees": [
          "Employee",
          1,
          null
        ]
      }
    }
  },
  "bonus": {
    "Office": OFFICE_SCHEMA,
    "Employee": {
      "scalars": "insured_number insured_kana insured_name birth_date bonus_paid_date cash_amount in_kind_amount total_amount personal_number basic_pension_office_code basic_pension_serial remarks_over_70 remarks_multiple_offices same_month_bonus_first_day only_over_70_bonus",
      "required": [],
      "objects": {},
      "arrays": {}
    },
    "Config": {
      "scalars": "output media_serial created_on add_eof",
      "required": [
        "office",
        "employees"
      ],
      "objects": {
        "office": "Office"
      },
      "arrays": {
        "employees": [
          "Employee",
          1,
          null
        ]
      }
    }
  },
  "dependent-third": {
    "Office": OFFICE_SCHEMA,
    "Insured": {
      "scalars": "employer_confirmation received_date insured_number insured_kana insured_name birth_date sex_type personal_number basic_pension_office_code basic_pension_serial annual_income postal_code_parent postal_code_child address_name",
      "required": [],
      "objects": {},
      "arrays": {}
    },
    "Spouse": {
      "scalars": "notification_date kana name birth_date relationship_type personal_number basic_pension_office_code basic_pension_serial nationality alias_kana alias_name cohabitation_type address_prefecture_code postal_code_parent postal_code_child address_name phone_type phone_area phone_exchange phone_number became_dependent_date became_dependent_reason became_dependent_reason_other occupation_type annual_income no_longer_dependent_date no_longer_dependent_reason no_longer_dependent_reason_other death_date remarks relationship_confirmed overseas_exception overseas_applicable_date overseas_applicable_reason overseas_applicable_reason_other overseas_not_applicable_date overseas_not_applicable_reason overseas_not_applicable_reason_other overseas_return_date spouse_annual_income insurance_card_required",
      "required": [],
      "objects": {},
      "arrays": {}
    },
    "OtherDependent": {
      "scalars": "kana name birth_date sex_type relationship_code relationship_other personal_number cohabitation_type postal_code_parent postal_code_child address_name overseas_exception overseas_applicable_reason overseas_applicable_reason_other overseas_not_applicable_reason overseas_not_applicable_reason_other overseas_return_date became_dependent_date occupation_type address_prefecture_code annual_income became_dependent_reason became_dependent_reason_other no_longer_dependent_date no_longer_dependent_reason no_longer_dependent_reason_other remarks relationship_confirmed insurance_card_required",
      "required": [],
      "objects": {},
      "arrays": {}
    },
    "Config": {
      "scalars": "output media_serial created_on add_eof movement_type",
      "required": [
        "office",
        "insured"
      ],
      "objects": {
        "office": "Office",
        "insured": "Insured",
        "spouse": "Spouse"
      },
      "arrays": {
        "other_dependents": [
          "OtherDependent",
          0,
          2
        ]
      }
    }
  },
  "kokunen-third": {
    "Office": OFFICE_SCHEMA,
    "PensionNumberPerson": {
      "scalars": "personal_number basic_pension_office_code basic_pension_serial",
      "required": [],
      "objects": {},
      "arrays": {}
    },
    "Spouse": {
      "scalars": "personal_number basic_pension_office_code basic_pension_serial kana name birth_date sex_type postal_code_parent postal_code_child address",
      "required": [],
      "objects": {},
      "arrays": {}
    },
    "ThirdInsured": {
      "scalars": "personal_number basic_pension_office_code basic_pension_serial report_date kana name birth_date relationship_type nationality alias_kana alias_name cohabitation_type postal_code_parent postal_code_child address phone_type phone_area phone_exchange phone_number movement_type became_date became_reason became_reason_other spouse_system_type lost_date lost_reason death_date lost_reason_other remarks overseas_special_type overseas_applicable_date overseas_applicable_reason overseas_applicable_reason_other overseas_not_applicable_date overseas_not_applicable_reason overseas_not_applicable_reason_other overseas_return_date",
      "required": [],
      "objects": {},
      "arrays": {}
    },
    "KokunenThirdRecord": {
      "scalars": "employer_received_date",
      "required": [
        "spouse",
        "third_insured"
      ],
      "objects": {
        "spouse": "Spouse",
        "third_insured": "ThirdInsured"
      },
      "arrays": {}
    },
    "Config": {
      "scalars": "output media_serial created_on add_eof",
      "required": [
        "office",
        "records"
      ],
      "objects": {
        "office": "Office"
      },
      "arrays": {
        "records": [
          "KokunenThirdRecord",
          1,
          null
        ]
      }
    }
  },
  "loss": {
    "Office": OFFICE_SCHEMA,
    "Employee": {
      "scalars": "insured_number insured_kana insured_name birth_date personal_number basic_pension_office_code basic_pension_serial loss_date loss_reason retirement_or_death_date remarks_multiple_offices remarks_reemployed remarks insurance_card_attached_count insurance_card_unreturned_count over_70_non_applicable over_70_non_applicable_date only_over_70_non_applicable",
      "required": [],
      "objects": {},
      "arrays": {}
    },
    "Config": {
      "scalars": "output media_serial created_on add_eof",
      "required": [
        "office",
        "employees"
      ],
      "objects": {
        "office": "Office"
      },
      "arrays": {
        "employees": [
          "Employee",
          1,
          null
        ]
      }
    }
  },
  "monthly-change": {
    "Office": OFFICE_SCHEMA,
    "Employee": {
      "scalars": "insured_number insured_kana insured_name birth_date revision_month previous_standard_monthly_health previous_standard_monthly_pension previous_revision_month raise_or_drop_month raise_or_drop_type retroactive_payment_month retroactive_payment_amount grand_total average_amount corrected_average_amount personal_number basic_pension_office_code basic_pension_serial remarks_70_or_over remarks_multiple_offices remarks_short_time remarks_raise_reason remarks_health_only_change remarks only_70_or_over",
      "required": [],
      "objects": {},
      "arrays": {
        "payroll_months": [
          "scalar",
          3,
          3
        ],
        "base_days": [
          "scalar",
          3,
          3
        ],
        "cash_amounts": [
          "scalar",
          3,
          3
        ],
        "in_kind_amounts": [
          "scalar",
          3,
          3
        ],
        "total_amounts": [
          "scalar",
          3,
          3
        ]
      }
    },
    "Config": {
      "scalars": "output media_serial created_on add_eof",
      "required": [
        "office",
        "employees"
      ],
      "objects": {
        "office": "Office"
      },
      "arrays": {
        "employees": [
          "Employee",
          1,
          null
        ]
      }
    }
  },
  "standard-remuneration": {
    "Office": OFFICE_SCHEMA,
    "Employee": {
      "scalars": "insured_number insured_kana insured_name birth_date application_date application_year previous_health_standard_monthly_amount previous_pension_standard_monthly_amount previous_revision_month raise_or_reduction_month raise_or_reduction_type retroactive_payment_month retroactive_payment_amount april_base_days may_base_days june_base_days april_cash_amount may_cash_amount june_cash_amount april_in_kind_amount may_in_kind_amount june_in_kind_amount april_total_amount may_total_amount june_total_amount grand_total_amount average_amount corrected_average_amount personal_number basic_pension_office_code basic_pension_serial remarks_70_or_over over_70_months remarks_multiple_offices remarks_monthly_change_planned remarks_partial_month remarks_leave remarks_short_time_worker remarks_part_time remarks_annual_average remarks only_70_or_over",
      "required": [],
      "objects": {},
      "arrays": {}
    },
    "Config": {
      "scalars": "output media_serial created_on add_eof",
      "required": [
        "office",
        "employees"
      ],
      "objects": {
        "office": "Office"
      },
      "arrays": {
        "employees": [
          "Employee",
          1,
          null
        ]
      }
    }
  }
};

function assertScalar(value: unknown, label: string): void {
  if (typeof value === "string") return;
  if (typeof value === "number" && Number.isSafeInteger(value)) return;
  throw new Error(`${label} must be a string or safe integer.`);
}

export function assertInputShape(config: unknown, form: string): void {
  const nodes = INPUT_SCHEMAS[form];
  if (!nodes) throw new Error(`Unsupported input schema: ${form}`);
  function check(value: unknown, type: string, label: string): void {
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
    const object = value as Record<string, unknown>;
    const schema = nodes[type];
    const scalarKeys = schema.scalars.split(" ").filter(Boolean);
    const allowed = new Set([...scalarKeys, ...Object.keys(schema.objects), ...Object.keys(schema.arrays)]);
    for (const key of Object.keys(object)) {
      if (!allowed.has(key)) throw new Error(`Unknown input field: ${label}.${key}`);
      if (scalarKeys.includes(key)) {
        if (type === "Config" && key === "add_eof") {
          if (![true, false, "true", "false"].includes(object[key] as boolean | string)) throw new Error("add_eof must be true or false.");
        } else {
          assertScalar(object[key], label + "." + key);
          if (type === "Config" && ["output", "created_on"].includes(key) && typeof object[key] !== "string") throw new Error(`${key} must be a string.`);
        }
      }
    }
    for (const key of schema.required) if (!(key in object)) throw new Error(`${label}.${key} is required.`);
    for (const [key, childType] of Object.entries(schema.objects)) if (key in object) check(object[key], childType, label + "." + key);
    for (const [key, [childType, min, max]] of Object.entries(schema.arrays)) {
      if (!(key in object)) continue;
      const array = object[key];
      if (!Array.isArray(array) || array.length < min || (max !== null && array.length > max)) throw new Error(`${label}.${key} must be an array of ${max === min ? min : min + "-" + (max ?? "many")} item(s).`);
      array.forEach((item, index) => {
        if (childType === "scalar") assertScalar(item, `${label}.${key}[${index}]`);
        else check(item, childType, `${label}.${key}[${index}]`);
      });
    }
  }
  check(config, "Config", "config");
}
