import Matter from "matter-js";
import { WORLD } from "./types";
import type {
  EggRuntime,
  FailReason,
  FixedObject,
  InkStroke,
  LevelData,
  PlacedKind,
  PlacedTool,
  Vec2,
} from "./types";
import { EGG_SPEC, INK_SPEC } from "./config/geometry";
import { createNestBodies } from "./entities/nest";
import { TWEAKS } from "./tweaks";
import { updateNestCapture } from "./systems/capture";

const { Engine, Bodies, Body, Composite, Events, Query } = Matter;

export type { InkStroke, PlacedTool };

export class PhysicsWorld {
  readonly engine: Matter.Engine;
  private nestSensor: Matter.Body | null = null;
  private nestFloor: Matter.Body | null = null;
  eggs: EggRuntime[] = [];
  private inkBodies: Matter.Body[] = [];
  private fanBodies: { body: Matter.Body; angle: number; dir: number }[] = [];
  private stickyBodies: Matter.Body[] = [];
  private conveyors: { body: Matter.Body; dir: number; angle: number }[] = [];
  private rotating: { body: Matter.Body; speed: number }[] = [];
  private bodyById = new Map<number, Matter.Body>();

  onEggNested: ((eggId: string) => void) | null = null;
  onEggBroken: ((eggId: string, reason: FailReason, at: Vec2) => void) | null = null;
  onBounce: ((strength: number) => void) | null = null;

  constructor() {
    this.engine = Engine.create({
      gravity: { x: 0, y: 0.88, scale: 0.001 },
      enableSleeping: true,
    });
  }

  resetLevel(level: LevelData, strokes: InkStroke[], placed: PlacedTool[]) {
    Composite.clear(this.engine.world, false);
    this.engine.world.gravity.y = 0.88;
    this.eggs = [];
    this.inkBodies = [];
    this.fanBodies = [];
    this.stickyBodies = [];
    this.conveyors = [];
    this.rotating = [];
    this.bodyById.clear();

    this.addBounds();
    this.addBasket(level.basket);
    for (const obj of level.fixedObjects) this.addProp(obj);
    for (const obj of placed) this.addProp(obj);
    this.buildInk(strokes);
    this.wireCollisions();
  }

  private track(body: Matter.Body) {
    this.bodyById.set(body.id, body);
    return body;
  }

  private addBounds() {
    const t = 80;
    const bounds = [
      Bodies.rectangle(WORLD.width / 2, -t / 2, WORLD.width + 400, t, {
        isStatic: true,
        label: "wall",
      }),
      Bodies.rectangle(WORLD.width / 2, WORLD.height + t / 2 + 40, WORLD.width + 400, t, {
        isStatic: true,
        label: "floor-kill",
      }),
      Bodies.rectangle(-t / 2, WORLD.height / 2, t, WORLD.height + 400, {
        isStatic: true,
        label: "wall",
      }),
      Bodies.rectangle(WORLD.width + t / 2, WORLD.height / 2, t, WORLD.height + 400, {
        isStatic: true,
        label: "wall",
      }),
    ];
    bounds.forEach((body) => this.track(body));
    Composite.add(this.engine.world, bounds);
  }

  private addBasket(pos: Vec2) {
    const nest = createNestBodies(pos);
    this.nestSensor = nest.sensor;
    this.nestFloor = nest.floor;
    Object.values(nest).forEach((body) => this.track(body));
    Composite.add(this.engine.world, Object.values(nest));
  }

