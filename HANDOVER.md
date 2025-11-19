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

## 現在の状態
- 開発サーバー: `http://127.0.0.1:8080` で起動
- エディタ全幅: デフォルトで全幅表示（余白なし、ベージュ背景は適用されない）
- 余白背景: EditorLayout ガジェットで幅・余白を設定した場合のみベージュ適用
- サイドバー: `structure`/`wiki` タブでガジェット表示
- HUD/FAB: 右下アイコンでクイックツールパネル開閉、HUD コントロール機能
- ツールバー: 右上アイコンがプレビュー(`layout-template`)とツールバー(`panel-top`)で重複解消
- FAB: 共通クラス `fab-button` で統一、サイズ・位置・色をCSS変数で制御
- UIラボ: `docs/ui-lab.html` で Panel/GadgetContainer の挙動検証可能
- SceneGradient: `SceneGradient` ガジェットで背景グラデーション3レイヤ制御可能

## 次の作業
- UIアーキテクチャの詳細化と実装
  - GadgetContainer の開閉・フローティング管理を強化
  - EditorArea 分割・レイアウト保存形式の定義
  - FAB Layer の設定UIからの編集機能を追加
- 統合テストとドキュメント更新
  - 全体の Lint/Smoke/E2E テスト実行
  - UI_ARCHITECTURE.md の更新と実際の実装反映
- 長期的な拡張
  - 動画背景・Canvasパターンの別ガジェット化
  - プリセット・フォルダによるUI設定の保存・切り替え

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
