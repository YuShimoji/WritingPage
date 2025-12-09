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

**最終更新**: 2025-12-10  
**担当**: AI Assistant  
**次回作業開始予定**: C-3 Step2（UI/エディタ配色レイヤ本格分離）と B-1（フローティングパネルUI改善）、A-1（editor-search.js 抽出）の優先度評価と着手

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

### 15. UIモード実装 (Normal/Focus/Blank)（2025-12-03）
- `css/style.css` に `html[data-ui-mode='focus']` / `html[data-ui-mode='blank']` のCSSルールを追加
  - Focus: サイドバー・HUD・FABを非表示、ツールバーは残す
  - Blank: すべてのUIを非表示、エディタのみ表示
- `js/app.js` の `setUIMode(mode)` 関数を活用
  - F2キー: UIモードサイクル切替 (normal → focus → blank → normal)
  - Escキー: Focus/Blankモードから Normal に復帰
- `settings.ui.uiMode` に保存し、起動時に復元
- `docs/EDITOR_HELP.md` のショートカット一覧を更新
- `node scripts/dev-check.js` 全項目パス

### 16. Live Preview 差分適用 (morphdom)（2025-12-03）
- `index.html` に morphdom CDN を追加
- `js/editor.js` の `_renderMarkdownPreviewImmediate()` を morphdom 版に更新
  - DOM差分適用でスクロール位置・フォーカスを保持
  - morphdom 未ロード時は従来の innerHTML フォールバック
- `docs/LIVE_PREVIEW_DIFF_DESIGN.md` に設計ドキュメントを作成
- `node scripts/dev-check.js` 全項目パス

### 17. Phase E: フローティングパネル PoC（2025-12-05）
- `js/gadgets-editor-extras.js` の UISettings ガジェットに「構造パネルをフローティング表示 (PoC)」ボタンを追加
  - `ZenWriterPanels.createDockablePanel()` を使用してフローティングパネルを生成
  - パネル内に structure グループのガジェットをミラー表示
  - ドッキング/フローティング切替、ドラッグ移動、閉じるボタンが動作
- `css/style.css` にフローティングパネルの高さ制限（max-height: 80vh）を追加
- 既存の `js/panels.js` の API をそのまま活用（新規コード最小化）
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

### 完了: Phase E-2 フローティングパネル本実装（2025-12-05）
- ✅ 状態保存（位置・サイズ・開閉状態）を settings に永続化
- ✅ 初期表示位置の最適化（画面中央寄せ）
- ✅ 全タブ対応（structure / typography / assist / wiki）
- ✅ パネルタイトルのユーザー編集（ダブルクリックで変更・タイトル永続化）
- 透明度調整UI・ショートカットキー（任意・次期対応）

### 優先: UIアーキテクチャの詳細化
- GadgetContainer の開閉・フローティング管理を強化（Phase E と連携）
- EditorArea 分割・レイアウト保存形式の定義
- FAB Layer の設定UIからの編集機能を追加

### Wiki/ガジェットまわりの整理
- 物語Wikiに混入している既存のヘルプ系Wikiページ（`help-*`）のストレージ整理

### コード品質向上
- 大きなファイルのリファクタリング（gadgets.js, app.js など）
- ESLint/Prettier 導入検討
- E2Eテストの現行実装対応修正（HUD, Wiki, Theme など）

### 長期的な拡張
- 動画背景・Canvasパターンの別ガジェット化
- Typora風ツリーペイン（ドキュメント管理統合）
- プラグイン拡張システム

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

## 16. テスト方法の再整理と現状の引き継ぎ（2025-12-03）

### 自動テストと開発サーバーの関係

- スモークテスト（`npm run test:smoke` → `node scripts/dev-check.js`）
  - 前提: 別ターミナルで `npm run dev` を起動し、`http://127.0.0.1:8080` でアプリが応答していること。
  - 内容: index.html/CSS/gadgets API/AI_CONTEXT.md などを HTTP 経由で取得し、HTML 構造やガジェット基盤、ルール文書の整合性を静的チェック。
- E2E テスト（`npm run test:e2e`）
  - Playwright の `webServer` 設定により、`node scripts/run-two-servers.js 9080` が自動起動。
  - 同一/クロスオリジン用に 2 ポート構成（base=9080, child=9081）で dev-server を起動し、ガジェットや Embed のブラウザ操作を包括的に検証。