  private addProp(obj: FixedObject | PlacedTool) {
    const common = {
      isStatic: true,
      angle: obj.angle,
      friction: 0.5,
      restitution: 0.2,
      label: obj.type as string,
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
        this.conveyors.push({ body, dir: obj.dir ?? 1, angle: obj.angle });
        break;
      case "fan":
        body = Bodies.rectangle(obj.x, obj.y, obj.w * 0.8, obj.h * 0.8, {
          ...common,
          isSensor: true,
        });
        this.fanBodies.push({ body, angle: obj.angle, dir: obj.dir ?? 1 });
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

    this.track(body);
    Composite.add(this.engine.world, body);
    obj.bodyIds = [body.id];
  }

  buildInk(strokes: InkStroke[]) {
    for (const body of this.inkBodies) {
      Composite.remove(this.engine.world, body);
      this.bodyById.delete(body.id);
    }
    this.inkBodies = [];
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;

      let runStart = stroke.points[0];
      let previous = stroke.points[0];
      let runAngle: number | null = null;

      const addSegment = (end: Vec2) => {
        const dx = end.x - runStart.x;
        const dy = end.y - runStart.y;
        const len = Math.hypot(dx, dy);
        if (len < 3) return;
        const segment = this.track(
          Bodies.rectangle(
            (runStart.x + end.x) / 2,
            (runStart.y + end.y) / 2,
            len,
            INK_SPEC.physicsThickness,
            {
              isStatic: true,
              angle: Math.atan2(dy, dx),
              friction: 0.075,
              frictionStatic: 0.35,
              restitution: 0.14,
              chamfer: { radius: INK_SPEC.physicsThickness / 2 },
              label: "ink",
            },
          ),
        );
        this.inkBodies.push(segment);
        Composite.add(this.engine.world, segment);
      };

      for (let i = 1; i < stroke.points.length; i++) {
        const point = stroke.points[i];
        const angle = Math.atan2(point.y - previous.y, point.x - previous.x);
        if (runAngle == null) runAngle = angle;
        const turn = Math.abs(
          Math.atan2(Math.sin(angle - runAngle), Math.cos(angle - runAngle)),
        );
        const length = Math.hypot(point.x - runStart.x, point.y - runStart.y);
        if (turn > INK_SPEC.mergeAngleRad || length > INK_SPEC.maxSegmentLength) {
          addSegment(previous);
          runStart = previous;
          runAngle = angle;
        }
        previous = point;
      }
      addSegment(previous);
    }
  }

  canSpawnEgg(at: Vec2): boolean {
    const probe = Bodies.circle(at.x, at.y, EGG_SPEC.spawnClearance, {
      isSensor: true,
    });
    const blocking = Composite.allBodies(this.engine.world).filter(
      (body) => !body.isSensor && body.label !== "wall" && body.label !== "floor-kill",
    );
    return Query.collides(probe, blocking).length === 0;
  }

  spawnEgg(at: Vec2, id: string): EggRuntime {
    const body = this.track(Bodies.circle(at.x, at.y, EGG_SPEC.radius, {
      label: `egg:${id}`,
      restitution: EGG_SPEC.restitution,
      friction: EGG_SPEC.friction,
      frictionStatic: EGG_SPEC.frictionStatic,
      frictionAir: EGG_SPEC.frictionAir,
      density: EGG_SPEC.density,
      sleepThreshold: 90,
      slop: 0.03,
    }));
    Composite.add(this.engine.world, body);
    const egg: EggRuntime = {
      id,
      bodyId: body.id,
      nested: false,
      broken: false,
      nestState: "outside",
      settleTime: 0,
    };
    this.eggs.push(egg);
    return egg;
  }

