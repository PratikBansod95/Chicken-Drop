import { stat } from "node:fs/promises";
import { resolve } from "node:path";

const required = [
  "public/assets/sprites/chicken.png",
  "public/assets/sprites/egg.png",
  "public/assets/sprites/egg_cracked.png",
  "public/assets/sprites/nest_back.png",
  "public/assets/sprites/nest_front.png",
  "public/assets/sprites/nest_shadow.png",
  "public/assets/sprites/star.png",
  "public/assets/sprites/spring.png",
  "public/assets/sprites/ramp.png",
  "public/assets/sprites/pad.png",
  "public/assets/sprites/fan.png",
  "public/assets/sprites/belt.png",
  "public/assets/sprites/sticky.png",
  "public/assets/sprites/spike.png",
  "public/assets/sprites/backdrop.jpg",
];

const errors = [];
for (const file of required) {
  try {
    const info = await stat(resolve(file));
    if (!info.isFile() || info.size < 64) errors.push(`${file}: empty or invalid`);
  } catch {
    errors.push(`${file}: missing`);
  }
}

if (errors.length) {
  console.error(`Asset integrity failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`Asset integrity passed (${required.length} production assets).`);
}
