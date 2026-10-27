# 入力項目

入力例は各届書の `sample-*.json`、型定義は `types.ts` にあります。サンプルの氏名・事業所・番号・生年月日は架空です（山田太郎、ダミー事業所株式会社、郵便番号 999-0000、電話 00-0000-0000）。公式の記入例や届書作成プログラムの収録データではありません。実在の届出には使わないでください。

以下は受理するキーの一覧です。必須条件は届書・フラグの組合せで変わるため、サンプルと各届書の検証条件も参照してください。

## CLIから入力する

申請内容を記入したJSONファイルを必ず指定してください。`sample-*.json` は形式を確認するためのダミーで、入力省略時に自動使用しません。

```sh
todoke generate acquire ./my-shutoku.json --output ./output/SHFD0006.csv
```

`./my-shutoku.json` は `--input ./my-shutoku.json` とも指定できます。入力・出力の相対パスは、コマンドを実行したフォルダーから解決します。生成処理は出力CSVを検証してから保存します。

## 共通の設定

| キー | 内容・既定値 |
|---|---|
| `office` | 事業所情報。必須 |
| `created_on` | 作成年月日。`YYYY-MM-DD`、`YYYY/MM/DD`、`YYYYMMDD`。省略時は実行時のUTC日付 |
| `media_serial` | 媒体通番。省略時 `001` |
| `output` | CLIの出力先。`--output` の指定が優先。両方省略時は `dist/<届書の種類>/<公式ファイル名>`（例: `dist/acquire/SHFD0006.csv`） |
| `add_eof` | `true` または `"true"` のときだけ末尾にEOFを追加。省略時なし |

事業所情報のキー: `prefecture_code`, `district_code`, `office_symbol`, `office_number`, `postal_code_parent`, `postal_code_child`, `address`, `name`, `owner_name`, `phone_area`, `phone_exchange`, `phone_number`。標準の生成では都道府県・郡市区・事業所記号番号、郵便番号、住所、名称、事業主氏名、電話番号が必要です。

## 入力値の扱い

- 文字列または安全な整数を基本とします。`add_eof` は真偽値も受理します。個人番号やコードは、先頭ゼロを失わないよう文字列で指定してください。
- キーの省略と空文字は同じ扱いになる項目があります。金額の既定値や任意日付は届書ごとに異なります。
- 日単位の日付は `YYYY-MM-DD` / `YYYY/MM/DD`、または届書が対応する元号コード付き表現を使えます。元号コード・元号年の範囲と実在する日付を検査します。月単位の日付の受理形式は算定・月変で異なります。
- 金額文字列には半角数字を使用します。カンマ、単位、小数、負数を自動除去しません。合算、千円未満の処理、上限は届書ごとに行います。
- CSVフィールド内のカンマ、改行、制御文字を拒否します。CP932で失われる文字や仕様外の文字を代替文字へ変換しません。
- 通常6種類は未知キーやJSON構造を検査します。被扶養者異動・第3号は入力の受理条件を維持するため構造検査を通さず、未知キーを検出しない場合があります。出力の検証は行います。[互換性上の扱い](architecture.md) を参照してください。

## 資格取得 (`acquire`)

`employees` は1件以上。氏名カナ、生年月日、性別、取得年月日などを指定します。特定減額特例は `remarks_special_reduction: "1"`。この条件での取得年月日省略と短時間労働者との排他を検査します。

[型定義](../src/social-insurance/acquire/types.ts) / [生成](../src/social-insurance/acquire/generate.ts) / [検証](../src/social-insurance/acquire/validate-shfd0006.ts)

トップレベルの構造: `office`, `employees`。

**Employee**

`insured_number`, `insured_kana`, `insured_name`, `birth_date`, `sex_type`, `acquisition_type`, `personal_number`, `resident_address_absence_reason`, `personal_number_note`, `basic_pension_office_code`, `basic_pension_serial`, `acquisition_date`, `has_dependents`, `cash_amount`, `in_kind_amount`, `total_amount`, `remarks_70_or_over`, `remarks_multiple_offices`, `remarks_short_time`, `remarks_reemployed`, `remarks_special_reduction`, `remarks`, `postal_code_parent`, `postal_code_child`, `address_kana`, `address_name`, `only_70_or_over`, `insurance_card_required`

## 資格喪失 (`loss`)

`employees` は1件以上。喪失年月日・原因に加え、退職・死亡等の条件を満たす日付を指定します。原因 `12` に対応します。

[型定義](../src/social-insurance/loss/types.ts) / [生成](../src/social-insurance/loss/generate.ts) / [検証](../src/social-insurance/loss/validate-shfd0006.ts)

