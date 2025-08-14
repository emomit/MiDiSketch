import React, { useMemo, useCallback, useEffect } from 'react';
import { useRef, useState } from 'react';
import { getNoteName } from '../../utils/noteUtils';
import { useAudio } from '../../hooks/useAudio';
import { Track } from '../../types/track';
import type { Measure } from '../../types/pianoRoll';

interface GridConfig {
  rows: number;
  measures: number;
  cellsPerMeasure: number;
  cellWidth: number;
  cellHeight: number;
  noteNameWidth: number;
}

interface PianoRollGridProps {
  gridConfig: GridConfig;
  measures: Measure[];
  timeSignature: { numerator: number; denominator: number };
  onCellClick: (cellId: string) => void;
  onCellDoubleClick: (cellId: string) => void;
  onGridMouseDown: (e: React.MouseEvent) => void;
  onGridMouseMove: (e: React.MouseEvent) => void;
  onGridMouseUp: () => void;
  isDragging: boolean;
  isSelecting: boolean;
  isChordMenuVisible?: boolean; // ChordMenu表示状態
  children?: React.ReactNode; // ノートレイヤー用
  
  tracks?: Track[];
  selectedTrackId?: string;
  playheadColumn?: number;
  
  selectionStart?: { row: number; col: number } | null;
  selectionEnd?: { row: number; col: number } | null;
  
  transpose?: number;
  onTransposeChange?: (v: number) => void;
  
  onMeasureSwap: (from: number, to: number) => void;
  onMeasureInsert: (index: number) => void;
  onMeasureDelete: (index: number) => void;
  onMeasureSelectInline: (index: number) => void;
  onMeasureCopy: (from: number, to: number) => void;
  
  alwaysShowMeasureSideButtons: boolean;
}

