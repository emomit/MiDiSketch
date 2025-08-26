export const TPB = 480; // ticks per beat

export function pxToTick(px: number, pxPerBeat: number): number {
  const ticksPerPx = TPB / pxPerBeat;
  return Math.round(px * ticksPerPx);
}

export function tickToPx(tick: number, pxPerBeat: number): number {
  const pxPerTick = pxPerBeat / TPB;
  return tick * pxPerTick;
}

export function quantize(tick: number, grid: number): number {
  return Math.round(tick / grid) * grid;
}

export function quantizePx(px: number, pxPerBeat: number, grid: number): number {
  const tick = pxToTick(px, pxPerBeat);
  const quantizedTick = quantize(tick, grid);
  return tickToPx(quantizedTick, pxPerBeat);
}
