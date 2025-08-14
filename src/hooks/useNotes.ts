import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Note, NoteUpdate } from '../types/note';
import { getNoteName } from '../utils/noteUtils';
import { useHistory } from './useHistory';

export const useNotes = (
    cellsPerMeasure: number = 16,
    cellWidth: number = 40,
    cellHeight: number = 25,
    options?: { onCommit?: () => void }
) => {
    const [notes, setNotes] = useState<Note[]>([]);
    // removed unused noteCounter state
    const counterRef = useRef(0);
    const idSetRef = useRef(new Set<string>());
    
    const { saveState, undo, redo, canUndo, canRedo, currentIndex } = useHistory();
    
    const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
    
    const [dragState, setDragState] = useState<{
        isDragging: boolean;
        noteId: string | null;
        dragType: 'move' | 'resize' | 'gridResize' | null;
        startX: number;
        startY: number;
        originalNote: Note | null;
        currentNote: Note | null;
        selectedNoteIds: string[];
        relativePositions: Map<string, { deltaTime: number; deltaPitch: number }>;
        gridResizeState?: {
            startMeasures: number;
            deltaMeasures: number;
            showPill: boolean;
        };
    }>({
        isDragging: false,
        noteId: null,
        dragType: null,
        startX: 0,
        startY: 0,
        originalNote: null,
        currentNote: null,
        selectedNoteIds: [],
        relativePositions: new Map()
    });

    type DragSnapshotItem = Pick<Note, 'id' | 'startTime' | 'pitch' | 'duration' | 'trackId'>;
    const dragSnapshotRef = useRef<DragSnapshotItem[]>([]);
    const getDragSnapshot = useCallback(() => dragSnapshotRef.current.slice(), []);

    const endDragBehaviorRef = useRef<'move' | 'copy' | 'cancel'>('move');
    const setEndDragBehavior = useCallback((mode: 'move' | 'copy' | 'cancel') => {
        endDragBehaviorRef.current = mode;
    }, []);

    const dragStateRef = useRef(dragState);
    useEffect(() => { dragStateRef.current = dragState; }, [dragState]);
    const cellWidthRef = useRef(cellWidth);
    const cellHeightRef = useRef(cellHeight);
    const cellsPerMeasureRef = useRef(cellsPerMeasure);
    useEffect(() => { cellWidthRef.current = cellWidth; }, [cellWidth]);
    useEffect(() => { cellHeightRef.current = cellHeight; }, [cellHeight]);
    useEffect(() => { cellsPerMeasureRef.current = cellsPerMeasure; }, [cellsPerMeasure]);

    const generateUniqueId = useCallback((pitch: number, startTime: number) => {
        let id: string;
        let attempts = 0;
        
        do {
            const timestamp = Date.now();
            const performanceTime = performance.now();
            const random = Math.random().toString(36).substr(2, 12);
            const microRandom = Math.random().toString(36).substr(2, 6);
            counterRef.current += 1;
            const counter = counterRef.current;
            
            id = `note-${timestamp}-${performanceTime.toFixed(6)}-${random}-${microRandom}-${counter}-${pitch}-${startTime}-${attempts}`;
            attempts++;
            
            if (attempts > 100) {
                id = `note-${Date.now()}-${Math.random().toString(36).substr(2, 15)}-${pitch}-${startTime}-fallback`;
                break;
            }
        } while (idSetRef.current.has(id));
        
        idSetRef.current.add(id);
        
        return id;
    }, []);

    const createNote = useCallback((pitch: number, startTime: number, duration: number = 4, zIndex: number = 19, trackId: string) => {
        const uniqueId = generateUniqueId(pitch, startTime);
        
        const newNote: Note = {
            id: uniqueId,
            pitch,
            startTime,
            duration,
            velocity: 100,
            channel: 0,
            noteName: getNoteName(pitch),
            measure: Math.floor(startTime / cellsPerMeasure) + 1,
            beat: (startTime % cellsPerMeasure) + 1,
            trackId,
            zIndex,
        }; 
        
        setNotes(prev => [...prev, newNote]);
        
        return newNote;
    }, [cellsPerMeasure, generateUniqueId]);

    const deleteNote = useCallback((noteId: string) => {
        setNotes(prev => prev.filter(note => note.id !== noteId));
        idSetRef.current.delete(noteId);
    }, []);

    const updateNote = useCallback((noteId: string, updates: NoteUpdate) => {
        setNotes(prev => prev.map(note => {
            if (note.id === noteId) {
                const updatedNote = { ...note, ...updates };
                if (updates.pitch !== undefined) {
                    updatedNote.noteName = getNoteName(updates.pitch);
                }
                if (updates.startTime !== undefined) {
                    updatedNote.measure = Math.floor(updates.startTime / cellsPerMeasure) + 1;
                    updatedNote.beat = (updates.startTime % cellsPerMeasure) + 1;
                }
                return updatedNote;
            }
            return note;
        }));
    }, [cellsPerMeasure]);

    const deleteMultipleNotes = useCallback((noteIds: string[]) => {
        const noteIdSet = new Set(noteIds);
        setNotes(prev => prev.filter(note => !noteIdSet.has(note.id)));
        noteIds.forEach(id => idSetRef.current.delete(id));
    }, []);

    const selectNote = useCallback((noteId: string, addToSelection = false) => {
        if (addToSelection) {
            setSelectedNotes(prev => new Set([...prev, noteId]));
        } else {
            setSelectedNotes(new Set([noteId]));
        }
    }, []);

    const deselectNote = useCallback((noteId: string) => {
        setSelectedNotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(noteId);
            return newSet;
        });
    }, []);

    const selectMultipleNotes = useCallback((noteIds: string[]) => {
        setSelectedNotes(new Set(noteIds));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedNotes(new Set());
    }, []);

    const isNoteSelected = useCallback((noteId: string) => {
        return selectedNotes.has(noteId);
    }, [selectedNotes]);

    const selectAllNotes = useCallback((notes: Note[]) => {
        const allNoteIds = notes.map(note => note.id);
        setSelectedNotes(new Set(allNoteIds));
    }, []);

    const updateMultipleNotes = useCallback((updates: Array<{ noteId: string; updates: NoteUpdate }>) => {
        setNotes(prev => prev.map(note => {
            const update = updates.find(u => u.noteId === note.id);
            if (update) {
                const updatedNote = { ...note, ...update.updates };
                if (update.updates.pitch !== undefined) {
                    updatedNote.noteName = getNoteName(update.updates.pitch);
                }
                if (update.updates.startTime !== undefined) {
                    updatedNote.measure = Math.floor(update.updates.startTime / cellsPerMeasure) + 1;
                    updatedNote.beat = (update.updates.startTime % cellsPerMeasure) + 1;
                }
                return updatedNote;
            }
            return note;
        }));
    }, [cellsPerMeasure]);

    const getNoteAtPosition = useCallback((pitch: number, time: number, trackId?: string) => {
        return notes.find(note => 
            note.pitch === pitch && 
            time >= note.startTime && 
            time < note.startTime + note.duration &&
            (trackId ? note.trackId === trackId : true)
        );
    }, [notes]);

    const getActiveTrackNoteAtPosition = useCallback((pitch: number, time: number, selectedTrackId: string) => {
        return notes.find(note => 
            note.pitch === pitch && 
            time >= note.startTime && 
            time < note.startTime + note.duration &&
            (note.trackId === selectedTrackId || (!note.trackId && selectedTrackId))
        );
    }, [notes]);
    
    const calculateRelativePositions = useCallback((selectedNoteIds: string[], baseNoteId: string) => {
        const baseNote = notes.find(n => n.id === baseNoteId);
        if (!baseNote) return new Map();
        
        const relativePositions = new Map();
        selectedNoteIds.forEach(noteId => {
            const note = notes.find(n => n.id === noteId);
            if (note) {
                const deltaTime = note.startTime - baseNote.startTime;
                const deltaPitch = note.pitch - baseNote.pitch;
                relativePositions.set(noteId, { deltaTime, deltaPitch });
            }
        });
        return relativePositions;
    }, [notes]);

    const startDrag = useCallback((noteId: string, event: React.MouseEvent | React.TouchEvent, dragType: 'move' | 'resize', selectedNoteIds: string[] = []) => {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        // タッチイベントとマウスイベントの座標を取得
        let clientX: number, clientY: number;
        if ('touches' in event && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else if ('clientX' in event) {
            clientX = event.clientX;
            clientY = event.clientY;
        } else {
            return; // 無効なイベント
        }

        const allSelectedIds = selectedNoteIds.length > 0 ? selectedNoteIds : [noteId];
        const relativePositions = allSelectedIds.length > 1 
            ? calculateRelativePositions(allSelectedIds, noteId)
            : new Map();
        
        dragSnapshotRef.current = notes.filter(n => allSelectedIds.includes(n.id)).map(n => ({
            id: n.id,
            startTime: n.startTime,
            pitch: n.pitch,
            duration: n.duration,
            trackId: n.trackId
        }));

        setDragState({
            isDragging: true,
            noteId,
            dragType,
            startX: clientX,
            startY: clientY,
            originalNote: { ...note },
            currentNote: { ...note },
            selectedNoteIds: allSelectedIds,
            relativePositions
        });
    }, [notes, calculateRelativePositions]);

    const handleDrag = useCallback((event: MouseEvent | TouchEvent) => {
        const s = dragStateRef.current;
        if (!s.isDragging || !s.originalNote || !s.currentNote) return;

        // タッチイベントとマウスイベントの座標を取得
        let clientX: number, clientY: number;
        if ('touches' in event && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else if ('clientX' in event) {
            clientX = event.clientX;
            clientY = event.clientY;
        } else {
            return; // 無効なイベント
        }

        const deltaX = clientX - s.startX;
        const deltaY = clientY - s.startY;

        if (s.dragType === 'move') {
            const rawDelta = deltaX / cellWidthRef.current;
            const deltaTime = Math.round(rawDelta);
            const deltaPitch = Math.round(-deltaY / cellHeightRef.current);

            const newStartTime = Math.max(0, s.originalNote.startTime + deltaTime);
            const newPitch = Math.max(21, Math.min(108, s.originalNote.pitch + deltaPitch));

            if (
                s.currentNote.startTime === newStartTime &&
                s.currentNote.pitch === newPitch
            ) {
                return;
            }

            setDragState(prev => {
                if (!prev.currentNote) return prev;
                if (prev.currentNote.startTime === newStartTime && prev.currentNote.pitch === newPitch) {
                    return prev;
                }
                return {
                    ...prev,
                    currentNote: {
                        ...prev.currentNote,
                        startTime: newStartTime,
                        pitch: newPitch,
                        noteName: getNoteName(newPitch),
                        measure: Math.floor(newStartTime / cellsPerMeasureRef.current) + 1,
                        beat: (newStartTime % cellsPerMeasureRef.current) + 1
                    }
                };
            });
        } else if (s.dragType === 'resize') {
            const rawDelta = deltaX / cellWidthRef.current;
            const deltaTime = Math.round(rawDelta);
            const newDuration = Math.max(1, s.originalNote.duration + deltaTime);

            if (s.currentNote.duration === newDuration) {
                return;
            }

            setDragState(prev => {
                if (!prev.currentNote) return prev;
                if (prev.currentNote.duration === newDuration) {
                    return prev;
                }
                return {
                    ...prev,
                    currentNote: {
                        ...prev.currentNote,
                        duration: newDuration
                    }
                };
            });
        }
    }, []);

    const clearAllNotes = useCallback(() => {
        setNotes([]);
    }, []);

    const restoreNotesFromHistory = useCallback((historyNotes: Note[] | null) => {
        if (!historyNotes) return;
        
        setNotes(historyNotes);
        idSetRef.current.clear();
        historyNotes.forEach(note => idSetRef.current.add(note.id));
    }, []);

    const isInitialized = useRef(false);

    const handleUndo = useCallback(() => {
        const historyNotes = undo();
        restoreNotesFromHistory(historyNotes);
    }, [undo, restoreNotesFromHistory]);

    const handleRedo = useCallback(() => {
        const historyNotes = redo();
        restoreNotesFromHistory(historyNotes);
    }, [redo, restoreNotesFromHistory]);

    useEffect(() => {
        if (!isInitialized.current) {
            isInitialized.current = true;
            return;
        }
        if (dragState.isDragging) {
            return;
        }
        if (notes.length === 0 && currentIndex === -1) {
            saveState(notes);
            return;
        }
        if (notes.length > 0) {
            const timeoutId = setTimeout(() => {
                saveState(notes);
                options?.onCommit?.();
            }, 100);
            
            return () => clearTimeout(timeoutId);
        }
    }, [notes, saveState, currentIndex, dragState.isDragging, options]);

    const endDrag = useCallback(() => {
        if (!dragState.currentNote || !dragState.noteId) {
            setDragState({
                isDragging: false,
                noteId: null,
                dragType: null,
                startX: 0,
                startY: 0,
                originalNote: null,
                currentNote: null,
                selectedNoteIds: [],
                relativePositions: new Map()
            });
            endDragBehaviorRef.current = 'move';
            return;
        }

        if (endDragBehaviorRef.current === 'copy' || endDragBehaviorRef.current === 'cancel') {
            setDragState({
                isDragging: false,
                noteId: null,
                dragType: null,
                startX: 0,
                startY: 0,
                originalNote: null,
                currentNote: null,
                selectedNoteIds: [],
                relativePositions: new Map()
            });
            endDragBehaviorRef.current = 'move';
            return;
        }

        if (dragState.dragType === 'move' && dragState.originalNote && dragState.currentNote) {
            const dx = dragState.currentNote.startTime - dragState.originalNote.startTime;
            const dp = dragState.currentNote.pitch - dragState.originalNote.pitch;
            const updates: Array<{ noteId: string; updates: NoteUpdate }> = [];
            dragSnapshotRef.current.forEach(s => {
                const validStartTime = Math.max(0, s.startTime + dx);
                const validPitch = Math.max(21, Math.min(108, s.pitch + dp));
                updates.push({ noteId: s.id, updates: { id: s.id, startTime: validStartTime, pitch: validPitch } });
            });
            if (updates.length) updateMultipleNotes(updates);
        } else if (dragState.dragType === 'resize' && dragState.currentNote) {
            const updates: Array<{ noteId: string; updates: NoteUpdate }> = [];
            dragState.selectedNoteIds.forEach(id => {
                updates.push({ 
                    noteId: id, 
                    updates: { 
                        id, 
                        duration: Math.max(1, dragState.currentNote!.duration) 
                    } 
                });
            });
            if (updates.length) updateMultipleNotes(updates);
        }

        setDragState({
            isDragging: false,
            noteId: null,
            dragType: null,
            startX: 0,
            startY: 0,
            originalNote: null,
            currentNote: null,
            selectedNoteIds: [],
            relativePositions: new Map()
        });

        setTimeout(() => {
            saveState(notes);
            options?.onCommit?.();
        }, 50);
        endDragBehaviorRef.current = 'move';
        dragSnapshotRef.current = [];
    }, [dragState, updateMultipleNotes, saveState, notes, options]);

    const displayNotes = useMemo(() => {
        if (!dragState.isDragging || !dragState.currentNote) {
            return notes;
        }
        if (
            dragState.originalNote &&
            ((dragState.dragType === 'move' &&
              dragState.currentNote.startTime === dragState.originalNote.startTime &&
              dragState.currentNote.pitch === dragState.originalNote.pitch) ||
             (dragState.dragType === 'resize' &&
              dragState.currentNote.duration === dragState.originalNote.duration))
        ) {
            return notes;
        }
        
        return notes.map(note => {
            if (dragState.selectedNoteIds.length === 1 && note.id === dragState.noteId) {
                return dragState.currentNote || note;
            }
            if (dragState.selectedNoteIds.length > 1 && dragState.selectedNoteIds.includes(note.id)) {
                const relativePos = dragState.relativePositions.get(note.id);
                if (relativePos && dragState.currentNote) {
                    if (dragState.dragType === 'move') {
                        const newStartTime = dragState.currentNote.startTime + relativePos.deltaTime;
                        const newPitch = dragState.currentNote.pitch + relativePos.deltaPitch;
                        
                        return {
                            ...note,
                            startTime: newStartTime,
                            pitch: newPitch,
                            noteName: getNoteName(newPitch),
                            measure: Math.floor(newStartTime / cellsPerMeasure) + 1,
                            beat: (newStartTime % cellsPerMeasure) + 1
                        };
                    } else if (dragState.dragType === 'resize') {
                        return {
                            ...note,
                            duration: dragState.currentNote.duration
                        };
                    }
                }
            }
            
            return note;
        });
    }, [notes, dragState, cellsPerMeasure]);

    const replaceNotes = useCallback((newNotes: Note[]) => {
        idSetRef.current = new Set(newNotes.map(n => n.id));
        counterRef.current = newNotes.length;
        setNotes(newNotes);
        saveState(newNotes);
        options?.onCommit?.();
        setSelectedNotes(new Set());
    }, [saveState, options]);
 
    return {
        notes: displayNotes,
        createNote,
        deleteNote,
        deleteMultipleNotes,
        updateNote,
        updateMultipleNotes,
        getNoteAtPosition,
        getActiveTrackNoteAtPosition,
        clearAllNotes,
        dragState,
        startDrag,
        handleDrag,
        endDrag,
        setEndDragBehavior,
        getDragSnapshot,
        handleUndo,
        handleRedo,
        canUndo,
        canRedo,
        selectedNotes,
        selectNote,
        deselectNote,
        selectMultipleNotes,
        clearSelection,
        isNoteSelected,
        selectAllNotes,
        replaceNotes
    };
}; 