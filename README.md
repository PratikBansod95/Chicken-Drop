# Chicken Nest Run

Farm physics puzzle — a hen lays eggs and you draw rails / place gadgets so **every egg** settles in the nest.

## Play locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy on Vercel (via Git)

1. Push to GitHub.
2. Import in [Vercel](https://vercel.com) — Framework Preset **Vite**, output `dist`.
3. Deploy.

`Study/` is reference-only and is not used by the build.

## Rules

| Level | Eggs | Win |
|------|------|-----|
| 1 | 1 | Nest that egg |
| 2–50 | 3 or 5 | Nest **all** laid eggs |

## Controls

- Draw path · place tools · **Play**
- Undo / Clear / Rotate / Delete
- Mute · reduce motion
- Keys: `R` reset, `Q`/`E` rotate, `Delete` remove tool
