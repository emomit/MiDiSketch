"use client";
import React from 'react';
import { TRACK_COLORS } from '../../utils/trackUtils';

interface ColorPaletteProps {
  selected: string;
  onSelect: (color: string) => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({ selected, onSelect }) => {
  return (
    <div className="z-30 bg-slate-800/95 backdrop-blur border border-slate-700 rounded shadow-2xl p-2 overflow-x-auto whitespace-nowrap" data-palette-root>
      <div className="flex gap-2">
        {TRACK_COLORS.map((c) => (
          <button
            key={c}
            className={`w-7 h-7 rounded flex-shrink-0 ${selected === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}`}
            style={{ backgroundColor: c }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => { e.preventDefault(); onSelect(c); }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
};

