/**
 * Tiny PCM WAV stubs for optional file-backed SFX (procedural bus still works).
 * Run: node scripts/gen-audio.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "assets", "audio");
fs.mkdirSync(OUT, { recursive: true });

function wavTone(name, freq, dur, vol = 0.2, type = "sine") {
  const sr = 22050;
  const n = Math.floor(sr * dur);
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.min(1, t * 40) * Math.max(0, 1 - t / dur);
    let s = Math.sin(2 * Math.PI * freq * t);
    if (type === "noise") s = Math.random() * 2 - 1;
    if (type === "square") s = s > 0 ? 1 : -1;
    const v = Math.max(-1, Math.min(1, s * vol * env));
    data.writeInt16LE((v * 32767) | 0, i * 2);
  }
  const hdr = Buffer.alloc(44);
  hdr.write("RIFF", 0);
  hdr.writeUInt32LE(36 + data.length, 4);
  hdr.write("WAVE", 8);
  hdr.write("fmt ", 12);
  hdr.writeUInt32LE(16, 16);
  hdr.writeUInt16LE(1, 20);
  hdr.writeUInt16LE(1, 22);
  hdr.writeUInt32LE(sr, 24);
  hdr.writeUInt32LE(sr * 2, 28);
  hdr.writeUInt16LE(2, 32);
  hdr.writeUInt16LE(16, 34);
  hdr.write("data", 36);
  hdr.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(OUT, `${name}.wav`), Buffer.concat([hdr, data]));
  console.log("wrote", name + ".wav");
}

wavTone("ui_tap", 880, 0.05, 0.12);
wavTone("cluck", 300, 0.08, 0.1, "square");
wavTone("lay", 280, 0.1, 0.12);
wavTone("plop", 160, 0.12, 0.14);
wavTone("bounce", 420, 0.08, 0.1);
wavTone("crack", 90, 0.18, 0.16, "noise");
wavTone("star", 720, 0.12, 0.1);
wavTone("win", 540, 0.28, 0.12);
wavTone("fail", 140, 0.28, 0.14);
wavTone("music_loop", 196, 1.2, 0.05);

console.log("audio ready in", OUT);
