MiDiSketch
==========

### 概要
ブラウザで使えるシンプルなピアノロールMIDIエディタです。PC/モバイル対応。MIDI書き出し、プロジェクトのJSON保存/読み込み、Supabaseを用いたクラウド保存に対応します。

### 主な機能
- トラック管理（トラックカラー/波形/ソロ/ミュート/音量）
- ノート編集（ドラッグ移動・リサイズ・複数選択）
- コード入力（右クリック/長押しでメニュー起動）
- 出力/保存（MIDI、JSON）

### 動作環境
- Node.js 18 以上（推奨 20）
- npm

### セットアップ
```bash
npm i
```

`.env.local`（任意）
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BASE_PATH=
```

開発サーバ
```bash
npm run dev
```

### Supabase を使う（任意）
1) Supabase プロジェクトを作成
2) `supabase/schema.sql` を実行（テーブル/ポリシー作成）
3) Auth のリダイレクトURLにデプロイ先を登録
4) `.env` に URL と anon キーを設定

未設定でもクラウド保存/自動保存以外は動作します。

### 検証/ビルド
```bash
npm run type-check
npm run lint
npm run build
```

### ショートカット
- Space: 再生/停止
- C: ループON/OFF
- ⌘(Ctrl)S: クラウド保存
- ⌘(Ctrl)M: MIDI出力
- ⌘(Ctrl)J: JSON保存
- ⌘(Ctrl)O: プロジェクト読込
- ⌘(Ctrl)Z / ⌘(Ctrl)Y: Undo / Redo
- ⌘(Ctrl)A: 全選択

### ライセンス
MIT