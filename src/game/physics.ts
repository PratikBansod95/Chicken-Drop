import Matter from "matter-js";
import { EGG_RADIUS, TWEAKS, WORLD } from "./types";
import type { EggRuntime, FixedObject, LevelData, PlacedKind, Vec2 } from "./types";

const { Engine, Bodies, Body, Composite, Constraint, Events, Query } = Matter;

export interface InkStroke {
  points: Vec2[];
}

export interface PlacedTool {
  id: string;
  type: PlacedKind;
  x: number;
  y: number;
  angle: number;
  w: number;
  h: number;
  dir: number;
  bodyIds: number[];
}

type FailReason =
  | "crack"
  | "fire"
  | "pan"
  | "spike"
  | "fell"
  | "timeout";

export class PhysicsWorld {
  readonly engine: Matter.Engine;
  private wallIds: number[] = [];
  private basketParts: Matter.Body[] = [];
  private nestSensor: Matter.Body | null = null;
  private nestFloor: Matter.Body | null = null;
  eggs: EggRuntime[] = [];
  private inkBodies: Matter.Body[] = [];
  private objectBodies = new Map<number, { kind: PlacedKind; meta?: PlacedTool | FixedObject }>();
  private fanBodies: { body: Matter.Body; angle: number; dir: number }[] = [];
  private stickyBodies: Matter.Body[] = [];
  private conveyors: { body: Matter.Body; dir: number; angle: number }[] = [];
  private rotating: { body: Matter.Body; speed: number }[] = [];
  private pins = new Map<string, Matter.Constraint>();

  onEggNested: ((eggId: string) => void) | null = null;
  onEggBroken: ((eggId: string, reason: FailReason) => void) | null = null;
  onBounce: (() => void) | null = null;

  constructor() {
    this.engine = Engine.create({
      gravity: { x: 0, y: TWEAKS.gravity },
      enableSleeping: true,
    });
    this.engine.timing.timeScale = 1;
  }

  clearDynamic() {
    for (const pin of this.pins.values()) Composite.remove(this.engine.world, pin);
    this.pins.clear();
    for (const egg of this.eggs) {
      const b = this.getBody(egg.bodyId);
      if (b) Composite.remove(this.engine.world, b);
    }
    this.eggs = [];
    for (const b of this.inkBodies) Composite.remove(this.engine.world, b);
    this.inkBodies = [];
  }

  resetLevel(level: LevelData, strokes: InkStroke[], placed: PlacedTool[]) {
    Composite.clear(this.engine.world, false);
    this.engine.world.gravity.y = TWEAKS.gravity;
    this.eggs = [];
    this.inkBodies = [];
    this.objectBodies.clear();
    this.fanBodies = [];
    this.stickyBodies = [];
    this.conveyors = [];
    this.rotating = [];
    this.pins.clear();
    this.basketParts = [];
    this.wallIds = [];

    this.addBounds();
    this.addBasket(level.basket);
    for (const obj of level.fixedObjects) this.addProp(obj, true);
    for (const obj of placed) this.addProp(obj, false);
    this.buildInk(strokes);
    this.wireCollisions();
  }

  private addBounds() {
    const t = 80;
    const walls = [
      Bodies.rectangle(WORLD.width / 2, -t / 2, WORLD.width + 400, t, { isStatic: true, label: "wall" }),
      Bodies.rectangle(WORLD.width / 2, WORLD.height + t / 2 + 40, WORLD.width + 400, t, {
        isStatic: true,
        label: "floor-kill",
      }),
      Bodies.rectangle(-t / 2, WORLD.height / 2, t, WORLD.height + 400, { isStatic: true, label: "wall" }),
      Bodies.rectangle(WORLD.width + t / 2, WORLD.height / 2, t, WORLD.height + 400, {
        isStatic: true,
        label: "wall",
      }),
    ];
    for (const w of walls) this.wallIds.push(w.id);
    Composite.add(this.engine.world, walls);
  }

