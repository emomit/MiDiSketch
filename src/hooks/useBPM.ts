import { useState, useCallback } from 'react';
import { BPMState, TimeSignature } from '../types/playback';

export const useBPM = () => {
  // BPM状態
  const [bpmState, setBpmState] = useState<BPMState>({
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    isMetronomeEnabled: false,
    isPlaying: false,
    isLoopEnabled: false,
    loopStartMeasure: 0,
    loopEndMeasure: 4,
  });

  const setBPM = useCallback((bpm: number) => {
    setBpmState(prev => ({ ...prev, bpm: Math.max(40, Math.min(200, bpm)) }));
  }, []);

  const setTimeSignature = useCallback((timeSignature: TimeSignature) => {
    setBpmState(prev => ({ ...prev, timeSignature }));
  }, []);


  const toggleMetronome = useCallback(() => {
    setBpmState(prev => ({ ...prev, isMetronomeEnabled: !prev.isMetronomeEnabled }));
  }, []);


  const setPlaying = useCallback((isPlaying: boolean) => {
    setBpmState(prev => ({ ...prev, isPlaying }));
  }, []);


  const toggleLoop = useCallback(() => {
    setBpmState(prev => ({ ...prev, isLoopEnabled: !prev.isLoopEnabled }));
  }, []);


  const setLoopRange = useCallback((startMeasure: number, endMeasure: number) => {
    const start = Math.max(0, Math.min(startMeasure, endMeasure));
    const end = Math.max(start + 1, endMeasure);
    setBpmState(prev => ({
      ...prev,
      loopStartMeasure: start,
      loopEndMeasure: end,
    }));
  }, []);

  const setState = useCallback((state: BPMState) => {
    setBpmState(state);
  }, []);

  return {
    bpmState,
    setBPM,
    setTimeSignature,
    toggleMetronome,
    setPlaying,
    toggleLoop,
    setLoopRange,
    setState,
  };
};