import { Note } from '../types/note';
import { TPB } from './timeUtils';

// 可変長数量符号化
function vlq(n: number): Uint8Array {
  const bytes: number[] = [];
  do {
    bytes.unshift(n & 0x7F);
    n >>= 7;
  } while (n > 0);
  
  for (let i = 0; i < bytes.length - 1; i++) {
    bytes[i] |= 0x80;
  }
  return Uint8Array.from(bytes);
}

// 文字列エンコード
function str(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

// 16ビット整数
function u16(n: number): Uint8Array {
  return new Uint8Array([(n >> 8) & 255, n & 255]);
}

// 32ビット整数
function u32(n: number): Uint8Array {
  return new Uint8Array([(n >> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255]);
}

// ノートをMIDIイベントに変換
function notesToEvents(notes: Note[]): Array<{ tick: number; type: 'on' | 'off'; note: number; vel: number; }> {
  const events: Array<{ tick: number; type: 'on' | 'off'; note: number; vel: number; }> = [];
  
  notes.forEach(note => {
    const startTick = note.startTime * TPB / 16; // 16セル = 1拍と仮定
    const endTick = (note.startTime + note.duration) * TPB / 16;
    
    events.push({
      tick: startTick,
      type: 'on',
      note: note.pitch,
      vel: note.velocity
    });
    
    events.push({
      tick: endTick,
      type: 'off',
      note: note.pitch,
      vel: 0
    });
  });
  
  return events;
}

export function toMIDI(notes: Note[]): Blob {
  const events = notesToEvents(notes);
  events.sort((a, b) => a.tick - b.tick);
  
  const bytes: number[] = [];
  let lastTick = 0;
  
  for (const event of events) {
    const deltaTime = event.tick - lastTick;
    lastTick = event.tick;
    
    bytes.push(...vlq(deltaTime));
    
    if (event.type === 'on') {
      bytes.push(0x90, event.note, event.vel);
    } else {
      bytes.push(0x80, event.note, 0x00);
    }
  }
  
  // End of Track
  bytes.push(0x00, 0xFF, 0x2F, 0x00);
  
  // ヘッダ (MThd)
  const header = [
    ...str('MThd'),
    ...u32(6),
    ...u16(0),      // format 0
    ...u16(1),      // ntrks=1
    ...u16(TPB)     // division
  ];
  
  // トラック (MTrk)
  const trackData = Uint8Array.from(bytes);
  const track = [
    ...str('MTrk'),
    ...u32(trackData.length),
    ...trackData
  ];
  
  return new Blob([Uint8Array.from([...header, ...track])], { type: 'audio/midi' });
}

export function downloadMIDI(notes: Note[], filename: string = 'sketch.mid'): void {
  const blob = toMIDI(notes);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 