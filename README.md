# todoke-cli

社会保険の電子申請用CSVをJSONから生成・検証するツール。

対象は年金事務所向けの7種類です。対応基準は届書作成仕様書第17.0版・届書作成プログラムVer34です。

## インストールと実行

Node.js **24.x** が必要です。`.nvmrc` は 24.13.1 です。npmレジストリには公開していません。このリポジトリを clone し、取得したフォルダーで次を順に実行します。

```sh
npm ci
npm run build
npm link
```

`npm run build` を省くと「実行ファイルが不足しています。todokeを配布ファイルから再インストールしてください。」と表示して終了します。clone した直後は `npm run build` を実行してから `npm link` してください。以後は任意のフォルダーから `todoke` を実行できます。

同梱の入力例で資格取得届を生成し、そのCSVを検証します。次の相対パスは、リポジトリのルートで実行したときのものです。

```sh
todoke generate acquire --input src/social-insurance/acquire/sample-shutoku.json --output ./out/SHFD0006.csv
todoke validate acquire --csv ./out/SHFD0006.csv
todoke --help
```

`sample-shutoku.json` は形式の見本です。公式の届書作成プログラムでの検査を通ることは保証しません。実申請には使わないでください。

入力JSONは必須で、生成時にCSVの検証も行います。位置引数でも入力を指定できます。出力先は `--output` → JSONの `output` → `dist/<届書の種類>/SHFD0006.csv` の順です。相対パスは、コマンドを実行したフォルダーから解決します。自分の届出は [入力項目](docs/inputs.md) を参照して別のJSONを用意し、`--input` に指定します。既存のCSVだけを検査する場合は、`validate` に届書の種類と `--csv` を指定します。

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

`npm ci` と `npm run build` のあと、同梱のダミーで動作を確認し、サンプルCSVを書き出せます。

```sh
npm run smoke
npm run sample:all
```

`npm run smoke` は同梱のダミー入力で資格取得届を生成し、そのCSVを検証します。実在の届出ではありません。`sample:acquire` は資格取得のダミーを `dist/samples/acquire/SHFD0006.csv` に、`sample:all` は7種類のダミーを `dist/samples/<種類>/SHFD0006.csv` に書き出します。

`sample-*.json` は形式の見本です。氏名は山田太郎・山田一郎・山田花子、事業所はダミー事業所株式会社です。番号・住所・生年月日も架空で、公式の記入例や届書作成プログラムのサンプルデータではありません。公式の届書作成プログラムでの検査を通ることは保証しません。サンプルを実申請に使用しないでください。

## ファイルとして配りたい場合

コマンドをファイルで渡すときは、ソースから `.tgz` を作ってからインストールします。`prepack` がビルドし、古いコンパイル済みファイルも削除します。実行コードと文字コード変換ライブラリはパッケージに同梱されるため、インストール先でのビルドは不要です。

```sh
npm ci
mkdir -p dist/packages
npm pack --pack-destination dist/packages
npm install --global dist/packages/todoke-cli-0.1.0.tgz
```

生成物は `dist/packages/todoke-cli-0.1.0.tgz` です。npmレジストリへの公開や `npm login` は不要です。

## 入力と構成

- [入力項目と既定値](docs/inputs.md)
- [コード構成とプログラムからの利用](docs/architecture.md)
- [変更の提案](CONTRIBUTING.md)

このツールは、入力から届書CSVを組み立て、形式を検査します。提出する内容と、必要な公式の確認は利用者が行ってください。

公式資料: [CSV形式届書の仕様](https://www.nenkin.go.jp/denshibenri/denshishinsei/20210401-2.html)、[届書作成プログラム](https://www.nenkin.go.jp/denshibenri/denshishinsei/download.html)。

[MIT License](LICENSE)。
