#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const forms = require('./forms.json');
const root = path.resolve(__dirname, '..');

function usage() {
  return `JSONから電子申請用CSVを生成します。

使い方:
  todoke generate <届書> <入力.json> [--output <出力.csv>]
  todoke generate <届書> --input <入力.json> [--output <出力.csv>]
  todoke validate <届書> --csv <既存.csv>

実行例:
  todoke generate acquire ./my-shutoku.json --output ./output/SHFD0006.csv
  todoke validate acquire --csv ./output/SHFD0006.csv

届書:
${Object.entries(forms).map(([id, form]) => `  ${id.padEnd(24)} ${form.label}`).join('\n')}

生成時は入力とCSVを検査し、成功した場合だけ出力先を更新します。
出力先は --output、JSONのoutput、dist/<届書>/<公式ファイル名> の順で決まります。`;
}

function parseArgs(argv) {
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) return { help: true };
  const [command, formId, ...args] = argv;
  if (!['generate', 'validate'].includes(command)) throw new Error(`不明なコマンド: ${command}`);
  if (!Object.hasOwn(forms, formId)) throw new Error(`届書を指定してください。不明な届書: ${formId ?? '(未指定)'}`);
  let input;
  let output;
  const inputFlags = command === 'generate' ? ['--input', '-i'] : ['--csv', '--csv-path', '-c'];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (inputFlags.includes(arg) || (command === 'generate' && ['--output', '-o'].includes(arg))) {
      const value = args[++index];
      if (!value || value.startsWith('-')) throw new Error(`${arg} の値を指定してください。`);
      if (inputFlags.includes(arg)) {
        if (input !== undefined) throw new Error('入力ファイルは1つだけ指定してください。');
        input = value;
      } else {
        if (output !== undefined) throw new Error('--output は1つだけ指定してください。');
        output = value;
      }
    } else if (arg.startsWith('-')) {
      throw new Error(`不明な引数: ${arg}`);
    } else {
      if (input !== undefined) throw new Error('入力ファイルは1つだけ指定してください。');
      input = arg;
    }
  }
  if (!input) throw new Error(command === 'generate' ? '入力JSONを指定してください。' : '検証するCSVを指定してください。');
  return { command, formId, input, output };
}

function run(options) {
  const form = forms[options.formId];
  const generatorPath = path.join(root, 'dist-js', form.generator);
  const validatorPath = path.join(root, 'dist-js', form.validator);
  if (!fs.existsSync(validatorPath) || (options.command === 'generate' && !fs.existsSync(generatorPath))) {
    throw new Error('実行ファイルが不足しています。todokeを配布ファイルから再インストールしてください。');
  }
  const { validate } = require(validatorPath);
  const input = path.resolve(options.input);
  if (options.command === 'generate') {
    const json = fs.readFileSync(input, 'utf8');
    let config;
    try {
      config = JSON.parse(json);
    } catch {
      throw new Error(`入力JSONを解析できません: ${input}`);
    }
    const output = path.resolve(options.output ?? String(config?.output ?? form.output));
    // Compare file identities: realpath can preserve case aliases on Mac/Windows.
    const source = fs.statSync(input, { bigint: true });
    const destination = fs.existsSync(output) ? fs.statSync(output, { bigint: true }) : undefined;
    if (output === input || (destination && destination.dev === source.dev && destination.ino === source.ino)) {
      throw new Error('入力JSONと出力CSVには別のパスを指定してください。');
    }
    // Preserve each form's input rules; dependent-third has no separate shape check.
    if (form.inputShape) require('../dist-js/social-insurance/input').assertInputShape(config, options.formId);
    const { buildCsv } = require(generatorPath);
    const { writeValidatedCsv } = require('../dist-js/common/csv');
    writeValidatedCsv(output, buildCsv(config), validate);
    console.log(`Wrote ${output}`);
  } else {
    const errors = validate(input);
    if (errors.length > 0) {
      errors.forEach(error => console.error(error));
      return 1;
    }
    console.log(`OK: ${options.formId} CSV`);
  }
  return 0;
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log(usage());
    else process.exitCode = run(options);
  } catch (error) {
    console.error(`エラー: ${error.message}\n\n${usage()}`);
    process.exitCode = 1;
  }
}
