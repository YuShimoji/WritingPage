# 作業申し送り: Zen Writer リファクタリング作業中

## 概要
Zen Writerのストーリーエディタ・ライティングエディタ開発のための土台盤石化を目的として、コードベースのリファクタリングを進行中です。ガジェットアーキテクチャの安定化、テストの修正、コード整理を実施し、プロジェクト全体の品質向上を進めています。

## 現在のプロジェクト状況

### 目標
- **ストーリーエディタ・ライティングエディタ開発の土台盤石化**
- **コードベースの品質向上**: 単一責任、命名規則、モジュール分割、ハードコーディング除去、長すぎるスクリプトの分割
- **テスト環境の安定化**: smoke/e2eテストの実行可能性確保
- **将来機能追加の容易化**: 保守性・拡張性の高いアーキテクチャ構築

### 実施済み作業

#### 1. リモート更新の同期とコンフリクト解消 ✅
- リモートからの最新更新を取得
- merge conflictを解決し、ローカル環境を安定化
- プロジェクト構造の確認とドキュメント更新

#### 2. プロジェクト全体像の把握 ✅
- 構造分析: 主要コンポーネントの依存関係理解
- ドキュメント確認: GADGETS.md, wiki-help.html, editor-help.html
- 既存Issueの棚卸しと優先度付け

#### 3. 未実装機能・未修正の総ざらいと優先度付け ✅
- `gadgets.js` (2994行): → モジュール化完了、`js/_legacy/gadgets.js` にアーカイブ済み
- Wiki/StoryWikiガジェットの重複実装問題
- UI構造変更に伴うテストセレクタの不整合
- ガジェットロードアウト処理の再確認が必要

#### 4. コードベース分析とリファクタリング計画策定 ✅
- `docs/REFACTORING_PLAN.md` に詳細な計画書を作成
- 短期計画: gadgets.js分割 → 完了、ビルトインガジェット個別ファイル化 → 完了
- 中期計画: editor.js/app.js整理、未実装機能の実装
- 品質基準: テストカバレッジ80%以上、静的解析エラー0件

#### 5. リファクタリング実行（第一段階）✅
- **smoke test修正**: `scripts/dev-check.js` を現在のUI構造に合わせて更新
  - pluginsパネルをオプション扱いに変更
  - gadgetsパネルIDを `structure-gadgets-panel`, `assist-gadgets-panel` に統一
  - import/export APIチェックをUI要素依存からAPI存在確認に変更

- **重複コード削除**: `js/gadgets.js` からコメントアウトされたStoryWikiガジェット（約200行）を削除、最終的に `js/_legacy/gadgets.js` にアーカイブ

- **テスト用ID追加**:
  - `js/gadgets.js`: カラーピッカーに `#bg-color`, `#text-color`, テーマボタンに `data-theme-preset` 属性、リセットボタン `#reset-colors`
  - `js/gadgets-editor-extras.js`: Typewriter/Snapshotガジェットのコントロールに適切なID付与

#### 6. テスト実行と動作確認 ✅
- **Smokeテスト**: ALL TESTS PASSED (全項目合格)
- **E2Eテスト**: 39 passed, 7 failed (大幅改善: 32→39 passed)
  - 残存失敗: theme-colors関連3件, editor-settings関連4件
  - 主な原因: ガジェットレンダリングタイミング、ロードアウト設定による表示状態差異

### 現在のテスト状況

#### 合格項目 (39件)
- Clockガジェット: 時間表示切替、設定永続化
- HUD Settings: 設定UI表示、幅・フォントサイズ設定
- Font Decoration: 基本装飾適用
- Wikiガジェット: ページ作成、検索、編集
- スナップショット管理: 設定保存・復元
- UI設定: タブ表示モード切替
- ドキュメント切替: 自動保存機能

#### 失敗項目 (7件)
1. **Theme Colors** (3件):
   - テーマ切替時のカラーピッカー値不一致
   - カスタム色適用・永続化
   - 色リセット機能

2. **Editor Settings** (4件):
   - Typewriterモード設定・保存
   - スナップショット設定調整
   - Typewriterスクロール動作
   - ドキュメント切替時の変更確認

