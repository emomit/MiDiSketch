import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  selectedNotes: Set<string>;
  deleteMultipleNotes: (noteIds: string[]) => void;
  clearSelection: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;
}

export const useKeyboardShortcuts = ({
  selectedNotes,
  deleteMultipleNotes,
  clearSelection,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onSelectAll
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNotes.size > 0) {
        e.preventDefault();
        const selectedNoteIds = Array.from(selectedNotes);
        deleteMultipleNotes(selectedNoteIds);
        clearSelection();
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
        return;
      }
      
      // Ctrl/Cmd + Z: Undo
      if (isCtrlOrCmd && e.key === 'z' && onUndo) {
        e.preventDefault();
        onUndo();
        return;
      }
      
      // Ctrl/Cmd + Y: Redo
      if (isCtrlOrCmd && e.key === 'y' && onRedo) {
        e.preventDefault();
        onRedo();
        return;
      }
      
      // Ctrl/Cmd + C: Copy
      if (isCtrlOrCmd && e.key === 'c' && onCopy) {
        e.preventDefault();
        onCopy();
        return;
      }
      
      // Ctrl/Cmd + V: Paste
      if (isCtrlOrCmd && e.key === 'v' && onPaste) {
        e.preventDefault();
        onPaste();
        return;
      }
      
      // Ctrl/Cmd + A: Select All
      if (isCtrlOrCmd && e.key === 'a' && onSelectAll) {
        e.preventDefault();
        onSelectAll();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedNotes, 
    deleteMultipleNotes, 
    clearSelection, 
    onUndo, 
    onRedo, 
    onCopy, 
    onPaste, 
    onSelectAll
  ]);
}; 