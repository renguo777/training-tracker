// 语法检查：提取各 HTML 内联 <script> 用 vm.Script 编译（不执行）
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
let fail = 0;

function checkFile(name, content) {
  const matches = [...content.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)];
  matches.forEach((m, i) => {
    try {
      new vm.Script(m[1], { filename: name + ' #script' + i });
      console.log('OK  ', name + ' script#' + i);
    } catch (e) {
      fail++;
      console.log('FAIL', name + ' script#' + i, e.message);
    }
  });
}

for (const f of ['index.html', 'charts.html', 'schulte.html']) {
  checkFile(f, fs.readFileSync(path.join(dir, f), 'utf8'));
}
// 独立 JS
for (const f of ['data.js', 'sw.js']) {
  try {
    new vm.Script(fs.readFileSync(path.join(dir, f), 'utf8'), { filename: f });
    console.log('OK  ', f);
  } catch (e) {
    fail++;
    console.log('FAIL', f, e.message);
  }
}
// manifest 有效性
try { JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')); console.log('OK   manifest.json'); }
catch (e) { fail++; console.log('FAIL manifest.json', e.message); }

console.log(fail ? `\n${fail} 个问题` : '\n全部通过 ✔');
process.exit(fail ? 1 : 0);
