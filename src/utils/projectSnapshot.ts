import { z } from 'zod';
import type { Track } from '../types/track';
import type { Note } from '../types/note';
import type { BPMState } from '../types/playback';

export interface ProjectSnapshot {
  version: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  bpmState: BPMState;
  tracks: Track[];
  notes: Note[];
  selectedTrackId: string;
  measures: number;
}

export const projectSnapshotSchema = z.object({
  version: z.number().default(1),
  name: z.string().default('Untitled'),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
  bpmState: z.object({
    bpm: z.number().default(120),
    timeSignature: z.object({ numerator: z.number().default(4), denominator: z.number().default(4) }).default({ numerator: 4, denominator: 4 }),
    isMetronomeEnabled: z.boolean().default(false),
    isPlaying: z.boolean().default(false),
    isLoopEnabled: z.boolean().default(false),
    loopStartMeasure: z.number().default(0),
    loopEndMeasure: z.number().default(4),
  }).default({ bpm: 120, timeSignature: { numerator: 4, denominator: 4 }, isMetronomeEnabled: false, isPlaying: false, isLoopEnabled: false, loopStartMeasure: 0, loopEndMeasure: 4 }),
  tracks: z.array(z.object({
    id: z.string(),
    name: z.string().default('Track'),
    wave: z.enum(['sine','square','sawtooth','triangle']).default('sine'),
    color: z.string().default('#3b82f6'),
    volume: z.number().default(0.6),
    isMuted: z.boolean().default(false),
    isSolo: z.boolean().default(false)
  })).default([]),
  notes: z.array(z.object({
    id: z.string(),
    pitch: z.number(),
    startTime: z.number(),
    duration: z.number(),
    velocity: z.number(),
    channel: z.number(),
    noteName: z.string(),
    measure: z.number(),
    beat: z.number(),
    trackId: z.string(),
    zIndex: z.number(),
  })).default([]),
  selectedTrackId: z.string(),
  measures: z.number().default(3),
});

export const buildProjectSnapshot = (args: {
  name: string;
  tracks: Track[];
  notes: Note[];
  bpmState: BPMState;
  selectedTrackId: string;
  measures: number;
  previous?: ProjectSnapshot | null;
}): ProjectSnapshot => {
  const now = new Date().toISOString();
  const snapshot: ProjectSnapshot = {
    version: 1,
    name: args.name,
    createdAt: args.previous?.createdAt ?? now,
    updatedAt: now,
    bpmState: args.bpmState,
    tracks: args.tracks,
    notes: args.notes,
    selectedTrackId: args.selectedTrackId,
    measures: args.measures,
  };
  projectSnapshotSchema.parse(snapshot);
  return snapshot;
};

export const computeProjectSignature = (snapshot: ProjectSnapshot): string => {
  projectSnapshotSchema.parse(snapshot);
  return JSON.stringify({
    version: snapshot.version,
    name: snapshot.name,
    bpmState: snapshot.bpmState,
    tracks: snapshot.tracks,
    notes: snapshot.notes,
    selectedTrackId: snapshot.selectedTrackId,
    measures: snapshot.measures,
  });
};

