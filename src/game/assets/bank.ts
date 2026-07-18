export type SpriteKey = "chicken" | "nest" | "star" | "backdrop";

const PATHS: Record<SpriteKey, string> = {
  chicken: "/assets/sprites/chicken.png",
  nest: "/assets/sprites/nest.png",
  star: "/assets/sprites/star.png",
  backdrop: "/assets/sprites/backdrop.jpg",
};

export class AssetBank {
  private images = new Map<SpriteKey, HTMLImageElement>();
  ready = false;

  async load(): Promise<void> {
    const entries = Object.entries(PATHS) as [SpriteKey, string][];
    await Promise.all(
      entries.map(
        ([key, src]) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.decoding = "async";
            img.onload = () => {
              this.images.set(key, img);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = src;
          }),
      ),
    );
    this.ready = true;
  }

  get(key: SpriteKey): HTMLImageElement | null {
    return this.images.get(key) ?? null;
  }
}

export const assets = new AssetBank();
