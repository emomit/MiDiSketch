export interface Note {
    id: string;
    pitch: number;        // 音階（0-127）
    startTime: number;    // 開始位置（セル番号）
    duration: number;     // 長さ（セル数）
    velocity: number;     // 音の強さ（0-127）
    channel: number;      // MIDIチャンネル（0-15）
    noteName: string;     // 音名（C4, G#2など）
    measure: number;      // 小節番号
    beat: number;         // 小節内の拍位置
    trackId: string;
    zIndex: number;
}

export type NoteUpdate = Partial<Pick<Note, 'pitch' | 'startTime' | 'duration' | 'velocity' | 'channel'>> & {
    id: string;
};