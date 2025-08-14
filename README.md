MiDiSketch
==========

### 概要
ブラウザで使えるシンプルなピアノロールMIDIエディタです。PC/モバイル対応。MIDI書き出し、プロジェクトのJSON保存/読み込み、Supabaseを用いたクラウド保存に対応します。
<img width="1920" height="1080" alt="Screen" src="https://github.com/user-attachments/assets/60dd40f3-958b-4a44-893b-698a1cf2e1ba" />

### 主な機能
- トラック管理（トラックカラー/波形/ソロ/ミュート/音量）
- ノート編集（ドラッグ移動・リサイズ・複数選択）
- コード入力（右クリック/長押しでメニュー起動）
- 出力/保存（MIDI、JSON）

### 制作背景
趣味で作曲をするとき、外出先ではPCが手元にないことや、あっても楽器がなく和音の打ち込みが面倒なことが多く、作曲を始めるモチベーションが下がってしまう課題がありました。  
この問題を解決するため、ブラウザ上で簡単にコード入力やメロディ作成ができるMIDIエディタを制作しました。  
外出先でも直感的に操作でき、思いついた音楽のアイデアをすぐ形にできる環境を目指しています。

### デモ・動画

実際に動作するVercelデプロイ版  
🔗 [MiDiSketch デモ](https://midi-sketch.vercel.app)

動作動画（PC・モバイル）  
[PC版](https://youtu.be/1WXMq6ymIxY?si=e-v7YGZzEDDn_xan) 
[モバイル版](https://youtube.com/shorts/rZJK1CjN6gE?si=Qcr9j75iLAXPHFdx)

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
### 画面構成　
<img width="1920" height="1080" alt="Instructions" src="https://github.com/user-attachments/assets/4b1f86b8-9b6a-47c8-88f3-2588da7d1141" />

1. **コードメニュー**  
   ノートを右クリックまたは長押しすると表示され、簡単にコードを配置できます。

2. **トラック**  
   PCでは常に表示。モバイルではトラックボタン、または左端スワイプで表示可能。  
   各トラックの状態を細かく調整できます。

3. **曲名**  
   曲名を指定できます。そのままプロジェクト名としても使用されます。

4. **ツールバー**  
   保存、書き出し、再生、ループなど、プロジェクト操作をまとめています。

5. **小節ボタン・コントロールバー**  
   小節の削除、移動、コピー、全選択をボタンで実行可能。  
   スライド操作で小節数を簡単に調整できます。

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
MIT License
