import React, { useState, useMemo, useEffect } from 'react';
import { useChordPlacement } from '../hooks/useChordPlacement';
import { Note } from '../types/note';

interface ChordMenuProps {
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

export const ChordMenu: React.FC<ChordMenuProps> = ({
    isVisible,
    position,
    onSelectChord,
    onClose,
    rootNote,
    startTime,
    duration,
    trackId,
    createNote
}) => {
    const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
    const [animationComplete, setAnimationComplete] = useState(false);
    const { placeChord, chordTypes } = useChordPlacement();

    useEffect(() => {
        if (isVisible) {
            setAnimationComplete(false);
            const timer = setTimeout(() => {
                setAnimationComplete(true);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setHoveredMenu(null);
        }
    }, [isVisible]);

    const isHoverEnabled = isVisible;

    const gap = 38;

    const chordLists = useMemo(() => {
        const allKeys = Object.keys(chordTypes);
        
        return {
            major: allKeys.filter(key => key.startsWith('major') && key !== 'major'),
            minor: allKeys.filter(key => key.startsWith('minor') && key !== 'minor'),
            dominant: allKeys.filter(key => 
                key.startsWith('dominant') && 
                key !== 'dominant' && 
                !key.includes('#') && 
                !key.includes('b')
            ),
            alt: ['sus4', 'dim', 'aug', 'sus2']
        };
    }, [chordTypes]);

    const getDisplayName = (chordType: string) => {
        if (chordType.startsWith('major')) return chordType.replace('major', '');
        if (chordType.startsWith('minor')) return chordType.replace('minor', '');
        if (chordType.startsWith('dominant')) return chordType.replace('dominant', '');
        return chordType === 'diminished' ? 'dim' : chordType;
    };

    const handleChordSelect = (chordType: string) => {
        if (createNote) {
            placeChord(rootNote, chordType, startTime, duration, createNote, trackId);
        }
        onSelectChord(chordType);
        onClose();
    };

    if (!isVisible) return null;

    return (
        <>
            <div className="fixed" style={{ zIndex: 9999 }}>
                
                <div 
                    className="fixed flex flex-col-reverse items-center gap-2"
                    style={{
                        left: position.x,
                        top: position.y - gap,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 9999
                    }}
                >
                    
                    <div className="flex justify-center">
                        <button 
                            className={`w-11 h-11 bg-pink-500 hover:bg-pink-400 hover:scale-110 text-white rounded-full text-sm font-bold flex items-center justify-center shadow-lg hover:shadow-xl ${
                                isHoverEnabled 
                                    ? 'transition-all duration-200 ease-out scale-100' 
                                    : 'animate-scale-bounce'
                            }`}
                            style={{ pointerEvents: 'auto' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleChordSelect('major'); // 修正
                            }}
                            onMouseEnter={() => {
                                if (isHoverEnabled) {
                                    setHoveredMenu('maj');
                                }
                            }}
                        >
                            Maj
                        </button>
                    </div>
                    
                    
                    <div className="flex flex-col-reverse items-center gap-2 mt-2">
                        {chordLists.major.map((chordType, index) => (
                          <div key={chordType} className={`relative ${hoveredMenu === 'maj' ? 'opacity-100' : 'opacity-0 scale-0'} transition-all duration-300`} style={{ animationDelay: `${index * 100}ms` }}>
                            <button
                                className={`w-10 h-10 bg-pink-500 hover:bg-pink-400 hover:scale-110 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg hover:shadow-xl`}
                                onClick={(e) => { e.stopPropagation(); handleChordSelect(chordType); }}
                                onMouseEnter={() => { if (isHoverEnabled) setHoveredMenu('maj'); }}
                            >
                                {getDisplayName(chordType)}
                            </button>
                            {chordType === 'major11' && (
                              <button
                                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-pink-500 hover:bg-pink-400 text-white rounded-full text-xs font-bold shadow"
                                style={{ left: '-24px', pointerEvents: 'auto' }}
                                onClick={(e) => { e.stopPropagation(); handleChordSelect('major#11'); }}
                                title="Maj#11"
                              >#</button>
                            )}
                          </div>
                        ))}
                    </div>
                </div>

                
                <div 
                    className="fixed flex flex-col gap-2 items-center"
                    style={{
                        left: position.x - 22,
                        top: position.y + 60 - 22 
                    }}
                >
                    <button 
                        className={`w-11 h-11 bg-sky-500 hover:bg-sky-400 hover:scale-110 text-white rounded-full text-sm font-bold flex items-center justify-center shadow-lg hover:shadow-xl ${
                            isHoverEnabled 
                                ? 'transition-all duration-200 ease-out scale-100' 
                                : 'animate-scale-bounce'
                        }`}
                        style={{ pointerEvents: 'auto' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleChordSelect('minor');
                            onClose();
                        }}
                        onMouseEnter={() => {
                            if (isHoverEnabled) {
                                setHoveredMenu('min');
                            }
                        }}
                    >
                        Min
                    </button>
                    
                    {chordLists.minor.map((chordType, index) => (
                        <button
                            key={chordType}
                            className={`w-10 h-10 bg-sky-500 hover:bg-sky-400 hover:scale-110 text-white rounded-full transition-all duration-300 ease-out text-xs font-bold flex items-center justify-center shadow-lg hover:shadow-xl ${
                                hoveredMenu === 'min' 
                                    ? 'opacity-100 scale-100' 
                                    : 'opacity-0 scale-0'
                            } ${
                                animationComplete 
                                    ? 'transition-all duration-200 ease-out' 
                                    : 'animate-scale-bounce'
                            }`}
                            style={{
                                animationDelay: `${index * 100}ms`
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleChordSelect(chordType);
                                onClose();
                            }}
                            onMouseEnter={() => {
                                if (isHoverEnabled) {
                                    setHoveredMenu('min');
                                }
                            }}
                        >
                            {getDisplayName(chordType)}
                        </button>
                    ))}
                </div>

                
                <div 
                    className="fixed flex flex-row-reverse items-center"
                    style={{
                        left: position.x - gap,
                        top: position.y,
                        transform: 'translate(-100%, -50%)',
                    }}
                >
                    
                    <div className="flex justify-center">
                        <button 
                            className={`w-11 h-11 bg-yellow-500 hover:bg-yellow-400 hover:scale-110 text-white rounded-full text-sm font-bold flex items-center justify-center shadow-lg hover:shadow-xl ${
                                isHoverEnabled 
                                    ? 'transition-all duration-200 ease-out scale-100' 
                                    : 'animate-scale-bounce'
                            }`}
                            style={{ pointerEvents: 'auto' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleChordSelect('diminished');
                                onClose();
                            }}
                            onMouseEnter={() => setHoveredMenu('alt')}
                        >
                            Alt
                        </button>
                    </div>
                    
                    
                    <div className="flex flex-row-reverse items-center gap-2 mr-2">
                        {chordLists.alt.map((chordType, index) => (
                            <button
                                key={chordType}
                                className={`w-11 h-11 bg-yellow-500 hover:bg-yellow-400 hover:scale-110 text-white rounded-full transition-all duration-300 ease-out text-xs font-bold flex items-center justify-center shadow-lg hover:shadow-xl ${
                                    hoveredMenu === 'alt' 
                                        ? 'opacity-100' 
                                        : 'opacity-0 scale-0'
                                } ${
                                    animationComplete 
                                        ? 'transition-all duration-200 ease-out' 
                                        : 'animate-scale-bounce'
                                }`}
                                style={{
                                    animationDelay: `${index * 100}ms`
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleChordSelect(chordType);
                                    onClose();
                                }}
                                onMouseEnter={() => {
                                    if (isHoverEnabled) {
                                        setHoveredMenu('alt');
                                    }
                                }}
                            >
                                {getDisplayName(chordType)}
                            </button>
                        ))}
                    </div>
                </div>

                
                <div 
                    className="fixed flex flex-row gap-2 items-center"
                    style={{
                        left: position.x + 60 - 22, // 60 is offset, 22 is radius
                        top: position.y - 22 // 22 is radius
                    }}
                >
                    <button 
                        className={`w-11 h-11 bg-purple-500 hover:bg-purple-400 hover:scale-110 text-white rounded-full text-sm font-bold flex items-center justify-center shadow-lg hover:shadow-xl ${
                            isHoverEnabled 
                                ? 'transition-all duration-200 ease-out scale-100' 
                                : 'animate-scale-bounce'
                        }`}
                        style={{ pointerEvents: 'auto' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleChordSelect('dominant7');
                            onClose();
                        }}
                        onMouseEnter={() => {
                            if (isHoverEnabled) {
                                setHoveredMenu('dom');
                            }
                        }}
                    >
                        Dom
                    </button>
                    
                    {chordLists.dominant.map((chordType, index) => {
                        const display = getDisplayName(chordType);
                        const num = parseInt(display, 10);
                        const showAcc = hoveredMenu === 'dom' && [9,11,13].includes(num);
                        return (
                          <div key={chordType} className={`relative ${hoveredMenu === 'dom' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'} transition-all duration-300`} style={{ animationDelay: `${index * 100}ms` }}>
                            <button
                              className={`w-10 h-10 bg-purple-500 hover:bg-purple-400 hover:scale-110 text-white rounded-full text-xs font-bold flex items-center justify-center shadow-lg hover:shadow-xl`}
                              onClick={(e) => { e.stopPropagation(); handleChordSelect(chordType); onClose(); }}
                              onMouseEnter={() => { if (isHoverEnabled) setHoveredMenu('dom'); }}
                            >
                              {display}
                            </button>
                            {showAcc && (
                              <>
                                
                                <button
                                  className="absolute left-1/2 -translate-x-1/2 w-6 h-6 bg-purple-500 hover:bg-purple-400 text-white rounded-full text-[10px] font-bold shadow"
                                  style={{ top: '-24px', pointerEvents: 'auto' }}
                                  title={`#${num}`}
                                  onClick={(e) => { e.stopPropagation(); handleChordSelect(`dominant#${num}`); }}
                                >#{num}</button>
                                
                                <button
                                  className="absolute left-1/2 -translate-x-1/2 w-6 h-6 bg-purple-500 hover:bg-purple-400 text-white rounded-full text-[10px] font-bold shadow"
                                  style={{ top: '40px', pointerEvents: 'auto' }}
                                  title={`b${num}`}
                                  onClick={(e) => { e.stopPropagation(); handleChordSelect(`dominantb${num}`); }}
                                >b{num}</button>
                              </>
                            )}
                          </div>
                        );
                    })}
                </div>

                
                <div 
                    className="fixed flex"
                    style={{
                        left: position.x - 20,
                        top: position.y - 20
                    }}
                >
                    <button 
                        className={`w-10 h-10 bg-slate-500 hover:bg-slate-400 hover:scale-110 text-white rounded-full text-xl font-bold shadow-lg hover:shadow-xl flex items-center justify-center ${
                            isHoverEnabled 
                                ? 'transition-all duration-200 ease-out scale-100' 
                                : 'animate-scale-bounce'
                        }`}
                        style={{ pointerEvents: 'auto' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        onMouseEnter={() => {
                            if (isHoverEnabled) {
                                setHoveredMenu(null);
                            }
                        }}
                    >
                        ✖︎
                    </button>
                </div>
            </div>
        </>
    );
};