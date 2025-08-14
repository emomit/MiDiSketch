import React from 'react';

interface GridCellProps {
    cellId: string;
    row: number;
    col: number;
    cellWidth: number;
    cellHeight: number;
    noteName: string;
    cellsPerMeasure: number;
    isSelected: boolean;
    onCellClick: (cellId: string) => void;
}

export const GridCell = React.memo(({
    cellId,
    row,
    col,
    cellWidth,
    cellHeight,
    noteName,
    cellsPerMeasure,
    isSelected,
    onCellClick
}: GridCellProps) => {
    const measureNumber = Math.floor(col / cellsPerMeasure) + 1;
    
    return (
        <button
            className={`transition-colors border border-slate-800 bg-slate-900 hover:bg-slate-700 ${
                isSelected ? 'bg-slate-700' : ''
            }`}
            style={{
                transform: 'translateZ(0)',
                willChange: 'transform',
                width: `${cellWidth}px`,
                height: `${cellHeight}px`
            }}
            onClick={() => onCellClick(cellId)}
            title={`${noteName} - Row: ${row}, Column: ${col}, Measure: ${measureNumber}`}
        />
    );
});

GridCell.displayName = 'GridCell';