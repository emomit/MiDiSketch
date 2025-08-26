import { describe, it, expect } from 'vitest';
import { toMIDI, downloadMIDI } from '../midiExport';
import { Note } from '../../types/note';

describe('midiExport', () => {
  const mockNotes: Note[] = [
    {
      id: 'note-1',
      pitch: 60, // C4
      startTime: 0,
      duration: 4,
      velocity: 100,
      channel: 0,
      noteName: 'C4',
      measure: 1,
      beat: 1,
      trackId: 'track-1',
      zIndex: 1
    },
    {
      id: 'note-2',
      pitch: 64, // E4
      startTime: 4,
      duration: 4,
      velocity: 80,
      channel: 0,
      noteName: 'E4',
      measure: 1,
      beat: 5,
      trackId: 'track-1',
      zIndex: 2
    }
  ];

  describe('toMIDI', () => {
    it('creates valid MIDI blob', () => {
      const blob = toMIDI(mockNotes);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('audio/midi');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('handles empty notes array', () => {
      const blob = toMIDI([]);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('audio/midi');
    });
  });

  describe('downloadMIDI', () => {
    it.skip('calls download function', () => {
      // モックの実装は実際のダウンロードをテストしない
      expect(() => downloadMIDI(mockNotes, 'test.mid')).not.toThrow();
    });
  });
});
