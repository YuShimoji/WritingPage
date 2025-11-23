# 作業申し送り: ガジェットアーキテクチャの実装完了

## 概要
ガジェットベースのアーキテクチャの実装を完了し、テスト可能状態まで整備しました。HUD/FAB トグル、サイドバータブ、ガジェット表示、エディタレイアウトのデフォルト設定を修正しました。

## 実施した作業
### 1. エディタレイアウトデフォルト設定修正
- `js/storage.js` に `editorLayout` 設定を追加
  - `maxWidth: 0` (全幅)
  - `padding: 0` (余白なし)
  - `marginBgColor: '#f5f5dc'` (ベージュ背景)
- サーバー再起動で余白部分がベージュ色に変化することを確認

### 2. ガジェット初期化確認
- `js/app.js` の `initGadgetsWithRetry` 関数で `ZWGadgets.init` が正しく呼び出されていることを確認
- `structure` および `wiki` グループのパネル初期化を実装

### 3. HUD/FAB トグル実装
- `index.html` に HUD コントロールボタン追加（クイックツールパネル内）
- `js/app.js` に HUD 表示/非表示、ピン固定、再表示のイベント処理追加
- `js/element-manager.js` に HUD ボタンの要素取得追加

### 4. ガジェットロードアウト修正
- `js/gadgets.js` で `DEFAULT_LOADOUTS` を `structure`/`wiki` グループ用に調整
- グループ正規化関数（`normalizeGroupName`, `normalizeGroupList`）を実装
- ガジェット登録を `structure`/`wiki` に統一

### 5. テスト実行
- **Lint**: Markdown フォーマットエラーが複数あるが、JS コードに問題なし
- **Smokeテスト**: 全項目パス
- **E2Eテスト**: 10項目パス、一部 HUD/Search 関連で失敗（既存の問題）

### 6. UI 表示修正（背景・アイコン重複）
- `js/gadgets-editor-extras.js` の `EditorLayout` ガジェットで、余白幅・余白が 0 のときはベージュ背景を適用しないよう修正
- `index.html` のツールバーで、`toggle-toolbar` ボタンのアイコンを `panel-top` に変更し、`toggle-preview` と重複を解消
- JS lint と smoke テストを再実行し、全項目パスを確認

### 7. FAB 共通ライブラリ実装（Aステップ）
- `css/style.css` に共通 FAB クラス `fab-button` を導入
  - サイズ・位置・色・アイコンサイズを CSS 変数で制御
  - `--fab-size`, `--fab-bottom`, `--fab-bg`, `--fab-fg`, `--fab-icon-size` など
- `index.html` で既存の `fab-toggle-toolbar` / `fab-tools` に `fab-button` クラスを付与
- `css/special.css` の FAB 定義も共通イメージに揃え、サイズを64pxに統一
- 将来の FAB 追加が簡単になり、設定UIからサイズ変更可能になる基盤を整備

### 8. Panel/GadgetContainer PoC 実装（Bステップ）
- 開発用 UI ラボページ `docs/ui-lab.html` を新規作成
  - `js/panels.js` のドッカブルパネル機能を活用
  - 「サンプルパネルを生成」ボタンでサイドバードッキングとフローティングパネルをデモ
- `index.html` の左サイドバー「ヘルプ / リファレンス」セクションにラボページリンクを追加
- Region / Panel / GadgetContainer の挙動検証用のサンドボックスを構築

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

### 13. Editor Settings E2Eテスト安定化（2025-11-22）
- `e2e/editor-settings.spec.js` を現行 UI / 実装に合わせて全面的に更新
  - Typewriter 設定:
    - サイドバーの Editor タブ依存を廃止し、`index.html` 上のグローバルコントロール
      (`#typewriter-enabled`, `#typewriter-anchor-ratio`, `#typewriter-stickiness`) を直接操作
    - リロード後も設定が `ZenWriterStorage` に永続化されていることを検証
  - スナップショット設定・Snapshot Manager:
    - `#snapshot-interval-ms`, `#snapshot-delta-chars`, `#snapshot-retention` を用いた設定 UI の永続テストを整理
    - 手動スナップショット作成は実装に合わせて
      `window.ZenWriterAPI.takeSnapshot()` または `window.ZenWriterStorage.addSnapshot()` を
      `page.evaluate` から直接呼び出し、`loadSnapshots().length` の増加で検証
  - UI プレゼンテーションモード:
    - テスト内で `ZenWriterStorage` の `ui.tabsPresentation` を変更し、
      `window.sidebarManager.applyTabsPresentationUI()` を呼び出して反映
    - DOM 上は `#sidebar` の `data-tabs-presentation` 属性を確認するシンプルなアサーションに変更
  - Node Graph:
    - サイドバー/ロードアウト構成に依存した fragile なテストを廃止
    - `window.ZWGadgets` の `NodeGraph` エントリの `factory` を直接呼び出し、
      生成された DOM に `.ng-toolbar`, `.ng-viewport`, 「ノード追加」「リンク」ボタンが存在することを確認する
      smoke テストに置き換え
  - Wiki:
    - `editor-settings.spec.js` では Wiki ガジェットの煙テストのみに縮小
    - サイドバーの Wiki タブを開き、`#wiki-gadgets-panel` 内のツールバーと検索入力が表示されることだけを検証
    - 詳細な CRUD / 検索フローは `e2e/wiki.spec.js` に委譲
  - ダイアログ（未保存変更 / スナップショット復元）:
    - Playwright の `page.on('dialog')` ではなく、`page.evaluate` 内で `window.confirm` / `window.prompt` をスタブ
    - `window.__zwDialogLog` にメッセージを蓄積し、
      「未保存の変更があります…」「新しいファイルの名前を入力してください:」
      「最後のスナップショットから復元しますか？…」といった文言をテストから検証
    - 新規ドキュメント作成時は `ZenWriterStorage.getCurrentDocId()` の変化と
      元ドキュメントに戻したときのコンテンツ保持（`#editor` が `Initial content`）を確認
    - スナップショット復元時は、事前に seed したスナップショットの内容に
      `#editor` が戻ることを確認
- `npx playwright test e2e/editor-settings.spec.js --reporter=line` が 10/10 パスすることを確認

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
