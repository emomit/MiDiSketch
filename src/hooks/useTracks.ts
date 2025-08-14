import { useState, useCallback } from 'react';
import { Track } from '../types/track';
import { Note } from '../types/note';
import { getNotesForTrack, getGhostNotes } from '../utils/trackUtils';

const DEFAULT_TRACKS: Track[] = [
  {
    id: 'track-1',
    name: 'Track 1',
    wave: 'sine',
    color: '#3b82f6',
    volume: 0.6,
    isMuted: false,
    isSolo: false
  },
  {
    id: 'track-2',
    name: 'Track 2',
    wave: 'square',
    color: '#ef4444',
    volume: 0.6,
    isMuted: false,
    isSolo: false
  },
  {
    id: 'track-3',
    name: 'Track 3',
    wave: 'sawtooth',
    color: '#10b981',
    volume: 0.6,
    isMuted: false,
    isSolo: false
  }
];

const getNextTrackColor = (trackIndex: number): string => {
  const colors = [
    '#3b82f6', // blue-500
    '#ef4444', // red-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
  ];

  return colors[trackIndex % colors.length];
};

export const useTracks = () => {
  const [tracks, setTracks] = useState<Track[]>(DEFAULT_TRACKS);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('track-1');

  const setSelectedTrackIdSafe = useCallback((trackId: string) => {
    setSelectedTrackId(trackId);
  }, []);

  const addTrack = useCallback(() => {
    const newTrack: Track = {
      id: `track-${Date.now()}`,
      name: `Track ${tracks.length + 1}`,
      wave: 'sine',
      color: getNextTrackColor(tracks.length),
      volume: 0.6,
      isMuted: false,
      isSolo: false
    };
    setTracks(prev => [...prev, newTrack]);
    setSelectedTrackIdSafe(newTrack.id);
  }, [tracks.length, setSelectedTrackIdSafe]);

  const deleteTrack = useCallback((trackId: string) => {
    if (tracks.length <= 1) return; // 最低1つは残す
    setTracks(prev => prev.filter(t => t.id !== trackId));
    if (selectedTrackId === trackId) {
      setSelectedTrackIdSafe(tracks[0]?.id || '');
    }
  }, [tracks, selectedTrackId, setSelectedTrackIdSafe]);

  const updateTrack = useCallback((trackId: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, ...updates } : t
    ));
  }, []);

  const moveTrack = useCallback((fromIndex: number, toIndex: number) => {
    setTracks(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const setAllTracks = useCallback((nextTracks: Track[], nextSelectedTrackId: string) => {
    setTracks(nextTracks);
    setSelectedTrackId(nextSelectedTrackId);
  }, []);

  // ノート関連のヘルパー関数
  const getActiveTrackNotes = useCallback((notes: Note[]) => {
    return getNotesForTrack(notes, selectedTrackId);
  }, [selectedTrackId]);

  const getGhostNotesForDisplay = useCallback((notes: Note[]) => {
    return getGhostNotes(notes, selectedTrackId, tracks);
  }, [selectedTrackId, tracks]);

  const getSelectedTrack = useCallback(() => {
    return tracks.find(track => track.id === selectedTrackId);
  }, [tracks, selectedTrackId]);

  return {
    tracks,
    selectedTrackId,
    setSelectedTrackId: setSelectedTrackIdSafe,
    addTrack,
    deleteTrack,
    updateTrack,
    moveTrack,
    setAllTracks,
    getActiveTrackNotes,
    getGhostNotesForDisplay,
    getSelectedTrack
  };
};