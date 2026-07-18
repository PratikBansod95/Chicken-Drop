import Matter from "matter-js";
import { EGG_SPEC, NEST_SPEC } from "../config/geometry";
import type { EggRuntime } from "../types";

const { Body, Query, Sleeping } = Matter;

/** Contact-based nest state machine; all timing is elapsed seconds, not render frames. */
export function updateNestCapture(
  eggs: EggRuntime[],
  nestSensor: Matter.Body | null,
  nestFloor: Matter.Body | null,
  getBody: (id: number) => Matter.Body | null,
  dtSec: number,
  onNested: (eggId: string) => void,
) {
  if (!nestSensor || !nestFloor) return;

  const sensorBounds = nestSensor.bounds;

  for (const egg of eggs) {
    if (egg.broken) continue;
    const body = getBody(egg.bodyId);
    if (!body) continue;

    if (egg.nested) {
      body.isSensor = true;
      body.collisionFilter.mask = 0;
      const x = Math.max(
        sensorBounds.min.x + EGG_SPEC.radius,
        Math.min(sensorBounds.max.x - EGG_SPEC.radius, body.position.x),
      );
      const y = Math.max(
        sensorBounds.min.y + EGG_SPEC.radius,
        Math.min(sensorBounds.max.y - EGG_SPEC.radius * 0.35, body.position.y),
      );
      if (x !== body.position.x || y !== body.position.y) Body.setPosition(body, { x, y });
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
      Sleeping.set(body, true);
      continue;
    }

    const fullyInside =
      body.position.x >= sensorBounds.min.x + EGG_SPEC.radius &&
      body.position.x <= sensorBounds.max.x - EGG_SPEC.radius &&
      body.position.y >= sensorBounds.min.y + EGG_SPEC.radius &&
      body.position.y <= sensorBounds.max.y - EGG_SPEC.radius * 0.35;

    if (!fullyInside) {
      egg.nestState = "outside";
      egg.settleTime = 0;
      continue;
    }

    if (egg.nestState === "outside") egg.nestState = "entered";

    const onFloor = Query.collides(body, [nestFloor]).length > 0;
    let onStableEgg = false;
    if (!onFloor) {
      for (const other of eggs) {
        if (other.id === egg.id || other.broken) continue;
        const ob = getBody(other.bodyId);
        if (!ob) continue;
        const dist = Math.hypot(body.position.x - ob.position.x, body.position.y - ob.position.y);
        const isAbove = body.position.y < ob.position.y - EGG_SPEC.radius * 0.35;
        const otherStable =
          other.nested ||
          other.nestState === "settled" ||
          Math.hypot(ob.velocity.x, ob.velocity.y) < NEST_SPEC.settleSpeed * 0.65;
        if (dist <= EGG_SPEC.radius * 2.08 && isAbove && otherStable) {
          onStableEgg = true;
          break;
        }
      }
    }

    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    const supported = onFloor || onStableEgg;
    const stable =
      supported &&
      speed <= NEST_SPEC.settleSpeed &&
      Math.abs(body.angularVelocity) <= NEST_SPEC.settleAngularSpeed;

    if (!supported) {
      egg.nestState = "entered";
      egg.settleTime = 0;
      continue;
    }

    egg.nestState = stable ? "settled" : "supported";
    egg.settleTime = stable ? egg.settleTime + dtSec : 0;

    if (egg.settleTime >= NEST_SPEC.settleDurationSec) {
      egg.nested = true;
      egg.nestState = "captured";
      body.isSensor = true;
      body.collisionFilter.mask = 0;
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
      Sleeping.set(body, true);
      onNested(egg.id);
    }
  }
}