### 技術的発見と課題

#### ガジェットアーキテクチャの現状
- **ZWGadgets.register()**: 機能追加の標準API
- **ロードアウトシステム**: `DEFAULT_LOADOUTS` でプリセット構成管理
- **グループ化**: `structure`, `assist`, `typography`, `wiki` の4グループ
- **動的レンダリング**: SidebarManager経由でのタブ/パネル管理

#### 特定された問題
- **gadgets.js肥大化**: 2994行の単一ファイル、複数の責任を担う
- **ID重複**: 複数パネルに同一ガジェットがレンダリングされる場合のID競合
- **レンダリングタイミング**: ガジェット初期化とUI要素表示の同期問題
- **テストセレクタ**: UI構造変更に伴うテストコードの更新遅れ

### 次の作業計画

#### 短期（次のセッション）
1. **gadgets.js分割開始**: core.js, loadouts.js, utils.js への分割
2. **ビルトインガジェット個別化**: 各ガジェットを別ファイルに分離
3. **残存e2eテスト修正**: 7件の失敗原因を特定し修正

#### 中期
1. **editor.js/app.js整理**: 責任分離とモジュール化
2. **未実装機能の実装**: REFACTORING_PLAN.md記載の機能
3. **ドキュメント更新**: API仕様、開発ガイドの充実

#### 品質目標
- **テストカバレッジ**: 最低80%、重要モジュール90%以上
- **静的解析**: エラー0件
- **パフォーマンス**: 起動時間改善、メモリ使用量最適化

### 環境・ツール状況
- **開発サーバー**: http://127.0.0.1:8080 (正常動作)
- **テスト環境**: Playwright e2e, 内部smokeテスト
- **依存関係**: 既存パッケージに変更なし
- **Git**: 最新コミット 0932f89, リモート同期済み

### 懸念事項
1. **e2eテストの不安定性**: タイミング依存の失敗が残存
2. **ガジェットレンダリング**: 複数グループ間での状態同期
3. **パフォーマンス**: 大規模リファクタリング中の動作確認

### 完了基準
- [ ] e2eテスト全合格 (現在39/46)
- [ ] gadgets.jsのモジュール分割完了
- [ ] 主要リファクタリング項目の実装
- [ ] 新機能開発のための土台確立

---

**最終更新**: 2025-12-02  
**担当**: AI Assistant  
**次回作業開始予定**: バックログ整理・未実装機能総ざらい (フェーズ候補整理)

### 9. UI アーキテクチャ仕様ドキュメント作成
- `docs/UI_ARCHITECTURE.md` を新規作成
- Region / Panel / Gadget / GadgetContainer / Scene / EditorArea の役割を定義
- FAB Layer の統一管理方針、Scenes & Gradients の3レイヤ構造（Base/Pattern/Overlay）を設計
- 将来の複数エディタ分割・動画背景・設定UI拡張を見据えた基盤仕様を整理

### 10. SceneGradient ガジェット PoC 実装（Cステップ）
- `js/gadgets-editor-extras.js` に `SceneGradient` ガジェットを追加
- Base / Pattern / Overlay の3レイヤ構造で背景グラデーションを制御
  - **Base Layer**: 単色 / 線形グラデーション / 放射グラデーション、角度・色・強度調整
  - **Pattern Layer**: 繰り返しグラデーション（線形/放射）、角度・サイズ・色・強度調整
  - **Overlay Layer**: vignette風の半透明オーバーレイ、タイプ・色・強度調整
- `.editor-container` の `backgroundImage` に適用
- 設定は `settings.scene` に保存
- JS lint / smoke テスト全項目パス

### 11. 物語WikiとReference Wikiの分離、およびサイドバー挙動の安定化（2025-11-20）
- `css/style.css` の `.editor-container` レイアウトを調整し、サイドバー展開時に右側へ一瞬白い余白がアニメーション表示される問題を修正
  - `width` のトランジションを廃止し、`margin-left` のみで押し出す方式に統一
  - `body { overflow-x: hidden; }` を追加し、横スクロールバーの発生と画面端のチラつきを抑制
