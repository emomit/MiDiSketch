import React from 'react';
import { Note as NoteType } from '../types/note';
import { Track } from '../types/track';
import { darkenColor, brightenColor } from '../utils/colorUtils';

interface NoteProps {
  note: NoteType;
  tracks: Track[];
  cellWidth: number;
  cellHeight: number;
  isSelected: boolean;
  isGhost?: boolean;
  onMouseDown: (noteId: string, event: React.MouseEvent, dragType: 'move' | 'resize') => void;
  onTouchStart: (noteId: string, event: React.TouchEvent, dragType: 'move' | 'resize') => void;
  onClick: (noteId: string, event: React.MouseEvent) => void;
  onContextMenu?: (noteId: string, event: React.MouseEvent) => void;
  onDelete?: (noteId: string) => void;
}

const getNoteColor = (note: NoteType, tracks: Track[], isSelected: boolean = false, isGhost: boolean = false) => {
  const track = tracks.find(t => t.id === note.trackId);
  const baseColor = track?.color || '#3b82f6';
  if (isGhost) return baseColor;
  if (isSelected) return brightenColor(baseColor, 0.3);
  return baseColor;
};

export const Note = React.memo<NoteProps>(function Note({
  note,
  tracks,
  cellWidth,
  cellHeight,
  isSelected,
  isGhost = false,
  onMouseDown,
  onTouchStart,
  onClick,
  onContextMenu,
  onDelete
}) {
  const noteColor = getNoteColor(note, tracks, isSelected, isGhost);
  const handleColor = darkenColor(noteColor, 0.4);
  const opacity = isGhost ? 0.4 : 1;
  const zIndex = isSelected ? 25 : isGhost ? 10 : 20;
  const pointerEvents = isGhost ? 'none' : 'auto';

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(note.id);
  };

  return (
    <div className="relative">
      <div
        className={`absolute rounded-l ${isGhost ? '' : 'pointer-events-auto cursor-move note-element'}`}
        style={{
          left: `${note.startTime * cellWidth}px`,
          top: `${(108 - note.pitch) * cellHeight}px`,
          width: `${note.duration * cellWidth - 8}px`,
          height: `${cellHeight - 2}px`,
          backgroundColor: noteColor,
          border: `1px solid ${noteColor}80`,
          opacity,
          zIndex,
          pointerEvents
        }}
        role="button"
        aria-pressed={isSelected}
        aria-label={`${note.noteName} 小節${note.measure} 拍${note.beat}`}
        tabIndex={0}
        onClick={(e) => onClick(note.id, e)}
        onDoubleClick={handleDoubleClick}
        onMouseDown={(e) => onMouseDown(note.id, e, 'move')}
        onTouchStart={(e) => onTouchStart(note.id, e, 'move')}
        onContextMenu={(e) => onContextMenu?.(note.id, e)}
        title={`${note.noteName} - 小節${note.measure}の${note.beat}拍目 - 長さ${note.duration}セル ${isSelected ? '(選択中)' : ''}`}
      />
      {!isGhost && (
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
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onMouseDown(note.id, e, 'resize'); }}
          onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); onTouchStart(note.id, e, 'resize'); }}
          title="長さを変更"
        />
      )}
    </div>
  );
});
