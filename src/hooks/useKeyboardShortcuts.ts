import { useEffect, useCallback } from 'react';
import { Note } from '../types/note';
import { quantize, TPB } from '../utils/timeUtils';

interface KeyboardShortcutsProps {
  notes: Note[];
  selectedNotes: Set<string>;
  onUpdateNotes: (updates: Array<{ noteId: string; updates: any }>) => void;
  onDeleteNotes: (noteIds: string[]) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  quantum: number;
  cellWidth: number;
}

export const useKeyboardShortcuts = ({
  notes,
  selectedNotes,
  onUpdateNotes,
  onDeleteNotes,
  onSelectAll,
  onClearSelection,
  onUndo,
  onRedo,
  quantum,
  cellWidth
}: KeyboardShortcutsProps) => {
  
  const getSelectedNoteIds = useCallback(() => {
    return Array.from(selectedNotes);
  }, [selectedNotes]);

  const getSelectedNotes = useCallback(() => {
    return notes.filter(note => selectedNotes.has(note.id));
  }, [notes, selectedNotes]);





  const deleteSelected = useCallback(() => {
    const selectedNoteIds = getSelectedNoteIds();
    if (selectedNoteIds.length > 0) {
      onDeleteNotes(selectedNoteIds);
    }
  }, [getSelectedNoteIds, onDeleteNotes]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // フォーム要素がフォーカスされている場合は無視
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement || 
        event.target instanceof HTMLSelectElement) {
      return;
    }

    const quantumTicks = quantum * TPB / 16; // 量子化グリッドをtickに変換

    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        deleteSelected();
        break;





      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onSelectAll();
        }
        break;

      case 'Escape':
        event.preventDefault();
        onClearSelection();
        break;

      case 'z':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onUndo?.();
        }
        break;

      case 'y':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onRedo?.();
        }
        break;
    }
  }, [quantum, deleteSelected, onSelectAll, onClearSelection, onUndo, onRedo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    deleteSelected
  };
}; 