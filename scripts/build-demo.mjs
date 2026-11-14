import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [template, core] = await Promise.all([
  readFile(resolve(root, 'demo/index.template.html'), 'utf8'),
  readFile(resolve(root, 'src/xray.mjs'), 'utf8'),
]);
const output = template.replace(
  '/* XRAY_RUNTIME_START */\n/* XRAY_RUNTIME_END */',
  `/* XRAY_RUNTIME_START */\n${core.trim()}\n/* XRAY_RUNTIME_END */`,
);
await writeFile(resolve(root, 'demo/index.html'), output);
