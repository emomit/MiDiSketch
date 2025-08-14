// 履歴管理
import { useState, useCallback, useRef } from 'react';
import { Note } from '../types/note';

interface HistoryState {
  notes: Note[];
  timestamp: number;
}

export const useHistory = (maxHistorySize: number = 50) => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const saveState = useCallback((notes: Note[]) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    // 前回の状態と比較して、実際に変更があった場合のみ保存
    const lastState = history[currentIndex];
    if (lastState) {
      const lastNotes = lastState.notes;
      if (lastNotes.length === notes.length) {
        // ノート数が同じ場合、内容を比較
        const hasChanges = notes.some((note, index) => {
          const lastNote = lastNotes[index];
          return !lastNote || 
                 lastNote.id !== note.id ||
                 lastNote.pitch !== note.pitch ||
                 lastNote.startTime !== note.startTime ||
                 lastNote.duration !== note.duration ||
                 lastNote.velocity !== note.velocity ||
                 lastNote.trackId !== note.trackId;
        });
        
        if (!hasChanges) {
          return;
        }
      }
    }

    const newState: HistoryState = {
      notes: notes.map(note => ({ ...note })),
      timestamp: Date.now()
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
  }, [currentIndex, maxHistorySize, history]);

  const undo = useCallback(() => {
    if (!canUndo) return null;
    
    isUndoRedoAction.current = true;
    setCurrentIndex(prev => prev - 1);
    return history[currentIndex - 1]?.notes || null;
  }, [canUndo, currentIndex, history]);

  const redo = useCallback(() => {
    if (!canRedo) return null;
    
    isUndoRedoAction.current = true;
    setCurrentIndex(prev => prev + 1);
    return history[currentIndex + 1]?.notes || null;
  }, [canRedo, currentIndex, history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    currentIndex
  };
}; 