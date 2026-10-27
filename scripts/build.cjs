'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const forms = require('../bin/forms.json');

const root = path.resolve(__dirname, '..');
// Removed entry points must not survive in a later installable package.
fs.rmSync(path.join(root, 'dist-js'), { recursive: true, force: true });
const result = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.json'], {
  cwd: root, stdio: 'inherit', windowsHide: true,
});
if (result.error) throw result.error;
if (result.status === 0) {
  for (const asset of new Set(Object.values(forms).flatMap(form => form.assets ?? []))) {
    const destination = path.join(root, 'dist-js', asset);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(root, 'src', asset), destination);
  }
}
process.exitCode = result.status ?? 1;
