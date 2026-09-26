# ワンナイト人狼 Online (One Night Werewolf Online)

スマホやPCのブラウザで手軽に遊べるリアルタイム通信型ワンナイト人狼ゲームです。
合言葉やURL共有で友達と即座にマッチングし、一晩の騙し合いを楽しめます。

---

## 🚀 主な機能

- **リアルタイム通信 (WebSocket)**: 投票、夜の能力発動、チャット、議論タイマーを完全同期。
- **スマホ完全対応**: タップ操作に特化したUI、直感的なカードめくり演出、片手操作。
- **役職完全サポート**: 人狼（一匹狼の墓地確認対応）、占い師、怪盗、村人、狂人、てるてる。
- **平和村判定**: 人狼が不在の場合の特殊判定ルールにも完全対応。
- **BOT追加機能**: 1人でも動作確認やテストプレイができる自動BOT機能。
- **推理メモ帳 & クイックスタンプ**: 議論をサポートするスマホ専用メモ機能と定型文スタンプ。
- **Web Audio音効**: 遠吠え、鐘、投票、ファンファーレなどの効果音（ミュート可能）。

---

## 🛠️ 技術スタック

- **フロントエンド**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti
- **バックエンド**: Node.js, Express, `ws` (WebSocket)
- **実行エンジン**: `tsx` (TypeScript直接実行)

---

## 💻 ローカル環境での動かし方

### 1. 前提条件
- [Node.js](https://nodejs.org/) (v18以上推奨)
- [Git](https://git-scm.com/)

### 2. セットアップ手順

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動 (ポート3000)
npm run dev
```

起動後、ブラウザで `http://localhost:3000` を開きます。
複数ブラウザタブやシークレットウィンドウを開くことで、ローカルでも複数人プレイをテストできます。

### 3. 本番ビルド & 実行

```bash
# クライアントコードのビルド
npm run build

# 本番サーバーの起動
npm start
```

---

## 📦 GitHub への公開手順

### 新しいリポジトリを作成してプッシュする場合:

1. [GitHub](https://github.com/) で新規リポジトリを作成（例: `one-night-werewolf`）。
2. プロジェクトのルートディレクトリで以下のコマンドを実行します：

```bash
# Gitの初期化
git init

# ファイルをステージングに追加
git add .

# コミットの作成
git commit -m "Initial commit: One Night Werewolf Online"

# メインブランチに設定
git branch -M main

# リモートリポジトリの登録（URLをご自身のリポジトリに変更）
git remote add origin https://github.com/あなたのユーザー名/one-night-werewolf.git

# GitHubへプッシュ
git push -u origin main
```

---

## 🌐 インターネット上への無料デプロイ（おすすめ先）

このアプリはリアルタイム通信に **WebSocket (Node.js)** を利用しているため、 静的ホスティング（GitHub PagesやVercel無料版のサーバーレス環境）単体ではなく、**WebSocket接続が維持できるコンテナ/Node.jsホスティング**が最適です。

### おすすめの公開先:
1. **[Render](https://render.com/) (Web Service)**:
   - GitHubリポジトリを連携するだけで自動デプロイ可能。
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node (無料プランあり)

2. **[Railway](https://railway.app/)**:
   - GitHub連携で即座に起動。WebSocket対応。

3. **[Fly.io](https://fly.io/)** / **[Google Cloud Run](https://cloud.google.com/run)**:
   - スケーラビリティが高く、低遅延でホスト可能。
