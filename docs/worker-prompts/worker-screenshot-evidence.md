# Worker Prompt: 全機能スクリーンショットエビデンス

> 生成日: 2026-03-23 / 担当: 独立Worker (Sonnet推奨)
> 並行実行: 可 (コアセッションと競合しない)

## 概要

Playwright を使って全機能のスクリーンショットを `docs/assets/screenshots/` に出力し、
どの機能がどう達成されているかを視覚的に証明するエビデンスを作成する。

## 前提

- `scripts/capture-full-showcase.js` が既存のキャプチャ基盤 (19シーン)
- 追加で以下の機能別エビデンスが必要

## 撮影対象一覧

### 1. エディタモード (4枚)
- Normal モード (デフォルト状態)
- Focus モード (チャプターリスト + エディタ)
- Blank モード (全非表示 + エッジホバー)
- Reader プレビューモード

### 2. チャプター管理 (4枚)
- チャプターリスト (章一覧 + 文字数表示)
- chapterMode デフォルト (新規ドキュメント)
- 章モード解除ボタン
- Legacy 変換バナー (既存ドキュメント)

### 3. DSL 演出ブロック (6枚)
- テキストボックス (dialogue/monologue プリセット)
- タイピング演出 (Reader プレビュー内)
- ダイアログボックス (4スタイル)
- スクロール連動 (fade-in/slide-in)
- パステキスト (SVG textPath)
- DSL挿入GUI モーダル (属性設定)

### 4. WYSIWYG ツールバー (3枚)
- 基本装飾 (太字/斜体/下線)
- TB ドロップダウン (演出挿入4種)
- ルビ挿入ポップアップ

### 5. サイドバー・ガジェット (6枚)
- サイドバー 6カテゴリ展開
- Story Wiki (エントリ + バックリンク)
- ノードグラフビュー
- ドキュメントツリー (階層表示)
- Typography パック選択
- 設定モーダル

### 6. ドックパネル (3枚)
- 左右ドック
- タブグループ
- フローティングパネル

### 7. テーマ (4枚)
- ライトテーマ (デフォルト)
- ダークテーマ
- セピアテーマ
- ハイコントラストテーマ

### 8. 日本語組版 (3枚)
- ルビ表示 (WYSIWYG内)
- 傍点表示
- 見出しタイポグラフィ

### 9. Reader プレビュー詳細 (3枚)
- 目次ページ + ナビゲーション
- ゲームブック分岐リンク
- エクスポートHTML

## 出力形式

```
docs/assets/screenshots/
  evidence-YYYY-MM-DD/
    01-mode-normal.png
    01-mode-focus.png
    01-mode-blank.png
    01-mode-reader.png
    02-chapter-list.png
    02-chapter-default.png
    ...
    manifest.json    ← ファイル名と説明の対応表
```

## 実装方法

1. `scripts/capture-full-showcase.js` の `run()` 関数をベースにする
2. 各シーンの前に必要なセットアップ (コンテンツ投入、モード切替、ガジェット展開) を行う
3. スクリーンショットは `page.screenshot({ path, fullPage: false })` で取得
4. 最後に `manifest.json` を出力

## 検証

- すべてのスクリーンショットファイルが存在すること
- manifest.json に全エントリが含まれていること
- 各画像が空白/エラー画面でないこと (ファイルサイズで簡易チェック)

## 注意事項

- dev-server を起動した状態で実行: `npm run dev` → 別ターミナルでスクリプト実行
- フォントのレンダリング差異を避けるため `stabilize()` 関数を使用
- サンプルコンテンツは `samples/full-feature-showcase.md` を使用
