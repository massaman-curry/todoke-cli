# todoke-cli

社会保険の電子申請用CSVをJSONから生成・検証するツール。

対象は年金事務所向けの7種類です。対応基準は届書作成仕様書第17.0版・届書作成プログラムVer34です。

## インストールと実行

Node.js **24.x** をインストールした環境で、配布されたパッケージを一度インストールします。

```sh
npm install --global /path/to/todoke-cli-0.1.0.tgz
```

以後は任意のフォルダーから `todoke` を実行できます。実行コードと文字コード変換ライブラリはパッケージに同梱しており、利用者によるビルドは不要です。npmレジストリには公開していないため、配布された `.tgz` のパスを指定してください。

申請内容を記入したJSONを用意し、届書の種類と入力ファイルを指定します。[入力項目](docs/inputs.md) と各届書の入力例を参照してください。

```sh
todoke generate acquire --input ./my-shutoku.json --output ./output/SHFD0006.csv
```

入力JSONは必須で、生成時にCSVの検証も行います。位置引数でも入力を指定できます。出力先は `--output` → JSONの `output` → `dist/<届書の種類>/SHFD0006.csv` の順です。相対パスは、コマンドを実行したフォルダーから解決します。

既存CSVだけを検査する場合は次を実行します。

```sh
todoke validate acquire --csv ./output/SHFD0006.csv
todoke --help
```

## 対応届書

| 届書 | 種類 | 入力例 |
|---|---|---|
| 資格取得・70歳以上該当 | `acquire` | [sample-shutoku.json](src/social-insurance/acquire/sample-shutoku.json) |
| 資格喪失・70歳以上不該当 | `loss` | [sample-soshitsu.json](src/social-insurance/loss/sample-soshitsu.json) |
| 賞与支払 | `bonus` | [sample-shoyo.json](src/social-insurance/bonus/sample-shoyo.json) |
| 算定基礎 | `standard-remuneration` | [sample-santei.json](src/social-insurance/standard-remuneration/sample-santei.json) |
| 月額変更 | `monthly-change` | [sample-geppen.json](src/social-insurance/monthly-change/sample-geppen.json) |
| 国民年金第3号 | `kokunen-third` | [sample-kokunen3gou.json](src/social-insurance/kokunen-third/sample-kokunen3gou.json) |
| 被扶養者異動・第3号 | `dependent-third` | [sample-fuyo3gou.json](src/social-insurance/dependent-third/sample-fuyo3gou.json) |

例: `todoke generate bonus --input ./my-bonus.json` / `todoke validate bonus --csv ./dist/bonus/SHFD0006.csv`。既定では各届書の専用フォルダーに公式ファイル名 `SHFD0006.csv` で出力します。

出力はCP932・CRLFです。文字コード変換と検証に成功した後で出力先を更新し、エラー時は既存ファイルを保持します。失敗時は以前のCSVを今回の生成結果として使用せず、入力を修正して再実行してください。

## ソースから動かす

Node.js は `.nvmrc` の 24.13.1 です。

```sh
npm ci
npm run smoke
npm run sample:all
```

`npm run smoke` は同梱のダミー入力で資格取得届を生成し、そのCSVを検証します。実在の届出ではありません。`sample:acquire` は資格取得のダミーを `dist/samples/acquire/SHFD0006.csv` に、`sample:all` は7種類のダミーを `dist/samples/<種類>/SHFD0006.csv` に書き出します。

`sample-*.json` の氏名は山田太郎・山田花子、事業所はダミー事業所株式会社です。番号・住所・生年月日も架空で、公式の記入例や届書作成プログラムのサンプルデータではありません。サンプルを実申請に使用しないでください。

配布パッケージを作る場合は次を実行します。`prepack` がビルドし、古いコンパイル済みファイルも削除します。

```sh
npm ci
mkdir -p dist/packages
npm pack --pack-destination dist/packages
```

生成物は `dist/packages/todoke-cli-0.1.0.tgz` です。npmレジストリへの公開や `npm login` は不要です。開発中に手元のコマンドを試す場合は、ビルド後に `npm link` も使用できます。

## 入力と構成

- [入力項目と既定値](docs/inputs.md)
- [コード構成とプログラムからの利用](docs/architecture.md)
- [変更の提案](CONTRIBUTING.md)

このツールは、入力から届書CSVを組み立て、形式を検査します。提出する内容と、必要な公式の確認は利用者が行ってください。

公式資料: [CSV形式届書の仕様](https://www.nenkin.go.jp/denshibenri/denshishinsei/20210401-2.html)、[届書作成プログラム](https://www.nenkin.go.jp/denshibenri/denshishinsei/download.html)。

[MIT License](LICENSE)。
