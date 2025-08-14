import { useState, useCallback, useRef, useEffect } from 'react';
import { BPMState } from '../types/playback';
import type { Note } from '../types/note';
import type { Track } from '../types/track';

let globalAudioContext: AudioContext | null = null;
let globalMasterGain: GainNode | null = null;
let globalCompressor: DynamicsCompressorNode | null = null;

export const useAudio = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorsRef = useRef<Map<string, OscillatorNode>>(new Map());
    const masterGainRef = useRef<GainNode | null>(null);
    const compressorRef = useRef<DynamicsCompressorNode | null>(null);
    const scheduledNodesRef = useRef<Set<{ osc: OscillatorNode; env: GainNode }>>(new Set());
    const [isPlaying, setIsPlaying] = useState(false);
    const [bpmState, setBpmState] = useState<BPMState>({
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        isMetronomeEnabled: false,
        isPlaying: false,
        isLoopEnabled: false,
        loopStartMeasure: 0,
        loopEndMeasure: 4,
    });

    const initAudio = useCallback(() => {
        if (!globalAudioContext) {
            const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
              || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (AC) globalAudioContext = new AC();
        }
        const ctx = globalAudioContext;
        if (!ctx) return;
        if (!globalMasterGain) {
            const g = ctx.createGain();
            g.gain.value = 0.35;
            globalMasterGain = g;
        }
        if (!globalCompressor) {
            const comp = ctx.createDynamicsCompressor();
            comp.threshold.value = -18;
            comp.knee.value = 24;
            comp.ratio.value = 6;
            comp.attack.value = 0.003;
            comp.release.value = 0.25;
            globalCompressor = comp;
        }
        try { globalMasterGain.disconnect(); } catch {}
        globalMasterGain.connect(globalCompressor!);
        try { globalCompressor!.disconnect(); } catch {}
        globalCompressor!.connect(ctx.destination);

        audioContextRef.current = globalAudioContext;
        masterGainRef.current = globalMasterGain;
        compressorRef.current = globalCompressor;
    }, []);


    const midiToFrequency = useCallback((midiNote: number): number => {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }, []);


    const getTimeInterval = useCallback((bpm: number): number => {
        return (60 / bpm) * 1000;
    }, []);


    const playNote = useCallback((midiNote: number, duration: number = 1000, wave: OscillatorType = 'sine', volume: number = 0.6) => {
        initAudio();
        const audioContext = globalAudioContext;
        if (!audioContext) return;

        const frequency = midiToFrequency(midiNote);
        const oscillator = audioContext.createOscillator();
        const env = audioContext.createGain();

        oscillator.connect(env);
        if (globalMasterGain) {
            env.connect(globalMasterGain);
        } else {
            env.connect(audioContext.destination);
        }

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = wave;

        const now = audioContext.currentTime;
        const end = now + duration / 1000;
        const peak = Math.max(0, Math.min(1, volume)) * 0.9;
        const attackTime = 0.005;
        const releaseTime = 0.02;

        env.gain.cancelScheduledValues(now);
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(peak, now + attackTime);
        env.gain.setValueAtTime(peak, end - releaseTime);
        env.gain.linearRampToValueAtTime(0.0001, end);

        oscillator.start(now);
        oscillator.stop(end);
        const noteId = `note-${midiNote}-${Date.now()}`;
        oscillatorsRef.current.set(noteId, oscillator);

        setTimeout(() => {
            oscillatorsRef.current.delete(noteId);
        }, duration);
    }, [initAudio, midiToFrequency]);

    const stopNote = useCallback((midiNote: number) => {
        oscillatorsRef.current.forEach((oscillator, noteId) => {
            if (noteId.includes(`note-${midiNote}-`)) {
                oscillator.stop();
                oscillatorsRef.current.delete(noteId);
            }
        });
    }, []);

    const stopAllNotes = useCallback(() => {
        oscillatorsRef.current.forEach((oscillator) => {
            oscillator.stop();
        });
        oscillatorsRef.current.clear();
        setIsPlaying(false);
    }, []);

    const scheduleNoteAt = useCallback((midiNote: number, startInMs: number, durationMs: number, wave: OscillatorType, volume: number) => {
        initAudio();
        const audioContext = globalAudioContext;
        if (!audioContext) return;

        const startAt = audioContext.currentTime + Math.max(0, startInMs) / 1000;
        const endAt = startAt + Math.max(0, durationMs) / 1000;

        const frequency = midiToFrequency(midiNote);
        const oscillator = audioContext.createOscillator();
        const env = audioContext.createGain();

        oscillator.connect(env);
        if (globalMasterGain) {
            env.connect(globalMasterGain);
        } else {
            env.connect(audioContext.destination);
        }

        oscillator.frequency.setValueAtTime(frequency, startAt);
        oscillator.type = wave;

        const peak = Math.max(0, Math.min(1, volume)) * 0.9;
        const attackTime = 0.005;
        const releaseTime = 0.02;

        env.gain.cancelScheduledValues(audioContext.currentTime);
        env.gain.setValueAtTime(0, startAt);
        env.gain.linearRampToValueAtTime(peak, startAt + attackTime);
        env.gain.setValueAtTime(peak, Math.max(startAt, endAt - releaseTime));
        env.gain.linearRampToValueAtTime(0.0001, endAt);

        oscillator.start(startAt);
        oscillator.stop(endAt);
        const nodeRef = { osc: oscillator, env };
        scheduledNodesRef.current.add(nodeRef);
        const clearAfter = Math.max(0, (endAt - audioContext.currentTime) * 1000) + 10;
        setTimeout(() => {
            try { nodeRef.osc.disconnect(); } catch {}
            try { nodeRef.env.disconnect(); } catch {}
            scheduledNodesRef.current.delete(nodeRef);
        }, clearAfter);
    }, [initAudio, midiToFrequency]);

    const metronomeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const createMetronomeSound = useCallback((isAccent: boolean = false) => {
        if (!audioContextRef.current) {
            const AC2 = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
              || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (AC2) audioContextRef.current = new AC2();
        }

        const audioContext = audioContextRef.current;
        if (!audioContext) return;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const frequency = isAccent ? 800 : 600;
        const volume = isAccent ? 0.3 : 0.2;

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }, []);

    const startMetronome = useCallback(() => {
        if (!bpmState.isMetronomeEnabled) return;

        const isCompound = bpmState.timeSignature.denominator === 8 && bpmState.timeSignature.numerator % 3 === 0;
        const beatsPerMeasure = isCompound ? bpmState.timeSignature.numerator / 3 : bpmState.timeSignature.numerator;
        const intervalMs = (60 / bpmState.bpm) * 1000;
        let beatCount = 0;

        createMetronomeSound(true);
        beatCount = 1;

        metronomeIntervalRef.current = setInterval(() => {
            const isAccent = beatCount % beatsPerMeasure === 0;
            createMetronomeSound(isAccent);
            beatCount++;
        }, intervalMs);
    }, [bpmState.bpm, bpmState.timeSignature.numerator, bpmState.timeSignature.denominator, bpmState.isMetronomeEnabled, createMetronomeSound]);

    const stopMetronome = useCallback(() => {
        if (metronomeIntervalRef.current) {
            clearInterval(metronomeIntervalRef.current);
            metronomeIntervalRef.current = null;
        }
    }, []);

    const loopIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const endTimerRef = useRef<NodeJS.Timeout | null>(null);
    const playbackIdRef = useRef(0);

    const isPlayingRef = useRef(false);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

    const stopPlayback = useCallback(() => {
        if (loopIntervalRef.current) { clearInterval(loopIntervalRef.current); loopIntervalRef.current = null; }
        if (endTimerRef.current) { clearTimeout(endTimerRef.current); endTimerRef.current = null; }
        playbackIdRef.current += 1;
        scheduledNodesRef.current.forEach(({ osc, env }) => {
            try { env.gain.cancelScheduledValues(0); } catch {}
            try { env.gain.setValueAtTime(0, (audioContextRef.current?.currentTime ?? 0)); } catch {}
            try { osc.stop(); } catch {}
            try { osc.disconnect(); } catch {}
            try { env.disconnect(); } catch {}
        });
        scheduledNodesRef.current.clear();
        stopAllNotes();
        setIsPlaying(false);
        stopMetronome();
    }, [stopAllNotes, stopMetronome]);

    const startPlayback = useCallback((notes: Note[] = [], tracks: Track[] = []) => {
        initAudio();
        setIsPlaying(true);
        if (loopIntervalRef.current) { clearInterval(loopIntervalRef.current); loopIntervalRef.current = null; }
        if (endTimerRef.current) { clearTimeout(endTimerRef.current); endTimerRef.current = null; }
        playbackIdRef.current += 1;
        const currentPlaybackId = playbackIdRef.current;

        if (bpmState.isMetronomeEnabled) {
            stopMetronome();
            startMetronome();
        }
        
        const quarterMs = getTimeInterval(bpmState.bpm);
        const subdivisionsPerBeat = 4;
        const cellsPerMeasure = bpmState.timeSignature.numerator * subdivisionsPerBeat;
        const cellMs = quarterMs / subdivisionsPerBeat;
        
        const scheduleNotes = () => {
            const startOffsetCells = bpmState.isLoopEnabled
              ? bpmState.loopStartMeasure * cellsPerMeasure
              : 0;
            const endOffsetCells = bpmState.isLoopEnabled
              ? bpmState.loopEndMeasure * cellsPerMeasure
              : Number.POSITIVE_INFINITY;

            const soloed = tracks.filter(t => t.isSolo);
            const isSoloMode = soloed.length > 0;

            notes.forEach(note => {
                if (playbackIdRef.current !== currentPlaybackId) return;
                const track = tracks.find(t => t.id === note.trackId);
                if (!track) return;
                if (track.isMuted) return;
                if (isSoloMode && !track.isSolo) return;

                const wave: OscillatorType = (track.wave as OscillatorType) || 'sine';
                const clampedStart = Math.max(note.startTime, startOffsetCells);
                const relativeStartCells = clampedStart - startOffsetCells;
                const startTimeMs = relativeStartCells * cellMs;
                const durationCells = Math.min(note.startTime + note.duration, endOffsetCells) - clampedStart;
                const durationMs = Math.max(0, durationCells * cellMs);

                if (durationMs > 0) {
                  const vol = Math.max(0, Math.min(1, track.volume));
                  scheduleNoteAt(note.pitch, startTimeMs, durationMs, wave, vol);
                }
            });
        };

        scheduleNotes();

        if (bpmState.isLoopEnabled) {
            const loopLengthCells = (bpmState.loopEndMeasure - bpmState.loopStartMeasure) * cellsPerMeasure;
            const loopLengthMs = loopLengthCells * cellMs;
            loopIntervalRef.current = setInterval(() => {
                if (!isPlayingRef.current || playbackIdRef.current !== currentPlaybackId) {
                    if (loopIntervalRef.current) { clearInterval(loopIntervalRef.current); loopIntervalRef.current = null; }
                    return;
                }
                scheduleNotes();
            }, loopLengthMs) as NodeJS.Timeout;
        } else {
            let maxEndMs = 0;
            const startOffsetCells = 0;
            notes.forEach(note => {
                const endCells = note.startTime + note.duration - startOffsetCells;
                const endMs = endCells * cellMs;
                if (endMs > maxEndMs) maxEndMs = endMs;
            });
            endTimerRef.current = setTimeout(() => {
                if (playbackIdRef.current !== currentPlaybackId) return;
                stopPlayback();
            }, Math.max(0, maxEndMs) + 50) as NodeJS.Timeout;
        }
    }, [initAudio, getTimeInterval, bpmState.bpm, bpmState.isLoopEnabled, bpmState.loopStartMeasure, bpmState.loopEndMeasure, bpmState.timeSignature.numerator, bpmState.isMetronomeEnabled, scheduleNoteAt, startMetronome, stopMetronome, stopPlayback]);

    const togglePlayback = useCallback((notes: Note[] = [], tracks: Track[] = []) => {
        if (isPlaying) {
            stopPlayback();
        } else {
            startPlayback(notes, tracks);
        }
    }, [isPlaying, stopPlayback, startPlayback]);

    

    const updateMetronome = useCallback(() => {
        stopMetronome();
        if (bpmState.isMetronomeEnabled && bpmState.isPlaying) {
            startMetronome();
        }
    }, [bpmState.isMetronomeEnabled, bpmState.isPlaying, stopMetronome, startMetronome]);

    const updateBPMState = useCallback((newBPMState: BPMState) => {
        setBpmState(newBPMState);
    }, []);

    const getMasterVolume = useCallback((): number => {
        initAudio();
        return Math.max(0, Math.min(1, (globalMasterGain?.gain.value ?? 0.35)));
    }, [initAudio]);

    const setMasterVolume = useCallback((v: number) => {
        initAudio();
        if (!globalMasterGain) return;
        globalMasterGain.gain.value = Math.max(0, Math.min(1, v));
    }, [initAudio]);

    return {
        playNote,
        stopNote,
        stopAllNotes,
        initAudio,
        isPlaying,
        startPlayback,
        stopPlayback,
        togglePlayback,
        bpmState,
        updateBPMState,
        startMetronome,
        stopMetronome,
        updateMetronome,
        getMasterVolume,
        setMasterVolume,
    };
}; 