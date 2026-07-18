import { SIMULATION } from "../config/geometry";

export class FixedStepClock {
  private accumulatorMs = 0;

  reset() {
    this.accumulatorMs = 0;
  }

  advance(frameMs: number, step: () => void): number {
    this.accumulatorMs += Math.max(0, Math.min(SIMULATION.maxFrameMs, frameMs));
    let steps = 0;
    while (
      this.accumulatorMs >= SIMULATION.fixedStepMs &&
      steps < SIMULATION.maxSubsteps
    ) {
      step();
      this.accumulatorMs -= SIMULATION.fixedStepMs;
      steps += 1;
    }
    if (steps === SIMULATION.maxSubsteps) this.accumulatorMs = 0;
    return steps;
  }
}

