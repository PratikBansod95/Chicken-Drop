/**
 * Generates cozy farm storybook PNG sprites (transparent) without external deps.
 * Run: node scripts/gen-sprites.mjs
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "assets", "sprites");

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function createCanvas(w, h) {
  const data = Buffer.alloc(w * h * 4);
  const api = {
    w,
    h,
    data,
    clear() {
      data.fill(0);
    },
    set(x, y, r, g, b, a = 255) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const i = (y * w + x) * 4;
      const aa = a / 255;
      const inv = 1 - aa;
      data[i] = Math.round(r * aa + data[i] * inv);
      data[i + 1] = Math.round(g * aa + data[i + 1] * inv);
      data[i + 2] = Math.round(b * aa + data[i + 2] * inv);
      data[i + 3] = Math.min(255, data[i + 3] + a);
    },
    fillEllipse(cx, cy, rx, ry, r, g, b, a = 255) {
      const x0 = Math.floor(cx - rx);
      const x1 = Math.ceil(cx + rx);
      const y0 = Math.floor(cy - ry);
      const y1 = Math.ceil(cy + ry);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const u = (x - cx) / rx;
          const v = (y - cy) / ry;
          if (u * u + v * v <= 1) api.set(x, y, r, g, b, a);
        }
      }
    },
    fillRect(x, y, rw, rh, r, g, b, a = 255, rad = 0) {
      for (let yy = y; yy < y + rh; yy++) {
        for (let xx = x; xx < x + rw; xx++) {
          if (rad > 0) {
            const lx = Math.min(xx - x, x + rw - 1 - xx);
            const ly = Math.min(yy - y, y + rh - 1 - yy);
            if (lx < rad && ly < rad) {
              const dx = rad - lx;
              const dy = rad - ly;
              if (dx * dx + dy * dy > rad * rad) continue;
            }
          }
          api.set(xx, yy, r, g, b, a);
        }
      }
    },
    strokeEllipse(cx, cy, rx, ry, r, g, b, a = 255, thick = 2) {
      for (let t = 0; t < Math.PI * 2; t += 0.01) {
        for (let k = 0; k < thick; k++) {
          api.set(
            Math.round(cx + Math.cos(t) * (rx - k)),
            Math.round(cy + Math.sin(t) * (ry - k)),
            r,
            g,
            b,
            a,
          );
        }
      }
    },
    save(name) {
      fs.writeFileSync(path.join(OUT, name), encodePNG(w, h, data));
      console.log("wrote", name);
    },
  };
  return api;
}

fs.mkdirSync(OUT, { recursive: true });

// nest_bowl — wide shallow woven look
{
  const c = createCanvas(320, 140);
  c.clear();
  c.fillEllipse(160, 88, 148, 42, 140, 90, 48, 255);
  c.fillEllipse(160, 78, 128, 30, 90, 55, 28, 255);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI;
    const x0 = 160 + Math.cos(a) * 140;
    const y0 = 70 + Math.sin(a) * 28;
    const x1 = 160 + Math.cos(a) * 90;
    const y1 = 95 + Math.sin(a) * 10;
    for (let t = 0; t < 1; t += 0.02) {
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      c.set(Math.round(x), Math.round(y), 180, 120, 60, 200);
    }
  }
  c.strokeEllipse(160, 58, 140, 22, 100, 65, 35, 230, 3);
  c.save("nest_bowl.png");
}

// egg
{
  const c = createCanvas(96, 120);
  c.clear();
  c.fillEllipse(48, 62, 34, 46, 255, 248, 230, 255);
  c.fillEllipse(38, 48, 10, 16, 255, 255, 255, 160);
  c.strokeEllipse(48, 62, 34, 46, 160, 120, 70, 180, 2);
  c.save("egg.png");
}

// egg_cracked
{
  const c = createCanvas(96, 120);
  c.clear();
  c.fillEllipse(30, 70, 18, 28, 243, 230, 200, 255);
  c.fillEllipse(66, 68, 16, 26, 243, 230, 200, 255);
  c.fillEllipse(48, 85, 14, 10, 246, 217, 106, 180);
  for (let i = 0; i < 40; i++) {
    c.set(40 + (i % 8), 40 + Math.floor(i / 8) * 3, 130, 90, 50, 220);
  }
  c.save("egg_cracked.png");
}

// chicken idle / lay
function paintChicken(c, laying) {
  c.clear();
  c.fillEllipse(64, 78, 40, 32, 245, 240, 225, 255);
  c.fillEllipse(88, 52, 22, 20, 245, 240, 225, 255);
  c.fillEllipse(96, 36, 10, 12, 220, 70, 70, 255);
  c.fillEllipse(100, 52, 8, 5, 240, 160, 60, 255);
  c.fillEllipse(82, 48, 3, 3, 40, 40, 50, 255);
  c.fillEllipse(48, 100, 10, 8, 220, 140, 60, 255);
  c.fillEllipse(72, 102, 10, 8, 220, 140, 60, 255);
  if (laying) c.fillEllipse(40, 105, 12, 14, 255, 235, 180, 255);
}

{
  const c = createCanvas(128, 128);
  paintChicken(c, false);
  c.save("chicken_idle.png");
  paintChicken(c, true);
  c.save("chicken_lay.png");
}

// tools
{
  const c = createCanvas(128, 128);
  c.clear();
  for (let i = 0; i < 6; i++) {
    c.fillRect(30, 20 + i * 14, 68, 8, 70, 180, 100, 255, 3);
  }
  c.fillRect(36, 100, 56, 14, 50, 140, 80, 255, 6);
  c.save("spring.png");
}
{
  const c = createCanvas(140, 80);
  c.clear();
  c.fillRect(8, 18, 124, 44, 100, 180, 230, 255, 16);
  c.fillRect(18, 28, 104, 16, 180, 220, 250, 200, 8);
  c.save("pad.png");
}
{
  const c = createCanvas(120, 120);
  c.clear();
  c.fillRect(16, 16, 88, 88, 120, 200, 220, 255, 18);
  c.fillEllipse(60, 60, 12, 12, 30, 60, 80, 255);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    for (let t = 0; t < 28; t++) {
      c.set(Math.round(60 + Math.cos(a) * t), Math.round(60 + Math.sin(a) * t), 30, 60, 80, 255);
    }
  }
  c.save("fan.png");
}
{
  const c = createCanvas(160, 70);
  c.clear();
  c.fillRect(6, 14, 148, 42, 200, 150, 90, 255, 12);
  for (let x = 18; x < 150; x += 22) c.fillRect(x, 24, 12, 22, 80, 55, 30, 180, 2);
  c.save("belt.png");
}
{
  const c = createCanvas(150, 80);
  c.clear();
  c.fillRect(8, 16, 134, 48, 200, 150, 230, 255, 14);
  c.fillEllipse(40, 40, 10, 10, 160, 100, 200, 180);
  c.fillEllipse(90, 45, 12, 8, 160, 100, 200, 160);
  c.save("sticky.png");
}

// hazards
{
  const c = createCanvas(160, 60);
  c.clear();
  for (let i = 0; i < 5; i++) {
    const x = 20 + i * 28;
    for (let y = 40; y >= 10; y--) {
      const t = (40 - y) / 30;
      const half = 10 * (1 - t);
      for (let xx = -half; xx <= half; xx++) c.set(Math.round(x + xx), y, 120, 95, 70, 255);
    }
  }
  c.save("spike.png");
}
{
  const c = createCanvas(100, 110);
  c.clear();
  for (let i = 0; i < 80; i++) {
    const x = 50 + Math.sin(i) * (20 + (i % 7));
    const y = 90 - i;
    c.fillEllipse(x, y, 10 - i * 0.08, 12 - i * 0.05, 255, 100 + (i % 40), 40, 200);
  }
  c.fillEllipse(50, 70, 8, 14, 255, 220, 100, 220);
  c.save("fire.png");
}
{
  const c = createCanvas(140, 80);
  c.clear();
  c.fillRect(16, 28, 108, 28, 120, 125, 135, 255, 10);
  c.fillEllipse(70, 30, 54, 12, 100, 105, 115, 255);
  c.fillRect(118, 20, 10, 36, 90, 95, 105, 255, 3);
  c.save("pan.png");
}

// gold star refine
{
  const c = createCanvas(96, 96);
  c.clear();
  const cx = 48;
  const cy = 48;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const a2 = a + Math.PI / 5;
    const x1 = cx + Math.cos(a) * 40;
    const y1 = cy + Math.sin(a) * 40;
    const x2 = cx + Math.cos(a2) * 16;
    const y2 = cy + Math.sin(a2) * 16;
    for (let t = 0; t < 1; t += 0.01) {
      c.set(Math.round(cx + (x1 - cx) * t), Math.round(cy + (y1 - cy) * t), 240, 190, 60, 255);
      c.set(Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), 240, 190, 60, 255);
    }
  }
  c.fillEllipse(48, 48, 14, 14, 255, 220, 100, 255);
  c.save("star.png");
}

console.log("sprites ready in", OUT);
