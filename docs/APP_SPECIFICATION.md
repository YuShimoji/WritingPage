# アプリケーション仕様書

Zen Writer v0.3.32

## 目次

1. [概要](#概要)
2. [動作環境](#動作環境)
3. [主要機能](#主要機能)
4. [UI構成](#ui構成)
5. [技術仕様](#技術仕様)
6. [配布形式](#配布形式)

---

## 概要

**製品名：** Zen Writer
**バージョン：** 0.3.32
**種別：** デスクトップアプリ / PWA
**ライセンス：** Private
**開発言語：** JavaScript（バニラJS）

**コンセプト：**
執筆に集中するためのミニマル&スタイリッシュな物語スタジオ。Novlr、Obsidian、Scrivenerの良い点を取り入れた、シンプルでモダンなエディタ。

---

## 動作環境

### デスクトップアプリ（Electron）

| 項目 | 要件 |
|------|------|
| OS | Windows 11 Home 10.0.26200以降 |
| Electron | v35.0.0 |
| Node.js | v22.19.0（開発時） |
| メモリ | 2GB以上推奨 |
| ディスク | 200MB以上の空き容量 |

### PWA（Progressive Web App）

| 項目 | 要件 |
|------|------|
| ブラウザ | Chrome 90+, Edge 90+, Firefox 88+ |
| 接続 | HTTPS または localhost |
| ストレージ | LocalStorage有効 |

---

## 主要機能

### 1. エディタ機能

| 機能 | 説明 | 状態 |
|------|------|------|
| テキストエディタ | シンプルなtextareaベース | 実装済み |
| WYSIWYGエディタ | リッチテキスト編集（contenteditable、切り替え可能） | 実装済み |
| 分割ビュー | 編集/プレビュー並列表示 | 実装済み |
| 文字数カウント | リアルタイム表示（ツールバー） | 実装済み |
| 自動保存 | LocalStorageに自動保存 | 実装済み |
| スナップショット | 手動/自動のバックアップポイント | 実装済み |
| タイプライターモード | カーソル位置固定スクロール | 実装済み |

### 2. 統合シェル UI（SP-070 以降）

公開 UI は mode 切替ではなく、統合シェルの状態で説明する。

| Surface | 説明 | 入口 |
|--------|------|------|
| top chrome | hidden が既定の一時シェル。window controls / drag lane / shell 操作を集約 | `F2`、Electron menu、command palette |
| left nav root | 常設ミニレール。カテゴリ一覧と last active cue を表示 | 左ナビ |
| left nav category | active category の label / icon / panel / gadget loadout を表示 | root からカテゴリ選択 |
| 再生オーバーレイ | 読者視点確認。visible 章結合・目次・ナビ・装飾パイプライン統合・読書進捗バー | shell UI / command palette |

- 内部互換 API として `normal` / `focus` は残るが、公開仕様の第一級概念にはしない。
- 過去の保存値は統合シェルの通常状態へ正規化する。
- 仕様詳細: `docs/INTERACTION_NOTES.md`、`docs/specs/spec-mode-architecture.md`

### 3. ドキュメント管理

| 機能 | 説明 | 状態 |
|------|------|------|
| 階層的ドキュメントツリー | Scrivener/Obsidian風 | 実装済み |
| 全文検索 | 複数ドキュメント横断、正規表現対応、検索履歴 | 実装済み |
| ドラッグ&ドロップ並び替え | ツリー内の順序変更 | 実装済み |
| Wikiリンク | `[[wikilink]]` 構文でドキュメント間リンク | 実装済み |
| doc:// リンク | `doc://docId#section` でドキュメント間+セクション指定リンク | 実装済み |
| チャプター管理 | Focus モード左パネルで章の追加・リネーム・並び替え・削除・D&D（SP-071 Phase 1） | 実装済み |

### 4. ガジェットシステム

モジュラー設計による拡張可能なパネルシステム。サイドバー内に6カテゴリのアコーディオンで配置。

**サイドバーカテゴリ（6区分）：**

| カテゴリ | ID | 主なガジェット |
|---------|-----|---------------|
| セクション | `sections` | SectionsNavigator（見出しツリー、Phase 1+2実装済み） |
| 構造 | `structure` | Documents, Outline, StoryWiki, Tags/SmartFolders, SnapshotManager |
| 編集 | `edit` | MarkdownPreview, ChoiceTools, FontDecoration, TextAnimation, Images |
| テーマ | `theme` | Themes, HeadingStyles, EditorLayout, VisualProfile |
| 補助 | `assist` | WritingGoal, HUDSettings, Pomodoro, MarkdownReference |
| 詳細設定 | `advanced` | UISettings, PrintSettings, GadgetPrefs, Keybinds, Help, LoadoutManager（標準 preset からは除外） |

**ガジェット総数：** 28個
**ロードアウト：** 3プリセット（作家モード/全機能/最小限）+ カスタム

### 5. 装飾・アニメーション

ビジュアルノベル・Web小説作成のための視覚要素。

**装飾機能：**

- 太字、斜体、下線、取り消し線
- 影、輪郭、光彩
- 大文字/小文字変換、文字間隔調整

**アニメーション機能：**

- フェード、スライド、タイプライター
- パルス、シェイク、バウンス
- 遅延フェード、速度・持続時間調整

**フローティングツールバー：**

- テキスト選択時にコンテキストメニューとして表示
- 装飾・アニメーション適用のショートカット

### 6. インポート/エクスポート

#### プラットフォーム別対応マトリクス

| 形式 | Browser/PWA Import | Browser/PWA Export | Electron Import | Electron Export |
|------|:--:|:--:|:--:|:--:|
| テキスト（.txt） | ○ | ○ | ○ | ○ |
| Markdown（.md） | ○ | ○ | ○ | ○ |
| HTML | × | × | ○ | ○ |
| PDF（印刷） | × | ○ | × | ○ |

#### UIアクセス経路

- **Browser/PWA**
  - Import: サイドバー → Documentsガジェット → 「入出力」→「JSON読み込み」
  - Export: サイドバー → Documentsガジェット → 「入出力」→「TXT書き出し」/「JSON書き出し」/ Advancedガジェット → 「印刷プレビュー」「TXT書き出し」
- **Electron**
  - Import: ファイル → 開く（`Ctrl+O`）— `.txt`, `.md`, `.html`, `.htm`, 任意ファイル
  - Export: ファイル → エクスポート → テキスト / HTML / Markdown
  - 印刷: ファイル → 印刷（`Ctrl+P`）またはAdvancedガジェット

**注記:** HTML エクスポートは `markdown-it` ライブラリによるレンダリング。Markdown構文がHTMLに変換される。

### 7. プラグインシステム

manifest駆動のローカルプラグイン機能を実装済み。

#### 基盤

| 項目 | 状態 |
|------|------|
| プラグインローダー | 実装済み（`js/plugin-manager.js`） |
| プラグインAPI | 実装済み（`js/plugin-api.js`） |
| manifest.json形式 | 実装済み（`js/plugins/manifest.json`） |
| 同梱プラグイン | choice.js（選択肢ツール） |

#### プラグインAPI（実装済み）

| API | 機能 | 備考 |
|-----|------|------|
| `gadgets` | カスタムガジェットの登録・設定読み書き | `ZWGadgets` へ委譲 |
| `themes` | カスタムテーマパレットの登録 | `ThemeRegistry` へ委譲 |
| `storage` | プラグイン固有のlocalStorage（`zw_plugin_{id}_` プレフィクスで分離） | JSON自動シリアライズ |
| `events` | 名前空間付きCustomEvent (`ZWPlugin:{id}:{name}`) の送受信 | `onZW()` でグローバル購読可 |

#### 登録パターン

プラグインには2つの登録方式がある:

1. **`window.ZWPlugin.register(config)`** — 正規API。`init(api)` コールバックで4つのAPIにアクセスできる
2. **`window.ZenWriterPlugins.register(plugin)`** — 簡易レジストリ。エディタアクション（テンプレート挿入等）を直接登録する

同梱の choice.js は簡易レジストリを使用。正規APIの利用例は今後追加予定。

#### セキュリティ制約

- **Trusted local plugins only**: `js/plugins/` 配下のローカルファイルのみ許可
- パス検証: `js/plugins/[a-zA-Z0-9._\-/]+\.js` のみ通過、`..` を含むパスは拒否
- サンドボックス・CSP分離・リモートプラグイン・権限システムは未実装

#### 将来予定（未実装）

| 項目 | 状態 |
|------|------|
| commands API | 設計のみ（`docs/design/PLUGIN_SYSTEM.md`） |
| プラグインマネージャーUI | 未実装 |
| リモートプラグイン | 未着手 |
| サンドボックス分離 | 未着手 |
| 権限宣言システム | 未着手 |

詳細: `docs/PLUGIN_GUIDE.md`

### 8. Story Wiki

ドキュメント内の世界観・キャラクター・用語を管理するWiki機能。

| 機能 | 状態 |
|------|------|
| カテゴリ分類 | 実装済み（キャラクター/場所/用語/メモ/設定） |
| ツリー+詳細ペイン | 実装済み |
| Wikiリンク `[[]]` | 実装済み |
| バックリンク表示 | 実装済み |
| ノードグラフ | 実装済み（リンク関係の可視化） |

---

## UI構成

### ツールバー

| グループ | 要素 |
|---------|--------|
| サイドバー制御 | メニューボタン |
| 情報表示 | 文字数カウント、執筆目標プログレスバー |
| shell 操作 | top chrome 表示、left nav root 復帰、再生オーバーレイ |
| クイックアクション | command palette / shell UI に集約 |
| ウィンドウ操作 | 最小化/最大化/閉じる（Electronフレームレス時のみ） |

### サイドバー

**構成：** left nav root/category 階層 + 6カテゴリ（sections / structure / edit / theme / assist / advanced）

- 各カテゴリは折りたたみ可能
- ガジェットはカテゴリ内に配置
- ロードアウト（プリセット）でガジェット構成を切り替え可能
- 公開 UI では left nav 階層を主導線とし、内部 mode による見え方の差分は互換扱い

### 一時シェル UI

- top chrome: 明示操作時だけ表示し、上端 hover reveal は使わない
- left nav: 常設ミニレールから root/category を切り替える

---

## 技術仕様

### アーキテクチャ

| 項目 | 技術 |
|------|------|
| フレームワーク | なし（バニラJS） |
| CSS設計 | CSS変数、Flexbox |
| ストレージ | IndexedDB + メモリキャッシュ (localStorageフォールバック) |
| テスト | Playwright E2E（62ファイル） |
| Lint | ESLint、Prettier、Markdownlint |
| デスクトップ | Electron v35.0.0 |

### コードベース

| 項目 | 数値 |
|------|------|
| JavaScriptファイル | 108ファイル |
| CSSファイル | 4ファイル（style.css メイン） |
| E2Eテスト | 62ファイル |
| ガジェット | 28個 |
| 仕様書 | spec-index.json に56エントリ |

### パフォーマンス

| 項目 | 目標 |
|------|------|
| 初期読み込み | 2秒以内 |
| 自動保存間隔 | 1秒 |
| テキスト入力遅延 | 50ms以内 |

### セキュリティ

| 対策 | 実装状況 |
|------|---------|
| XSS対策 | CSS.escape使用、入力サニタイズ |
| ReDoS対策 | 正規表現検証 |
| Origin検証 | Embed SDK origin検証実装済み |

---

## 配布形式

### 1. Electronアプリ

**App ID：** com.zenwriter.app
**製品名：** Zen Writer
**ビルド方式：** electron-builder

**配布ファイル：**

- `build/win-unpacked/` - Windows実行ファイル
- `Zen Writer.exe` - メインアプリケーション

**インストール：**

- スタートメニューショートカット自動作成（`npm run app:install`）
- レジストリ登録なし（ポータブル）

### 2. PWA

**Manifest：**

```json
{
  "name": "Zen Writer",
  "short_name": "ZenWriter",
  "display": "standalone",
  "background_color": "#1e1e1e",
  "theme_color": "#252526"
}
```

**Service Worker：**

- キャッシュ戦略：Network First
- オフライン対応

---

## 制限事項

### 現在の制限

1. **プラットフォーム：** Windowsのみ正式サポート（Mac/Linux未検証）
2. **同期機能：** なし（LocalStorageのみ）
3. **クラウド保存：** なし
4. **モバイル対応：** デスクトップ優先、モバイルは部分対応
5. **プラグインセキュリティ：** ローカル信頼のみ。サンドボックス・リモートプラグインは未実装

### クラウド同期（設計ドラフト / session 86）

現時点では未実装。PoC は以下の最小要件で設計する。

- 同期単位は `documentId` 基準（ドキュメントごと）
- 競合解決は **LWW + 競合時複製** を採用（自動マージしない）
- オフライン復帰時に失敗した場合はローカルスナップショットへ復旧
- 認証情報は環境変数/OS資格情報ストア経由を前提（コード直書き禁止）
- 通信は TLS 前提、失敗時は UI に明示的な同期状態を表示

### LocalStorage容量

- **標準：** 5-10MB
- **推奨：** 大量のテキストはエクスポートして外部保存

---

## 主要仕様の実装状態

詳細は `docs/spec-index.json` を参照。ロードマップ上の優先度は `docs/ROADMAP.md` に記載。

| ID | 仕様名 | 状態 |
|----|--------|------|
| SP-070 | モードアーキテクチャ | done (Phase 1-3完了) |
| SP-071 | チャプター管理再設計 | done (Phase 1-3完了) |
| SP-072 | セクションリンク & インタラクティブナビ | done (Phase 1-5完了) |
| SP-073 | パステキスト | partial (90%。Phase 1-3完了、Phase 4 フリーハンド描画 残) |
| SP-074 | Web小説演出統合 | done (Phase 1-6完了) |
| SP-076 | ドックパネルシステム | partial (75%。Phase 1-3完了、Phase 4 上下ドック+プリセット 残) |

---

## 関連ドキュメント

- [起動手順書](APP_LAUNCH_GUIDE.md)
- [ロードマップ](ROADMAP.md)
- [アーキテクチャ](ARCHITECTURE.md)
- [トラブルシューティング](TROUBLESHOOTING.md)
- [仕様インデックス](spec-index.json)