  private addBasket(pos: Vec2) {
    const thick = 14;
    const w = 130;
    const h = 70;
    const left = Bodies.rectangle(pos.x - w / 2 + thick / 2, pos.y - 6, thick, h, {
      isStatic: true,
      friction: 0.7,
      restitution: 0.15,
      label: "basket-rim",
      chamfer: { radius: 4 },
    });
    const right = Bodies.rectangle(pos.x + w / 2 - thick / 2, pos.y - 6, thick, h, {
      isStatic: true,
      friction: 0.7,
      restitution: 0.15,
      label: "basket-rim",
      chamfer: { radius: 4 },
    });
    const floor = Bodies.rectangle(pos.x, pos.y + h / 2 - thick / 2 - 4, w - thick * 1.4, thick, {
      isStatic: true,
      friction: 0.95,
      restitution: 0.05,
      label: "basket-floor",
    });
    const sensor = Bodies.rectangle(pos.x, pos.y + 8, w - 36, h - 18, {
      isStatic: true,
      isSensor: true,
      label: "nest-sensor",
    });
    this.nestSensor = sensor;
    this.nestFloor = floor;
    this.basketParts = [left, right, floor, sensor];
    Composite.add(this.engine.world, this.basketParts);
  }

  private addProp(obj: FixedObject | PlacedTool, _fixed: boolean) {
    const angle = "angle" in obj ? obj.angle : 0;
    const common = {
      isStatic: true,
      angle,
      friction: 0.5,
      restitution: 0.2,
      label: obj.type,
    };

    let body: Matter.Body;
    switch (obj.type) {
      case "spring":
        body = Bodies.rectangle(obj.x, obj.y, obj.w * 0.7, obj.h * 0.55, {
          ...common,
          restitution: 1.15 * TWEAKS.bounceScale,
          friction: 0.1,
        });
        break;
      case "pad":
        body = Bodies.rectangle(obj.x, obj.y, obj.w, obj.h * 0.55, {
          ...common,
          restitution: 0.95 * TWEAKS.bounceScale,
          friction: 0.15,
        });
        break;
      case "sticky":
        body = Bodies.rectangle(obj.x, obj.y, obj.w, obj.h * 0.55, {
          ...common,
          restitution: 0.02,
          friction: 1.2,
        });
        this.stickyBodies.push(body);
        break;
      case "conveyor":
        body = Bodies.rectangle(obj.x, obj.y, obj.w, obj.h * 0.5, {
          ...common,
          restitution: 0.1,
          friction: 0.9,
        });
        this.conveyors.push({ body, dir: obj.dir ?? 1, angle });
        break;
      case "fan":
        body = Bodies.rectangle(obj.x, obj.y, obj.w * 0.8, obj.h * 0.8, {
          ...common,
          isSensor: true,
        });
        this.fanBodies.push({ body, angle, dir: obj.dir ?? 1 });
        break;
      case "spike":
        body = Bodies.rectangle(obj.x, obj.y, obj.w, obj.h * 0.5, {
          ...common,
          restitution: 0.1,
        });
        break;
      case "fire":
        body = Bodies.circle(obj.x, obj.y, Math.min(obj.w, obj.h) * 0.35, {
          ...common,
          isSensor: true,
        });
        break;
      case "pan":
        body = Bodies.rectangle(obj.x, obj.y, obj.w, obj.h * 0.45, {
          ...common,
          restitution: 0.25,
        });
        if ("rotating" in obj && obj.rotating && obj.rotateSpeed) {
          this.rotating.push({ body, speed: obj.rotateSpeed });
        }
        break;
      default:
        body = Bodies.rectangle(obj.x, obj.y, obj.w, obj.h, common);
    }

    this.objectBodies.set(body.id, { kind: obj.type, meta: obj });
    Composite.add(this.engine.world, body);
    if ("bodyIds" in obj) obj.bodyIds = [body.id];
  }

