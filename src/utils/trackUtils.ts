import { Track } from '../types/track';
import { Note } from '../types/note';


export const getNotesForTrack = (notes: Note[], trackId: string): Note[] => {
  return notes.filter(note => note.trackId === trackId);
};

export const getGhostNotes = (notes: Note[], selectedTrackId: string, tracks: Track[]): Array<Note & { trackColor: string }> => {
  return notes
    .filter(note => note.trackId !== selectedTrackId)
    .map(note => {
      const track = tracks.find(t => t.id === note.trackId);
      return {
        ...note,
        trackColor: track?.color || '#6366f1'
      };
    });
};


export const TRACK_COLORS = [
  '#ef4444', // vivid red-500
  '#f97316', // vivid orange-500
  '#f59e0b', // vivid amber-500
  '#84cc16', // vivid lime-500
  '#10b981', // vivid emerald-500
  '#06b6d4', // vivid cyan-500
  '#3b82f6', // vivid blue-500
  '#8b5cf6', // vivid violet-500
  '#a855f7', // vivid purple-500
  '#ec4899', // vivid pink-500
  '#f43f5e', // vivid rose-500
  '#14b8a6', // vivid teal-500
];


export const getNextTrackColor = (trackIndex: number): string => {
  return TRACK_COLORS[trackIndex % TRACK_COLORS.length];
};