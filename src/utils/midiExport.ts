import { Note } from '../types/note';

interface MIDIHeader {
    format: number;
    tracks: number;
    timeDivision: number;
}

// removed unused MIDITrack interface

interface MIDIEvent {
    deltaTime: number;
    type: number;
    data: number[];
}

export const generateMIDIFile = (notes: Note[], tempo: number = 120, subdivisionsPerBeat: number = 4): ArrayBuffer => {
    const timeDivision = 480;
    const microsecondsPerBeat = Math.floor(60000000 / tempo);
    
    const headerChunk = createHeaderChunk({
        format: 1,
        tracks: 2,
        timeDivision
    });

    const tempoTrack = createTempoTrack(microsecondsPerBeat);
    
    const noteTrack = createNoteTrack(notes, timeDivision, subdivisionsPerBeat);

    const fileSize = headerChunk.length + tempoTrack.length + noteTrack.length;
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);
    
    let offset = 0;
    
    writeBytes(view, headerChunk, offset);
    offset += headerChunk.length;
    
    writeBytes(view, tempoTrack, offset);
    offset += tempoTrack.length;
    
    writeBytes(view, noteTrack, offset);

    return buffer;
};

const createHeaderChunk = (header: MIDIHeader): Uint8Array => {
    const chunk = new Uint8Array(14);
    const view = new DataView(chunk.buffer);
    
    chunk[0] = 0x4D; chunk[1] = 0x54; chunk[2] = 0x68; chunk[3] = 0x64;
    
    view.setUint32(4, 6, false);
    
    view.setUint16(8, header.format, false);
    
    view.setUint16(10, header.tracks, false);
    
    view.setUint16(12, header.timeDivision, false);
    
    return chunk;
};
    
const createTempoTrack = (microsecondsPerBeat: number): Uint8Array => {
    const events: MIDIEvent[] = [
        { deltaTime: 0, type: 0xFF, data: [0x51, 0x03, ...intToBytes(microsecondsPerBeat, 3)] },
        { deltaTime: 0, type: 0xFF, data: [0x2F, 0x00] }
    ];
    
    return createTrackChunk(events);
};

const createNoteTrack = (notes: Note[], timeDivision: number, subdivisionsPerBeat: number): Uint8Array => {
    const ticksPerCell = Math.max(1, Math.floor(timeDivision / subdivisionsPerBeat));

    type RawEvent = { tick: number; type: number; data: number[]; priority: number };
    const rawEvents: RawEvent[] = [];

    notes.forEach(note => {
        const startTick = Math.max(0, Math.floor(note.startTime * ticksPerCell));
        const endTick = Math.max(startTick + 1, Math.floor((note.startTime + note.duration) * ticksPerCell));
        rawEvents.push({ tick: startTick, type: 0x90, data: [note.pitch, note.velocity], priority: 1 });
        rawEvents.push({ tick: endTick, type: 0x80, data: [note.pitch, 0], priority: 0 });
    });

    rawEvents.sort((a, b) => (a.tick - b.tick) || (a.priority - b.priority));

    const events: MIDIEvent[] = [];
    let prevTick = 0;
    rawEvents.forEach(ev => {
        const delta = Math.max(0, ev.tick - prevTick);
        events.push({ deltaTime: delta, type: ev.type, data: ev.data });
        prevTick = ev.tick;
    });

    events.push({ deltaTime: 0, type: 0xFF, data: [0x2F, 0x00] });

    return createTrackChunk(events);
};

const createTrackChunk = (events: MIDIEvent[]): Uint8Array => {
    let totalSize = 0;
    events.forEach(event => {
        totalSize += getVariableLengthSize(event.deltaTime);
        totalSize += 1;
        totalSize += event.data.length;
    });
    
    const chunk = new Uint8Array(8 + totalSize);
    const view = new DataView(chunk.buffer);
    
    chunk[0] = 0x4D; chunk[1] = 0x54; chunk[2] = 0x72; chunk[3] = 0x6B;
    
    view.setUint32(4, totalSize, false);
    
    let offset = 8;
    events.forEach(event => {
        offset += writeVariableLength(chunk, event.deltaTime, offset);
        chunk[offset++] = event.type;
        event.data.forEach(byte => chunk[offset++] = byte);
    });
    
    return chunk;
};

const writeVariableLength = (array: Uint8Array, value: number, offset: number): number => {
    const bytes = [];
    let temp = value;
    
    do {
        bytes.unshift(temp & 0x7F);
        temp >>= 7;
    } while (temp > 0);
    
    for (let i = 0; i < bytes.length - 1; i++) {
        bytes[i] |= 0x80;
    }
    
    bytes.forEach(byte => array[offset++] = byte);
    return bytes.length;
};

const getVariableLengthSize = (value: number): number => {
    let size = 1;
    let temp = value;
    
    while (temp > 0x7F) {
        temp >>= 7;
        size++;
    }
    
    return size;
};

const intToBytes = (value: number, bytes: number): number[] => {
    const result = [];
    for (let i = bytes - 1; i >= 0; i--) {
        result.push((value >> (i * 8)) & 0xFF);
    }
    return result;
};

const writeBytes = (view: DataView, bytes: Uint8Array, offset: number) => {
    bytes.forEach((byte, index) => {
        view.setUint8(offset + index, byte);
    });
};

export const downloadMIDI = (notes: Note[], filename: string = 'piano-roll.mid', tempo: number = 120, subdivisionsPerBeat: number = 4) => {
    const midiData = generateMIDIFile(notes, tempo, subdivisionsPerBeat);
    const blob = new Blob([midiData], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}; 