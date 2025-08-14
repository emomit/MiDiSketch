export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16)
  };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const darkenColor = (color: string, amount: number = 0.3): string => {
  const { r, g, b } = hexToRgb(color);
  const darkenR = Math.max(0, Math.floor(r * (1 - amount)));
  const darkenG = Math.max(0, Math.floor(g * (1 - amount)));
  const darkenB = Math.max(0, Math.floor(b * (1 - amount)));
  return rgbToHex(darkenR, darkenG, darkenB);
};

export const brightenColor = (color: string, amount: number = 0.2): string => {
  const { r, g, b } = hexToRgb(color);
  const brightenR = Math.min(255, Math.floor(r + (255 - r) * amount));
  const brightenG = Math.min(255, Math.floor(g + (255 - g) * amount));
  const brightenB = Math.min(255, Math.floor(b + (255 - b) * amount));
  return rgbToHex(brightenR, brightenG, brightenB);
};