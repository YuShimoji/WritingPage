# モードアーキテクチャ仕様書 (SP-070)

## 概要

Zen Writer のアプリケーション全体を **Normal / Focus / Blank** の3モードに分離し、
執筆集中と全機能アクセスを両立させる。
現在のガジェット過多問題（33個）とサイドバー混雑を、モード切り替えで構造的に解決する。

---

## 背景課題

- 左サイドバーにガジェットが33個並び、執筆に不要な情報が常時表示される
- 章構造の管理とガジェット設定が同一パネルに混在し、認知負荷が高い
- 「必要以外のガジェット大項目を下に避ける」暫定対処では根本解決にならない
- 執筆時に必要なのはタイトルと章構造だけだが、それを実現するUI状態がない

---

## 目的

- 執筆時の認知負荷を最小化する（Focusモード）
- 全機能へのアクセスを維持する（Normalモード）
- 究極にシンプルな環境を提供する（Blankモード）
- モード間の遷移を低コストにする

---

## モード定義

### Normal モード

全機能アクセス可能なデフォルト状態。

| 要素 | 表示 |
|------|------|
| サイドバー | 全カテゴリ表示（sections / structure / edit / theme / assist / advanced） |
| ガジェット | ロードアウトに従い全表示 |
| ヘッダーツールバー | 表示 |
| フローティング装飾バー | 表示 |
| ステータスバー | 表示 |
| エッジホバーUI | 有効 |

用途: テーマ設定、ガジェット操作、Wiki管理、デバッグ、全般的な設定変更。

> **実装名称**: `data-ui-mode="normal"`（既存実装との互換。仕様上の「Editor」は「Normal」に統一）

### Focus モード

執筆集中のための簡素化された状態。

| 要素 | 表示 |
|------|------|
| サイドバー | 非表示。代わりに **チャプターリストパネル**（左固定240px） |
| ガジェット | 非表示 |
| ヘッダーツールバー | 表示（モード切替を含む） |
| フローティング装飾バー | 表示（テキスト選択時のみ） |
| ステータスバー | 表示（文字数 / 現在章） |
| エッジホバーUI | 無効 |
| オーバーレイアクセス | チャプターリストパネル内の「設定」ボタンから |

用途: 執筆作業。章間の移動。テキスト装飾は選択時のフローティングバーで行う。

> **実装名称**: `data-ui-mode="focus"`

### Blank モード

エディタのみの究極シンプル状態。

| 要素 | 表示 |
|------|------|
| サイドバー | 非表示 |
| ガジェット | 非表示 |
| ヘッダーツールバー | 非表示（**上端エッジホバーで一時表示**、またはEscで復帰） |
| フローティング装飾バー | 表示（テキスト選択時のみ） |
| ステータスバー | 非表示 |
| エッジホバーUI | 上端のみ有効（ツールバー一時表示用） |

用途: 完全な執筆没入。気を散らす要素を一切排除。

> **実装名称**: `data-ui-mode="blank"`

---

## モード遷移

### 遷移方法

1. **ヘッダー内モード切替ボタン**（3状態トグル、常設。ツールバー内 `.mode-switch` radiogroupに実装済み）
2. **キーボードショートカット**:
   - `Ctrl+Shift+F`: Focus トグル（Focus中に再押下でNormalへ）
   - `Ctrl+Shift+B`: Blank トグル（Blank中に再押下でNormalへ）
   - `Esc`: Focus / Blank → Normal に復帰
3. **Blankモードからの復帰**: マウス上端ホバーでツールバー一時表示 → モードボタンでNormalへ

### 遷移時の挙動

- モード切替はCSSトランジション（200ms ease）
- エディタの内容・カーソル位置・スクロール位置は保持
- 現在のモードは `settings.ui.uiMode` として localStorage に保存し、次回起動時に復元
- モード切替時にドキュメントの保存は発生しない（状態はUI表示のみに影響）

### Normal モードへのオーバーレイアクセス

Focus モードから全機能にアクセスする必要がある場合:

- **スライドインオーバーレイ**: チャプターリストパネルの「設定」ボタン → 右からサイドバーがスライドイン
- オーバーレイを閉じると Focus モードに戻る（モード変更は発生しない）
- オーバーレイ内での設定変更は即時反映

Blank モードから:

- 上端エッジホバーでツールバーが一時表示される
- ツールバー内のモードボタンで Normal / Focus に遷移可能
- `Esc` キーで即座に Normal に復帰

---

## 既存機能との関係

### サイドバー (SidebarManager)

- Normal モード: 現行のアコーディオン6カテゴリをそのまま使用
- Focus モード: `SidebarManager` は非活性化。`#focus-chapter-panel` が左パネルを占有。設定ボタンでサイドバーをオーバーレイ表示
- Blank モード: サイドバー DOM は非表示（`display: none`）

