export type SpriteKey =
  | "chicken"
  | "chicken_lay"
  | "nest"
  | "egg"
  | "egg_cracked"
  | "star"
  | "backdrop"
  | "spring"
  | "pad"
  | "fan"
  | "belt"
  | "sticky"
  | "spike"
  | "fire"
  | "pan";

const PATHS: Record<SpriteKey, string> = {
  chicken: "/assets/sprites/chicken_idle.png",
  chicken_lay: "/assets/sprites/chicken_lay.png",
  nest: "/assets/sprites/nest_bowl.png",
  egg: "/assets/sprites/egg.png",
  egg_cracked: "/assets/sprites/egg_cracked.png",
  star: "/assets/sprites/star.png",
  backdrop: "/assets/sprites/backdrop.jpg",
  spring: "/assets/sprites/spring.png",
  pad: "/assets/sprites/pad.png",
  fan: "/assets/sprites/fan.png",
  belt: "/assets/sprites/belt.png",
  sticky: "/assets/sprites/sticky.png",
  spike: "/assets/sprites/spike.png",
  fire: "/assets/sprites/fire.png",
  pan: "/assets/sprites/pan.png",
};

/** Fallbacks if new filenames missing (legacy names). */
const FALLBACKS: Partial<Record<SpriteKey, string>> = {
  chicken: "/assets/sprites/chicken.png",
  nest: "/assets/sprites/nest.png",
};

export class AssetBank {
  private images = new Map<SpriteKey, HTMLImageElement>();
  ready = false;

  async load(onProgress?: (pct: number) => void): Promise<void> {
    const entries = Object.entries(PATHS) as [SpriteKey, string][];
    let done = 0;
    const total = entries.length;

    await Promise.all(
      entries.map(
        ([key, src]) =>
          new Promise<void>((resolve) => {
            const finish = () => {
              done += 1;
              onProgress?.(done / total);
              resolve();
            };
            const tryLoad = (url: string, allowFallback: boolean) => {
              const img = new Image();
              img.decoding = "async";
              img.onload = () => {
                this.images.set(key, img);
                finish();
              };
              img.onerror = () => {
                const fb = FALLBACKS[key];
                if (allowFallback && fb) tryLoad(fb, false);
                else finish();
              };
              img.src = url;
            };
            tryLoad(src, true);
          }),
      ),
    );
    this.ready = true;
    onProgress?.(1);
  }

  get(key: SpriteKey): HTMLImageElement | null {
    return this.images.get(key) ?? null;
  }
}

export const assets = new AssetBank();
