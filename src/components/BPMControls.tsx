import React, { useState } from 'react';
import { TimeSignature } from '../types/playback';

interface BPMControlsProps {
  bpm: number;
  timeSignature: TimeSignature;
  isMetronomeEnabled: boolean;
  isPlaying: boolean;
  onBPMChange: (bpm: number) => void;
  onTimeSignatureChange: (timeSignature: TimeSignature) => void;
  onMetronomeToggle: () => void;
}

export const BPMControls: React.FC<BPMControlsProps> = ({
  bpm,
  timeSignature,
  isMetronomeEnabled,
  isPlaying,
  onBPMChange,
  onTimeSignatureChange,
  onMetronomeToggle
}) => {
  const [isBPMEditing, setIsBPMEditing] = useState(false);
  const [tempBPM, setTempBPM] = useState(bpm.toString());

  const timeSignatureOptions: TimeSignature[] = [
    { numerator: 2, denominator: 4 },
    { numerator: 3, denominator: 4 },
    { numerator: 4, denominator: 4 },
    { numerator: 6, denominator: 8 },
    { numerator: 3, denominator: 8 }
  ];

  const handleBPMInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTempBPM(value);
  };

  const handleBPMConfirm = () => {
    const newBPM = parseInt(tempBPM);
    if (!isNaN(newBPM) && newBPM >= 40 && newBPM <= 200) {
      onBPMChange(newBPM);
    } else {
      setTempBPM(bpm.toString());
    }
    setIsBPMEditing(false);
  };

  const handleBPMCancel = () => {
    setTempBPM(bpm.toString());
    setIsBPMEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBPMConfirm();
    } else if (e.key === 'Escape') {
      handleBPMCancel();
    }
  };

  return (
    <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-lg">
      
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">BPM:</span>
        {isBPMEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={tempBPM}
              onChange={handleBPMInput}
              onKeyDown={handleKeyDown}
              onBlur={handleBPMConfirm}
              className="w-16 px-2 py-1 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:outline-none focus:border-blue-500"
              min="40"
              max="200"
              autoFocus
            />
            <button
              onClick={handleBPMConfirm}
              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500"
            >
              ✓
            </button>
            <button
              onClick={handleBPMCancel}
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500"
            >
              ✗
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsBPMEditing(true)}
            className="px-3 py-1 bg-slate-700 text-white text-sm rounded hover:bg-slate-600 transition-colors"
          >
            {bpm}
          </button>
        )}
      </div>

      
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">拍子:</span>
        <select
          value={`${timeSignature.numerator}/${timeSignature.denominator}`}
          onChange={(e) => {
            const [numerator, denominator] = e.target.value.split('/').map(Number);
            onTimeSignatureChange({ numerator, denominator });
          }}
          className="px-2 py-1 bg-slate-700 text-white text-sm rounded border border-slate-600 focus:outline-none focus:border-blue-500"
        >
          {timeSignatureOptions.map((ts) => (
            <option key={`${ts.numerator}/${ts.denominator}`} value={`${ts.numerator}/${ts.denominator}`}>
              {ts.numerator}/{ts.denominator}
            </option>
          ))}
        </select>
      </div>

      
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">メトロノーム:</span>
        <button
          onClick={onMetronomeToggle}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            isMetronomeEnabled
              ? 'bg-yellow-600 text-white hover:bg-yellow-500'
              : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {isMetronomeEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">再生:</span>
        <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-500' : 'bg-slate-600'}`} />
      </div>
    </div>
  );
}; 