  buildInk(strokes: InkStroke[]) {
    for (const b of this.inkBodies) Composite.remove(this.engine.world, b);
    this.inkBodies = [];
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      for (let i = 1; i < stroke.points.length; i++) {
        const a = stroke.points[i - 1];
        const b = stroke.points[i];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 2) continue;
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const seg = Bodies.rectangle(midX, midY, len, 10, {
          isStatic: true,
          angle: Math.atan2(dy, dx),
          friction: 0.55,
          restitution: 0.18,
          chamfer: { radius: 3 },
          label: "ink",
        });
        this.inkBodies.push(seg);
        Composite.add(this.engine.world, seg);
      }
    }
  }

  spawnEgg(at: Vec2, id: string): EggRuntime {
    const body = Bodies.circle(at.x, at.y, EGG_RADIUS, {
      label: `egg:${id}`,
      restitution: 0.28,
      friction: 0.35,
      frictionAir: 0.012,
      density: 0.0022,
      sleepThreshold: 45,
    });
    Composite.add(this.engine.world, body);
    const egg: EggRuntime = {
      id,
      bodyId: body.id,
      nested: false,
      broken: false,
      nestHold: 0,
    };
    this.eggs.push(egg);
    return egg;
  }

  private wireCollisions() {
    Events.off(this.engine, "collisionStart");
    Events.off(this.engine, "collisionActive");

    Events.on(this.engine, "collisionStart", (e) => {
      for (const pair of e.pairs) {
        this.handlePair(pair, true);
      }
    });
    Events.on(this.engine, "collisionActive", (e) => {
      for (const pair of e.pairs) {
        this.handlePair(pair, false);
      }
    });
  }

  private eggFromBody(body: Matter.Body): EggRuntime | null {
    if (!body.label.startsWith("egg:")) return null;
    const id = body.label.slice(4);
    return this.eggs.find((e) => e.id === id) ?? null;
  }

  private handlePair(pair: Matter.Pair, isStart: boolean) {
    const bodies = [pair.bodyA, pair.bodyB];
    const eggBody = bodies.find((b) => b.label.startsWith("egg:"));
    const other = bodies.find((b) => b !== eggBody);
    if (!eggBody || !other) return;
    const egg = this.eggFromBody(eggBody);
    if (!egg || egg.broken || egg.nested) return;

    const kind = other.label;
    if (kind === "spike" || kind === "pan") {
      this.breakEgg(egg, kind === "spike" ? "spike" : "pan");
      return;
    }
    if (kind === "fire") {
      this.breakEgg(egg, "fire");
      return;
    }
    if (kind === "floor-kill") {
      this.breakEgg(egg, "fell");
      return;
    }

    if (isStart && (kind === "ink" || kind === "basket-rim" || kind === "spring" || kind === "pad")) {
      const impact = Math.hypot(eggBody.velocity.x, eggBody.velocity.y);
      if (impact > 4.5) this.onBounce?.();
      if (
        (kind === "ink" || kind === "basket-rim") &&
        pair.collision.depth > 0 &&
        impact * 0.012 > TWEAKS.breakImpulse
      ) {
        // impulse approx via relative speed
        const rel = Math.hypot(
          eggBody.velocity.x - other.velocity.x,
          eggBody.velocity.y - other.velocity.y,
        );
        if (rel > 14) this.breakEgg(egg, "crack");
      }
    }
  }

  breakEgg(egg: EggRuntime, reason: FailReason) {
    if (egg.broken || egg.nested) return;
    egg.broken = true;
    const body = this.getBody(egg.bodyId);
    if (body) Composite.remove(this.engine.world, body);
    this.onEggBroken?.(egg.id, reason);
  }

  step(dtMs: number) {
    const steps = 2;
    for (let i = 0; i < steps; i++) Engine.update(this.engine, dtMs / steps);

    for (const r of this.rotating) {
      Body.setAngle(r.body, r.body.angle + r.speed * (dtMs / 1000));
      Body.setAngularVelocity(r.body, 0);
    }

    for (const fan of this.fanBodies) {
      const eggs = this.eggs.filter((e) => !e.broken && !e.nested);
      for (const egg of eggs) {
        const body = this.getBody(egg.bodyId);
        if (!body) continue;
        const dx = body.position.x - fan.body.position.x;
        const dy = body.position.y - fan.body.position.y;
        const localX = dx * Math.cos(-fan.angle) - dy * Math.sin(-fan.angle);
        const localY = dx * Math.sin(-fan.angle) + dy * Math.cos(-fan.angle);
        if (localX < 0 || localX > 240 || Math.abs(localY) > 100) continue;
        const force = TWEAKS.fanForce * (1 - localX / 280) * fan.dir;
        Body.applyForce(body, body.position, {
          x: Math.cos(fan.angle) * force,
          y: Math.sin(fan.angle) * force,
        });
      }
    }

    for (const c of this.conveyors) {
      const eggs = this.eggs.filter((e) => !e.broken && !e.nested);
      for (const egg of eggs) {
        const body = this.getBody(egg.bodyId);
        if (!body) continue;
        const hits = Query.collides(body, [c.body]);
        if (!hits.length) continue;
        const tx = Math.cos(c.angle) * c.dir * 0.0028;
        const ty = Math.sin(c.angle) * c.dir * 0.0028;
        Body.applyForce(body, body.position, { x: tx, y: ty });
      }
    }

    for (const sticky of this.stickyBodies) {
      for (const egg of this.eggs) {
        if (egg.broken || egg.nested) continue;
        const body = this.getBody(egg.bodyId);
        if (!body) continue;
        if (!Query.collides(body, [sticky]).length) continue;
        Body.setVelocity(body, {
          x: body.velocity.x * 0.86,
          y: body.velocity.y * 0.86,
        });
      }
    }

    this.updateNesting();

    for (const egg of this.eggs) {
      if (egg.broken || egg.nested) continue;
      const body = this.getBody(egg.bodyId);
      if (!body) continue;
      if (
        body.position.y > WORLD.height + 120 ||
        body.position.x < -140 ||
        body.position.x > WORLD.width + 140
      ) {
        this.breakEgg(egg, "fell");
      }
    }
  }

  private updateNesting() {
    if (!this.nestSensor || !this.nestFloor) return;
    for (const egg of this.eggs) {
      if (egg.broken || egg.nested) continue;
      const body = this.getBody(egg.bodyId);
      if (!body) continue;

      const inSensor = Query.collides(body, [this.nestSensor]).length > 0;
      const onFloor = Query.collides(body, [this.nestFloor]).length > 0;
      const speed = Math.hypot(body.velocity.x, body.velocity.y);
      const settled =
        inSensor &&
        speed < TWEAKS.nestSettleSpeed &&
        body.velocity.y > -0.8 &&
        (onFloor || body.position.y >= this.nestFloor.position.y - EGG_RADIUS - 8);

      if (settled) {
        egg.nestHold += 1;
      } else {
        egg.nestHold = Math.max(0, egg.nestHold - 2);
      }

      if (egg.nestHold >= TWEAKS.nestHoldFrames) {
        this.pinEgg(egg, body);
      }
    }
  }

  private pinEgg(egg: EggRuntime, body: Matter.Body) {
    egg.nested = true;
    Body.setVelocity(body, { x: 0, y: 0 });
    Body.setAngularVelocity(body, 0);
    const pin = Constraint.create({
      bodyA: body,
      pointB: { x: body.position.x, y: body.position.y },
      stiffness: 0.85,
      damping: 0.2,
      length: 0,
    });
    this.pins.set(egg.id, pin);
    Composite.add(this.engine.world, pin);
    Body.setStatic(body, true);
    this.onEggNested?.(egg.id);
  }

  private getBody(id: number): Matter.Body | null {
    for (const b of Composite.allBodies(this.engine.world)) {
      if (b.id === id) return b;
    }
    return null;
  }

  getEggBody(egg: EggRuntime): Matter.Body | null {
    return this.getBody(egg.bodyId);
  }

  destroy() {
    Events.off(this.engine, "collisionStart");
    Events.off(this.engine, "collisionActive");
    Composite.clear(this.engine.world, false);
    Engine.clear(this.engine);
  }
}
