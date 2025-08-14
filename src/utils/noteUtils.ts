export const getNoteName = (midiNote: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor((midiNote - 12) / 12);
  const noteName = noteNames[midiNote % 12];
  return `${noteName}${octave}`;
};

export const midiToFrequency = (midiNote: number): number => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

export const isValidMidiNote = (midiNote: number): boolean => {
  return midiNote >= 21 && midiNote <= 108;
};