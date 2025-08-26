export function radialPositions(
  center: { x: number; y: number }, 
  radius: number, 
  count: number, 
  startDeg: number = -90
): Array<{ x: number; y: number }> {
  const rad = Math.PI / 180;
  return Array.from({ length: count }, (_, i) => {
    const ang = startDeg + (i * 360 / count);
    return { 
      x: center.x + radius * Math.cos(ang * rad), 
      y: center.y + radius * Math.sin(ang * rad) 
    };
  });
}

export function calculateChordMenuLayout(
  center: { x: number; y: number },
  itemCount: number,
  baseRadius: number = 60
): Array<{ x: number; y: number; angle: number }> {
  if (itemCount <= 1) {
    return [{ x: center.x, y: center.y, angle: 0 }];
  }

  const positions = radialPositions(center, baseRadius, itemCount);
  return positions.map((pos, i) => ({
    x: pos.x,
    y: pos.y,
    angle: -90 + (i * 360 / itemCount)
  }));
}
