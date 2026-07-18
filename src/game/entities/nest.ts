import Matter from "matter-js";
import { assets } from "../assets/bank";
import { NEST_SPEC } from "../config/geometry";
import type { Vec2 } from "../types";

const { Bodies } = Matter;

export interface NestBodies {
  floor: Matter.Body;
  leftWall: Matter.Body;
  rightWall: Matter.Body;
  sensor: Matter.Body;
}

export function createNestBodies(pos: Vec2): NestBodies {
  const common = {
    isStatic: true,
    friction: 0.88,
    frictionStatic: 1,
    restitution: 0.04,
    label: "basket-rim",
  };
  const wallX = NEST_SPEC.cavityWidth / 2 + NEST_SPEC.wallThickness / 2;

  const leftWall = Bodies.rectangle(
    pos.x - wallX,
    pos.y,
    NEST_SPEC.wallThickness,
    NEST_SPEC.wallHeight,
    {
      ...common,
      angle: -NEST_SPEC.wallAngle,
      chamfer: { radius: 7 },
    },
  );
  const rightWall = Bodies.rectangle(
    pos.x + wallX,
    pos.y,
    NEST_SPEC.wallThickness,
    NEST_SPEC.wallHeight,
    {
      ...common,
      angle: NEST_SPEC.wallAngle,
      chamfer: { radius: 7 },
    },
  );
  const floor = Bodies.rectangle(
    pos.x,
    pos.y + NEST_SPEC.floorOffsetY,
    NEST_SPEC.floorWidth,
    NEST_SPEC.wallThickness,
    {
      ...common,
      label: "basket-floor",
      chamfer: { radius: 6 },
    },
  );
  const sensor = Bodies.rectangle(
    pos.x,
    pos.y + NEST_SPEC.sensorOffsetY,
    NEST_SPEC.sensorWidth,
    NEST_SPEC.sensorHeight,
    {
      isStatic: true,
      isSensor: true,
      label: "nest-sensor",
    },
  );

  return { floor, leftWall, rightWall, sensor };
}

function drawNestSprite(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  key: "nestBack" | "nestFront" | "nestShadow",
) {
  const img = assets.get(key);
  if (!img) return false;
  ctx.drawImage(
    img,
    pos.x - NEST_SPEC.spriteWidth / 2,
    pos.y + NEST_SPEC.spriteOffsetY,
    NEST_SPEC.spriteWidth,
    NEST_SPEC.spriteHeight,
  );
  return true;
}

export function drawNestBack(ctx: CanvasRenderingContext2D, pos: Vec2) {
  drawNestSprite(ctx, pos, "nestShadow");
  if (drawNestSprite(ctx, pos, "nestBack")) return;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.fillStyle = "#8b4e23";
  ctx.beginPath();
  ctx.ellipse(0, 20, 174, 72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4f2d19";
  ctx.beginPath();
  ctx.ellipse(0, -12, 145, 48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawNestFront(ctx: CanvasRenderingContext2D, pos: Vec2) {
  if (drawNestSprite(ctx, pos, "nestFront")) return;

  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.strokeStyle = "#b56c2d";
  ctx.lineWidth = 30;
  ctx.beginPath();
  ctx.moveTo(-158, -4);
  ctx.quadraticCurveTo(0, 54, 158, -4);
  ctx.stroke();
  ctx.restore();
}

