"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Note } from '../../types/note';
import { PianoRollGrid } from './PianoRollGrid';
import { PianoRollNotes } from './PianoRollNotes';
import { PianoRollSelection } from './PianoRollSelection';
import { ChordMenu } from '../ChordMenu';
import { ChordMenuMobile } from '../ChordMenuMobile';
import { useChordPlacement } from '../../hooks/useChordPlacement';
import { GridResizeHandle } from '../GridResizeHandle';
import { useNotes } from '../../hooks/useNotes';
import { useAudio } from '../../hooks/useAudio';
import { useRangeSelection } from '../../hooks/useRangeSelection';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

import { Track } from '../../types/track';
import { getNoteName } from '../../utils/noteUtils';
import { colFromX, rowFromY, snapCol } from '../../utils/gridMath';
import type { Measure, Cell } from '../../types/pianoRoll';

interface GridConfig {
  rows: number;
  measures: number;
  cellsPerMeasure: number;
  cellWidth: number;
  cellHeight: number;
  noteNameWidth: number;
}


interface PianoRollProps {
  tracks: Track[];
  selectedTrackId: string;
  onNotesChange?: (notes: Note[]) => void;
  onSelectedNotesChange?: (selectedCount: number) => void;
  onSelectedNotesSetChange?: (selectedNotes: Set<string>) => void;
  timeSignature: { numerator: number; denominator: number };
  subdivisionsPerBeat: number;
  externalNotes?: Note[];
  onMeasuresChange?: (measures: number) => void;
  bpm?: number;
  isLoopEnabled?: boolean;
  loopStartMeasure?: number;
  loopEndMeasure?: number;
  isPlaying?: boolean;
  measures?: number;
  transpose?: number;
  onTransposeChange?: (v: number) => void;
  onExposeApi?: (api: {
    undo: () => void;
    redo: () => void;
    clearSelection: () => void;
    selectAll: () => void;
    setSelectedLength: (cells: number) => void;
    setSelectedLengthArbitrary: (cells: number) => void;
    moveSelected: (dx: number, dy: number) => void;
    openChordMenuAtSelected: () => void;
    applyChord: (chordType: string) => void;
    chordLists: { major: string[]; minor: string[]; dominant: string[]; alt: string[] };
    deleteMultipleNotes: (ids: string[]) => void;
  }) => void;
}