トップレベルの構造: `office`, `employees`。

**Employee**

`insured_number`, `insured_kana`, `insured_name`, `birth_date`, `personal_number`, `basic_pension_office_code`, `basic_pension_serial`, `loss_date`, `loss_reason`, `retirement_or_death_date`, `remarks_multiple_offices`, `remarks_reemployed`, `remarks`, `insurance_card_attached_count`, `insurance_card_unreturned_count`, `over_70_non_applicable`, `over_70_non_applicable_date`, `only_over_70_non_applicable`

## 賞与支払 (`bonus`)

`employees` は1件以上。賞与支払日・金銭額・現物額を指定します。合計は既存の千円未満処理・上限処理に従います。

[型定義](../src/social-insurance/bonus/types.ts) / [生成](../src/social-insurance/bonus/generate.ts) / [検証](../src/social-insurance/bonus/validate-shfd0006.ts)

トップレベルの構造: `office`, `employees`。

**Employee**

`insured_number`, `insured_kana`, `insured_name`, `birth_date`, `bonus_paid_date`, `cash_amount`, `in_kind_amount`, `total_amount`, `personal_number`, `basic_pension_office_code`, `basic_pension_serial`, `remarks_over_70`, `remarks_multiple_offices`, `same_month_bonus_first_day`, `only_over_70_bonus`

## 算定基礎 (`standard-remuneration`)

`employees` は1件以上。申請年月、支払基礎日数、4〜6月の報酬、合計・平均を指定します。省略時の算出と訂正平均の扱いは生成処理にあります。

[型定義](../src/social-insurance/standard-remuneration/types.ts) / [生成](../src/social-insurance/standard-remuneration/generate.ts) / [検証](../src/social-insurance/standard-remuneration/validate-shfd0006.ts)

トップレベルの構造: `office`, `employees`。

**Employee**

`insured_number`, `insured_kana`, `insured_name`, `birth_date`, `application_date`, `application_year`, `previous_health_standard_monthly_amount`, `previous_pension_standard_monthly_amount`, `previous_revision_month`, `raise_or_reduction_month`, `raise_or_reduction_type`, `retroactive_payment_month`, `retroactive_payment_amount`, `april_base_days`, `may_base_days`, `june_base_days`, `april_cash_amount`, `may_cash_amount`, `june_cash_amount`, `april_in_kind_amount`, `may_in_kind_amount`, `june_in_kind_amount`, `april_total_amount`, `may_total_amount`, `june_total_amount`, `grand_total_amount`, `average_amount`, `corrected_average_amount`, `personal_number`, `basic_pension_office_code`, `basic_pension_serial`, `remarks_70_or_over`, `over_70_months`, `remarks_multiple_offices`, `remarks_monthly_change_planned`, `remarks_partial_month`, `remarks_leave`, `remarks_short_time_worker`, `remarks_part_time`, `remarks_annual_average`, `remarks`, `only_70_or_over`

## 月額変更 (`monthly-change`)

`employees` は1件以上。申請年月、変動区分、対象3か月の日数・報酬を指定します。3か月分の配列の件数や、対象月の連続性を検査します。

[型定義](../src/social-insurance/monthly-change/types.ts) / [生成](../src/social-insurance/monthly-change/generate.ts) / [検証](../src/social-insurance/monthly-change/validate-shfd0006.ts)

トップレベルの構造: `office`, `employees`。

**Employee**

`insured_number`, `insured_kana`, `insured_name`, `birth_date`, `revision_month`, `previous_standard_monthly_health`, `previous_standard_monthly_pension`, `previous_revision_month`, `raise_or_drop_month`, `raise_or_drop_type`, `retroactive_payment_month`, `retroactive_payment_amount`, `grand_total`, `average_amount`, `corrected_average_amount`, `personal_number`, `basic_pension_office_code`, `basic_pension_serial`, `remarks_70_or_over`, `remarks_multiple_offices`, `remarks_short_time`, `remarks_raise_reason`, `remarks_health_only_change`, `remarks`, `only_70_or_over`

**Employeeの配列項目（各3要素）**

| キー | 内容 |
|---|---|
| `payroll_months` | 対象となる連続3か月。省略時は改定月の3〜1か月前から算出 |
| `base_days` | 各月の支払基礎日数。各月に応じた日数の入力が必要 |
| `cash_amounts` | 各月の金銭による報酬。省略時は各月 `0` |
| `in_kind_amounts` | 各月の現物による報酬。省略時は各月 `0` |
| `total_amounts` | 各月の合計。省略時は金銭と現物から算出 |

