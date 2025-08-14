export interface Chord {
  name: string;
  intervals: number[];
  description: string;
}

export const CHORD_TYPES: Record<string, Chord> = {
  major: { name: 'Major', intervals: [4, 7], description: 'Major triad' },
  minor: { name: 'Minor', intervals: [3, 7], description: 'Minor triad' },
  dominant7: { name: 'Dom7', intervals: [4, 7, 10], description: 'Dominant seventh' },
  dominant9: { name: 'Dom9', intervals: [4, 7, 10, 14], description: 'Dominant ninth' },
  dominant11: { name: 'Dom11', intervals: [4, 7, 10, 14, 17], description: 'Dominant eleventh' },
  dominant13: { name: 'Dom13', intervals: [4, 7, 10, 14, 17, 21], description: 'Dominant thirteenth' },
  major7: { name: 'Maj7', intervals: [4, 7, 11], description: 'Major seventh' },
  major9: { name: 'Maj9', intervals: [4, 7, 11, 14], description: 'Major ninth' },
  major11: { name: 'Maj11', intervals: [4, 7, 11, 14, 17], description: 'Major eleventh' },
  major13: { name: 'Maj13', intervals: [4, 7, 11, 14, 17, 21], description: 'Major thirteenth' },
  minor7: { name: 'Min7', intervals: [3, 7, 10], description: 'Minor seventh' },
  minor9: { name: 'Min9', intervals: [3, 7, 10, 14], description: 'Minor ninth' },
  minor11: { name: 'Min11', intervals: [3, 7, 10, 14, 17], description: 'Minor eleventh' },
  minor13: { name: 'Min13', intervals: [3, 7, 10, 14, 17, 21], description: 'Minor thirteenth' },
  dim: { name: 'Dim', intervals: [3, 6], description: 'Diminished triad' },
  aug: { name: 'Aug', intervals: [4, 8], description: 'Augmented triad' },
  sus2: { name: 'Sus2', intervals: [2, 7], description: 'Suspended second' },
  sus4: { name: 'Sus4', intervals: [5, 7], description: 'Suspended fourth' },

  // 拡張（シャープ/フラット）
  'major#11': { name: 'Maj#11', intervals: [4, 7, 11, 14, 18], description: 'Major with #11' },
  'dominant#9': { name: 'Dom#9', intervals: [4, 7, 10, 15], description: 'Dominant with #9' },
  'dominantb9': { name: 'Domb9', intervals: [4, 7, 10, 13], description: 'Dominant with b9' },
  'dominant#11': { name: 'Dom#11', intervals: [4, 7, 10, 14, 18], description: 'Dominant with #11' },
  'dominantb11': { name: 'Domb11', intervals: [4, 7, 10, 14, 16], description: 'Dominant with b11' },
  'dominant#13': { name: 'Dom#13', intervals: [4, 7, 10, 14, 17, 22], description: 'Dominant with #13' },
  'dominantb13': { name: 'Domb13', intervals: [4, 7, 10, 14, 17, 20], description: 'Dominant with b13' }
}; 