"use client";
import React, { useEffect, useRef, useState } from 'react';

interface InlineRenameProps {
  value: string;
  onChange: (next: string) => void;
}

export const InlineRename: React.FC<InlineRenameProps> = ({ value, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setText(value), [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  if (!editing) {
    return (
      <div
        className="text-white text-sm font-medium truncate"
        title={value}
        onDoubleClick={() => setEditing(true)}
      >
        {value}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => { setEditing(false); if (text !== value) onChange(text.trim() || value); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); }
        if (e.key === 'Escape') { setText(value); setEditing(false); }
      }}
      className="px-2 py-1 rounded bg-slate-700 border border-slate-600 text-white text-sm w-full"
    />
  );
};

