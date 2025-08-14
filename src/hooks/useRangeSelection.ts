import { useState, useCallback, useRef } from 'react';
import { Note } from '../types/note';

interface RangeSelectionState {
  isSelecting: boolean;
  selectionStart: { row: number; col: number } | null;
  selectionEnd: { row: number; col: number } | null;
}

export const useRangeSelection = () => {
  const [state, setState] = useState<RangeSelectionState>({
    isSelecting: false,
    selectionStart: null,
    selectionEnd: null
  });

  const rafIdRef = useRef<number | null>(null);
  const pendingRef = useRef<{ row: number; col: number } | null>(null);

  const startRangeSelection = useCallback((row: number, col: number) => {
    setState({ isSelecting: true, selectionStart: { row, col }, selectionEnd: { row, col } });
  }, []);

  const flush = useCallback(() => {
    if (!pendingRef.current) return;
    const { row, col } = pendingRef.current;
    pendingRef.current = null;
    setState(prev => (prev.isSelecting ? { ...prev, selectionEnd: { row, col } } : prev));
    rafIdRef.current = null;
  }, []);

  const updateRangeSelection = useCallback((row: number, col: number) => {
    pendingRef.current = { row, col };
    if (rafIdRef.current != null) return;
    rafIdRef.current = requestAnimationFrame(flush);
  }, [flush]);

  const endRangeSelection = useCallback((notes: Note[], onNotesSelected: (noteIds: string[]) => void, selectedTrackId?: string) => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      flush();
    }
    if (state.isSelecting && state.selectionStart && state.selectionEnd) {
      const minRow = Math.min(state.selectionStart.row, state.selectionEnd.row);
      const maxRow = Math.max(state.selectionStart.row, state.selectionEnd.row);
      const minCol = Math.min(state.selectionStart.col, state.selectionEnd.col);
      const maxCol = Math.max(state.selectionStart.col, state.selectionEnd.col);

      const notesInRange = notes.filter(note => {
        if (selectedTrackId && note.trackId !== selectedTrackId) return false;
        const noteRow = 108 - note.pitch;
        const noteStartCol = note.startTime;
        const noteEndCol = note.startTime + note.duration - 1;
        return noteRow >= minRow && noteRow <= maxRow && noteStartCol <= maxCol && noteEndCol >= minCol;
      });

      const noteIdsInRange = notesInRange.map(note => note.id);
      onNotesSelected(noteIdsInRange);
    }

    setState({ isSelecting: false, selectionStart: null, selectionEnd: null });
  }, [state.isSelecting, state.selectionStart, state.selectionEnd, flush]);

  const clearRangeSelection = useCallback(() => {
    setState({ isSelecting: false, selectionStart: null, selectionEnd: null });
  }, []);

  return {
    ...state,
    startRangeSelection,
    updateRangeSelection,
    endRangeSelection,
    clearRangeSelection
  };
}; 