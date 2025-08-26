import React, { useState } from 'react';
import { Note } from '../../types/note';
import { Track } from '../../types/track';
import { darkenColor, brightenColor } from '../../utils/colorUtils';

interface PianoRollNotesProps {
  notes: Note[];
  tracks: Track[];
  selectedTrackId: string;
  cellWidth: number;
  cellHeight: number;
  onNoteDragStart: (noteId: string, event: React.MouseEvent | React.TouchEvent, dragType: 'move' | 'resize', selectedNoteIds?: string[]) => void;
  onNoteDelete?: (noteIds: string | string[]) => void;
  selectedNotes: Set<string>;
  onNoteSelect: (noteId: string, addToSelection?: boolean) => void;
  clearSelection: () => void;
  onNoteContextMenu?: (noteId: string, event: React.MouseEvent) => void;
}

const getNoteColor = (note: Note, tracks: Track[], isSelected: boolean = false) => {
  const track = tracks.find(t => t.id === note.trackId);
  const baseColor = track?.color || '#3b82f6';
  if (isSelected) return brightenColor(baseColor, 0.3);
  return baseColor;
};

export const PianoRollNotes: React.FC<PianoRollNotesProps> = ({
  notes,
  tracks,
  selectedTrackId,
  cellWidth,
  cellHeight,
  onNoteDragStart,
  onNoteDelete,
  selectedNotes,
  onNoteSelect,
  clearSelection,
  onNoteContextMenu
}) => {
  const activeTrackNotes = notes.filter(note => note.trackId === selectedTrackId || (!note.trackId && selectedTrackId));
  const ghostNotes = notes.filter(note => !!note.trackId && note.trackId !== selectedTrackId && tracks.some(t => t.id === note.trackId));

  const selectedNoteIds = Array.from(selectedNotes);
  const handleNoteDragStart = (noteId: string, event: React.MouseEvent | React.TouchEvent, dragType: 'move' | 'resize') => {
    event.preventDefault();
    event.stopPropagation();
    // 選択されたノートをドラッグする場合は、すべての選択されたノートをドラッグ対象にする
    const noteIdsToDrag = selectedNotes.has(noteId) ? selectedNoteIds : [noteId];
    onNoteDragStart(noteId, event, dragType, noteIdsToDrag);
  };

  const createTouchEvent = (touchEvent: React.TouchEvent): React.MouseEvent => {
    const touch = touchEvent.touches[0];
    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => touchEvent.preventDefault(),
      stopPropagation: () => touchEvent.stopPropagation(),
    } as React.MouseEvent;
  };

  // ダブルクリック判定用の状態
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickNoteId, setLastClickNoteId] = useState<string | null>(null);
  const DOUBLE_CLICK_DELAY = 300; // 通常の半分（300ms）

  const handleNoteClick = (noteId: string, event: React.MouseEvent) => {
    const now = Date.now();
    const isDoubleClick = (now - lastClickTime < DOUBLE_CLICK_DELAY) && lastClickNoteId === noteId;
    
    if (isDoubleClick) {
      event.stopPropagation();
      if (selectedNotes.has(noteId) && selectedNotes.size > 1) {
        onNoteDelete?.(Array.from(selectedNotes));
      } else {
        onNoteDelete?.(noteId);
      }
      clearSelection();
      setLastClickTime(0);
      setLastClickNoteId(null);
      return;
    }

    setLastClickTime(now);
    setLastClickNoteId(noteId);
    
    const bodyFlag = (document.body as HTMLElement & { dataset: DOMStringMap }).dataset.multiSelect === '1';
    const addToSelection = bodyFlag || event.ctrlKey || event.metaKey;
    onNoteSelect(noteId, addToSelection);
  };

  return (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {ghostNotes.map((note) => {
          const track = tracks.find(t => t.id === note.trackId);
          const ghostColor = track?.color || '#6366f1';
          return (
            <div key={`ghost-${note.id}`} className="relative">
              <div
                className="absolute rounded opacity-40"
                style={{
                  left: `${note.startTime * cellWidth}px`,
                  top: `${(108 - note.pitch) * cellHeight}px`,
                  width: `${note.duration * cellWidth - 8}px`,
                  height: `${cellHeight - 2}px`,
                  backgroundColor: ghostColor,
                  border: `1px solid ${ghostColor}80`,
                  zIndex: 10,
                  pointerEvents: 'none'
                }}
                title={`${note.noteName} (${track?.name || 'Unknown Track'}) - 小節${note.measure}の${note.beat}拍目`}
              />
            </div>
          );
        })}
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
        {activeTrackNotes.map((note) => {
          const isSelected = selectedNotes.has(note.id);
          const noteColor = getNoteColor(note, tracks, isSelected);
          const handleColor = darkenColor(noteColor, 0.4);
          return (
            <div key={note.id} className="relative">
              <div
                className="absolute rounded-l pointer-events-auto cursor-move note-element"
                style={{
                  left: `${note.startTime * cellWidth}px`,
                  top: `${(108 - note.pitch) * cellHeight}px`,
                  width: `${note.duration * cellWidth - 8}px`,
                  height: `${cellHeight - 2}px`,
                  backgroundColor: noteColor,
                  zIndex: isSelected ? 25 : 20
                }}
                role="button"
                aria-pressed={isSelected}
                aria-label={`${note.noteName} 小節${note.measure} 拍${note.beat}`}
                tabIndex={0}
                onClick={(e) => handleNoteClick(note.id, e)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (selectedNotes.has(note.id) && selectedNotes.size > 1) onNoteDelete?.(Array.from(selectedNotes));
                  else onNoteDelete?.(note.id);
                  clearSelection();
                }}
                onMouseDown={(e) => handleNoteDragStart(note.id, e, 'move')}
                onTouchStart={(e) => {
                  const t = e.touches && e.touches[0];
                  if (!t) return;
                  
                  type LongPressTarget = HTMLDivElement & { _lpStart?: { x: number; y: number }; _lpTimer?: number | null };
                  const target = e.currentTarget as LongPressTarget;
                  target._lpStart = { x: t.clientX, y: t.clientY };
                  target._lpTimer = window.setTimeout(() => {
                    const start = target._lpStart;
                    const synthetic = {
                      preventDefault: () => {},
                      stopPropagation: () => {},
                      clientX: start?.x ?? t.clientX,
                      clientY: start?.y ?? t.clientY,
                    } as unknown as React.MouseEvent<HTMLDivElement>;
                    onNoteContextMenu?.(note.id, synthetic);
                  }, 500);
                }}
                onTouchMove={(e) => {
                  const target = e.currentTarget as HTMLDivElement & { _lpStart?: { x: number; y: number }; _lpTimer?: number | null };
                  const start = target._lpStart;
                  const timer = target._lpTimer;
                  if (!start || !timer) return;
                  const t = e.touches[0];
                  const dx = Math.abs(t.clientX - start.x);
                  const dy = Math.abs(t.clientY - start.y);
                  if (dx > 10 || dy > 10) { 
                    clearTimeout(timer); 
                    target._lpTimer = null; 
                    // ドラッグ開始
                    handleNoteDragStart(note.id, createTouchEvent(e), 'move');
                  }
                }}
                onTouchEnd={(e) => {
                  const target = e.currentTarget as HTMLDivElement & { _lpTimer?: number | null };
                  const timer = target._lpTimer;
                  if (timer) { 
                    clearTimeout(timer); 
                    target._lpTimer = null; 
                  }
                }}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onNoteContextMenu?.(note.id, e); }}
                title={`${note.noteName} - 小節${note.measure}の${note.beat}拍目 - 長さ${note.duration}セル ${isSelected ? '(選択中)' : ''}`}
              />
              <div
                className="absolute rounded-r pointer-events-auto cursor-ew-resize note-element resize-handle"
                style={{
                  left: `${(note.startTime + note.duration) * cellWidth - 8}px`,
                  top: `${(108 - note.pitch) * cellHeight}px`,
                  width: '8px',
                  height: `${cellHeight - 2}px`,
                  backgroundColor: handleColor,
                  zIndex: 21
                }}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); handleNoteDragStart(note.id, e, 'resize'); }}
                onTouchStart={(e) => { 
                  e.stopPropagation(); 
                  e.preventDefault(); 
                  handleNoteDragStart(note.id, createTouchEvent(e), 'resize'); 
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="長さを変更"
              />
            </div>
          );
        })}
      </div>
    </>
  );
}; 