export const PianoRoll: React.FC<PianoRollProps> = ({ tracks, selectedTrackId, onNotesChange, onSelectedNotesChange, onSelectedNotesSetChange, timeSignature, subdivisionsPerBeat, externalNotes, onMeasuresChange, bpm, isLoopEnabled, loopStartMeasure, loopEndMeasure, isPlaying, measures: measuresProp, transpose, onTransposeChange, onExposeApi }) => {
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    rows: 88,
    measures: 3,
    cellsPerMeasure: timeSignature.numerator * subdivisionsPerBeat,
    cellWidth: 40,
    cellHeight: 25,
    noteNameWidth: 64,
  });
  useEffect(() => {
    if (typeof measuresProp === 'number' && measuresProp > 0 && measuresProp !== gridConfig.measures) {
      setGridConfig(prev => ({ ...prev, measures: measuresProp }));
    }
  }, [measuresProp, gridConfig.measures]);

  const [measures, setMeasures] = useState<Measure[]>([]);
  const [isLongPressMode, setIsLongPressMode] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isSelecting,
    selectionStart,
    selectionEnd,
    startRangeSelection,
    updateRangeSelection,
    endRangeSelection,
  } = useRangeSelection();

  const {
    notes,
    createNote,
    deleteNote,
    // getNoteAtPosition,
    getActiveTrackNoteAtPosition,
    dragState,
    startDrag,
    handleDrag,
    endDrag,
    deleteMultipleNotes,
    handleUndo,
    handleRedo,
    // canUndo,
    // canRedo,
    selectedNotes,
    selectNote,
    // deselectNote,
    selectMultipleNotes,
    clearSelection,
    // isNoteSelected,
    selectAllNotes,
    replaceNotes,
    updateMultipleNotes,
    setEndDragBehavior,
    getDragSnapshot
  } = useNotes(gridConfig.cellsPerMeasure, gridConfig.cellWidth, gridConfig.cellHeight, { onCommit: () => {} });

  const lastAppliedExternalNotesRef = useRef<Note[] | undefined>(undefined);
  useEffect(() => {
    if (!externalNotes) return;
    if (lastAppliedExternalNotesRef.current === externalNotes) return;
    replaceNotes(externalNotes);
    lastAppliedExternalNotesRef.current = externalNotes;
  }, [externalNotes, replaceNotes]);

  useEffect(() => {
    if (!onNotesChange) return;
    if (dragState.isDragging) return;
    onNotesChange(notes);
  }, [notes, onNotesChange, dragState.isDragging]);

  useEffect(() => {
    if (!onSelectedNotesChange) return;
    onSelectedNotesChange(selectedNotes.size);
  }, [selectedNotes.size, onSelectedNotesChange]);

  useEffect(() => {
    if (!onSelectedNotesSetChange) return;
    onSelectedNotesSetChange(selectedNotes);
  }, [selectedNotes, onSelectedNotesSetChange]);

  // 音再生管理
  const { playNote } = useAudio();
  const handleDragRef = useRef<(e: MouseEvent | TouchEvent) => void>(() => {});
  const endDragRef = useRef<() => void>(() => {});
  const dragStateRef = useRef(dragState);
  const lastPreviewPitchRef = useRef<number | null>(null);
  const lastPreviewAtRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  useEffect(() => { dragStateRef.current = dragState; }, [dragState]);
  useEffect(() => { handleDragRef.current = handleDrag; }, [handleDrag]);
  useEffect(() => { endDragRef.current = endDrag; }, [endDrag]);
  const previewWaveRef = useRef<OscillatorType>('sine');
  const previewVolRef = useRef<number>(0.6);
  useEffect(() => {
    const track = tracks.find(t => t.id === selectedTrackId);
    previewWaveRef.current = (track?.wave as OscillatorType) || 'sine';
    previewVolRef.current = Math.max(0, Math.min(1, track?.volume ?? 0.6));
  }, [tracks, selectedTrackId]);

  // 再生ヘッド
  const [playheadColumn, setPlayheadColumn] = useState<number | null>(null);
  const playheadRafRef = useRef<number | null>(null);
  const playheadStartTimeRef = useRef<number>(0);
  const loopRangeRef = useRef<{ start: number; end: number }>({ start: 0, end: gridConfig.measures });
  useEffect(() => {
    loopRangeRef.current = {
      start: (typeof loopStartMeasure === 'number' ? loopStartMeasure : 0),
      end: (typeof loopEndMeasure === 'number' ? loopEndMeasure : gridConfig.measures)
    };
  }, [loopStartMeasure, loopEndMeasure, gridConfig.measures]);

  useEffect(() => {
    if (!isPlaying) {
      setPlayheadColumn(null);
      if (playheadRafRef.current != null) cancelAnimationFrame(playheadRafRef.current);
      playheadRafRef.current = null;
      return;
    }
    const bpmVal = bpm ?? 120;
    const subdivisionsPerBeat = 4;
    const cellsPerMeasure = gridConfig.cellsPerMeasure; // numerator*4
    const msPerQuarter = (60 / bpmVal) * 1000;
    const msPerCell = msPerQuarter / subdivisionsPerBeat;
    const loopStartCells = loopRangeRef.current.start * cellsPerMeasure;
    const loopEndCells = loopRangeRef.current.end * cellsPerMeasure;
    playheadStartTimeRef.current = performance.now();

    const tick = () => {
      const now = performance.now();
      const elapsedMs = now - playheadStartTimeRef.current;
      let cells = Math.floor(elapsedMs / msPerCell);
      if (isLoopEnabled) {
        const loopLen = Math.max(1, loopEndCells - loopStartCells);
        cells = loopStartCells + (cells % loopLen);
      }
      setPlayheadColumn(cells);
      playheadRafRef.current = requestAnimationFrame(tick);
    };
    playheadRafRef.current = requestAnimationFrame(tick);
    return () => {
      if (playheadRafRef.current != null) cancelAnimationFrame(playheadRafRef.current);
      playheadRafRef.current = null;
    };
  }, [isPlaying, bpm, gridConfig.cellsPerMeasure, isLoopEnabled]);

  // ChordMenu状態管理
  const [chordMenuState, setChordMenuState] = useState<{
    isVisible: boolean;
    position: { x: number; y: number };
    noteId: string | null;
    rootNote: number;
    startTime: number;
    duration: number;
  }>({
    isVisible: false,
    position: { x: 0, y: 0 },
    noteId: null,
    rootNote: 60,
    startTime: 0,
    duration: 4
  });

  // モバイル判定
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const update = () => {
      const nav = navigator as Navigator & { maxTouchPoints?: number };
      const hasTouch = 'ontouchstart' in window || (nav.maxTouchPoints ?? 0) > 0;
      setIsMobile(mql.matches || hasTouch);
    };
    update();
    if (mql.addEventListener) mql.addEventListener('change', update);
    else mql.addListener(update);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', update);
      else mql.removeListener(update);
    };
  }, []);

  // 音名を自動生成（メモ化）
  const noteNames = useMemo(() => 
    Array.from({ length: gridConfig.rows }, (_, i) => getNoteName(108 - i)),
    [gridConfig.rows]
  );

  // セルID生成
  const generateCellId = useCallback((row: number, column: number): string => {
    return `cell-${row}-${column}`;
  }, []);

  // 小節ID生成
  const generateMeasureId = useCallback((measureIndex: number): string => {
    return `measure-${measureIndex}`;
  }, []);

  // 小節とセルを初期化
  const initializeMeasuresAndCells = useCallback(() => {
    const newMeasures: Measure[] = [];
    
    for (let measureIndex = 0; measureIndex < gridConfig.measures; measureIndex++) {
      const measureCells: Cell[] = [];
      
      // 各小節内のセルを生成
      for (let row = 0; row < gridConfig.rows; row++) {
        for (let col = 0; col < gridConfig.cellsPerMeasure; col++) {
          const globalColumn = measureIndex * gridConfig.cellsPerMeasure + col;
          measureCells.push({
            id: generateCellId(row, globalColumn),
            row,
            column: globalColumn,
            isSelected: false,
            note: noteNames[row]
          });
        }
      }
      
      newMeasures.push({
        id: generateMeasureId(measureIndex),
        name: `${measureIndex + 1}`,
        index: measureIndex,
        isSelected: false
      });
    }
    
    setMeasures(newMeasures);
  }, [gridConfig.measures, gridConfig.rows, gridConfig.cellsPerMeasure, noteNames, generateCellId, generateMeasureId]);

  // 拍子/分割が変わったらグリッド構成を更新
  useEffect(() => {
    setGridConfig(prev => ({
      ...prev,
      cellsPerMeasure: timeSignature.numerator * subdivisionsPerBeat,
    }));
  }, [timeSignature.numerator, subdivisionsPerBeat]);


  // 小節クリック処理（未使用のため削除）

  const handleNoteDragStart = useCallback((noteId: string, event: React.MouseEvent | React.TouchEvent, dragType: 'move' | 'resize', selectedNoteIds?: string[]) => {
    setEndDragBehavior(event.shiftKey ? 'copy' : 'move');
    startDrag(noteId, event, dragType, selectedNoteIds);
  }, [startDrag, setEndDragBehavior]);

  const handleCellClick = useCallback((cellId: string) => {
    const [, rowStr, colStr] = cellId.split('-');
    const row = parseInt(rowStr);
    const colRaw = parseInt(colStr);
    const col = snapCol(colRaw);
    const midiNote = 108 - row;

    const existingNote = getActiveTrackNoteAtPosition(midiNote, col, selectedTrackId);

    if (existingNote) {
      deleteNote(existingNote.id);
    } else {
      createNote(midiNote, col, 1, 19, selectedTrackId);
      const track = tracks.find(t => t.id === selectedTrackId);
      const vol = Math.max(0, Math.min(1, track?.volume ?? 0.6));
      playNote(midiNote, 500, (track?.wave as OscillatorType) || 'sine', vol);
    }
  }, [createNote, deleteNote, getActiveTrackNoteAtPosition, playNote, selectedTrackId, tracks]);

  const handleCellDoubleClick = useCallback((cellId: string) => {
    const [, rowStr, colStr] = cellId.split('-');
    const row = parseInt(rowStr);
    const col = parseInt(colStr);
    const midiNote = 108 - row;

    // 選択トラックのノートのみを対象にする
    const existingNote = getActiveTrackNoteAtPosition(midiNote, col, selectedTrackId);
    if (existingNote) {
      deleteNote(existingNote.id);
    }
  }, [deleteNote, getActiveTrackNoteAtPosition, selectedTrackId]);

  const handleGridMouseDown = useCallback((e: React.MouseEvent) => {
    // ノート上でのクリックは無視
    if ((e.target as HTMLElement).closest('.note-element')) {
      return;
    }
    
    // リサイズハンドル上でのクリックは無視
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return;
    }
    
    // セルボタン上でのクリックは無視
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = colFromX(x, gridConfig.cellWidth);
    const row = rowFromY(y, gridConfig.cellHeight);
    
    startRangeSelection(row, col);
  }, [gridConfig.cellWidth, gridConfig.cellHeight, startRangeSelection]);

  const handleGridMouseMove = useCallback((e: React.MouseEvent) => {
    if (isSelecting) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const rawCol = x / gridConfig.cellWidth;
      const col = snapCol(rawCol);
      const row = rowFromY(y, gridConfig.cellHeight);
      
      updateRangeSelection(row, col);
    }
  }, [isSelecting, gridConfig.cellWidth, gridConfig.cellHeight, updateRangeSelection]);

  const handleGridMouseUp = useCallback(() => {
    if (isSelecting) {
      endRangeSelection(notes, selectMultipleNotes, selectedTrackId);
    }
  }, [isSelecting, endRangeSelection, notes, selectMultipleNotes, selectedTrackId]);

  // ノート削除ハンドラー
  const handleNoteDelete = useCallback((noteIds: string | string[]) => {
    if (Array.isArray(noteIds)) {
      deleteMultipleNotes(noteIds);
    } else {
      deleteNote(noteIds);
    }
  }, [deleteMultipleNotes, deleteNote]);

  const handleGridResize = useCallback((newMeasures: number) => {
    const limitCells = newMeasures * gridConfig.cellsPerMeasure;
    if (newMeasures < gridConfig.measures) {
      const toDelete = notes.filter(n => n.startTime >= limitCells).map(n => n.id);
      if (toDelete.length) deleteMultipleNotes(toDelete);
      const updates: Array<{ noteId: string; updates: { id: string; duration: number } }> = [];
      notes.forEach(n => {
        if (n.startTime < limitCells && n.startTime + n.duration > limitCells) {
          const newDuration = Math.max(1, limitCells - n.startTime);
          updates.push({ noteId: n.id, updates: { id: n.id, duration: newDuration } });
        }
      });
      if (updates.length) updateMultipleNotes(updates);
    }
    setGridConfig(prev => ({
      ...prev,
      measures: newMeasures
    }));
    onMeasuresChange?.(newMeasures);
  }, [onMeasuresChange, gridConfig.measures, gridConfig.cellsPerMeasure, notes, deleteMultipleNotes, updateMultipleNotes]);

  const handleChordSelect = useCallback((chordType: string) => {
    void chordType;
    setChordMenuState(prev => ({ ...prev, isVisible: false }));
  }, []);

  const handleChordMenuClose = useCallback(() => {
    setChordMenuState(prev => ({ ...prev, isVisible: false }));
  }, []);

  const noteMap = useMemo(() => {
    const map = new Map<string, Note>();
    notes.forEach(note => map.set(note.id, note));
    return map;
  }, [notes]);

  const handleNoteContextMenu = useCallback((noteId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const note = noteMap.get(noteId); // O(1)検索
    if (note) {
      setChordMenuState({
        isVisible: true,
        position: { x: event.clientX, y: event.clientY },
        noteId: note.id,
        rootNote: note.pitch,
        startTime: note.startTime,
        duration: note.duration
      });
    }
  }, [noteMap]);

  useEffect(() => {
    initializeMeasuresAndCells();
  }, [initializeMeasuresAndCells]);

  useEffect(() => {
    if (!dragState.isDragging) return;
    const onMove = (e: MouseEvent) => {
      handleDragRef.current(e);
      if (rafIdRef.current != null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const s = dragStateRef.current;
        if (s.isDragging && s.originalNote && s.dragType === 'move') {
          const deltaY = e.clientY - s.startY;
          const deltaPitch = Math.round(-deltaY / gridConfig.cellHeight);
          const newPitch = Math.max(21, Math.min(108, s.originalNote.pitch + deltaPitch));
          const now = Date.now();
          if (newPitch !== lastPreviewPitchRef.current && now - lastPreviewAtRef.current > 60) {
            playNote(newPitch, 150, previewWaveRef.current, previewVolRef.current);
            lastPreviewPitchRef.current = newPitch;
            lastPreviewAtRef.current = now;
          }
        }
      });
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // スクロールを防ぐ
      handleDragRef.current(e);
      if (rafIdRef.current != null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const s = dragStateRef.current;
        if (s.isDragging && s.originalNote && e.touches.length > 0 && s.dragType === 'move') {
          const deltaY = e.touches[0].clientY - s.startY;
          const deltaPitch = Math.round(-deltaY / gridConfig.cellHeight);
          const newPitch = Math.max(21, Math.min(108, s.originalNote.pitch + deltaPitch));
          const now = Date.now();
          if (newPitch !== lastPreviewPitchRef.current && now - lastPreviewAtRef.current > 60) {
            playNote(newPitch, 150, previewWaveRef.current, previewVolRef.current);
            lastPreviewPitchRef.current = newPitch;
            lastPreviewAtRef.current = now;
          }
        }
      });
    };
    const onUp = (e: MouseEvent) => {
      lastPreviewPitchRef.current = null;
      const s = dragStateRef.current;
      if (e.shiftKey && s.isDragging && s.originalNote && s.currentNote) {
        const dx = s.currentNote.startTime - s.originalNote.startTime;
        const dp = s.currentNote.pitch - s.originalNote.pitch;
        const snap = getDragSnapshot();
        snap.forEach(ss => {
          const newStart = Math.max(0, ss.startTime + dx);
          const newPitch = Math.max(21, Math.min(108, ss.pitch + dp));
          createNote(newPitch, newStart, ss.duration, 19, ss.trackId);
        });
        setEndDragBehavior('copy');
      } else {
        setEndDragBehavior('move');
      }
      endDragRef.current();
    };
    const onTouchEnd = (e: TouchEvent) => {
      lastPreviewPitchRef.current = null;
      const s = dragStateRef.current;
      if (s.isDragging && s.originalNote && s.currentNote) {
        // 長押しモードの場合はコピー、そうでなければ移動
        if (isLongPressMode) {
          const dx = s.currentNote.startTime - s.originalNote.startTime;
          const dp = s.currentNote.pitch - s.originalNote.pitch;
          const snap = getDragSnapshot();
          snap.forEach(ss => {
            const newStart = Math.max(0, ss.startTime + dx);
            const newPitch = Math.max(21, Math.min(108, ss.pitch + dp));
            createNote(newPitch, newStart, ss.duration, 19, ss.trackId);
          });
          setEndDragBehavior('copy');
        } else {
          setEndDragBehavior('move');
        }
      }
      // 長押しモードをリセット
      setIsLongPressMode(false);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      endDragRef.current();
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, [dragState.isDragging, gridConfig.cellHeight, playNote, getDragSnapshot, createNote, setEndDragBehavior, isLongPressMode]);

  useKeyboardShortcuts({
    selectedNotes,
    deleteMultipleNotes,
    clearSelection,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSelectAll: () => selectAllNotes(notes)
  });

  const applyNoteUpdates = useCallback((updates: Array<{ id: string; startTime: number }>) => {
    if (!updates.length) return;
    const payload = updates.map(u => ({ noteId: u.id, updates: { id: u.id, startTime: u.startTime } }));
    updateMultipleNotes(payload);
  }, [updateMultipleNotes]);

  const moveNotesForInsert = useCallback((insertIndex: number) => {
    const span = gridConfig.cellsPerMeasure;
    const updates: Array<{ id: string; startTime: number }> = [];
    notes.forEach(n => {
      const mi = Math.floor(n.startTime / span);
      if (mi >= insertIndex) updates.push({ id: n.id, startTime: n.startTime + span });
    });
    applyNoteUpdates(updates);
  }, [gridConfig.cellsPerMeasure, notes, applyNoteUpdates]);

  const moveNotesForDelete = useCallback((deleteIndex: number) => {
    const span = gridConfig.cellsPerMeasure;
    const updates: Array<{ id: string; startTime: number }> = [];
    notes.forEach(n => {
      const mi = Math.floor(n.startTime / span);
      if (mi > deleteIndex) updates.push({ id: n.id, startTime: Math.max(0, n.startTime - span) });
    });
    applyNoteUpdates(updates);
  }, [gridConfig.cellsPerMeasure, notes, applyNoteUpdates]);

  const moveNotesForSwap = useCallback((from: number, to: number) => {
    if (from === to) return;
    const span = gridConfig.cellsPerMeasure;
    const delta = (to - from) * span;
    const updates: Array<{ id: string; startTime: number }> = [];
    if (from < to) {
      notes.forEach(n => {
        const mi = Math.floor(n.startTime / span);
        if (mi === from) updates.push({ id: n.id, startTime: n.startTime + delta });
        else if (mi > from && mi <= to) updates.push({ id: n.id, startTime: n.startTime - span });
      });
    } else {
      notes.forEach(n => {
        const mi = Math.floor(n.startTime / span);
        if (mi === from) updates.push({ id: n.id, startTime: n.startTime + delta });
        else if (mi >= to && mi < from) updates.push({ id: n.id, startTime: n.startTime + span });
      });
    }
    applyNoteUpdates(updates);
  }, [gridConfig.cellsPerMeasure, notes, applyNoteUpdates]);

  const [showCopyHint, setShowCopyHint] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (e.shiftKey && (dragState.isDragging || isSelecting)) {
        setShowCopyHint({ x: e.clientX + 10, y: e.clientY + 10 });
      } else {
        setShowCopyHint(null);
      }
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, [dragState.isDragging, isSelecting]);

  useEffect(() => {
    const onCopyMeasure = (e: Event) => {
      const { from, to } = (e as CustomEvent).detail as { from: number; to: number };
      if (from === to) return;
      const span = gridConfig.cellsPerMeasure;
      const fromStart = from * span;
      const fromEnd = (from + 1) * span;
      const delta = (to - from) * span;
      const src = notes.filter(n => n.startTime >= fromStart && n.startTime < fromEnd);
      src.forEach(n => {
        const newStart = Math.max(0, n.startTime + delta);
        createNote(n.pitch, newStart, n.duration, 19, n.trackId);
      });
    };
    window.addEventListener('measure-copy', onCopyMeasure as EventListener);
    return () => window.removeEventListener('measure-copy', onCopyMeasure as EventListener);
  }, [gridConfig.cellsPerMeasure, notes, createNote]);

  const { placeChord, chordTypes } = useChordPlacement();
  const chordLists = useMemo(() => {
    const allKeys = Object.keys(chordTypes);
    return {
      major: allKeys.filter(key => key.startsWith('major') && key !== 'major'),
      minor: allKeys.filter(key => key.startsWith('minor') && key !== 'minor'),
      dominant: allKeys.filter(key => key.startsWith('dominant') && key !== 'dominant' && !key.includes('#') && !key.includes('b')),
      alt: ['sus4', 'dim', 'aug', 'sus2']
    };
  }, [chordTypes]);

  const applyChordAtSelected = useCallback((chordType: string) => {
    const firstId = Array.from(selectedNotes)[0];
    if (!firstId) return;
    const n = notes.find(nn => nn.id === firstId);
    if (!n) return;
    placeChord(n.pitch, chordType, n.startTime, n.duration, createNote, n.trackId);
  }, [selectedNotes, notes, placeChord, createNote]);

  const openChordMenuAtSelected = useCallback(() => {
    const firstId = Array.from(selectedNotes)[0];
    if (!firstId) return;
    const n = notes.find(nn => nn.id === firstId);
    if (!n) return;
    setChordMenuState({
      isVisible: true,
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      noteId: n.id,
      rootNote: n.pitch,
      startTime: n.startTime,
      duration: n.duration
    });
  }, [selectedNotes, notes]);

  const setSelectedLength = useCallback((cells: number) => {
    const c = Math.max(1, Math.floor(cells));
    const ids = Array.from(selectedNotes);
    if (!ids.length) return;
    const payload = ids.map(id => ({ noteId: id, updates: { id, duration: c } }));
    updateMultipleNotes(payload);
  }, [selectedNotes, updateMultipleNotes]);

  const setSelectedLengthArbitrary = useCallback((cells: number) => {
    const c = Math.max(1, Math.floor(cells));
    const ids = Array.from(selectedNotes);
    if (!ids.length) return;
    const payload = ids.map(id => ({ noteId: id, updates: { id, duration: c } }));
    updateMultipleNotes(payload);
  }, [selectedNotes, updateMultipleNotes]);

  const moveSelected = useCallback((dx: number, dy: number) => {
    const ids = Array.from(selectedNotes);
    if (!ids.length) return;
    const idSet = new Set(ids);
    const payload: Array<{ noteId: string; updates: { id: string; startTime?: number; pitch?: number } }> = [];
    notes.forEach(n => {
      if (!idSet.has(n.id)) return;
      const ns = Math.max(0, n.startTime + dx);
      const np = Math.max(21, Math.min(108, n.pitch + dy));
      payload.push({ noteId: n.id, updates: { id: n.id, startTime: ns, pitch: np } });
    });
    if (payload.length) updateMultipleNotes(payload);
  }, [selectedNotes, notes, updateMultipleNotes]);

  useEffect(() => {
    if (!onExposeApi) return;
    onExposeApi({
      undo: handleUndo,
      redo: handleRedo,
      clearSelection,
      selectAll: () => selectAllNotes(notes),
      setSelectedLength,
      setSelectedLengthArbitrary,
      moveSelected,
      openChordMenuAtSelected,
      applyChord: applyChordAtSelected,
      chordLists,
      deleteMultipleNotes,
    });
  }, [onExposeApi, handleUndo, handleRedo, clearSelection, selectAllNotes, notes, setSelectedLength, setSelectedLengthArbitrary, moveSelected, openChordMenuAtSelected, applyChordAtSelected, chordLists, deleteMultipleNotes]);

  return (
    <div className="piano-roll flex flex-col relative"
      style={{
        height: `${gridConfig.rows * gridConfig.cellHeight + 2}px`
      }}
    >
      
      <PianoRollGrid
        gridConfig={gridConfig}
        measures={measures}
        timeSignature={timeSignature}
        onCellClick={handleCellClick}
        onCellDoubleClick={handleCellDoubleClick}
        onGridMouseDown={handleGridMouseDown}
        onGridMouseMove={handleGridMouseMove}
        onGridMouseUp={handleGridMouseUp}
        isDragging={dragState.isDragging}
        isSelecting={isSelecting}
        isChordMenuVisible={chordMenuState.isVisible}
        tracks={tracks}
        selectedTrackId={selectedTrackId}
        playheadColumn={playheadColumn ?? undefined}
        selectionStart={selectionStart}
        selectionEnd={selectionEnd}
        transpose={transpose}
        onTransposeChange={onTransposeChange}
        alwaysShowMeasureSideButtons={isMobile}
        onMeasureSwap={(from, to) => {
          if (from === to) return;
          setMeasures(prev => {
            const next = [...prev];
            const mv = next.splice(from, 1)[0];
            next.splice(to, 0, mv);
            return next.map((m, i) => ({ ...m, id: generateMeasureId(i), name: `${i + 1}`, index: i }));
          });
          moveNotesForSwap(from, to);
        }}
        onMeasureInsert={(index) => {
          setGridConfig(prev => ({ ...prev, measures: prev.measures + 1 }));
          setMeasures(prev => {
            const next = [...prev];
            next.splice(index, 0, { id: generateMeasureId(index), name: `${index + 1}`, index, isSelected: false });
            return next.map((m, i) => ({ ...m, id: generateMeasureId(i), name: `${i + 1}`, index: i }));
          });
          moveNotesForInsert(index);
          onMeasuresChange?.(gridConfig.measures + 1);
        }}
        onMeasureDelete={(index) => {
          if (gridConfig.measures <= 1) return;
          const span = gridConfig.cellsPerMeasure;
          const startCell = index * span;
          const endCell = (index + 1) * span;
          const idsToDelete = notes.filter(n => n.startTime >= startCell && n.startTime < endCell).map(n => n.id);
          if (idsToDelete.length) deleteMultipleNotes(idsToDelete);
          setGridConfig(prev => ({ ...prev, measures: Math.max(1, prev.measures - 1) }));
          setMeasures(prev => {
            const next = [...prev];
            next.splice(index, 1);
            return next.map((m, i) => ({ ...m, id: generateMeasureId(i), name: `${i + 1}`, index: i }));
          });
          moveNotesForDelete(index);
          onMeasuresChange?.(gridConfig.measures - 1);
        }}
        onMeasureSelectInline={(index) => {
          const span = gridConfig.cellsPerMeasure;
          const startCell = index * span;
          const endCell = (index + 1) * span;
          const ids = notes.filter(n => n.startTime >= startCell && n.startTime < endCell).map(n => n.id);
          if (ids.length) selectMultipleNotes(ids); else clearSelection();
        }}
        onMeasureCopy={(from, to) => {
          if (from === to) return;
          const span = gridConfig.cellsPerMeasure;
          const fromStart = from * span;
          const fromEnd = (from + 1) * span;
          const delta = (to - from) * span;
          const src = notes.filter(n => n.startTime >= fromStart && n.startTime < fromEnd);
          src.forEach(n => createNote(n.pitch, Math.max(0, n.startTime + delta), n.duration, 19, n.trackId));
        }}
      >
        
        <PianoRollSelection
          selectionStart={selectionStart}
          selectionEnd={selectionEnd}
          isSelecting={isSelecting}
          cellWidth={gridConfig.cellWidth}
          cellHeight={gridConfig.cellHeight}
        />

        
        <PianoRollNotes
          notes={notes}
          tracks={tracks}
          selectedTrackId={selectedTrackId}
          cellWidth={gridConfig.cellWidth}
          cellHeight={gridConfig.cellHeight}
          onNoteDragStart={handleNoteDragStart}
          onNoteDelete={handleNoteDelete}
          selectedNotes={selectedNotes}
          onNoteSelect={selectNote}
          clearSelection={clearSelection}
          onNoteContextMenu={handleNoteContextMenu}
        />
      </PianoRollGrid>

      
      {showCopyHint && (
        <div className="pointer-events-none fixed" style={{ left: showCopyHint.x, top: showCopyHint.y, zIndex: 10020 }}>
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">+
          </div>
        </div>
      )}
 
      
      {isMobile ? (
        <ChordMenuMobile
          isVisible={chordMenuState.isVisible}
          position={chordMenuState.position}
          onSelectChord={handleChordSelect}
          onClose={handleChordMenuClose}
          rootNote={chordMenuState.rootNote}
          startTime={chordMenuState.startTime}
          duration={chordMenuState.duration}
          trackId={selectedTrackId}
          createNote={createNote}
        />
      ) : (
        <ChordMenu
          isVisible={chordMenuState.isVisible}
          position={chordMenuState.position}
          onSelectChord={handleChordSelect}
          onClose={handleChordMenuClose}
          rootNote={chordMenuState.rootNote}
          startTime={chordMenuState.startTime}
          duration={chordMenuState.duration}
          trackId={selectedTrackId}
          createNote={createNote}
        />
      )}

      
      <GridResizeHandle
        onResize={handleGridResize}
        currentMeasures={gridConfig.measures}
        cellWidth={gridConfig.cellWidth}
        cellsPerMeasure={gridConfig.cellsPerMeasure}
        noteNameWidth={gridConfig.noteNameWidth}
      />
    </div>
  );
}; 