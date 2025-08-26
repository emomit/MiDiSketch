import React from 'react';
import type { Track } from '../../types/track';

interface PianoRollSelectionProps {
  selectionStart: { row: number; col: number } | null;
  selectionEnd: { row: number; col: number } | null;
  isSelecting: boolean;
  cellWidth: number;
  cellHeight: number;
  tracks: Track[];
  selectedTrackId: string;
}

export const PianoRollSelection: React.FC<PianoRollSelectionProps> = ({
  selectionStart,
  selectionEnd,
  isSelecting,
  cellWidth,
  cellHeight,
  tracks,
  selectedTrackId
}) => {
  if (!isSelecting || !selectionStart || !selectionEnd) return null;

  const left = Math.min(selectionStart.col, selectionEnd.col) * cellWidth;
  const top = Math.min(selectionStart.row, selectionEnd.row) * cellHeight;
  const width = (Math.abs(selectionEnd.col - selectionStart.col) + 1) * cellWidth;
  const height = (Math.abs(selectionEnd.row - selectionStart.row) + 1) * cellHeight;

  // 選択中のトラックの色を取得
  const selectedTrack = tracks.find(track => track.id === selectedTrackId);
  const borderColor = selectedTrack?.color || '#22c55e';
  const backgroundColor = `${borderColor}10`;

  return (
    <div
      className="absolute border-2 border-dashed pointer-events-none"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 15,
        borderColor,
        backgroundColor,
      }}
    />
  );
}; 