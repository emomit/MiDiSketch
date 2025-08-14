import React from 'react';

interface PianoRollSelectionProps {
  selectionStart: { row: number; col: number } | null;
  selectionEnd: { row: number; col: number } | null;
  isSelecting: boolean;
  cellWidth: number;
  cellHeight: number;
}

export const PianoRollSelection: React.FC<PianoRollSelectionProps> = ({
  selectionStart,
  selectionEnd,
  isSelecting,
  cellWidth,
  cellHeight
}) => {
  if (!isSelecting || !selectionStart || !selectionEnd) return null;

  const left = Math.min(selectionStart.col, selectionEnd.col) * cellWidth;
  const top = Math.min(selectionStart.row, selectionEnd.row) * cellHeight;
  const width = (Math.abs(selectionEnd.col - selectionStart.col) + 1) * cellWidth;
  const height = (Math.abs(selectionEnd.row - selectionStart.row) + 1) * cellHeight;

  return (
    <div
      className="absolute border-2 border-dashed pointer-events-none"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 15,
        borderColor: '#22c55e',
        backgroundColor: '#22c55e10',
      }}
    />
  );
}; 