- Puppeteer テスト（`npm run test:puppeteer`）
  - 前提: `npm run dev` で 8080 ポートの dev-server が起動済み。
  - 内容: 初期表示のスクリーンショット取得など、ビジュアル確認用の補助テスト。

### index.html 直接オープンとの使い分け

- `index.html` をブラウザで直接開く（`file://`）運用は、純粋なオフライン執筆用途としては引き続き有効。
- ただし、`dev-check.js` や E2E/Puppeteer など **自動テストは HTTP 前提** のため、開発・検証作業では `npm run dev` または Playwright の `webServer` を前提にするのが標準。

### 現在の状態と確認済み事項

- `js/gadgets.js` のモジュール分割完了、`js/_legacy/gadgets.js` へのアーカイブ済み。
- ガジェット基盤は `gadgets-core.js` / `gadgets-utils.js` / `gadgets-loadouts.js` / `gadgets-init.js` / `gadgets-builtin.js` に分割され、`dev-check.js` も新構成に追従。
- 旧 `TypographyThemes` ガジェットは `Themes` / `Typography` / `VisualProfile` の 3 ガジェットに分割され、ロードアウト・ヘルプ・ドキュメントの参照も更新済み。
- `BACKLOG.md` と `AI_CONTEXT.md` を現在のモジュール構成・進捗に合わせて更新し、フェーズ C/D 完了および残タスク（editor.js/app.js の整理、Panel/Region 基盤設計など）を明示。
- `node scripts/dev-check.js` 実行結果: **ALL TESTS PASSED** を確認済み。

### 次回以降の推奨タスク（サマリ）

1. TESTING.md の微修正  
   - スモークテスト手順に「事前に `npm run dev` を起動する」ことを明記し、README の Quick Start との整合を取る。
2. editor.js / app.js の分割計画策定  
   - それぞれ 500 行以下を目標に、EditorCore/HUD/Snapshot/ショートカットなど責務ごとのモジュール構成を検討し、簡易設計メモを作成。
3. Panel/GadgetContainer 抽象レイヤの PoC  
   - `docs/UI_ARCHITECTURE.md` の Region/Panel モデルに沿って、左サイドバーの既存パネルを薄い抽象レイヤ（Panel/GadgetContainer）経由で初期化する実験実装を行い、将来のフローティングパネル実装に備える。

## 17. テーマプリセット調整とナイトテーマ追加（2025-12-04）

### 実施内容

- テーマプリセットのうち、ライト/ダークが他プリセット（セピア/高コントラスト等）に比べてボタン色の変化が分かりにくいという指摘を受け、配色設計を再確認。
- ダークテーマのアクセント色を「濃い灰色」に変更し、ボタン・チェックボックス・スライダーなど UI コントロール全体で一貫したダークグレー基調となるよう調整。
- 新しい暗色テーマ `night` を追加。`dark` より一段階明るいモノクロ寄りの暗色テーマとして定義し、背景/テキスト/ボタンすべてをグレー系で統一。
- ThemeManager（`js/theme.js`）の `themeColors` に `night` を追加し、テーマ適用時の既定色およびカラーピッカー初期値と整合。
- Themes ガジェット（`js/gadgets-themes.js`）に `night` プリセットボタンを追加し、既存の light/dark/sepia/high-contrast/solarized と並べて選択可能にした。
- `js/ui-labels.js` に `THEME_NAME_NIGHT` ラベル（「ナイト」）を追加し、ローカライズ済みラベルから参照。
- `docs/THEMES.md` のプリセット一覧に `night` を追記し、仕様レベルで新テーマを明示。
- `docs/BACKLOG.md` に、テーマプリセット拡張のための集中管理機構、および UI 配色と執筆エリア配色の分離という 2 つの設計タスクを追加。

### 影響ファイル

- `css/style.css`  
  - `[data-theme='dark']` の `--focus-color` を `#555555`（濃い灰色）に変更し、`--accent-color` を `var(--focus-color)` に統一。  
  - 新テーマ `[data-theme='night']` を追加し、背景/テキスト/サイドバー/ツールバー/ボーダー/アクセント色をグレー系で定義。  
- `js/theme.js`  
  - `this.themeColors` に `night: { bgColor: '#262626', textColor: '#e5e5e5' }` を追加し、テーマ適用時の既定色に反映。  
