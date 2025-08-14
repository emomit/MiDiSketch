// コード配置フック - コードの配置ロジックと計算
import { useCallback } from 'react';
import { Note } from '../types/note';
import { CHORD_TYPES } from '../types/chord';
import { isValidMidiNote } from '../utils/noteUtils';

export const useChordPlacement = () => {
  const placeChord = useCallback((
    rootNote: number,
    chordType: string,
    startTime: number,
    duration: number = 4,
    createNote: (pitch: number, startTime: number, duration: number, zIndex: number, trackId: string) => Note,
    trackId: string
  ) => {
    const chord = CHORD_TYPES[chordType];
    if (!chord) return [];

    const notes: Note[] = [];
    
    chord.intervals.forEach(interval => {
      const pitch = rootNote + interval;
      
      if (isValidMidiNote(pitch)) {
        const note = createNote(pitch, startTime, duration, 19, trackId);
        notes.push(note);
      }
    });

    return notes;
  }, []);

  const getChordTypeFromMenu = useCallback((direction: string): string => {
    const menuMapping: Record<string, string> = {
      'maj': 'major',
      'min': 'minor',
      'dom': 'dominant7',
      'alt': 'diminished'
    };
    return menuMapping[direction] || 'major';
  }, []);

  return {
    placeChord,
    getChordTypeFromMenu,
    chordTypes: CHORD_TYPES
  };
};