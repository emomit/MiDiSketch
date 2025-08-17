"use client";
import React, { useState } from 'react';
import { getSupabaseClient } from '../../../utils/supabaseClient';

interface LoginSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginSheet: React.FC<LoginSheetProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    onClose();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = getSupabaseClient();
    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : undefined);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMessage('確認メールを送信しました。メールのリンクから認証してください。');
  };

  return (
    <div
      className={`fixed top-0 md:top-[56px] right-0 z-[10000] w-[360px] max-w-[85vw] h-[100dvh] md:h-[calc(100vh-56px)]
      bg-slate-800 text-white border-l border-slate-700 shadow-2xl
      transition-transform duration-200 ease-out will-change-transform
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-4 border-b border-slate-700 font-semibold">
        {mode === 'login' ? 'ログイン' : '新規登録'}
      </div>
      <form onSubmit={mode === 'login' ? handleSignIn : handleSignUp} className="p-4 flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="px-3 py-2 rounded bg-slate-700 border border-slate-600 focus:outline-none"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="px-3 py-2 rounded bg-slate-700 border border-slate-600 focus:outline-none"
          required
        />
        {mode === 'signup' && (
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            className="px-3 py-2 rounded bg-slate-700 border border-slate-600 focus:outline-none"
            required
          />
        )}
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {message && <div className="text-green-400 text-sm">{message}</div>}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded px-4 py-2 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800"
        >
          {loading ? '処理中…' : mode === 'login' ? 'ログイン' : '登録する'}
        </button>
      </form>
      <div className="px-4 pb-4 text-sm text-slate-300">
        {mode === 'login' ? (
          <button
            className="underline hover:text-white transition-colors"
            onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
          >
            アカウントを作成
          </button>
        ) : (
          <button
            className="underline hover:text-white transition-colors"
            onClick={() => { setMode('login'); setError(null); setMessage(null); }}
          >
            既にアカウントをお持ちの方はこちら
          </button>
        )}
      </div>
    </div>
  );
};

