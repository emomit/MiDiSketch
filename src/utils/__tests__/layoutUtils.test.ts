import { describe, it, expect } from 'vitest';
import { radialPositions, calculateChordMenuLayout } from '../layoutUtils';

describe('layoutUtils', () => {
  describe('radialPositions', () => {
    it('creates correct number of positions', () => {
      const center = { x: 100, y: 100 };
      const radius = 50;
      const count = 4;
      
      const positions = radialPositions(center, radius, count);
      expect(positions).toHaveLength(4);
    });

    it('positions are at correct distance from center', () => {
      const center = { x: 100, y: 100 };
      const radius = 50;
      const count = 4;
      
      const positions = radialPositions(center, radius, count);
      
      positions.forEach(pos => {
        const distance = Math.sqrt(
          Math.pow(pos.x - center.x, 2) + Math.pow(pos.y - center.y, 2)
        );
        expect(distance).toBeCloseTo(radius, 1);
      });
    });

    it('handles single item', () => {
      const center = { x: 100, y: 100 };
      const radius = 50;
      
      const positions = radialPositions(center, radius, 1);
      expect(positions).toHaveLength(1);
      expect(positions[0].x).toBeCloseTo(center.x, 1);
      expect(positions[0].y).toBeCloseTo(center.y - radius, 1); // startDeg = -90
    });
  });

  describe('calculateChordMenuLayout', () => {
    it('creates layout with correct structure', () => {
      const center = { x: 100, y: 100 };
      const itemCount = 3;
      
      const layout = calculateChordMenuLayout(center, itemCount);
      expect(layout).toHaveLength(3);
      
      layout.forEach(item => {
        expect(item).toHaveProperty('x');
        expect(item).toHaveProperty('y');
        expect(item).toHaveProperty('angle');
      });
    });

    it('handles single item', () => {
      const center = { x: 100, y: 100 };
      
      const layout = calculateChordMenuLayout(center, 1);
      expect(layout).toHaveLength(1);
      expect(layout[0].x).toBe(center.x);
      expect(layout[0].y).toBe(center.y);
      expect(layout[0].angle).toBe(0);
    });
  });
});
