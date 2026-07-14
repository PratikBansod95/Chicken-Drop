# Farm assets

Sprites and SFX are primarily rendered / generated at runtime (canvas art + Web Audio)
so the game deploys without binary art dependencies.

Optional replacements:
- `sprites/atlas.webp` + `atlas.json` — drop in TexturePacker output and wire in render
- `audio/*.ogg` — replace procedural SFX/music in `src/game/audio/bus.ts`

Do not remove this folder; Vercel ships `public/` as static files.
