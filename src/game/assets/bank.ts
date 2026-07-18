export type SpriteKey =
  | "chicken"
  | "egg"
  | "nestBack"
  | "nestFront"
  | "nestShadow"
  | "star"
  | "backdrop";

const PATHS: Record<SpriteKey, string> = {
  chicken: "/assets/sprites/chicken.png",
  egg: "/assets/sprites/egg.png",
  nestBack: "/assets/sprites/nest_back.png",
  nestFront: "/assets/sprites/nest_front.png",
  nestShadow: "/assets/sprites/nest_shadow.png",
  star: "/assets/sprites/star.png",
  backdrop: "/assets/sprites/backdrop.jpg",
};

export class AssetBank {
  private images = new Map<SpriteKey, HTMLImageElement>();
  private failures = new Set<SpriteKey>();
  ready = false;

  async load(onProgress?: (loaded: number, total: number) => void): Promise<void> {
    const entries = Object.entries(PATHS) as [SpriteKey, string][];
    let loaded = 0;
    onProgress?.(0, entries.length);
    await Promise.all(
      entries.map(
        ([key, src]) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.decoding = "async";
            img.onload = () => {
              this.images.set(key, img);
              loaded += 1;
              onProgress?.(loaded, entries.length);
              resolve();
            };
            img.onerror = () => {
              this.failures.add(key);
              loaded += 1;
              onProgress?.(loaded, entries.length);
              console.warn(`Chicken Nest Run: failed to load sprite "${key}" from ${src}`);
              resolve();
            };
            img.src = src;
          }),
      ),
    );
    this.ready = true;
  }

  get(key: SpriteKey): HTMLImageElement | null {
    return this.images.get(key) ?? null;
  }

  failed(key: SpriteKey): boolean {
    return this.failures.has(key);
  }
}

export const assets = new AssetBank();