export const PianoRollGrid: React.FC<PianoRollGridProps> = ({
  gridConfig,
  measures,
  timeSignature,
  onCellClick,
  onCellDoubleClick,
  onGridMouseDown,
  onGridMouseMove,
  onGridMouseUp,
  isDragging,
  isSelecting,
  isChordMenuVisible = false, // デフォルト値
  children,
  tracks,
  selectedTrackId,
  playheadColumn,
  selectionStart,
  selectionEnd,
  transpose = 0,
  onTransposeChange,
  onMeasureSwap,
  onMeasureInsert,
  onMeasureDelete,
  onMeasureSelectInline,
  onMeasureCopy,
  alwaysShowMeasureSideButtons,
}) => {
  const { playNote } = useAudio();
  const [draggedMeasure, setDraggedMeasure] = useState<number | null>(null);
  const overMeasureRef = useRef<number | null>(null);
  const [hoveredMeasure, setHoveredMeasure] = useState<number | null>(null);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [isTransposing, setIsTransposing] = useState(false);
  const [transposeDragDelta, setTransposeDragDelta] = useState(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftPressed(true); };
    const onKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftPressed(false); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, []);

  
  const noteNames = useMemo(() => 
    Array.from({ length: gridConfig.rows }, (_, i) => getNoteName(108 - i)),
    [gridConfig.rows]
  );

  
  const totalGridWidth = useMemo(() => (
    gridConfig.noteNameWidth + gridConfig.measures * gridConfig.cellsPerMeasure * gridConfig.cellWidth
  ), [gridConfig.noteNameWidth, gridConfig.measures, gridConfig.cellsPerMeasure, gridConfig.cellWidth]);

  
  const generateCellId = useCallback((row: number, column: number): string => {
    return `cell-${row}-${column}`;
  }, []);

  
  useEffect(() => {
    const handleMouseUp = () => {
      onGridMouseUp();
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onGridMouseUp]);

  
  const handleCellClick = useCallback((e: React.MouseEvent, cellId: string) => {
    e.stopPropagation();
    onCellClick(cellId);
  }, [onCellClick]);

  const handleCellDoubleClick = useCallback((e: React.MouseEvent, cellId: string) => {
    e.stopPropagation();
    onCellDoubleClick(cellId);
  }, [onCellDoubleClick]);

  return (
    <div className="flex flex-col" role="region" aria-label="Piano Roll">
      
      <div className="sticky top-0 z-[60]" style={{ width: `${totalGridWidth}px` }}>
        
        <div className="flex">
          
          <div 
            className="sticky top-0 left-0 z-[65] flex-shrink-0 bg-slate-800 border-t-2 border-t-slate-600 border-b-1 border-b-slate-700 border-r-1 border-r-slate-900 flex items-center justify-center hover:bg-slate-600 transition-all text-white text-xs select-none"
            style={{ width: `${gridConfig.noteNameWidth}px`, height: `${gridConfig.cellHeight}px` }}
            title="Transpose"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsTransposing(true);
              setTransposeDragDelta(0);
              const startY = e.clientY;
              const startTp = transpose || 0;
              let raf: number | null = null;
              const onMove = (ev: MouseEvent) => {
                const dy = ev.clientY - startY;
                const delta = Math.round(-dy / 10);
                setTransposeDragDelta(delta);
                const next = Math.max(-24, Math.min(24, startTp + delta));
                if (next !== transpose) {
                  if (raf != null) cancelAnimationFrame(raf);
                  raf = requestAnimationFrame(() => onTransposeChange?.(next));
                }
              };
              const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                if (raf != null) cancelAnimationFrame(raf);
                setIsTransposing(false);
                setTransposeDragDelta(0);
              };
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
          >
            {isTransposing ? (transposeDragDelta >= 0 ? `+${transposeDragDelta}` : `${transposeDragDelta}`) : (
              <span className="inline-flex items-center">
                <span className="material-symbols-outlined icon-xs">music_note</span>
                <span className="material-symbols-outlined icon-xs">swap_vert</span>
              </span>
            )}
          </div>
              
          {measures.map((measure) => (
            <div
              key={measure.id}
              className={`relative z-20 flex-shrink-0 select-none group`}
              style={{ height: `${gridConfig.cellHeight}px`, width: `${gridConfig.cellsPerMeasure * gridConfig.cellWidth}px` }}
              role="button"
              aria-pressed={false}
              tabIndex={0}
              onMouseDown={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const x = e.clientX - rect.left;
                const isLeft = x < 12;
                const isRight = rect.width - x < 12;
                const idx = measure.index;
                if (isLeft && e.button === 0) {
                  onMeasureDelete(idx);
                  return;
                }
                if (isRight && e.button === 0) {
                  onMeasureInsert(idx + 1);
                  return;
                }
                setDraggedMeasure(idx);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onMeasureSelectInline(measure.index);
                }
              }}
              onMouseEnter={() => { overMeasureRef.current = measure.index; setHoveredMeasure(measure.index); }}
              onMouseLeave={() => { if (!draggedMeasure) setHoveredMeasure(null); }}
              onMouseUp={() => {
                if (draggedMeasure != null && overMeasureRef.current != null) {
                  const shift = (window.event as MouseEvent | undefined)?.shiftKey ?? false;
                  if (shift && draggedMeasure !== overMeasureRef.current) {
                    onMeasureCopy(draggedMeasure, overMeasureRef.current);
                  } else if (draggedMeasure !== overMeasureRef.current) {
                    onMeasureSwap(draggedMeasure, overMeasureRef.current);
                  } else {
                    onMeasureSelectInline(draggedMeasure);
                  }
                }
                setDraggedMeasure(null);
                setHoveredMeasure(null);
              }}
            >
              
              <div className={`absolute inset-0 text-slate-300 flex items-center justify-center transition-colors bg-slate-700 hover:bg-slate-600`}>{measure.name}</div>

              
              {(() => {
                const isActive = draggedMeasure === measure.index;
                const isTarget = draggedMeasure != null && hoveredMeasure === measure.index && !isActive;
                let lineColor = 'bg-transparent';
                if (isActive) lineColor = 'bg-blue-400';
                else if (isTarget) lineColor = shiftPressed ? 'bg-emerald-400' : 'bg-orange-400';
                return (
                  <div className={`absolute left-0 right-0 bottom-0 h-[3px] ${lineColor} transition-all duration-150`} />
                );
              })()}

              
              <div className={`absolute left-0 top-0 h-full w-8 ${alwaysShowMeasureSideButtons ? '' : 'hover:bg-red-600/60'} flex items-center justify-center`}>
                <button
                  type="button"
                  className={`${alwaysShowMeasureSideButtons ? 'opacity-100 transform scale-100' : 'opacity-0 group-hover:opacity-100 transition-all duration-150 transform scale-95 group-hover:scale-110'} text-white text-sm font-bold px-2 py-0.5 ${draggedMeasure != null && hoveredMeasure === measure.index ? 'opacity-100' : ''}`}
                  onMouseDown={(e) => { e.stopPropagation(); onMeasureDelete(measure.index); }}
                  title="小節削除"
                  aria-label="小節削除"
                >-</button>
              </div>
              <div className={`absolute right-0 top-0 h-full w-8 ${alwaysShowMeasureSideButtons ? '' : 'hover:bg-emerald-600/60'} flex items-center justify-center`}>
                <button
                  type="button"
                  className={`${alwaysShowMeasureSideButtons ? 'opacity-100 transform scale-100' : 'opacity-0 group-hover:opacity-100 transition-all duration-150 transform scale-95 group-hover:scale-110'} text-white text-sm font-bold px-2 py-0.5 ${draggedMeasure != null && hoveredMeasure === measure.index ? 'opacity-100' : ''}`}
                  onMouseDown={(e) => { e.stopPropagation(); onMeasureInsert(measure.index + 1); }}
                  title="小節挿入"
                  aria-label="小節挿入"
                >+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      
      <div className="flex relative" style={{ width: `${totalGridWidth}px` }}>
        
        <div 
          className="sticky top-0 left-0 z-[50] flex flex-col flex-shrink-0"
          style={{
            width: `${gridConfig.noteNameWidth}px`,
            height: `${gridConfig.rows * gridConfig.cellHeight + 2}px`,
          }}
        >
          <div 
            className="bg-slate-800 flex-shrink-0 rounded-br-md border-l-2 border-slate-900"
          >
            {noteNames.map((noteName, index) => {
              const hasAccidental = noteName.includes('#') || noteName.includes('♭');
              const midiNote = 108 - index;
              return (
                <button
                  key={index}
                  type="button"
                  className={`w-full text-xs flex items-center justify-center ${hasAccidental ? 'bg-slate-900 text-slate-100 hover:bg-slate-600' : 'bg-slate-800 text-slate-100 hover:bg-slate-600'}`}
                  style={{ height: `${gridConfig.cellHeight}px` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tracks && selectedTrackId) {
                      const track = tracks.find(t => t.id === selectedTrackId);
                      const vol = Math.max(0, Math.min(1, track?.volume ?? 0.6));
                      playNote(midiNote, 300, (track?.wave as OscillatorType) || 'sine', vol);
                    } else {
                      playNote(midiNote, 300);
                    }
                  }}
                >
                  {noteName}
                </button>
              );
            })}
          </div>
        </div>

          
        <div 
          className="grid border border-slate-600 flex-shrink-0 relative z-[40]"
          style={{
            width: `${gridConfig.measures * gridConfig.cellsPerMeasure * gridConfig.cellWidth}px`,
            gridTemplateColumns: `repeat(${gridConfig.measures * gridConfig.cellsPerMeasure}, ${gridConfig.cellWidth}px)`,
            gridTemplateRows: `repeat(${gridConfig.rows}, ${gridConfig.cellHeight}px)`,
            pointerEvents: isChordMenuVisible ? 'none' : 'auto' // ChordMenu表示時は無効化
          }}
          role="grid"
          aria-rowcount={gridConfig.rows}
          aria-colcount={gridConfig.measures * gridConfig.cellsPerMeasure}
          aria-multiselectable
          tabIndex={0}
          onMouseDown={isChordMenuVisible ? undefined : onGridMouseDown}
          onMouseMove={isChordMenuVisible ? undefined : onGridMouseMove}
        >
          
          {Array.from({ length: gridConfig.rows }, (_, row) =>
            Array.from({ length: gridConfig.measures * gridConfig.cellsPerMeasure }, (_, col) => {
              const cellId = generateCellId(row, col);
              let ariaSel = false;
              if (isSelecting && selectionStart && selectionEnd) {
                const minRow = Math.min(selectionStart.row, selectionEnd.row);
                const maxRow = Math.max(selectionStart.row, selectionEnd.row);
                const minCol = Math.min(selectionStart.col, selectionEnd.col);
                const maxCol = Math.max(selectionStart.col, selectionEnd.col);
                ariaSel = row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
              }
              
              return (
                <div
                  key={cellId}
                  className={`grid-cell border border-slate-800 ${!isDragging && !isSelecting ? 'hover:bg-slate-700' : ''}`}
                  style={{
                    width: `${gridConfig.cellWidth}px`,
                    height: `${gridConfig.cellHeight}px`,
                    backgroundColor: '#0f172a'
                  }}
                  role="gridcell"
                  aria-selected={ariaSel}
                  onClick={(e) => handleCellClick(e, cellId)}
                  onDoubleClick={(e) => handleCellDoubleClick(e, cellId)}
                />
              );
            })
          )}

          
          {Array.from({ length: gridConfig.measures }, (_, measureIndex) => {
            const x = measureIndex * gridConfig.cellsPerMeasure * gridConfig.cellWidth;
            return (
              <div
                key={`measure-line-${measureIndex}`}
                className="absolute pointer-events-none bg-slate-600"
                style={{
                  left: `${x - 2}px`,
                  top: '0px',
                  width: '4px',
                  height: `${gridConfig.rows * gridConfig.cellHeight}px`,
                  zIndex: 15
                }}
              />
            );
          })}
          
          <div
            className="absolute pointer-events-none bg-slate-600"
            style={{
              left: `${gridConfig.measures * gridConfig.cellsPerMeasure * gridConfig.cellWidth - 2}px`,
              top: '0px',
              width: '4px',
              height: `${gridConfig.rows * gridConfig.cellHeight}px`,
              zIndex: 15
            }}
          />

          
          {Array.from({ length: gridConfig.measures * gridConfig.cellsPerMeasure }, (_, col) => {
            // 複合拍子(例: 6/8, 9/8, 12/8)では1拍=3つの8分のまとまり
            const isCompound = timeSignature.denominator === 8 && timeSignature.numerator % 3 === 0;
            const beatsPerMeasure = isCompound ? timeSignature.numerator / 3 : timeSignature.numerator;
            const cellsPerBeat = gridConfig.cellsPerMeasure / beatsPerMeasure;
            if (col % cellsPerBeat === 0 && col % gridConfig.cellsPerMeasure !== 0) {
              const x = col * gridConfig.cellWidth;
              return (
                <div
                  key={`beat-line-${col}`}
                  className="absolute pointer-events-none bg-slate-700"
                  style={{
                    left: `${x - 1}px`,
                    top: '0px',
                    width: '2px',
                    height: `${gridConfig.rows * gridConfig.cellHeight}px`,
                    zIndex: 14
                  }}
                />
              );
            }
            return null;
          })}

          
          {Array.from({ length: gridConfig.measures * gridConfig.cellsPerMeasure }, (_, col) => {
            const isCompound = timeSignature.denominator === 8 && timeSignature.numerator % 3 === 0;
            const beatsPerMeasure = isCompound ? timeSignature.numerator / 3 : timeSignature.numerator;
            const cellsPerBeat = gridConfig.cellsPerMeasure / beatsPerMeasure;
            const subDiv = Math.round(cellsPerBeat / 3);
            const isSubDivisible = cellsPerBeat % 3 === 0 && subDiv > 0;
            if (isSubDivisible && col % subDiv === 0 && col % cellsPerBeat !== 0 && col % gridConfig.cellsPerMeasure !== 0) {
              const x = col * gridConfig.cellWidth;
              return (
                <div
                  key={`subbeat-line-${col}`}
                  className="absolute pointer-events-none bg-slate-800"
                  style={{
                    left: `${x}px`,
                    top: '0px',
                    width: '1px',
                    height: `${gridConfig.rows * gridConfig.cellHeight}px`,
                    opacity: 0.35,
                    zIndex: 13
                  }}
                />
              );
            }
            return null;
          })}

          
          {children}

          
          {typeof playheadColumn === 'number' && playheadColumn >= 0 && (
            <div
              className="absolute pointer-events-none bg-white"
              style={{
                left: `${playheadColumn * gridConfig.cellWidth}px`,
                top: '0px',
                width: '2px',
                height: `${gridConfig.rows * gridConfig.cellHeight}px`,
                opacity: 0.9,
                zIndex: 50
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
} 