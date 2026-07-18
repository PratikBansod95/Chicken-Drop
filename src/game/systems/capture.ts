import Matter from "matter-js";
import { EGG_RADIUS } from "../types";
import { TWEAKS } from "../tweaks";
import type { EggRuntime } from "../types";

const { Body, Composite, Constraint, Query } = Matter;

/**
 * Nest settle/pin — egg must be in the bowl sensor AND
 * (touching basket-floor OR resting on an already-nested egg).
 */
export function updateNestCapture(
  engine: Matter.Engine,
  eggs: EggRuntime[],
  nestSensor: Matter.Body | null,
  nestFloor: Matter.Body | null,
  pins: Map<string, Matter.Constraint>,
  getBody: (id: number) => Matter.Body | null,
  onNested: (eggId: string) => void,
) {
  if (!nestSensor || !nestFloor) return;

  for (const egg of eggs) {
    if (egg.broken || egg.nested) continue;
    const body = getBody(egg.bodyId);
    if (!body) continue;

    const inSensor = Query.collides(body, [nestSensor]).length > 0;
    if (!inSensor) {
      egg.nestHold = Math.max(0, egg.nestHold - 2);
      continue;
    }

    const onFloor = Query.collides(body, [nestFloor]).length > 0;
    let onNestedEgg = false;
    if (!onFloor) {
      for (const other of eggs) {
        if (other.id === egg.id || other.broken || !other.nested) continue;
        const ob = getBody(other.bodyId);
        if (!ob) continue;
        const dist = Math.hypot(body.position.x - ob.position.x, body.position.y - ob.position.y);
        if (dist < EGG_RADIUS * 2.2 && body.position.y >= ob.position.y - 6) {
          onNestedEgg = true;
          break;
        }
      }
    }

    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    const settled =
      (onFloor || onNestedEgg) &&
      speed < TWEAKS.nestSettleSpeed &&
      body.velocity.y > -1.0;

    if (settled) egg.nestHold += 1;
    else egg.nestHold = Math.max(0, egg.nestHold - 1);

    if (egg.nestHold >= TWEAKS.nestHoldFrames) {
      egg.nested = true;
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
      const settleY = Math.min(body.position.y, nestFloor.position.y - EGG_RADIUS * 0.85);
      Body.setPosition(body, { x: body.position.x, y: settleY });
      const pin = Constraint.create({
        bodyA: body,
        pointB: { x: body.position.x, y: body.position.y },
        stiffness: 0.9,
        damping: 0.25,
        length: 0,
      });
      pins.set(egg.id, pin);
      Composite.add(engine.world, pin);
      Body.setStatic(body, true);
      onNested(egg.id);
    }
  }
}
