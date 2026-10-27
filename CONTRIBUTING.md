# 開発への参加

不具合報告では、対象の届書、実行コマンド、期待した結果、実際のエラーを書いてください。再現用JSONにはダミーデータを使い、氏名・個人番号などの実情報は投稿しないでください。

このリポジトリのツリーは再出力で置き換わります。ここに直接加えた修正は、次の再出力で消えます。残したい修正は、再出力の元になる変更として扱ってください。

## 手元で確認する

Node.js 24.13.1 を使います。

```sh
npm ci
npm run smoke
```

`npm run build` は古い `dist-js` を削除してからビルドします。利用者向けのコマンドは `todoke` です。届書固有の計算は各届書の `generate.ts`、検査条件は `validate-shfd0006.ts` にあります。共通化するときは、空欄・既定値・日付の受理形式・エラー条件の違いを先に確認してください。

## 配布パッケージ

```sh
npm ci
mkdir -p dist/packages
npm pack --pack-destination dist/packages
```

`prepack` がビルドし、`dist/packages/todoke-cli-0.1.0.tgz` を作成します。利用者は `npm install --global /path/to/todoke-cli-0.1.0.tgz` を一度実行し、任意のフォルダーから `todoke` を使えます。npmレジストリへの公開や `npm login` は不要です。

`EXPORT-MANIFEST.json` は出力時点の出自とファイルハッシュの記録であり、その後の変更で自動更新されるものではありません。
