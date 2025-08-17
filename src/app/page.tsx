"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PianoRoll } from "../components/piano-roll";
import { useTracks } from "../hooks/useTracks";
import { useAudio } from "../hooks/useAudio";
import { useBPM } from "../hooks/useBPM";
import { Track } from "../types/track";
import type { Note } from "../types/note";
import { downloadMIDI } from "../utils/midiExport";
import { LoginSheet } from "../components/ui/Auth/LoginSheet";
import { InlineRename } from "../components/ui/InlineRename";
import { ColorPalette } from "../components/ui/ColorPalette";
import { UserMenu } from "../components/ui/Auth/UserMenu";
 
import { ProjectPickerSheet } from "../components/ui/ProjectPickerSheet";
import { upsertProject, upsertProjectWithRename, createVersion } from "../utils/projectApi";
import { getSupabaseClient } from "../utils/supabaseClient";
import { buildProjectSnapshot, computeProjectSignature } from "../utils/projectSnapshot";
import { downloadJson } from "../utils/downloadJson";

export default function Home() {
  const { 
    tracks, 
    selectedTrackId, 
    setSelectedTrackId, 
    addTrack, 
    deleteTrack, 
    updateTrack,
    setAllTracks
  } = useTracks();

  const { 
    bpmState, 
    setBPM, 
    setTimeSignature, 
    setPlaying,
    toggleLoop,
    setLoopRange,
    setState
  } = useBPM();
  
  const { 
    isPlaying, 
    togglePlayback, 
    updateBPMState
  } = useAudio();
  

  React.useEffect(() => {
    updateBPMState(bpmState);
  }, [bpmState, updateBPMState]);
  

  useEffect(() => {
    setPlaying(isPlaying);
  }, [isPlaying, setPlaying]);
  

  const [currentNotes, setCurrentNotes] = useState<Note[]>([]);
  const [selectedNotesCount, setSelectedNotesCount] = useState(0);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const handleNotesChange = useCallback((n: Note[]) => { setCurrentNotes(n); }, []);
  const handleSelectedNotesChange = useCallback((c: number) => { setSelectedNotesCount(c); }, []);
  const handleSelectedNotesSetChange = useCallback((notes: Set<string>) => { setSelectedNotes(notes); }, []);

  const handleMeasuresChange = useCallback((m: number) => {
    setCurrentMeasures(m);
    if (bpmState.isLoopEnabled) setLoopRange(0, m);
  }, [bpmState.isLoopEnabled, setLoopRange]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [projectName, setProjectName] = useState('My Project');
  const [hasDefault, setHasDefault] = useState<boolean>(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userIconRef = useRef<HTMLButtonElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const [palette, setPalette] = useState<{ open: boolean; trackId: string | null; top: number; left: number }>({ open: false, trackId: null, top: 0, left: 0 });
  const lastSignatureRef = useRef<string>("");
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [importedNotes, setImportedNotes] = useState<Note[] | null>(null);
  const [currentMeasures, setCurrentMeasures] = useState<number>(3);
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false);
  const [transpose, setTranspose] = useState<number>(0);
  
  const [cloudFlash, setCloudFlash] = useState(false);
  const [jsonFlash, setJsonFlash] = useState(false);
  const [midiFlash, setMidiFlash] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isBootLoadingExiting, setIsBootLoadingExiting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isTrackPanelOpenMobile, setIsTrackPanelOpenMobile] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'title' | 'audio' | 'length' | 'move' | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  type PianoApi = {
    undo?: () => void;
    redo?: () => void;
    clearSelection?: () => void;
    setSelectedLength?: (v: number) => void;
    setSelectedLengthArbitrary?: (v: number) => void;
    moveSelected?: (dx: number, dy: number) => void;
    applyChord?: (t: string) => void;
    chordLists?: Record<'major'|'minor'|'dominant'|'alt', string[]>;
    selectAll?: (notes: Note[]) => void;
    deleteMultipleNotes?: (ids: string[]) => void;
  };
  const pianoApiRef = useRef<PianoApi | null>(null);
  const [isChordToolbarOpen, setIsChordToolbarOpen] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [lengthSlider, setLengthSlider] = useState<number>(1);
  const [lengthInput, setLengthInput] = useState<number>(1);
  
  


  const lastAppliedTransposeRef = useRef<number>(0);
  useEffect(() => {
    const clamped = Math.max(-24, Math.min(24, transpose));
    if (clamped !== transpose) { setTranspose(clamped); return; }
    const delta = clamped - lastAppliedTransposeRef.current;
    if (delta === 0 || !Array.isArray(currentNotes) || currentNotes.length === 0) return;
    const transposed = currentNotes.map(n => ({
      ...n,
      pitch: Math.max(21, Math.min(108, n.pitch + delta))
    }));
    setImportedNotes(transposed);
    setCurrentNotes(transposed);
    lastAppliedTransposeRef.current = clamped;
  }, [transpose, currentNotes]);


  const latestRef = useRef({
    tracks,
    selectedTrackId,
    currentNotes,
    bpmState,
    currentMeasures,
    projectName,
    togglePlayback,
    toggleLoop,
    setLoopRange,
    updateTrack,
    addTrack,
  });
  useEffect(() => {
    latestRef.current = {
      tracks,
      selectedTrackId,
      currentNotes,
      bpmState,
      currentMeasures,
      projectName,
      togglePlayback,
      toggleLoop,
      setLoopRange,
      updateTrack,
      addTrack,
    };
  }, [tracks, selectedTrackId, currentNotes, bpmState, currentMeasures, projectName, togglePlayback, toggleLoop, setLoopRange, updateTrack, addTrack]);

  // キーボードショートカット
  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      const t = el as HTMLElement | null;
      if (!t) return false;
      const tag = t.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      if (e.repeat) return;
      const s = latestRef.current;
      const key = e.key.toLowerCase();

      // Meta 系
      if (e.metaKey) {
        if (key === 's') {
          e.preventDefault();

          (async () => {
            try {
              const newName = await upsertProjectWithRename({ name: s.projectName, data: s.currentNotes });
              if (newName && newName !== s.projectName) setProjectName(newName);
            } catch {}
          })();
          // ボタンフラッシュ
          setCloudFlash(true);
          setTimeout(() => setCloudFlash(false), 1200);
          return;
        }
        if (key === 'o') {
          e.preventDefault();
          setIsProjectPickerOpen(v => !v);
          return;
        }
        if (key === 'm') {
          e.preventDefault();
          downloadMIDI(s.currentNotes, 'piano-roll.mid', s.bpmState.bpm, 4);
          setMidiFlash(true);
          setTimeout(() => setMidiFlash(false), 800);
          return;
        }
        if (key === 'j') {
          e.preventDefault();
          const snapshot = buildProjectSnapshot({
            name: s.projectName,
            tracks: s.tracks,
            notes: s.currentNotes,
            bpmState: s.bpmState,
            selectedTrackId: s.selectedTrackId,
            measures: s.currentMeasures,
          });
          downloadJson(snapshot, `${s.projectName || 'project'}.json`);
          setJsonFlash(true);
          setTimeout(() => setJsonFlash(false), 800);
          return;
        }
      }

      if (e.code === 'Space' || key === ' ') {
        e.preventDefault();
        s.togglePlayback(s.currentNotes, s.tracks);
        return;
      }
      if (key === 'c') {
        const willEnable = !s.bpmState.isLoopEnabled;
        s.toggleLoop();
        if (willEnable) s.setLoopRange(0, s.currentMeasures);
        return;
      }
      if (key === 't') {
        s.addTrack();
        return;
      }
      if ((key === 's' || key === 'm' || key === '1' || key === '2' || key === '3' || key === '4') && s.selectedTrackId) {
        const track = s.tracks.find(tr => tr.id === s.selectedTrackId);
        if (!track) return;
        if (key === 's') {
          s.updateTrack(track.id, { isSolo: !track.isSolo });
          return;
        }
        if (key === 'm') {
          s.updateTrack(track.id, { isMuted: !track.isMuted });
          return;
        }
        const map: Record<string, 'sine' | 'square' | 'sawtooth' | 'triangle'> = {
          '1': 'sine',
          '2': 'square',
          '3': 'sawtooth',
          '4': 'triangle',
        };
        if (map[key]) {
          s.updateTrack(track.id, { wave: map[key] });
          return;
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSaveDefault = useCallback(() => {
    const snapshot = buildProjectSnapshot({
      name: projectName,
      tracks,
      notes: currentNotes,
      bpmState,
      selectedTrackId,
      measures: currentMeasures,
    });
    try {
      const key = currentUserId ? `defaultProject:${currentUserId}` : 'defaultProject:anon';
      localStorage.setItem(key, JSON.stringify(snapshot));
      setHasDefault(true);
    } catch {}
  }, [projectName, tracks, currentNotes, bpmState, selectedTrackId, currentMeasures, currentUserId]);

  const handleResetDefault = useCallback(() => {
    try {
      const key = currentUserId ? `defaultProject:${currentUserId}` : 'defaultProject:anon';
      localStorage.removeItem(key);
      setHasDefault(false);
    } catch {}
  }, [currentUserId]);

  const handleLoadDefault = useCallback(() => {
    // 保存確認
    const shouldSave = confirm('現在のプロジェクトを保存しますか？');
    if (shouldSave) {
      (async () => { try { await upsertProject({ name: projectName, data: currentNotes }); } catch {} })();
    }
    try {
      const key = currentUserId ? `defaultProject:${currentUserId}` : 'defaultProject:anon';
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d?.bpmState) setState(d.bpmState);
      if (d?.tracks && d?.selectedTrackId) setAllTracks(d.tracks, d.selectedTrackId);
      setImportedNotes(Array.isArray(d?.notes) ? d.notes : []);
      if (typeof d?.measures === 'number') setCurrentMeasures(d.measures);
      if (typeof d?.name === 'string') setProjectName(d.name);
    } catch {}
  }, [projectName, currentNotes, setState, setAllTracks, setImportedNotes, setCurrentMeasures, currentUserId]);


  useEffect(() => {
    const snapshot = buildProjectSnapshot({
      name: projectName,
      tracks,
      notes: currentNotes,
      bpmState,
      selectedTrackId,
      measures: currentMeasures,
    });
    const sig = computeProjectSignature(snapshot);
    if (sig !== lastSignatureRef.current) {
      lastSignatureRef.current = sig;
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(async () => {
        try { await upsertProject({ name: projectName, data: snapshot }); } catch {}
        try {
          const ns = currentUserId ? `autosave:${currentUserId}:${projectName}` : `autosave:anon:${projectName}`;
          localStorage.setItem(ns, JSON.stringify(snapshot));
          localStorage.setItem('autosave:lastProjectName', projectName);
        } catch {}
      }, 1000);
    }
    const id = setInterval(async () => {
      try { await createVersion(projectName); } catch {}
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [projectName, tracks, currentNotes, bpmState, selectedTrackId, currentUserId, currentMeasures, transpose]);

  // 起動時復元
  useEffect(() => {
    if (!authChecked) return;
    try {
      const rawName = localStorage.getItem('autosave:lastProjectName');
      const ns = currentUserId && rawName ? `autosave:${currentUserId}:${rawName}` : (rawName ? `autosave:anon:${rawName}` : null);
      const raw = ns ? localStorage.getItem(ns) : null;
      if (raw) {
        const snapshot = JSON.parse(raw);
        if (snapshot?.bpmState) setState(snapshot.bpmState);
        if (snapshot?.tracks && snapshot?.selectedTrackId) setAllTracks(snapshot.tracks, snapshot.selectedTrackId);
        setImportedNotes(Array.isArray(snapshot?.notes) ? snapshot.notes : []);
        if (typeof rawName === 'string') setProjectName(rawName);
        if (typeof snapshot?.measures === 'number') setCurrentMeasures(snapshot.measures);
      }
    } catch {}
    if (isBootLoading) {
      setIsBootLoadingExiting(true);
      setTimeout(() => setIsBootLoading(false), 500);
    }
  }, [authChecked, currentUserId, setAllTracks, setState, isBootLoading]);
  
  useEffect(() => {
    if (!isBootLoading) return;
    const t = setTimeout(() => {
      setIsBootLoadingExiting(true);
      setTimeout(() => setIsBootLoading(false), 500);
    }, 1000);
    return () => clearTimeout(t);
  }, [isBootLoading]);

  useEffect(() => {
    setIsBootLoadingExiting(false);
  }, []);
 
  useEffect(() => {
    const onDocDown = (e: Event) => {
      if (!palette.open) return;
      const target = e.target as Node;
      if (paletteRef.current && paletteRef.current.contains(target)) return;
      setPalette(prev => ({ ...prev, open: false }));
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('touchstart', onDocDown, { passive: true } as AddEventListenerOptions);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('touchstart', onDocDown as EventListener);
    };
  }, [palette.open]);


  useEffect(() => {
    if (selectedNotesCount === 0 && (activeMobileTab === 'length' || activeMobileTab === 'move')) {
      setActiveMobileTab(null);
    }
    if (selectedNotesCount === 0 && isChordToolbarOpen) {
      setIsChordToolbarOpen(false);
    }
  }, [selectedNotesCount, activeMobileTab, isChordToolbarOpen]);


  useEffect(() => {
    const open = () => setIsChordToolbarOpen(true);
    window.addEventListener('open-mobile-chord-toolbar', open as EventListener);
    return () => window.removeEventListener('open-mobile-chord-toolbar', open as EventListener);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setCurrentUserEmail(data.user?.email ?? null);
      setCurrentUserId(data.user?.id ?? null);
      setAuthChecked(true);
      try {
        const legacy = localStorage.getItem('defaultProject');
        if (legacy && data.user?.id) {
          localStorage.setItem(`defaultProject:${data.user.id}`, legacy);
          localStorage.removeItem('defaultProject');
        }
        const key = data.user?.id ? `defaultProject:${data.user.id}` : 'defaultProject:anon';
        setHasDefault(!!localStorage.getItem(key));
      } catch {}
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setCurrentUserEmail(session?.user?.email ?? null);
      setCurrentUserId(session?.user?.id ?? null);
      if (session?.user) setIsLoginOpen(false);
      if (!session?.user) {
        try {
          localStorage.removeItem('autosave:lastSnapshot');
          localStorage.removeItem('autosave:lastProjectName');
        } catch {}
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div>
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {isBootLoading && (
          <div className={`fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center transition-transform duration-500 ease-in-out ${
            isBootLoadingExiting ? '-translate-x-full' : 'translate-x-0'
          }`}>
            <div className="text-white text-6xl md:text-8xl font-bold tracking-wider">
              MiDiSketch
            </div>
          </div>
        )}
        <div className="hidden md:flex bg-slate-800 rounded-br-lg overflow-visible whitespace-nowrap"> 
          
          <div>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white text-xl group-focus-within:text-blue-400">
                music_note
              </span>
              <input 
                type="text" 
                className="px-10 py-2 bg-slate-00 rounded-md text-white focus:outline-none focus:ring-none focus:bg-slate-500 hover:bg-slate-500 m-2"
                placeholder="Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
          </div>

          
          <div className="w-px bg-slate-700 m-2"></div>

          
          <div className="relative group m-2">
            <button 
              className={`rounded-md px-4 py-2 transition-all flex items-center justify-center active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${midiFlash ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-700 hover:bg-slate-600'}`}
              onClick={() => {
                downloadMIDI(
                  currentNotes,
                  'piano-roll.mid',
                  bpmState.bpm,
                  4
                );
                setMidiFlash(true);
                setTimeout(() => setMidiFlash(false), 800);
              }}
            >
              <span className="material-symbols-outlined text-white text-xl">audio_file</span>
            </button>
            <div className="pointer-events-none absolute left-1/2 top-full z-[10012] mt-1 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
              <div className="px-2 py-1 text-xs text-white bg-slate-800 border border-slate-700 rounded shadow">MIDI出力</div>
            </div>
          </div>
          <div className="relative group m-2">
          <button 
              className={`rounded-md px-4 py-2 transition-all flex items-center justify-center active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${jsonFlash ? 'bg-orange-500 hover:bg-orange-400' : 'bg-slate-700 hover:bg-slate-600'}`}
            onClick={() => {
                const snapshot = buildProjectSnapshot({
                  name: projectName,
                  tracks,
                  notes: currentNotes,
                  bpmState,
                  selectedTrackId,
                  measures: currentMeasures,
                });
                downloadJson(snapshot, `${projectName || 'project'}.json`);
                setJsonFlash(true);
                setTimeout(() => setJsonFlash(false), 800);
              }}
            >
              <span className="material-symbols-outlined text-white text-xl">file_download</span>
            </button>
            <div className="pointer-events-none absolute left-1/2 top-full z-[10012] mt-1 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
              <div className="px-2 py-1 text-xs text-white bg-slate-800 border border-slate-700 rounded shadow">JSON書き出し</div>
            </div>
          </div>
          <div className="relative group m-2">
            <button 
              className="rounded-md bg-slate-700 px-4 py-2 hover:bg-slate-600 transition-all flex items-center justify-center active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
              onClick={() => setIsProjectPickerOpen(true)}
            >
              <span className="material-symbols-outlined text-white text-xl">folder_open</span>
            </button>
            <div className="pointer-events-none absolute left-1/2 top-full z-[10012] mt-1 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
              <div className="px-2 py-1 text-xs text-white bg-slate-800 border border-slate-700 rounded shadow">読み込み</div>
            </div>
          </div>
          <div className="relative group m-2">
            <button
              className={`rounded-md px-4 py-2 transition-all flex items-center justify-center active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${cloudFlash ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-700 hover:bg-slate-600'}`}
              onClick={async () => {
                try {
                  const newName = await upsertProjectWithRename({ name: projectName, data: currentNotes });
                  if (newName && newName !== projectName) setProjectName(newName);
                } catch {}
              }}
            >
              <span className="material-symbols-outlined text-white text-xl">cloud_done</span>
          </button>
            <div className="pointer-events-none absolute left-1/2 top-full z-[10012] mt-1 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
              <div className="px-2 py-1 text-xs text-white bg-slate-800 border border-slate-700 rounded shadow">クラウド保存</div>
            </div>
          </div>

          
          <div className="w-px bg-slate-700 m-2"></div>

          
          <div className="relative group m-2 select-none">
            <button
              className="rounded-md bg-slate-700 px-4 py-2 hover:bg-slate-600 transition-all flex items-center justify-center text-white text-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
              onMouseDown={(e) => {
                e.preventDefault();
                const startY = e.clientY;
                const startBpm = bpmState.bpm;
                let raf: number | null = null;
                const onMove = (ev: MouseEvent) => {
                  const dy = ev.clientY - startY;
                  const delta = Math.round(-dy / 5); // 5pxで1BPM
                  const next = Math.max(40, Math.min(240, startBpm + delta));
                  if (next !== bpmState.bpm) {
                    if (raf != null) cancelAnimationFrame(raf);
                    raf = requestAnimationFrame(() => setBPM(next));
                  }
                };
                const onUp = () => {
                  document.removeEventListener('mousemove', onMove);
                  document.removeEventListener('mouseup', onUp);
                  if (raf != null) cancelAnimationFrame(raf);
                };
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
              }}
            >
              <span className="font-medium leading-6">{bpmState.bpm} BPM</span>
            </button>
            <div className="pointer-events-none absolute left-1/2 top-full z-[10012] mt-1 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
              <div className="px-2 py-1 text-xs text-white bg-slate-800 border border-slate-700 rounded shadow">上下ドラッグで変更</div>
            </div>
          </div>

          

          
          <div className="relative group m-2">
            <button 
              className={`rounded-md px-4 py-2 transition-colors duration-150 flex items-center justify-center active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${isPlaying ? 'bg-white hover:bg-slate-100' : 'bg-slate-700 hover:bg-slate-600'}`}
              onClick={() => { togglePlayback(currentNotes, tracks); }}
            >
              {isPlaying ? (
                <span className="material-symbols-outlined text-slate-900 text-xl">pause</span>
              ) : (
                <span className="material-symbols-outlined text-white text-xl">play_arrow</span>
              )}
            </button>
            <div className="pointer-events-none absolute left-1/2 top-full z-[10012] mt-1 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
              <div className="px-2 py-1 text-xs text-white bg-slate-800 border border-slate-700 rounded shadow">{isPlaying ? '停止' : '再生'}</div>
            </div>
          </div>

          
          <div className="relative group m-2">
            <button
              className={`rounded-md px-4 py-2 transition-colors duration-150 flex items-center justify-center active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 bg-slate-700 hover:bg-slate-600`}
              onClick={() => {
                const nextNumerator = bpmState.timeSignature.numerator === 3 ? 4 : 3;
                setTimeSignature({ numerator: nextNumerator, denominator: 4 });
              }}
            >
              <span className="text-white text-sm font-medium leading-6">{bpmState.timeSignature.numerator}/4</span>
            </button>
            <div className="pointer-events-none absolute left-1/2 top-full z-[10012] mt-1 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
              <div className="px-2 py-1 text-xs text-white bg-slate-800 border border-slate-700 rounded shadow">拍子切り替え</div>
            </div>
          </div>

          
          <div className="relative group m-2">
            <button
              className={`rounded-md px-4 py-2 transition-colors duration-150 flex items-center justify-center active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${bpmState.isLoopEnabled ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-slate-700 hover:bg-slate-600'}`}
              onClick={() => {
                const willEnable = !bpmState.isLoopEnabled;
                toggleLoop();
                if (willEnable) {
                  setLoopRange(0, currentMeasures);
                }
              }}
              aria-pressed={bpmState.isLoopEnabled}
            >
              <span className="material-symbols-outlined text-white text-xl">repeat</span>
            </button>
            <div className="pointer-events-none absolute left-1/2 top-full z-[10012] mt-1 -translate-x-1/2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
              <div className="px-2 py-1 text-xs text-white bg-slate-800 border border-slate-700 rounded shadow">ループ再生</div>
          </div>
          </div>

          
          <button
            ref={userIconRef}
            className="ml-auto mr-2 my-2 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
            title={currentUserEmail ? currentUserEmail : 'ログイン'}
            onClick={() => {
              if (currentUserEmail) { setIsUserMenuOpen((v) => !v); } else { setIsLoginOpen((v) => !v); }
            }}
            style={{ backgroundColor: isUserMenuOpen || isLoginOpen ? '#334155' : '#374151' }}
          >
            <span className="material-symbols-outlined text-white text-base">{currentUserEmail ? 'account_circle' : 'person'}</span>
          </button>
        </div>
        
        
          <div
          className="flex w-full relative md:h-[calc(100vh-56px)] h-[100dvh] bg-slate-900"
          onTouchStart={(e) => {
            const t = e.touches[0];
            touchStartXRef.current = t.clientX;
            touchStartYRef.current = t.clientY;
          }}
          onTouchEnd={(e) => {
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStartXRef.current;
            const dy = t.clientY - touchStartYRef.current;
            if (Math.abs(dx) > Math.abs(dy)) {
              if (touchStartXRef.current < 24 && dx > 50) setIsTrackPanelOpenMobile(true);
              if (isTrackPanelOpenMobile && dx < -50) setIsTrackPanelOpenMobile(false);
            }
          }}
        >
          {palette.open && (
            <div ref={paletteRef} className="fixed z-[10010]" style={{ top: palette.top, left: palette.left }}>
              <ColorPalette
                selected={tracks.find(t => t.id === palette.trackId)?.color || '#3b82f6'}
                onSelect={(c) => { if (palette.trackId) updateTrack(palette.trackId, { color: c }); setPalette(p => ({ ...p, open: false })); }}
              />
            </div>
          )}
          
          <div
            className={`flex-shrink-0 w-64 border-t-2 border-slate-600 bg-slate-800 h-[100dvh] md:h-[calc(100vh-56px)] flex flex-col
              md:relative md:translate-x-0 md:static md:z-auto
              fixed left-0 top-0 md:top-[56px] z-[10006] transition-transform duration-200 ease-out
              ${isTrackPanelOpenMobile ? 'translate-x-0' : '-translate-x-full'} md:transform-none`}
          >
            
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-white font-semibold text-lg">Tracks</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {tracks.map((track: Track) => (
                <div
                  key={track.id}
                  className={`relative p-3 border-b border-slate-700 hover:bg-slate-700 cursor-pointer ${selectedTrackId === track.id ? 'bg-slate-700' : ''}`}
                  onClick={() => setSelectedTrackId(track.id)}
                >
                  <button
                    className="absolute top-2 right-2 w-6 h-6 rounded-md bg-red-600/95 hover:bg-red-600/40 transition-colors flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTrack(track.id);
                      const filtered = currentNotes.filter(n => n.trackId !== track.id);
                      setImportedNotes(filtered);
                      setCurrentNotes(filtered);
                      if (selectedTrackId === track.id && tracks.length > 1) {
                        const next = tracks.find(t => t.id !== track.id);
                        if (next) setSelectedTrackId(next.id);
                      }
                      setPalette(p => ({ ...p, open: false }));
                    }}
                    title="削除"
                    aria-label="削除"
                  >
                    <span className="material-symbols-outlined text-white text-sm">close</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: track.color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setPalette({ open: true, trackId: track.id, top: rect.bottom + 8, left: rect.left });
                      }}
                    />
                    <InlineRename
                      value={track.name}
                      onChange={(name) => updateTrack(track.id, { name })}
                    />
                    <div className="ml-auto" />
                      </div>
                  <div className="mt-2 flex items-center gap-1 justify-end">
                    <button
                      className={`px-2 py-1 text-xs rounded ${track.wave === 'sine' ? 'text-white' : 'text-white hover:opacity-90'}`}
                      style={{ backgroundColor: track.wave === 'sine' ? track.color : '#475569' }}
                      onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { wave: 'sine' }); }}
                      title="sine"
                    >Sine</button>
                    <button
                      className={`px-2 py-1 text-xs rounded ${track.wave === 'square' ? 'text-white' : 'text-white hover:opacity-90'}`}
                      style={{ backgroundColor: track.wave === 'square' ? track.color : '#475569' }}
                      onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { wave: 'square' }); }}
                      title="square"
                    >Squa</button>
                    <button
                      className={`px-2 py-1 text-xs rounded ${track.wave === 'sawtooth' ? 'text-white' : 'text-white hover:opacity-90'}`}
                      style={{ backgroundColor: track.wave === 'sawtooth' ? track.color : '#475569' }}
                      onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { wave: 'sawtooth' }); }}
                      title="sawtooth"
                    >Saw</button>
                    <button
                      className={`px-2 py-1 text-xs rounded ${track.wave === 'triangle' ? 'text-white' : 'text-white hover:opacity-90'}`}
                      style={{ backgroundColor: track.wave === 'triangle' ? track.color : '#475569' }}
                      onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { wave: 'triangle' }); }}
                      title="triangle"
                    >Tri</button>
                      </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        className={`px-2 py-2 rounded aspect-square min-w-8 ${track.isSolo ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-white'}`}
                        onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { isSolo: !track.isSolo }); }}
                        title="Solo"
                        aria-label="Solo"
                      >S</button>
                      <button
                        className={`px-2 py-2 rounded aspect-square min-w-8 ${track.isMuted ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-white'}`}
                        onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { isMuted: !track.isMuted }); }}
                        title="Mute"
                        aria-label="Mute"
                      >M</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center justify-center leading-none">
                        <span className="material-symbols-outlined text-slate-300 text-sm">
                          {track.volume === 0 ? 'volume_mute' : (track.volume < 0.5 ? 'volume_down' : 'volume_up')}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{Math.round(track.volume * 100)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={track.volume}
                        onChange={(e) => { e.stopPropagation(); updateTrack(track.id, { volume: Number(e.target.value) }); }}
                        className="volume-slider w-28"
                        title="音量"
                        style={{
                          ['--slider-color' as unknown as string]: track.color,
                          background: `linear-gradient(to right, ${track.color} ${Math.round(track.volume * 100)}%, #475569 ${Math.round(track.volume * 100)}%)`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="md:static absolute left-0 right-0 bottom-0 p-3 pb-20 md:pb-3 md:bottom-auto border-t border-slate-700 bg-slate-800">
              <button className="w-full px-3 py-2 rounded bg-slate-700 text-white hover:bg-slate-600" onClick={() => addTrack()}>トラックを追加</button>
            </div>
          </div>
          
          
          <div className="overflow-auto flex-1 md:h-[calc(100vh-56px)] h-[100dvh]">
            <PianoRoll 
              tracks={tracks}
              selectedTrackId={selectedTrackId}
              onNotesChange={handleNotesChange}
              onSelectedNotesChange={handleSelectedNotesChange}
              onSelectedNotesSetChange={handleSelectedNotesSetChange}
              timeSignature={bpmState.timeSignature}
              subdivisionsPerBeat={4}
              externalNotes={importedNotes ?? undefined}
              onMeasuresChange={handleMeasuresChange}
              bpm={bpmState.bpm}
              isLoopEnabled={bpmState.isLoopEnabled}
              loopStartMeasure={bpmState.loopStartMeasure}
              loopEndMeasure={bpmState.loopEndMeasure}
              isPlaying={isPlaying}
              measures={currentMeasures}
              transpose={transpose}
              onTransposeChange={(v) => setTranspose(v)}
              onExposeApi={(api) => { pianoApiRef.current = api; }}
            />
            </div>

          
            {isTrackPanelOpenMobile && (
              <div
                className="md:hidden fixed inset-0 top-[56px] bg-black/40 z-[10005]"
                onClick={() => setIsTrackPanelOpenMobile(false)}
              />
            )}
        </div>

        
        <LoginSheet isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

        
        {isUserMenuOpen && (
          <UserMenu 
            open={isUserMenuOpen}
            onClose={() => setIsUserMenuOpen(false)} 
            anchorRef={userIconRef}
            onSaveDefault={handleSaveDefault}
            onResetDefault={handleResetDefault}
            onLoadDefault={handleLoadDefault}
            hasDefault={hasDefault}
          />
        )}

        
        

        
        {(() => {
          const selected = tracks.find(t => t.id === selectedTrackId);
          const color = selected?.color || '#3b82f6';
          const size = 48; // ヘッダー高さ/左右ボタン直径
          const pillWidth = 220; // ピルの固定横幅
          const expanded = !!activeMobileTab;
          return (
            <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[10007] flex items-end gap-3">
              
              {selectedNotesCount > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto z-[10009]" style={{ width: pillWidth, bottom: (size + 12), display: isChordToolbarOpen ? 'flex' : 'none' }}>
                  {(['major','minor','alt','dominant'] as const).map((group) => (
                    <div key={group} className="relative flex flex-col items-center">
                      <button className={`w-10 h-10 rounded text-white border border-white/10 shadow flex items-center justify-center ${group === 'major' ? 'bg-pink-500 hover:bg-pink-400' : group === 'minor' ? 'bg-sky-500 hover:bg-sky-400' : group === 'dominant' ? 'bg-purple-500 hover:bg-purple-400' : 'bg-yellow-500 hover:bg-yellow-400'}`}
                        onClick={() => {
                          if (!pianoApiRef.current?.chordLists) return;
                          const lists = pianoApiRef.current.chordLists;
                          const types = group === 'major' ? lists.major : group === 'minor' ? lists.minor : group === 'dominant' ? lists.dominant : lists.alt;
                          const next = (types && types[0]) || null;
                          if (next) pianoApiRef.current?.applyChord?.(next);
                        }}
                        title={group === 'major' ? 'Maj' : group === 'minor' ? 'Min' : group === 'dominant' ? 'Dom' : 'Alt'}>
                        <span className="text-xs font-medium">{group === 'major' ? 'Maj' : group === 'minor' ? 'Min' : group === 'dominant' ? 'Dom' : 'Alt'}</span>
                      </button>
                      
                      <div className="absolute bottom-12 flex flex-col items-center gap-1 z-[10010]">
                        {((pianoApiRef.current?.chordLists?.[group] as string[]) || []).slice(0,6).map((ct: string) => (
                          <button key={ct} className={`w-10 h-10 rounded text-white border border-white/10 text-[11px] flex items-center justify-center ${group === 'major' ? 'bg-pink-500 hover:bg-pink-400' : group === 'minor' ? 'bg-sky-500 hover:bg-sky-400' : group === 'dominant' ? 'bg-purple-500 hover:bg-purple-400' : 'bg-yellow-500 hover:bg-yellow-400'}`}
                            onClick={() => pianoApiRef.current?.applyChord?.(ct)}>
                            {ct.replace('major','').replace('minor','').replace('dominant','') || (group === 'major' ? 'M' : group === 'minor' ? 'm' : group === 'dominant' ? '7' : 'alt')}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                className="rounded-full border border-white/10 shadow-lg"
                style={{ width: size, height: size, backgroundColor: color, transform: 'translateY(-3px)', backdropFilter: 'blur(10px) saturate(1.1)' as unknown as string }}
                onClick={() => setIsTrackPanelOpenMobile(true)}
                aria-label="Tracks"
              />
              
              <div
                className={`${expanded ? 'rounded-3xl' : 'rounded-full'} border border-white/10 shadow-lg mb-1 overflow-hidden transition-[max-height] duration-400 ease-[cubic-bezier(0.22,0.61,0.36,1)] flex flex-col`}
                style={{
                  maxHeight: expanded ? '70vh' : `${size}px`,
                  width: pillWidth,
                  backdropFilter: 'blur(10px) saturate(1.1)' as unknown as string,
                  background: 'rgba(30,41,59,0.55)'
                }}
              >
                
                {!expanded && (
                  <div className="flex items-stretch divide-x divide-white/10 whitespace-nowrap" style={{ height: size, width: pillWidth }}>
                    {selectedNotesCount > 0 ? (
                      <>
                        <button className="px-4 text-white text-sm active:scale-95 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 flex items-center justify-center" onClick={(e) => { e.preventDefault(); e.stopPropagation(); pianoApiRef.current?.clearSelection?.(); setActiveMobileTab(null); }}>
                          <span className="material-symbols-outlined text-base">deselect</span>
                        </button>
                        <button className={`px-4 text-white text-sm active:scale-95 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 flex items-center justify-center ${activeMobileTab === 'length' ? 'font-semibold' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); pianoApiRef.current?.selectAll?.(currentNotes); }}>
                          <span className="material-symbols-outlined text-base">checklist</span>
                        </button>
                        <button
                          className={`px-4 text-white text-sm active:scale-95 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 flex items-center justify-center ${isMultiSelectMode ? 'font-semibold' : ''}`}
                          aria-pressed={isMultiSelectMode}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMultiSelectMode(v => {
                              (document.body as unknown as { dataset: Record<string, string> }).dataset.multiSelect = v ? '0' : '1';
                              return !v;
                            });
                          }}
                        >
                          <span className={`material-symbols-outlined text-base ${isMultiSelectMode ? 'text-green-400' : ''}`}>select_all</span>
                        </button>
                        <button className={`px-4 text-white text-sm active:scale-95 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 flex items-center justify-center ${activeMobileTab === 'move' ? 'font-semibold' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (selectedNotesCount > 0) { const ids = Array.from(selectedNotes).filter((id): id is string => typeof id === 'string'); if (ids.length > 0) { pianoApiRef.current?.deleteMultipleNotes?.(ids); } } }}>
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button className={`px-4 text-white text-sm active:scale-95 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 flex items-center justify-center ${activeMobileTab === 'title' ? 'font-semibold' : ''}`} onClick={() => setActiveMobileTab(prev => prev === 'title' ? null : 'title')}>
                          <span className="material-symbols-outlined text-base">music_note</span>
                        </button>
                        <button className="px-4 text-white text-sm active:scale-95 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 flex items-center justify-center" onClick={(e) => { e.preventDefault(); e.stopPropagation(); pianoApiRef.current?.undo?.(); }}>
                          <span className="material-symbols-outlined text-base">undo</span>
                        </button>
                        <button className="px-4 text-white text-sm active:scale-95 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 flex items-center justify-center" onClick={(e) => { e.preventDefault(); e.stopPropagation(); pianoApiRef.current?.redo?.(); }}>
                          <span className="material-symbols-outlined text-base">redo</span>
                        </button>
                        <button className={`px-4 text-white text-sm active:scale-95 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 flex items-center justify-center ${activeMobileTab === 'audio' ? 'font-semibold' : ''}`} onClick={() => setActiveMobileTab(prev => prev === 'audio' ? null : 'audio')}>
                          <span className="material-symbols-outlined text-base">equalizer</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
                  
                {expanded && (
                  <div className="p-3 border-t border-white/10 transition-all duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]">
                    {activeMobileTab === 'title' && (
                      <>
                        
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-white/90">music_note</span>
                          <input type="text" className="px-2 py-1 text-sm w-[140px] rounded bg-slate-700 border border-slate-600 focus:outline-none text-white" placeholder="Project Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                        </div>
                        
                        <div className="mt-3 flex items-center">
                          <div className="flex items-center gap-2">
                            <button className={`w-10 h-10 rounded flex items-center justify-center transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${midiFlash ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'} text-white`} onClick={() => { downloadMIDI(currentNotes, 'piano-roll.mid', bpmState.bpm, 4); setMidiFlash(true); setTimeout(() => setMidiFlash(false), 800); }}>
                              <span className="material-symbols-outlined text-base">audio_file</span>
                            </button>
                            <button className={`w-10 h-10 rounded flex items-center justify-center transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${jsonFlash ? 'bg-orange-500' : 'bg-slate-700 hover:bg-slate-600'} text-white`} onClick={() => { const snapshot = buildProjectSnapshot({ name: projectName, tracks, notes: currentNotes, bpmState, selectedTrackId, measures: currentMeasures }); downloadJson(snapshot, `${projectName || 'project'}.json`); setJsonFlash(true); setTimeout(() => setJsonFlash(false), 800); }}>
                              <span className="material-symbols-outlined text-base">file_download</span>
                            </button>
                            <button className="w-10 h-10 rounded flex items-center justify-center transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 bg-slate-700 hover:bg-slate-600 text-white" onClick={() => setIsProjectPickerOpen(true)}>
                              <span className="material-symbols-outlined text-base">folder_open</span>
                            </button>
                            <button className="w-10 h-10 rounded flex items-center justify-center transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 bg-emerald-600 hover:bg-emerald-500 text-white" onClick={async () => { try { const newName = await upsertProjectWithRename({ name: projectName, data: currentNotes }); if (newName && newName !== projectName) setProjectName(newName); } catch {} }}>
                              <span className="material-symbols-outlined text-base">cloud_upload</span>
                            </button>
                          </div>
                        </div>
                        

                        <div className="mt-3 flex items-center justify-end">
                          <button
                            className="w-10 h-10 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white mr-2"
                            title={currentUserEmail ? currentUserEmail : 'ログイン'}
                            onClick={() => {
                              if (currentUserEmail) { setIsUserMenuOpen(v => !v); } else { setIsLoginOpen(v => !v); }
                            }}
                            aria-label="Login or Account"
                          >
                            <span className="material-symbols-outlined text-base">{currentUserEmail ? 'account_circle' : 'person'}</span>
                          </button>
                          <button className="w-10 h-10 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white" onClick={() => setActiveMobileTab(null)} aria-label="Close">
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                      </>
                    )}
                    {activeMobileTab === 'audio' && (
                      <>
                      <div className="flex items-center gap-2 relative">
                        <button className="px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-600 text-sm transition-colors" onClick={() => {
                          const v = prompt('BPMを入力 (40-240)', String(bpmState.bpm));
                          if (!v) return;
                          const num = Math.max(40, Math.min(240, Math.floor(Number(v))));
                          if (!Number.isNaN(num)) setBPM(num);
                        }}>
                          {bpmState.bpm} BPM
                        </button>
                        <button className={`px-3 py-2 rounded transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 ${bpmState.isLoopEnabled ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-white hover:bg-slate-600'}`} onClick={() => { const willEnable = !bpmState.isLoopEnabled; toggleLoop(); if (willEnable) setLoopRange(0, currentMeasures); }} aria-pressed={bpmState.isLoopEnabled}>
                          <span className="material-symbols-outlined text-base">repeat</span>
                        </button>
                        <button className="px-3 py-2 rounded bg-slate-700 text-white hover:bg-slate-600 transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800" onClick={() => { const nextNumerator = bpmState.timeSignature.numerator === 3 ? 4 : 3; setTimeSignature({ numerator: nextNumerator, denominator: 4 }); }}>{bpmState.timeSignature.numerator}/4</button>
                        <div className="ml-auto" />
                       
                      </div>
                      <div className="mt-3 flex items-center justify-end">
                        <button className="w-10 h-10 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white transition-colors duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800" onClick={() => setActiveMobileTab(null)} aria-label="Close">
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>

                      </>
                    )}
                    {activeMobileTab === 'length' && (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-white text-sm">長さ</span>
                          <input type="range" min={1} max={8} step={1} value={lengthSlider} onChange={(e) => { const v = Number(e.target.value); setLengthSlider(v); pianoApiRef.current?.setSelectedLength?.(v); }} className="w-40" />
                          <span className="text-white/80 text-xs">{lengthSlider}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input type="number" min={1} className="w-20 px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white text-sm" value={lengthInput} onChange={(e) => setLengthInput(Math.max(1, Number(e.target.value) || 1))} />
                            <button className="px-2 py-1 rounded bg-slate-700 text-white hover:bg-slate-600 text-sm" onClick={() => pianoApiRef.current?.setSelectedLengthArbitrary?.(lengthInput)}>適用</button>
                          </div>
                          <button className="w-10 h-10 rounded flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white" onClick={() => setActiveMobileTab(null)} aria-label="Close">
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>
                      </>
                    )}
                    {activeMobileTab === 'move' && (
                      <>
                        <div className="flex flex-col items-center gap-2 py-1">
                          <div className="flex items-center gap-2 justify-center w-full">
                            <button className="w-10 h-10 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center" onClick={() => pianoApiRef.current?.moveSelected?.(0, 1)}>
                              <span className="material-symbols-outlined text-base">arrow_upward</span>
                            </button>
                          </div>
                          <div className="flex items-center gap-6 justify-center w-full">
                            <button className="w-10 h-10 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center" onClick={() => pianoApiRef.current?.moveSelected?.(-1, 0)}>
                              <span className="material-symbols-outlined text-base">arrow_back</span>
                            </button>
                            <button className="w-10 h-10 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center" onClick={() => pianoApiRef.current?.moveSelected?.(1, 0)}>
                              <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </button>
                          </div>
                          <div className="flex items-center gap-2 justify-center w-full">
                            <button className="w-10 h-10 rounded bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center" onClick={() => pianoApiRef.current?.moveSelected?.(0, -1)}>
                              <span className="material-symbols-outlined text-base">arrow_downward</span>
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <button className="px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-600 text-sm" onClick={() => pianoApiRef.current?.selectAll?.(currentNotes)}>全選択</button>
                          <button className="px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-600 text-sm" onClick={() => setActiveMobileTab(null)}>閉じる</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <button
                className="rounded-full border border-white/10 shadow-lg flex items-center justify-center text-white"
                style={{ width: size, height: size, transform: 'translateY(-3px)', backdropFilter: 'blur(10px) saturate(1.1)', background: 'rgba(30,41,59,0.55)' }}
                onClick={() => { togglePlayback(currentNotes, tracks); }}
                aria-label="Play/Pause"
              >
                <span className="material-symbols-outlined text-white text-xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
              </button>
            </div>
          );
        })()}

        
        <ProjectPickerSheet
          isOpen={isProjectPickerOpen}
          onClose={() => setIsProjectPickerOpen(false)}
          onLoadProject={({ name, data }) => {
            try {
              if (data?.bpmState) setState(data.bpmState);
              if (data?.tracks && data?.selectedTrackId) setAllTracks(data.tracks, data.selectedTrackId);
              setImportedNotes(Array.isArray(data?.notes) ? data.notes : []);
              setProjectName(name || projectName);
              if (typeof data?.measures === 'number') setCurrentMeasures(data.measures);
            } catch {}
          }}
        />
      </div>
    </div>
  );
}
