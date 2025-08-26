'use client';

import { useEffect, useState } from 'react';

export default function PWATestPage() {
  const [pwaStatus, setPwaStatus] = useState({
    isInstalled: false,
    isStandalone: false,
    hasServiceWorker: false,
    isOnline: true,
    canInstall: false
  });

  useEffect(() => {
    // PWAの状態をチェック
    const checkPWAStatus = () => {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
      const isStandalone = isInstalled;
      const hasServiceWorker = 'serviceWorker' in navigator;
      const isOnline = navigator.onLine;

      setPwaStatus({
        isInstalled,
        isStandalone,
        hasServiceWorker,
        isOnline,
        canInstall: false
      });
    };

    // Service Workerの登録状態をチェック
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        setPwaStatus(prev => ({
          ...prev,
          hasServiceWorker: !!registration
        }));
      }
    };

    checkPWAStatus();
    checkServiceWorker();

    // オンライン/オフライン状態の監視
    const handleOnline = () => setPwaStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPwaStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        setPwaStatus(prev => ({ ...prev, hasServiceWorker: true }));
      } catch (error) {
        // Service Worker registration failed
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">PWA テストページ</h1>
        
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">PWA 状態</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>インストール済み:</span>
                <span className={pwaStatus.isInstalled ? 'text-green-400' : 'text-red-400'}>
                  {pwaStatus.isInstalled ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>スタンドアロンモード:</span>
                <span className={pwaStatus.isStandalone ? 'text-green-400' : 'text-red-400'}>
                  {pwaStatus.isStandalone ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Service Worker:</span>
                <span className={pwaStatus.hasServiceWorker ? 'text-green-400' : 'text-red-400'}>
                  {pwaStatus.hasServiceWorker ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>オンライン:</span>
                <span className={pwaStatus.isOnline ? 'text-green-400' : 'text-red-400'}>
                  {pwaStatus.isOnline ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">アクション</h2>
            <div className="space-y-3">
              <button
                onClick={handleInstall}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
              >
                Service Worker を登録
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors"
              >
                ページを再読み込み
              </button>
              <a
                href="/"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors text-center"
              >
                メインページに戻る
              </a>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">PWA のテスト方法</h2>
            <div className="space-y-2 text-sm">
              <p>1. ブラウザの開発者ツールを開く</p>
              <p>2. Application タブで以下を確認:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Manifest が正しく読み込まれているか</li>
                <li>Service Workers が登録されているか</li>
                <li>Storage にキャッシュが保存されているか</li>
              </ul>
              <p>3. オフラインにしてページが表示されるかテスト</p>
              <p>4. ホーム画面に追加できるかテスト</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