指定する場合は必ず3要素です。計算結果の桁数・上限と改定年月との関係も検査します。

## 国民年金第3号 (`kokunen-third`)

`records` は1件以上。各要素に `spouse` と `third_insured` が必要です。異動区分に応じて該当日・非該当日・理由などを検査します。

[型定義](../src/social-insurance/kokunen-third/types.ts) / [生成](../src/social-insurance/kokunen-third/generate.ts) / [検証](../src/social-insurance/kokunen-third/validate-shfd0006.ts)

トップレベルの構造: `office`, `records`。

**PensionNumberPerson**

`personal_number`, `basic_pension_office_code`, `basic_pension_serial`

**Spouse**

`personal_number`, `basic_pension_office_code`, `basic_pension_serial`, `kana`, `name`, `birth_date`, `sex_type`, `postal_code_parent`, `postal_code_child`, `address`

**ThirdInsured**

`personal_number`, `basic_pension_office_code`, `basic_pension_serial`, `report_date`, `kana`, `name`, `birth_date`, `relationship_type`, `nationality`, `alias_kana`, `alias_name`, `cohabitation_type`, `postal_code_parent`, `postal_code_child`, `address`, `phone_type`, `phone_area`, `phone_exchange`, `phone_number`, `movement_type`, `became_date`, `became_reason`, `became_reason_other`, `spouse_system_type`, `lost_date`, `lost_reason`, `death_date`, `lost_reason_other`, `remarks`, `overseas_special_type`, `overseas_applicable_date`, `overseas_applicable_reason`, `overseas_applicable_reason_other`, `overseas_not_applicable_date`, `overseas_not_applicable_reason`, `overseas_not_applicable_reason_other`, `overseas_return_date`

**KokunenThirdRecord**

`employer_received_date`

子オブジェクト: `spouse` → Spouse, `third_insured` → ThirdInsured。

## 被扶養者異動・第3号 (`dependent-third`)

`insured` が必要です。配偶者は `spouse`、その他の扶養者は `other_dependents`（0〜2人）で指定します。`movement_type` と異動理由に応じた必須条件を検査します。

[型定義](../src/social-insurance/dependent-third/types.ts) / [生成](../src/social-insurance/dependent-third/generate.ts) / [検証](../src/social-insurance/dependent-third/validate-shfd0006.ts)

トップレベルの構造: `office`, `insured`, `spouse`, `other_dependents`。加えて `movement_type` を指定します。

**Insured**

`employer_confirmation`, `received_date`, `insured_number`, `insured_kana`, `insured_name`, `birth_date`, `sex_type`, `personal_number`, `basic_pension_office_code`, `basic_pension_serial`, `annual_income`, `postal_code_parent`, `postal_code_child`, `address_name`

**Spouse**

`notification_date`, `kana`, `name`, `birth_date`, `relationship_type`, `personal_number`, `basic_pension_office_code`, `basic_pension_serial`, `nationality`, `alias_kana`, `alias_name`, `cohabitation_type`, `address_prefecture_code`, `postal_code_parent`, `postal_code_child`, `address_name`, `phone_type`, `phone_area`, `phone_exchange`, `phone_number`, `became_dependent_date`, `became_dependent_reason`, `became_dependent_reason_other`, `occupation_type`, `annual_income`, `no_longer_dependent_date`, `no_longer_dependent_reason`, `no_longer_dependent_reason_other`, `death_date`, `remarks`, `relationship_confirmed`, `overseas_exception`, `overseas_applicable_date`, `overseas_applicable_reason`, `overseas_applicable_reason_other`, `overseas_not_applicable_date`, `overseas_not_applicable_reason`, `overseas_not_applicable_reason_other`, `overseas_return_date`, `spouse_annual_income`, `insurance_card_required`

**OtherDependent**

`kana`, `name`, `birth_date`, `sex_type`, `relationship_code`, `relationship_other`, `personal_number`, `cohabitation_type`, `postal_code_parent`, `postal_code_child`, `address_name`, `overseas_exception`, `overseas_applicable_reason`, `overseas_applicable_reason_other`, `overseas_not_applicable_reason`, `overseas_not_applicable_reason_other`, `overseas_return_date`, `became_dependent_date`, `occupation_type`, `address_prefecture_code`, `annual_income`, `became_dependent_reason`, `became_dependent_reason_other`, `no_longer_dependent_date`, `no_longer_dependent_reason`, `no_longer_dependent_reason_other`, `remarks`, `relationship_confirmed`, `insurance_card_required`