- `js/wiki.js` の Wiki ガジェットを「物語Wiki」として整理
  - ガジェットタイトルを `物語Wiki` に変更し、グループを `wiki` のみに統一
  - Story 用ページとヘルプ用ページが混在していた一覧を見直し、デフォルトでは Story 用ページのみを表示
  - ヘルプ系ページ（フォルダが「ヘルプ」、または `help` タグ付き）はフィルタ対象とし、Story Wiki からは事実上分離
- 物語Wiki専用のヘルプドキュメント `docs/wiki-help.html` を新規作成
  - 物語Wikiの概要・ページ構造・基本操作・AIを用いた自動生成・タグ/フォルダの使い分けを1ページに集約
  - 技術的な詳細仕様は既存の `docs/GADGETS.md` の Story Wiki セクションを参照する形にし、重複を最小限に整理
- Wikiヘルプ導線の統一
  - `js/wiki.js` 内の「ヘルプ」ボタンを、内部の `help-wiki` ページではなく `docs/wiki-help.html` を別タブで開くよう変更
  - `js/app.js` 内の Assist タブの「Wikiヘルプを開く」ボタンも同じく `docs/wiki-help.html` を別タブで開く実装に統一
- 既存の Reference Wiki 相当のコンテンツは docs 配下に集約し、サイドバーの狭い領域には「物語用Wiki」だけを残す方針に更新

### 12. 物語Wiki E2Eテスト安定化（2025-11-21）
- `e2e/wiki.spec.js` を現行の `js/wiki.js` 実装に合わせて更新
  - サイドバーの Wiki タブを開いてから `#wiki-gadgets-panel` を待機するよう前処理を修正
  - 「新規ページ」「検索」「空状態」のテストを UI 構造に追従
  - 「既存ページの編集」は DOM の再レンダリングに依存せず、`ZenWriterStorage` 経由で内容更新を検証
- `npm run dev-check` および `npx playwright test e2e/wiki.spec.js` がローカルでグリーンであることを確認

### 14. Markdownライブプレビュー性能改善（2025-12-02）
- `js/editor.js` の `renderMarkdownPreview()` をデバウンス版と即時版に分離
  - デバウンス版: 100msデバウンスでinputイベントの高頻度更新を抑制（パフォーマンス改善）
  - 即時版: `_renderMarkdownPreviewImmediate()` で初期化時等の即時更新を保証
  - 既存の `updateWordCount` デバウンスパターンを踏襲
- BACKLOG.md にデバウンス適用を完了マーク、差分適用（morphdom等）を長期課題として残す
- `node scripts/dev-check.js` 全項目パス

## 現在の状態
- 開発サーバー: `http://127.0.0.1:8080` で起動
- エディタ全幅: デフォルトで全幅表示（余白なし、ベージュ背景は適用されない）
- 余白背景: EditorLayout ガジェットで幅・余白を設定した場合のみベージュ適用
- サイドバー: `structure`/`wiki` タブでガジェット表示。左サイドバー展開時の右側余白の一時的なチラつきは解消済み
- HUD/FAB: 右下アイコンでクイックツールパネル開閉、HUD コントロール機能
- ツールバー: 右上アイコンがプレビュー(`layout-template`)とツールバー(`panel-top`)で重複解消
- FAB: 共通クラス `fab-button` で統一、サイズ・位置・色をCSS変数で制御
- UIラボ: `docs/ui-lab.html` で Panel/GadgetContainer の挙動検証可能
- SceneGradient: `SceneGradient` ガジェットで背景グラデーション3レイヤ制御可能
- Wiki: サイドバーの Wiki タブには物語Wikiガジェットのみを表示し、Reference 系ヘルプは `docs/editor-help.html` / `docs/wiki-help.html` など docs 配下のドキュメントに集約

## 次の作業
- UIアーキテクチャの詳細化と実装
  - GadgetContainer の開閉・フローティング管理を強化
  - EditorArea 分割・レイアウト保存形式の定義
  - FAB Layer の設定UIからの編集機能を追加
