"use client";
import React, { useMemo } from 'react';
import { useChordPlacement } from '../hooks/useChordPlacement';
import { Note } from '../types/note';

interface ChordMenuMobileProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onSelectChord: (chordType: string) => void;
  onClose: () => void;
  rootNote: number;
  startTime: number;
  duration: number;
  trackId: string;
  createNote: (pitch: number, startTime: number, duration: number, zIndex: number, trackId: string) => Note;
}

export const ChordMenuMobile: React.FC<ChordMenuMobileProps> = ({
  isVisible,
  position,
  onSelectChord,
  onClose,
  rootNote,
  startTime,
  duration,
  trackId,
  createNote,
}) => {
  const { placeChord, chordTypes } = useChordPlacement();

  const chordLists = useMemo(() => {
    const allKeys = Object.keys(chordTypes);
    return {
      major: allKeys.filter((key) => key.startsWith('major') && key !== 'major'),
      minor: allKeys.filter((key) => key.startsWith('minor') && key !== 'minor'),
      dominant: allKeys.filter(
        (key) => key.startsWith('dominant') && key !== 'dominant' && !key.includes('#') && !key.includes('b')
      ),
      alt: ['sus4', 'dim', 'aug', 'sus2'],
    };
  }, [chordTypes]);

  const getDisplayName = (chordType: string) => {
    if (chordType.startsWith('major')) return chordType.replace('major', '');
    if (chordType.startsWith('minor')) return chordType.replace('minor', '');
    if (chordType.startsWith('dominant')) return chordType.replace('dominant', '');
    return chordType === 'diminished' ? 'dim' : chordType;
  };

  const handleChordSelect = (chordType: string) => {
    if (createNote) placeChord(rootNote, chordType, startTime, duration, createNote, trackId);
    onSelectChord(chordType);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-[10000]"
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, -100%)' }}
    >
      <div className="relative px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl shadow-xl backdrop-blur-md">
        <div className="flex flex-row items-end gap-4 flex-nowrap">
          
          <div className="flex flex-col-reverse items-center gap-2">
            <button
              className="w-11 h-11 bg-pink-500 hover:bg-pink-400 text-white rounded-full text-sm font-bold flex items-center justify-center shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleChordSelect('major');
              }}
            >
              Maj
            </button>
            <div className="flex flex-col items-center gap-2">
              {chordLists.major.map((chordType) => (
                <button
                  key={chordType}
                  className="w-10 h-10 bg-pink-500 hover:bg-pink-400 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChordSelect(chordType);
                  }}
                >
                  {getDisplayName(chordType)}
                </button>
              ))}
            </div>
          </div>

          
          <div className="flex flex-col-reverse items-center gap-2">
            <button
              className="w-11 h-11 bg-sky-500 hover:bg-sky-400 text-white rounded-full text-sm font-bold flex items-center justify-center shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleChordSelect('minor');
              }}
            >
              Min
            </button>
            <div className="flex flex-col items-center gap-2">
              {chordLists.minor.map((chordType) => (
                <button
                  key={chordType}
                  className="w-10 h-10 bg-sky-500 hover:bg-sky-400 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChordSelect(chordType);
                  }}
                >
                  {getDisplayName(chordType)}
                </button>
              ))}
            </div>
          </div>

          
          <div className="flex flex-col-reverse items-center gap-2">
            <button
              className="w-11 h-11 bg-purple-500 hover:bg-purple-400 text-white rounded-full text-sm font-bold flex items-center justify-center shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleChordSelect('dominant7');
              }}
            >
              Dom
            </button>
            <div className="flex flex-col items-center gap-2">
              {chordLists.dominant.map((chordType) => {
                const display = getDisplayName(chordType);
                return (
                  <button
                    key={chordType}
                    className="w-10 h-10 bg-purple-500 hover:bg-purple-400 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChordSelect(chordType);
                    }}
                  >
                    {display}
                  </button>
                );
              })}
            </div>
          </div>

          
          <div className="flex flex-col-reverse items-center gap-2">
            <button
              className="w-11 h-11 bg-yellow-500 hover:bg-yellow-400 text-white rounded-full text-sm font-bold flex items-center justify-center shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleChordSelect('diminished');
              }}
            >
              Alt
            </button>
            <div className="flex flex-col items-center gap-2">
              {chordLists.alt.map((chordType) => (
                <button
                  key={chordType}
                  className="w-10 h-10 bg-yellow-500 hover:bg-yellow-400 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChordSelect(chordType);
                  }}
                >
                  {getDisplayName(chordType)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <button
          className="absolute left-1/2 -translate-x-1/2 w-10 h-10 bg-slate-500 hover:bg-slate-400 text-white rounded-full text-xl font-bold shadow-lg flex items-center justify-center"
          style={{ top: '100%', marginTop: '8px' }}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          ✖︎
        </button>
      </div>
    </div>
  );
};

