/* 数据层：所有记录存在手机本地 localStorage，不外传 */
'use strict';

const TT_KEY = 'tt_training_v1';

// 当天日期字符串，如 2026-08-17（用本地时区）
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// 日期字符串 -> Date（按本地时区解析，避免 UTC 偏差）
function dateOf(str) {
  const p = str.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

function fmtDate(str) {
  const d = dateOf(str);
  const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  return d.getMonth() + 1 + '月' + d.getDate() + '日 ' + w;
}

function load() {
  try {
    const raw = localStorage.getItem(TT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 隐私模式等场景，降级为空数据 */ }
  return { version: 1, days: {}, schulte: [] };
}

function save(data) {
  try {
    localStorage.setItem(TT_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    alert('保存失败：手机存储不可用（可能是无痕模式）。请改用正常模式浏览。');
    return false;
  }
}

// 某天记录：{ pushups: 数量|null, plank: 秒数|null }
function getDay(str) {
  const data = load();
  return data.days[str] || { pushups: null, plank: null };
}

function setDay(str, key, value) {
  const data = load();
  if (!data.days[str]) data.days[str] = { pushups: null, plank: null };
  data.days[str][key] = value;
  if (data.days[str].pushups == null && data.days[str].plank == null) delete data.days[str];
  return save(data);
}

function deleteDay(str) {
  const data = load();
  delete data.days[str];
  return save(data);
}

function getSchulte() {
  return load().schulte; // 数组按时间倒序（新在前）
}

function addSchulte(size, ms, err) {
  const data = load();
  data.schulte.unshift({ id: Date.now() + '-' + Math.floor(Math.random() * 1e6), t: Date.now(), size: size, ms: ms, err: err || 0 });
  return save(data);
}

function deleteSchulte(id) {
  const data = load();
  data.schulte = data.schulte.filter((r) => r.id !== id);
  return save(data);
}

// 导出备份：下载 JSON 文件（数据打包 zip，为以后导入做兼容）
function exportJSON() {
  const blob = new Blob([JSON.stringify(load(), null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '训练记录备份-' + todayStr() + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

// 导入备份：解析 JSON，校验结构后覆盖本地数据
function importJSON(text) {
  const obj = JSON.parse(text);
  if (!obj || typeof obj !== 'object') throw new Error('文件格式不正确');
  if (Array.isArray(obj.days)) {
    // 旧版兼容：days 可能是数组
    const map = {};
    obj.days.forEach((d) => { if (d && d.date) map[d.date] = { pushups: d.pushups ?? null, plank: d.plank ?? null }; });
    obj.days = map;
  }
  if (!obj.days || typeof obj.days !== 'object') throw new Error('未找到训练记录');
  if (!Array.isArray(obj.schulte)) obj.schulte = [];
  return save({ version: 1, days: obj.days, schulte: obj.schulte });
}