- Wiki/ガジェットまわりの整理
  - `gadgets.js` のロードアウトおよびグループ処理を再確認し、`SceneGradient` が `structure` ガジェットとして常に期待通り表示されることを保証
  - 物語Wikiに混入している既存のヘルプ系Wikiページ（`help-*`）のストレージ整理（必要であればマイグレーション/クリーンアップ方針を検討）
- 統合テストとドキュメント更新
  - 全体の Lint/Smoke/E2E テスト実行（MarkdownLintエラーについては別Issueで追跡継続）
  - UI_ARCHITECTURE.md / GADGETS.md / wiki-help.html などドキュメントの整合性確認
- 長期的な拡張
  - 動画背景・Canvasパターンの別ガジェット化
  - プリセット・フォルダによるUI設定の保存・切り替え
- コード品質向上
  - 大きなファイルのリファクタリング（gadgets.js, app.js など）
  - E2Eテストの現行実装対応修正（HUD, Wiki, Theme など）
- UIモード実装（Normal/Focus/Blank）
  - settings.ui.mode と data-ui-mode 属性によるモード切り替え
- **未実装機能の総ざらいと次期フェーズ整理**
  - BACKLOG.md の未完了項目をフェーズ/カテゴリ別に整理
  - 次期フェーズ候補を明示し、優先度付け

## 注意点
- e2e テストで HUD 関連のテストが一部失敗しているため、HUD 機能の安定化が必要
- ブラウザキャッシュクリアで最新変更が反映されることを確認
- EditorLayout の背景適用は幅・余白が設定された場合のみ（デフォルト全幅時はベージュなし）
- UIラボページは開発用なので、本番UIとは独立して挙動確認に使用

## コミット情報
変更ファイルをコミット・プッシュしてください。

コミット済み:
- `fix(ui): editor layout background and toolbar icons`
  - `js/gadgets-editor-extras.js`: EditorLayout ガジェットの背景適用条件を修正
  - `index.html`: ツールバーアイコン重複を解消
- `feat(ui): add FAB unification, panels PoC, and UI architecture docs`
  - `css/style.css`: FAB 共通クラス `fab-button` を導入
  - `css/special.css`: FAB 定義を共通イメージに揃え
  - `index.html`: FAB に共通クラス付与、UIラボページリンク追加
  - `docs/ui-lab.html`: 新規作成（Panel/GadgetContainer PoC）
  - `docs/UI_ARCHITECTURE.md`: 新規作成（UIアーキテクチャ仕様）
- `fix(ui): sidebar overlay mode, dynamic toolbar height, assist tab fixes`
  - サイドバーオーバーレイモード、動的ツールバー高さ、アシストタブ修正（リモートから統合）
- `refactor(ui): gadget init and SceneGradient helpers`
  - `js/gadgets-editor-extras.js`: SceneGradient ガジェットのリファクタリング（ヘルパー関数抽出）
  - `js/app.js`: ガジェット初期化・ロードアウト初期化を関数化
- `test(e2e): update sidebar layout specs for overlay tabs`
  - `e2e/sidebar-layout.spec.js`: サイドバーオーバーレイ仕様対応とタブセレクタ修正
- `feat(editor): Markdownライブプレビュー性能改善とドキュメント更新`
  - `js/editor.js`: renderMarkdownPreview() をデバウンス版と即時版に分離（100msデバウンス）
  - `docs/BACKLOG.md`: デバウンス適用完了マーク、差分適用を長期課題に
  - `docs/HANDOVER.md`: 作業内容追加更新

コミット予定:
- `feat(ui): add SceneGradient gadget PoC`
  - `js/gadgets-editor-extras.js`: SceneGradient ガジェット実装（Base/Pattern/Overlay 3レイヤ）
  - `HANDOVER.md`: SceneGradient PoC 実装を追加

## 追加仕様: UI モード (Normal / Focus / Blank)

- Normal: 現在の標準 UI。ツールバー、サイドバー、HUD、FAB などが通常どおり表示される。
- Focus: 既存の `data-toolbar-hidden` や HUD/FAB の設定を組み合わせ、執筆領域を優先した簡易 UI。必要最低限のコントロールのみ残す。
- Blank: ヘッダー、サイドバー、HUD、FAB を含むすべての UI を隠し、エディタキャンバスのみを表示する完全な「まっさらなページ」モード。

