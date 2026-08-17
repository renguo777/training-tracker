// 纯 Node 生成 PWA 图标（手写 PNG 编码，无需任何依赖）
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- PNG 编码 ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- 绘制 ----------
function drawIcon(size) {
  const w = size, h = size;
  const img = Buffer.alloc(w * h * 4); // 默认全透明

  const setPx = (x, y, r, g, b) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    img[i] = r; img[i + 1] = g; img[i + 2] = b; img[i + 3] = 255;
  };

  // 对角线渐变背景
  const c1 = [255, 94, 58], c2 = [108, 92, 231];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = (x + y) / (w + h);
      setPx(x, y,
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t));
    }
  }

  const stampCircle = (cx, cy, r) => {
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(w - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(h - 1, Math.ceil(cy + r));
    const rr = r * r;
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy <= rr) setPx(x, y, 255, 255, 255);
      }
  };

  const stampLine = (x0, y0, x1, y1, r) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      stampCircle(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r);
    }
  };

  // 三根上升的柱子（圆头）
  const barR = size * 0.07;
  stampLine(size * 0.23, size * 0.60, size * 0.23, size * 0.86, barR);
  stampLine(size * 0.50, size * 0.42, size * 0.50, size * 0.86, barR);
  stampLine(size * 0.77, size * 0.24, size * 0.77, size * 0.86, barR);

  // 顶部上升趋势线 + 箭头
  const lineR = size * 0.024;
  stampLine(size * 0.23, size * 0.60, size * 0.50, size * 0.42, lineR);
  stampLine(size * 0.50, size * 0.42, size * 0.77, size * 0.24, lineR);
  stampLine(size * 0.77, size * 0.24, size * 0.87, size * 0.16, lineR);
  stampLine(size * 0.87, size * 0.16, size * 0.79, size * 0.18, lineR); // 箭头左翼
  stampLine(size * 0.87, size * 0.16, size * 0.84, size * 0.27, lineR); // 箭头右翼

  return encodePNG(w, h, img);
}

const dir = path.dirname(fileURLToPath(import.meta.url));
const targets = [
  ['icon-512.png', 512],
  ['icon-192.png', 192],
  ['apple-touch-icon.png', 180],
];
for (const [name, size] of targets) {
  fs.writeFileSync(path.join(dir, name), drawIcon(size));
  console.log(name, 'done');
}