- `js/gadgets-themes.js`  
  - `themePresets` に `night` を追加し、サイドバーの Themes ガジェットから選択可能にした。  
  - `refreshState()` 内の `themeColors` に `night` を追加し、カラーピッカーの既定値（背景/文字色）がテーマと同期するようにした。  
- `js/ui-labels.js`  
  - Typography Themes 系ラベルに `THEME_NAME_NIGHT: 'ナイト'` を追加。  
- `docs/THEMES.md`  
  - プリセット一覧に `night` を追加し、「ダークより一段階明るいモノクロ暗色テーマ」として記載。  
- `docs/BACKLOG.md`  
  - 「テーマプリセット拡張のための集中管理機構」「UI配色と執筆エリア配色の分離」を中優先タスクとして追加。  

### 検証

- `npm run test:smoke`（`node scripts/dev-check.js`）を実行し、**ALL TESTS PASSED** を確認。  
- ブラウザ上で `Themes` ガジェットから以下を手動確認:  
  - `light` → `dark` → `night` → `sepia` → `high-contrast` → `solarized` と順に切り替え、  
    - ボタン・チェックボックス・スライダーのアクセント色が各テーマに応じて変化すること  
    - 特に `dark` と `night` で「濃い灰色／やや明るい灰色」の差が視認できること  

### 設計メモ / 今後の改善点

- 現状の Themes ガジェットの「背景色」「文字色」カラーピッカーは `--bg-color` / `--text-color` を直接上書きしており、**UI と執筆エリアが同一レイヤーの配色**になっている。  
- 本来は、  
  - UI 全体の配色（ツールバー/サイドバー/ボタン等）  
  - 執筆エリア（本文）の配色・装飾  
  を別レイヤーとして扱い、テーマプリセットは主に UI 側のトーン/コントラストを制御し、本文のスタイルは Visual Profile や別ガジェット側で管理するのが望ましい。  
- このため、`docs/BACKLOG.md` に「テーマプリセット拡張のための集中管理機構」「UI配色と執筆エリア配色の分離」を追加タスクとして明示し、今後の設計リファインで対応する方針。

### 18. Selection Tooltip v1 実装（2025-12-05）

- 目的: `textarea` ベースのエディタで、テキスト選択に連動した最小限の Markdown 装飾/挿入操作を Quick Actions として提供する。仕様は `docs/EDITOR_EXTENSIONS.md` に準拠。
- 実装内容:
  - `js/editor.js`
    - 選択範囲ヘルパを追加: `getSelectionRange()`, `getSelectedText()`, `wrapSelection(prefix, suffix = prefix)`。
    - 既存の `insertTextAtCursor()` と同様に、編集後に `saveContent()` と `updateWordCount()` を呼び出すことで、一貫した保存/カウント更新フローを維持。
  - `js/app.js`
    - `initSelectionTooltip()` を追加し、`window.ZenWriterEditor` と `getTextPosition()` を利用して選択範囲上部に `position: fixed` のツールチップを表示。
    - v1 で提供するアクション: 太字/斜体/取り消し線（wrapSelection）、リンク/画像/区切り線/ルビ（簡易ダイアログ + Markdown テンプレート挿入）。
    - 表示条件: `selectionStart !== selectionEnd` かつエディタにフォーカスがある場合のみツールチップを表示。選択解除/エディタ外クリック/Esc で非表示。
    - キーボード操作: Esc でツールチップを閉じる、Tab/Shift+Tab でツールチップ内ボタンを循環フォーカス。
  - `css/style.css`
    - `.selection-tooltip` / `.selection-tooltip button` を追加し、既存ボタンスタイルと整合したミニマルなフローティングツールバーとして定義。z-index は `--z-tooltip` を使用。
- 検証:
  - `npm run test:smoke`（`node scripts/dev-check.js`）を実行し、**ALL TESTS PASSED** を確認。
  - 手動確認として、テキストを選択 → ツールチップ表示 → 各ボタン操作（太字/リンク/画像/ルビなど）で期待どおりの Markdown が挿入されること、および Esc/クリック/選択解除でツールチップが非表示になることを確認予定。

### 19. editor.js モジュール分割 Phase A（2025-12-07〜2025-12-08）

