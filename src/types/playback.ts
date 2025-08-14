export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export interface BPMState {
  bpm: number;
  timeSignature: TimeSignature;
  isMetronomeEnabled: boolean;
  isPlaying: boolean;
  isLoopEnabled: boolean;
  loopStartMeasure: number;
  loopEndMeasure: number;
}

export interface LoopRange {
  startMeasure: number;
  endMeasure: number;
  isEnabled: boolean;
}

// 再生設定
export interface PlaybackSettings {
  bpm: BPMState;
  loop: LoopRange;
} 