  private wireCollisions() {
    Events.off(this.engine, "collisionStart");
    Events.off(this.engine, "collisionActive");

    Events.on(this.engine, "collisionStart", (e) => {
      for (const pair of e.pairs) this.handlePair(pair, true);
    });
    Events.on(this.engine, "collisionActive", (e) => {
      for (const pair of e.pairs) this.handlePair(pair, false);
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

    const kind = other.label as PlacedKind | string;
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
      if (impact > 4.5) this.onBounce?.(impact);
      if (kind === "ink" || kind === "basket-rim") {
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
    const at = body
      ? { x: body.position.x, y: body.position.y }
      : { x: 0, y: 0 };
    if (body) {
      Composite.remove(this.engine.world, body);
      this.bodyById.delete(body.id);
    }
    this.onEggBroken?.(egg.id, reason, at);
  }

  step(dtMs: number) {
    const dtSec = dtMs / 1000;

    for (const r of this.rotating) {
      Body.setAngle(r.body, r.body.angle + r.speed * dtSec);
      Body.setAngularVelocity(r.body, 0);
    }

    for (const fan of this.fanBodies) {
      for (const egg of this.eggs.filter((e) => !e.broken && !e.nested)) {
        const body = this.getBody(egg.bodyId);
        if (!body) continue;
        const dx = body.position.x - fan.body.position.x;
        const dy = body.position.y - fan.body.position.y;
        const localX = dx * Math.cos(-fan.angle) - dy * Math.sin(-fan.angle);
        const localY = dx * Math.sin(-fan.angle) + dy * Math.cos(-fan.angle);
        if (localX < 0 || localX > 240 || Math.abs(localY) > 100) continue;
        const force = TWEAKS.fanForce * (1 - localX / 280) * Math.abs(fan.dir || 1);
        Body.applyForce(body, body.position, {
          x: Math.cos(fan.angle) * force,
          y: Math.sin(fan.angle) * force,
        });
      }
    }

    for (const c of this.conveyors) {
      for (const egg of this.eggs.filter((e) => !e.broken && !e.nested)) {
        const body = this.getBody(egg.bodyId);
        if (!body || !Query.collides(body, [c.body]).length) continue;
        Body.applyForce(body, body.position, {
          x: Math.cos(c.angle) * c.dir * 0.0028,
          y: Math.sin(c.angle) * c.dir * 0.0028,
        });
      }
    }

    for (const sticky of this.stickyBodies) {
      for (const egg of this.eggs) {
        if (egg.broken || egg.nested) continue;
        const body = this.getBody(egg.bodyId);
        if (!body || !Query.collides(body, [sticky]).length) continue;
        const damping = Math.pow(0.86, dtSec * 60);
        Body.setVelocity(body, {
          x: body.velocity.x * damping,
          y: body.velocity.y * damping,
        });
      }
    }

    Engine.update(this.engine, dtMs);

    const rollingSurfaces = Composite.allBodies(this.engine.world).filter((body) =>
      ["ink", "basket-floor", "pad", "spring", "conveyor", "sticky"].includes(body.label),
    );
    for (const egg of this.eggs) {
      if (egg.broken || egg.nested) continue;
      const body = this.getBody(egg.bodyId);
      if (!body) continue;

      const touchingSurface = Query.collides(body, rollingSurfaces).length > 0;
      if (touchingSurface) {
        const target = Math.max(
          -EGG_SPEC.maxAngularSpeed,
          Math.min(EGG_SPEC.maxAngularSpeed, body.velocity.x / EGG_SPEC.radius),
        );
        Body.setAngularVelocity(
          body,
          body.angularVelocity + (target - body.angularVelocity) * 0.24,
        );
      } else {
        Body.setAngularVelocity(body, body.angularVelocity * EGG_SPEC.angularDamping);
      }
    }

    updateNestCapture(
      this.eggs,
      this.nestSensor,
      this.nestFloor,
      (id) => this.getBody(id),
      dtSec,
      (id) => this.onEggNested?.(id),
    );

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

  private getBody(id: number): Matter.Body | null {
    return this.bodyById.get(id) ?? null;
  }

  getEggBody(egg: EggRuntime): Matter.Body | null {
    return this.getBody(egg.bodyId);
  }

  getBodyById(id: number): Matter.Body | null {
    return this.getBody(id);
  }

  destroy() {
    Events.off(this.engine, "collisionStart");
    Events.off(this.engine, "collisionActive");
    Composite.clear(this.engine.world, false);
    Engine.clear(this.engine);
  }
}
