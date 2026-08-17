// data.js 逻辑测试：mock localStorage 后加载并验证
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.join(dir, 'data.js'), 'utf8');

let store = {};
const sandbox = {
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
  },
  alert: (m) => console.log('  [alert]', m),
  console, Date, Math, JSON,
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

let pass = 0, fail = 0;
const assert = (cond, msg) => { if (cond) { pass++; console.log('OK  ', msg); } else { fail++; console.log('FAIL', msg); } };

// 记录写入/读取
sandbox.setDay('2026-08-15', 'pushups', 30);
sandbox.setDay('2026-08-15', 'plank', 75);
let d = sandbox.getDay('2026-08-15');
assert(d.pushups === 30 && d.plank === 75, 'setDay/getDay 读写正确');

// 同日累计
sandbox.setDay('2026-08-16', 'pushups', 10);
sandbox.setDay('2026-08-16', 'pushups', 12);
assert(sandbox.getDay('2026-08-16').pushups === 12, '同一天再次记录覆盖更新');

// 全空删除
sandbox.setDay('2026-08-17', 'pushups', 5);
sandbox.setDay('2026-08-17', 'pushups', null);
assert(!('2026-08-17' in sandbox.load().days), '两个值都为空时该天记录自动删除');

// 舒尔特
sandbox.addSchulte(5, 31200, 2);
sandbox.addSchulte(3, 8000, 0);
let s = sandbox.getSchulte();
assert(s.length === 2 && s[0].size === 3, '舒尔特记录按时间倒序存储');
sandbox.deleteSchulte(s[0].id);
assert(sandbox.getSchulte().length === 1, '删除舒尔特单条记录');

// 导出/导入
const backup = JSON.stringify(sandbox.load());
store = {};
sandbox.importJSON(backup);
d = sandbox.getDay('2026-08-15');
assert(d.pushups === 30 && sandbox.getSchulte().length === 1, '导出再导入数据完整');
let threw = false;
try { sandbox.importJSON('{"foo":1}'); } catch (e) { threw = true; }
assert(threw, '非法文件被拒绝');

// 旧版兼容（days 为数组）
const legacy = JSON.stringify({ version: 1, days: [{ date: '2026-08-01', pushups: 20 }], schulte: [] });
store = {};
sandbox.importJSON(legacy);
assert(sandbox.getDay('2026-08-01').pushups === 20, '旧版数组格式兼容导入');

// 日期
assert(sandbox.todayStr() === new Date(2026, 7, 17).getFullYear() + '-' + '08' + '-' + '17' || /^\d{4}-\d{2}-\d{2}$/.test(sandbox.todayStr()), 'todayStr 格式正确');

console.log(fail ? `\n${fail} 个失败` : `\n${pass} 项全部通过 ✔`);
process.exit(fail ? 1 : 0);
