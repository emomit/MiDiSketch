import { Note } from './note';

export interface Track {
  id: string;
  name: string;
  wave: 'sine' | 'square' | 'sawtooth' | 'triangle';
  color: string;
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
}

export interface TrackNote extends Note {
  trackId: string;
} 