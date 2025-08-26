import { describe, it, expect } from 'vitest';
import { quantize, pxToTick, tickToPx, TPB } from '../timeUtils';

describe('timeUtils', () => {
  describe('quantize', () => {
    it('quantize to nearest grid', () => {
      expect(quantize(239, 120)).toBe(240);
      expect(quantize(241, 120)).toBe(240);
      expect(quantize(300, 120)).toBe(360);
      expect(quantize(0, 120)).toBe(0);
    });

    it('handles exact grid positions', () => {
      expect(quantize(240, 120)).toBe(240);
      expect(quantize(360, 120)).toBe(360);
    });
  });

  describe('pxToTick and tickToPx', () => {
    const pxPerBeat = 160; // 1拍 = 160px

    it('converts px to ticks correctly', () => {
      expect(pxToTick(160, pxPerBeat)).toBe(TPB); // 1拍分
      expect(pxToTick(80, pxPerBeat)).toBe(TPB / 2); // 半拍分
      expect(pxToTick(0, pxPerBeat)).toBe(0);
    });

    it('converts ticks to px correctly', () => {
      expect(tickToPx(TPB, pxPerBeat)).toBe(160); // 1拍分
      expect(tickToPx(TPB / 2, pxPerBeat)).toBe(80); // 半拍分
      expect(tickToPx(0, pxPerBeat)).toBe(0);
    });

    it('round trip conversion', () => {
      const originalPx = 123;
      const ticks = pxToTick(originalPx, pxPerBeat);
      const backToPx = tickToPx(ticks, pxPerBeat);
      expect(backToPx).toBeCloseTo(originalPx, 1);
    });
  });
});
