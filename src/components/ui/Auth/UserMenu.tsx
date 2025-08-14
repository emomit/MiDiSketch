"use client";
import React, { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '../../../utils/supabaseClient';
import type { User } from '@supabase/supabase-js';

interface UserMenuProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  onSaveDefault: () => void;
  onResetDefault: () => void;
  onLoadDefault: () => void;
  hasDefault: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ open, onClose, anchorRef, onSaveDefault, onResetDefault, onLoadDefault, hasDefault }) => {
  const [user, setUser] = useState<User | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current && panelRef.current.contains(t)) return;
      if (anchorRef.current && anchorRef.current.contains(t as Node)) return;
      onClose();
    };
    const handleTouch = (e: TouchEvent) => {
      const t = e.target as Node;
      if (panelRef.current && panelRef.current.contains(t)) return;
      if (anchorRef.current && anchorRef.current.contains(t as Node)) return;
      onClose();
    };
    if (open) {
      document.addEventListener('mousedown', handleMouse);
      document.addEventListener('touchstart', handleTouch, { passive: true } as AddEventListenerOptions);
    }
    return () => {
      document.removeEventListener('mousedown', handleMouse);
      document.removeEventListener('touchstart', handleTouch as EventListener);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="fixed z-[10001] top-14 right-3 w-72 bg-slate-800 text-white border border-slate-700 rounded-md shadow-xl"
      role="menu"
    >
      <div className="px-4 py-3 border-b border-slate-700">
        <div className="text-sm text-slate-300">ログイン中</div>
        <div className="text-sm font-medium truncate" title={user?.email ?? ''}>{user?.email ?? '-'}</div>
      </div>
      <div className="py-1">
        <div className="px-4 py-2 text-xs text-slate-400">デフォルト設定</div>
        <button
          className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700 disabled:opacity-40"
          disabled={!hasDefault}
          onClick={() => { onLoadDefault(); onClose(); }}
        >デフォルトを呼び出し</button>
        <button
          className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700"
          onClick={() => { onSaveDefault(); onClose(); }}
        >現在のプロジェクトをデフォルトに登録</button>
        <button
          className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700 disabled:opacity-40"
          disabled={!hasDefault}
          onClick={() => { onResetDefault(); onClose(); }}
        >デフォルトをリセット</button>
        <div className="border-t border-slate-700 my-1" />
        <button
          className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-slate-700"
          onClick={async () => {
            const supabase = getSupabaseClient();
            await supabase.auth.signOut();
            onClose();
          }}
        >ログアウト</button>
      </div>
    </div>
  );
};

