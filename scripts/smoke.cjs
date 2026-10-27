'use strict';

// Synthetic sample only. This does not read tests/fixtures or official checker output.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const binName = Object.keys(pkg.bin)[0];
const bin = path.join(root, pkg.bin[binName]);
const input = path.join(root, 'src/social-insurance/acquire/sample-shutoku.json');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'social-smoke-'));

function run(args) {
  execFileSync(process.execPath, [bin, ...args], { cwd: work, stdio: 'inherit', windowsHide: true });
}

try {
  run(['--help']);
  const output = path.join(work, 'SHFD0006.csv');
  run(['generate', 'acquire', '--input', input, '--output', output]);
  run(['validate', 'acquire', '--csv', output]);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
