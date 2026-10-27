# コード構成

社会保険7種類は届書ごとのフォルダーに分かれています。CSVの組み立て、ファイル操作、検査を分離し、個別の計算や条件が共通の仕組みに埋もれないようにしています。

```text
src/
  common/csv.ts                  CP932、CSVファイル、共通の暦計算
  social-insurance/
    acquire/                    資格取得（他の6種類も同じ構成）
      types.ts                  JSON入力の型
      generate.ts               届書レコードとCSVテキストの組み立て
      validate-shfd0006.ts       届書固有の検査
      sample-shutoku.json        ダミー入力例
    shared/                     型、文字列、元号、共通ヘッダー
    validation/                 検証補助、共通ヘッダー検査
    input.ts                    未知キー・オブジェクト構造の検査
    rules.ts                    届書ごとの文字種・桁数の順序付き定義
```

生成は「入力を読む → 入力検査 → CSVテキストを組み立てる → CP932へ変換 → 一時ファイルを検証 → 出力先を置換」という流れです。共通CLIは届書メタデータに登録された生成関数と検証関数を同じプロセスから呼び出します。生成候補が不正なら出力先を置き換えません。

`generate.ts` の `buildCsv` はファイルを操作しません。作成年月日の既定値だけは現在のUTC日付を使用します。呼び出し側は `now` を渡して固定できます。入力オブジェクトは変更しません。

## 利用者向けCLI

`package.json` の bin は `bin/todoke.cjs` です。配布された `.tgz` を `npm install --global /path/to/package.tgz` で一度インストールすると、任意のフォルダーから次を実行できます。利用者によるビルドは不要です。

```sh
todoke generate acquire --input ./my-shutoku.json --output ./output/SHFD0006.csv
todoke validate acquire --csv ./output/SHFD0006.csv
todoke --help
```

生成のJSONと検証のCSVは必須で、それぞれ位置引数でも受理します。出力先は `--output`、JSONの `output`、`dist/<種類>/<公式ファイル名>` の順で選びます。相対パスは実行時の作業フォルダーが基準です。引数なしまたは `--help` ではヘルプを表示します。

このパッケージは社会保険7種類を扱います。生成器は `generate.ts`、検証器は `validate-shfd0006.ts` です。これらのモジュールにCLIの起動処理はありません。

`sample:<種類>` / `sample:all` も同じCLIを呼び、`dist/samples/<種類>/<公式ファイル名>` にダミーCSVを生成します。`npm run build` は `dist-js` を削除してからコンパイルします。`npm ci` のあと `dist/packages` を作り、`npm pack --pack-destination dist/packages` でビルド済みパッケージを作成できます。ビルドは `prepack` で自動実行されます。

`bin/forms.json` は生成・検証モジュールの場所、既定出力先、入力構造検査の有無を明示します。宣言した実行用JSONもビルド時に `dist-js` へコピーします。配布対象は `package.json` の `files` で指定し、`iconv-lite` とその依存ライブラリを同梱します。インストール先にTypeScriptや元のソースフォルダーがなくてもCLIを実行できます。

## プログラムからの利用

通常はCLIを使用してください。組み込む場合は、型付きの組み立て関数と既存の検証・保存処理を組み合わせます。`buildCsv` 単独は完全な入力・出力検証を行うAPIではありません。

```ts
import { buildCsv } from "./src/social-insurance/acquire/generate";
import type { Config } from "./src/social-insurance/acquire/types";
import { assertInputShape } from "./src/social-insurance/input";
import { validate } from "./src/social-insurance/acquire/validate-shfd0006";
import { writeValidatedCsv } from "./src/common/csv";

const input: unknown = JSON.parse(jsonText);
assertInputShape(input, "acquire");
const content = buildCsv(input as Config, {
  now: () => new Date("2026-10-25T00:00:00Z"),
});
writeValidatedCsv("./dist/my-shutoku/SHFD0006.csv", content, validate);
```

インポート時にCLIが走ることはありません。`validate(csvPath)` はエラーメッセージ配列を返します。ファイルが読めない場合などのIO例外は呼び出し側で扱ってください。

## 保守時に守ること

- 列の並びは各 `generate.ts` の配列に明示します。行末コメントの番号は仕様上の1始まりの項番です。配列添字の0始まりと区別してください。
- 生成器と検証器の列定義を一つの自動生成スキーマにまとめません。定義が分かれていることで、両者が同じ誤りを共有しにくくしています。
- 共通ヘッダー・文字列の補助処理だけを共有します。賞与の丸め、算定や月変の平均、扶養条件は届書ごとに残します。
- 月単位の日付入力など、似ていても受理形式やエラーの異なる処理は分けたままにしています。
- 被扶養者異動・第3号は他の6種類と異なり、`assertInputShape` を通しません。入力の受理条件を維持するため、そのままです。型検査や未知キーの扱いを統一する変更は別途検討してください。出力CSVの検証はこの届書でも実行します。
