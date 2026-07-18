# Assets

Farm storybook sprites and short WAV SFX for Chicken Nest Run.

## Sprites (`sprites/`)

- `nest_bowl.png`, `egg.png`, `egg_cracked.png`
- `chicken_idle.png`, `chicken_lay.png`, `star.png`
- Tools: `spring.png`, `pad.png`, `fan.png`, `belt.png`, `sticky.png`
- Hazards: `spike.png`, `fire.png`, `pan.png`
- `backdrop.jpg` — playfield atmosphere
- Legacy fallbacks: `nest.png`, `chicken.png`

Regenerate painted placeholders: `node scripts/gen-sprites.mjs`

## Audio (`audio/`)

WAV stubs (`ui_tap`, `cluck`, `lay`, `plop`, `bounce`, `crack`, `star`, `win`, `fail`, `music_loop`).
The audio bus prefers these files and falls back to procedural Web Audio.

Regenerate: `node scripts/gen-audio.mjs`
