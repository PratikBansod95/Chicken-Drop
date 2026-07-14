import Matter from "matter-js";
import { EGG_RADIUS } from "../types";
import { TWEAKS } from "../tweaks";
import type { EggRuntime } from "../types";

const { Body, Composite, Constraint, Query } = Matter;

/** Nest settle/pin capture — wide bowl sensor + low rest threshold. */
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

  const sensorBounds = nestSensor.bounds;
  const floorY = nestFloor.position.y;

  for (const egg of eggs) {
    if (egg.broken || egg.nested) continue;
    const body = getBody(egg.bodyId);
    if (!body) continue;

    const inSensor = Query.collides(body, [nestSensor]).length > 0;
    const onFloor = Query.collides(body, [nestFloor]).length > 0;

    // Also treat “inside bowl AABB + above floor” as in-nest (helps stacked eggs)
    const inBowlBox =
      body.position.x > sensorBounds.min.x + 4 &&
      body.position.x < sensorBounds.max.x - 4 &&
      body.position.y > sensorBounds.min.y - 8 &&
      body.position.y < floorY + EGG_RADIUS + 6;

    // Supported by floor OR sitting on another already-nested / nearly-still egg
    let onSupport = onFloor || body.position.y >= floorY - EGG_RADIUS - 14;
    if (!onSupport) {
      for (const other of eggs) {
        if (other.id === egg.id || other.broken) continue;
        const ob = getBody(other.bodyId);
        if (!ob) continue;
        const dist = Math.hypot(body.position.x - ob.position.x, body.position.y - ob.position.y);
        if (dist < EGG_RADIUS * 2.15 && body.position.y > ob.position.y - 4) {
          if (other.nested || Math.hypot(ob.velocity.x, ob.velocity.y) < TWEAKS.nestSettleSpeed) {
            onSupport = true;
            break;
          }
        }
      }
    }

    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    const settled =
      (inSensor || inBowlBox) &&
      onSupport &&
      speed < TWEAKS.nestSettleSpeed &&
      body.velocity.y > -1.2;

    if (settled) egg.nestHold += 1;
    else egg.nestHold = Math.max(0, egg.nestHold - 1);

    if (egg.nestHold >= TWEAKS.nestHoldFrames) {
      egg.nested = true;
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
      // Settle slightly into the bowl so the stack stays neat
      const settleY = Math.min(body.position.y, floorY - EGG_RADIUS * 0.85);
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