想定実装:

- 設定: `settings.ui.mode` に `"normal" | "focus" | "blank"` を保存。
- DOM: `<html data-ui-mode="normal|focus|blank">` 属性で現在のモードを表現し、CSS 側で一括制御する。
- 戻り方: Blank モード時も、Esc キーや専用ショートカット（例: F2）で `normal` に戻せるようにする。将来的に画面端ホバーでヘッダー一時表示も検討。

## 追加仕様: ツールレジストリとガジェット/ヘッダーアイコン整理

- 新規ファイル `js/tools-registry.js` に、ツール定義レジストリ `window.WritingTools` を追加する。
- ツールは次のような構造を持つ想定:

  - `id`: `"text-decoration"` など、一意なツール ID
  - `label`: ツール名（UI 表示用）
  - `icon`: Lucide アイコン名（`"type"`, `"sparkles"` など）
  - `group`: `"editor" | "structure" | "wiki" | "system"` など、ガジェットグループとの対応
  - `gadgetId` (任意): 対応するガジェット ID（例: フォント装飾、テキストアニメーション、EditorLayout など）
  - `entrypoints`: `{ headerIcon: boolean, sidebarGadget: boolean, fabMenu: boolean }` とし、「ヘッダーアイコン」「サイドバーのガジェット」「FAB メニュー」のどこからアクセスできるかを切り替え可能にする。

- 目的:

  - 右上ヘッダーアイコンとサイドバーガジェット、FAB でバラバラに管理されている機能を、「1 つのツール定義」から生成できるようにする。
  - ユーザー設定から「ヘッダーアイコンとして出す」「ガジェットのみ」「両方」「FAB メニューにも出す」といった選択を行えるようにする。
  - ガジェット内のヘッダーにも Lucide アイコンを表示できるようにし、ツールと UI の対応関係を分かりやすくする。

- 現時点の状態:

  - `js/tools-registry.js` はスケルトン実装として `window.WritingTools` を定義し、代表的なツール（テキスト装飾・テキストアニメーション・EditorLayout・HUD コントロールなど）を登録する。
  - まだ既存のガジェットやボタンとは接続しておらず、「将来的にここから参照する」ための準備段階。
  - HTML 側では `index.html` のスクリプトタグに `js/tools-registry.js` を追加し、今後の利用に備える。

## 15. TypographyThemes ガジェット分割（2025-12-03）

### 実施内容

旧 `TypographyThemes` ガジェット（445行の単一ファイル）を、責務ごとに3つのガジェットに分割:

1. **Themes ガジェット** (`js/gadgets-themes.js`, 244行)
   - テーマプリセット（light/dark/sepia/high-contrast/solarized）
   - カスタムカラー設定（背景色・文字色）
   - 色リセット機能
   - カスタム色プリセットの保存・適用

2. **Typography ガジェット** (`js/gadgets-typography.js`, 218行)
   - フォントファミリー選択（9種類のフォント）
   - UIフォントサイズ設定
   - エディタフォントサイズ設定
   - 行間設定

3. **Visual Profile ガジェット** (`js/gadgets-visual-profile.js`, 既存)
   - 組み込みプロファイルの選択・適用
   - ユーザー定義プロファイルの作成・編集・削除

### 変更ファイル

- `js/gadgets-themes.js`: 新規作成
- `js/gadgets-typography.js`: フォント設定のみに縮小
- `index.html`: `gadgets-themes.js` のスクリプト参照追加
- `docs/BACKLOG.md`: 完了タスクとして記録

### 検証結果

- `node scripts/dev-check.js`: ALL TESTS PASSED
- ブラウザでの動作確認: テーマ切替、カラー設定、フォント設定が独立して動作

### 効果

- 単一責任の原則に準拠し、各ガジェットの責務が明確化
- 今後の機能拡張（テーマ追加、フォント追加など）が容易に
- コードの可読性・保守性が向上