- `js/editor-preview.js` に Markdown ライブプレビュー処理を抽出し、EditorManager からは `editorPreview_renderMarkdownPreview*` 経由で委譲する構成に変更。
- `js/editor-images.js` に画像ペースト/ドラッグ&ドロップ、画像挿入用 Markdown 生成、旧 `data:image` 埋め込みの Asset 化、および画像プレビュー描画処理を抽出し、EditorManager 側には薄いラッパーのみ残す構成に変更。
- `js/editor-overlays.js` にエディタオーバーレイ（画像オーバーレイ・インライン文字数スタンプ）の描画、ドラッグ/リサイズ用インタラクション、および mirror HTML 構築処理を抽出し、EditorManager 側には薄いラッパーのみ残す構成に変更。
- `index.html` のスクリプト読み込み順を更新し、`editor-preview.js` → `editor-images.js` → `editor-overlays.js` → `editor.js` → `app.js` の順でロードされるよう統一。
- 各抽出ステップ後に `npm run test:smoke`（`node scripts/dev-check.js`）を実行し、最新状態で **ALL TESTS PASSED** を確認。

### 20. ThemeRegistry 導入（テーマ集中管理 C-2）（2025-12-08）

- 目的: テーマプリセット定義（ID、ラベル、色パレット）を単一レジストリで集中管理し、ThemeManager / Themes ガジェット / CSS / ドキュメント間の不整合を防止。
- 実装内容:
  - `js/theme-registry.js` を新規作成:
    - `THEME_PRESETS` 配列にプリセット定義（id, labelKey, fallbackLabel, colors）を集約。
    - `ThemeRegistry` オブジェクトを公開し、`listPresets()`, `getPreset()`, `getColors()`, `getLabel()`, `toThemeColorsMap()`, `isValidPreset()` を提供。
  - `js/theme.js`:
    - `ThemeManager.themeColors` を `ThemeRegistry.toThemeColorsMap()` から取得するよう変更（フォールバック付き）。
  - `js/gadgets-themes.js`:
    - `themePresets` を `ThemeRegistry.listPresets()` から動的生成に変更。
    - `refreshState()` 内のテーマ色取得も `ThemeRegistry.getColors()` 経由に変更（フォールバック付き）。
  - `index.html`:
    - `theme-registry.js` を `theme.js` より前に読み込むよう追加。
  - `docs/THEMES.md`:
    - 設計メモに C-2 完了を反映。
- 検証:
  - `npm run test:smoke` を実行し、**ALL TESTS PASSED** を確認。
- 次のステップ:
  - C-3: UI/エディタ配色レイヤ分離（CSS 変数の追加とレジストリ拡張）
  - B-1: フローティングパネル透明度・ショートカット・折りたたみ UI
  - A-1: editor-search.js 抽出

## 21. C-3: UI/エディタ配色レイヤ分離 Step1（2025-12-10）

- 目的:
  - エディタ本文エリアと UI 全体の配色レイヤを将来的に分離しつつ、現行テーマの見た目を維持したまま移行の土台を作る。
- 実施内容:
  - `css/style.css`:
    - `:root` に `--editor-bg`, `--editor-text` を追加し、初期値はそれぞれ `var(--bg-color)`, `var(--text-color)` として alias 化。
    - 各テーマプリセット (`[data-theme='dark']` など) にも `--editor-bg`, `--editor-text` を追加し、現時点では UI と同じ色を指すように定義。
    - `#editor` / `.editor-preview` の背景色・文字色を `--editor-bg` / `--editor-text` 経由で参照するよう変更（フォールバックに従来の `--bg-color` / `--text-color` を維持）。
  - `js/theme.js`:
    - `ThemeManager.applyCustomColors()` で `--editor-bg`, `--editor-text` も同時に更新するよう変更。
    - `ThemeManager.clearCustomColors()` で `--editor-bg`, `--editor-text` も削除し、現在のテーマ既定色からカラーピッカー値を再計算するように維持。
  - ドキュメント:
    - `docs/THEMES.md` に C-3 セクションを追加し、Step1 完了と Step2 以降の設計メモを追記。
    - `AI_CONTEXT.md` の進捗に「C-3 Step1 完了」を追記し、次の中断可能点を「C-3 Step2 / B-1 / A-1」として更新。
- 検証:
  - `npm run test:smoke` を実行し、**ALL TESTS PASSED** を確認。
- 備考:
  - 現時点では UI とエディタ本文で同一の色を使用しており、ユーザーから見た見た目は従来テーマと完全に同一。
  - C-3 Step2 以降で ThemeRegistry 側に UI 用/エディタ用の色レイヤ（`uiColors`/`editorColors`）を導入し、Themes ガジェットのカラーピッカーを「本文エリア優先」に再設計する予定。
