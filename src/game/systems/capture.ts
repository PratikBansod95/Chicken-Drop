import Matter from "matter-js";
import { EGG_RADIUS } from "../types";
import { TWEAKS } from "../tweaks";
import type { EggRuntime } from "../types";

const { Body, Composite, Constraint, Query } = Matter;

/** Nest settle/pin capture — rim + floor + rest threshold. */
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
    const onFloor = Query.collides(body, [nestFloor]).length > 0;
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    const settled =
      inSensor &&
      speed < TWEAKS.nestSettleSpeed &&
      body.velocity.y > -0.8 &&
      (onFloor || body.position.y >= nestFloor.position.y - EGG_RADIUS - 8);

    if (settled) egg.nestHold += 1;
    else egg.nestHold = Math.max(0, egg.nestHold - 2);

    if (egg.nestHold >= TWEAKS.nestHoldFrames) {
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
      pins.set(egg.id, pin);
      Composite.add(engine.world, pin);
      Body.setStatic(body, true);
      onNested(egg.id);
    }
  }
}
