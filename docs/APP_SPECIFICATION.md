# アプリケーション仕様書

Zen Writer v0.3.29

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
**バージョン：** 0.3.29
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

### 2. エディタモード（SP-070）

3つのUIモードを切り替えて執筆環境をカスタマイズ。

| モード | 説明 | ショートカット |
|--------|------|-------------|
| Normal | 全機能アクセス可能。サイドバー・ツールバー・ガジェットすべて表示 | — |
| Focus | 執筆集中。左にチャプターリストパネル（SP-071 Phase 1実装済み: 章ナビ・リネーム・D&D・コンテキストメニュー）、サイドバー非表示。設定はオーバーレイアクセス | `Ctrl+Shift+F` |
| Blank | 究極シンプル。エディタのみ表示。上端ホバーでツールバー一時復帰 | `Ctrl+Shift+B` |

- `Esc` でFocus/BlankからNormalに復帰
- モード状態はLocalStorageに保存・次回起動時に復元
- 仕様詳細: `docs/specs/spec-mode-architecture.md`

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
| 構造 | `structure` | Outline, Documents, Snapshot, Tags/SmartFolders |
| 編集 | `edit` | StoryWiki, Images, ChoiceTools, プレビュー, 分割ビュー, WYSIWYG切り替え |
| テーマ | `theme` | Themes, Typography, VisualProfile |
| 補助 | `assist` | WritingGoal, HUD, Clock, Pomodoro |
| 詳細設定 | `advanced` | PrintSettings, Help, MarkdownRef |

**ガジェット総数：** 33個 (+1 開発専用)
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
  - Import: サイドバー → Documentsガジェット → 「読込」ボタン（`.txt`, `.md` のみ）
  - Export: サイドバー → Documentsガジェット → 「TXT」「MD」ボタン / Advancedガジェット → 「印刷プレビュー」「TXTエクスポート」
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
| モード切替 | Normal / Focus / Blank の3ボタン |
| クイックアクション | 全画面表示、Canvas Mode (beta) |
| ウィンドウ操作 | 最小化/最大化/閉じる（Electronフレームレス時のみ） |

### サイドバー

**構成：** 6カテゴリのアコーディオン（sections / structure / edit / theme / assist / advanced）

- 各カテゴリは折りたたみ可能
- ガジェットはカテゴリ内に配置
- ロードアウト（プリセット）でガジェット構成を切り替え可能
- Focusモードでは非表示（代わりにChapterListパネルを表示）

### エッジホバーUI

マウスが画面端に近づくと、隠れたUIを一時的にスライドイン表示。

- 上端: ツールバー復帰（Blankモードで有効）
- 左端: サイドバー復帰

---

## 技術仕様

### アーキテクチャ

| 項目 | 技術 |
|------|------|
| フレームワーク | なし（バニラJS） |
| CSS設計 | CSS変数、Flexbox |
| ストレージ | LocalStorage |
| テスト | Playwright E2E（358件 / 49ファイル） |
| Lint | ESLint、Prettier、Markdownlint |
| デスクトップ | Electron v35.0.0 |

### コードベース

| 項目 | 数値 |
|------|------|
| JavaScriptファイル | 104ファイル |
| CSSファイル | style.css（メイン、6000+行） |
| E2Eテスト | 49ファイル、358テストケース |
| ガジェット | 33個 (+1 開発専用) |
| 仕様書 | spec-index.json に42エントリ |

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

### LocalStorage容量

- **標準：** 5-10MB
- **推奨：** 大量のテキストはエクスポートして外部保存

---

## 新規仕様（策定済み・実装待ち）

以下の仕様は `docs/specs/` に策定済み。詳細は `docs/spec-index.json` を参照。
ロードマップ上の優先度は `docs/ROADMAP.md` に記載。

| ID | 仕様名 | 状態 |
|----|--------|------|
| SP-070 | モードアーキテクチャ | partial（Phase 1完了） |
| SP-071 | チャプター管理再設計 | partial（Phase 1完了） |
| SP-072 | セクションリンク & インタラクティブナビ | todo |
| SP-073 | パステキスト | todo |
| SP-074 | Web小説演出統合 | todo |
| SP-075 | Google Keep連携 | todo |
| SP-076 | ドックパネルシステム | todo |

---

## 関連ドキュメント

- [起動手順書](APP_LAUNCH_GUIDE.md)
- [ロードマップ](ROADMAP.md)
- [アーキテクチャ](ARCHITECTURE.md)
- [トラブルシューティング](TROUBLESHOOTING.md)
- [仕様インデックス](spec-index.json)
