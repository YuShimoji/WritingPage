---
description: Zen Writerをデスクトップアプリ（Electron）としてビルド・確認する手順
---

# Zen Writer デスクトップアプリ ビルドワークフロー

## 前提条件

- Node.js がインストール済みであること
- プロジェクトルートで作業すること

## 開発モード（デバッグ確認）

// turbo

1. 依存関係をインストール

```bash
npm install
```

// turbo
2. Electronアプリを開発モードで起動

```bash
npm run electron:dev
```

- ネイティブウィンドウで Zen Writer が起動します
- DevTools付きで確認したい場合は `--dev` フラグを使用:

```bash
npm run electron:dev -- --dev
```

## 本番ビルド（配布用）

// turbo
3. ポータブルビルドを生成（インストーラーなし）

```bash
npm run electron:build
```

- 出力先: `build/win-unpacked/Zen Writer.exe`

// turbo
4. ビルド結果を確認

```bash
dir build\win-unpacked\
```

1. アプリを実行して動作確認

```bash
.\build\win-unpacked\Zen Writer.exe
```

## インストーラー付きビルド（オプション）

```bash
npm run electron:dist
```

- NSIS インストーラーが `build/` に生成されます

## 注意事項

- `build/` ディレクトリは `.gitignore` に含まれておりコミットされません
- `electron/main.js` がメインプロセス、`electron/preload.js` がプリロードスクリプトです
- Web版（ブラウザ版）は従来通り `npm run dev` で起動可能です