### ガジェットシステム

- ガジェットの登録・初期化はモードに依存しない（常にロード済み）
- 表示/非表示のみモードで切り替える
- ガジェット間通信はモードに関係なく機能する

### SP-052 セクションナビゲーション

- Normal モードの `sections` カテゴリにある `SectionsNavigator` は引き続き機能
- Focus モードの `ChapterList` は `SectionsNavigator` とデータソース（見出し解析結果）を共有するが、UIは別
- 責務分離: `SectionsNavigator` = ガジェットとしてのセクション管理、`ChapterList` = Focusモード専用の簡素なナビ

### SP-076 ドックパネル

- ドックパネルは Normal モード専用の拡張機能
- Focus / Blank モードではドックパネルは非表示
- モード遷移時にドックパネルの状態（位置・サイズ）は保持

---

## データモデル

```
// localStorage: settings.ui.uiMode (既存のZenWriter設定に統合)
"normal" | "focus" | "blank"

// 将来拡張 (未実装):
// settings.focus.chapterListWidth: number (px, default 240)
// settings.blank.showOnHover: boolean (default true)
```

---

## 実装詳細

### 変更ファイル

| ファイル | 変更内容 |
|----------|----------|
| `css/style.css` | Focus/Blank の `[data-ui-mode]` ルール強化。Focus用ChapterListパネルCSS。Blankモードのtransform方式エッジホバー復帰 |
| `js/app.js` | キーボードショートカット追加。FocusChapterPanel連動ロジック（`initFocusChapterPanel` IIFE） |
| `index.html` | `#focus-chapter-panel` マウントポイント追加。設定ボタン付きヘッダー + チャプターリスト領域 |
| `js/edge-hover.js` | 変更なし（既存のBlank対応コードが汎用CSSルールにより動作） |

### 技術的な注意点

- **Blankモードのツールバー**: `display: none` から `transform: translateY(-100%)` に変更。`edge-hover.js` の既存機構でホバー復帰
- **Electron専用CSSの廃止**: `html.is-electron[data-ui-mode="blank"]` ルールは汎用ルールに統合済み
- **FocusChapterPanel**: `SectionsNavigator` の `_headings` データを参照。未初期化時はMarkdown見出し正規表現でフォールバック解析
- **MutationObserver**: `data-ui-mode` 属性変更を監視し、Focus遷移時にチャプターリストを再構築

---

## 成功状態

- Focus モードで、タイトルと章リストだけが見え、章を選択してすぐ執筆に入れる
- Blank モードで、画面にエディタ以外何も見えない状態で執筆でき、上端ホバーでツールバーに復帰できる
- Normal モードで、現行の全機能がそのまま使える
- 3モード間の切り替えが1アクション（ショートカットまたはワンクリック）で完了する
- モード切替後もエディタの状態（内容・カーソル・スクロール）が完全に保持される

---

## 未決定事項

- [ ] Focusモードのチャプターリスト幅のリサイズ可否
- [ ] ガジェットのホットキーによるモード横断アクセスの必要性
- [ ] Visual Profile (SP-012) との連携（モードごとにテーマを変えるか）

### 解決済み

- [x] モード切替ボタンのUI → 3つのアイコンボタン（layout / crosshair / square）で実装済み
- [x] Blankモードのホバー一時表示 → `edge-hover.js` のtransform方式 + CSS transition
- [x] モード属性名 → `data-ui-mode` で統一（仕様の `data-app-mode` は不採用）
- [x] モード名称 → `normal` / `focus` / `blank`（仕様の `editor` は `normal` に統一）
- [x] オーバーレイのレイアウト → 右サイドパネルスライドイン方式

---

## 影響範囲

- `index.html`: `#focus-chapter-panel` 追加
- `css/style.css`: モード別表示ルール強化、ChapterListパネルCSS
- `js/app.js`: ショートカット、FocusChapterPanel連動
- `js/edge-hover.js`: 変更なし（既存機構を活用）
- `js/sidebar-manager.js`: 変更なし（CSS制御で十分）

---

## 段階的実装

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 1 | 3モードCSS分離 + ショートカット + Focus ChapterListスタブ + Blankエッジホバー | 完了 |
| Phase 2 | SP-071 ChapterList本実装 + ChapterStore統合ガード (undoスタック章分離、モード遷移前flush) | 完了 |
| Phase 3 | Focusパネルリサイズ (pointer events + localStorage保存 + ダブルクリック復帰) | 完了 |
| Phase 4 | SP-076 ドックパネル（Normal モード用） | todo |
