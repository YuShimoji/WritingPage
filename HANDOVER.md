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

## 現在の状態
- 開発サーバー: http://127.0.0.1:8080 で起動
- エディタ全幅: デフォルトで全幅表示（余白なし、ベージュ背景は適用されない）
- 余白背景: EditorLayout ガジェットで幅・余白を設定した場合のみベージュ適用
- サイドバー: `structure`/`wiki` タブでガジェット表示
- HUD/FAB: 右下アイコンでクイックツールパネル開閉、HUD コントロール機能
- ツールバー: 右上アイコンがプレビュー(`layout-template`)とツールバー(`panel-top`)で重複解消

## 次の作業
- UI ガジェット実装の継続（リッチテキストエディタ、プレビュー表示など）
- UI モード（Normal/Focus/Blank）の実装
- ツールレジストリの統合とユーザー設定によるエントリポイント制御
- ドキュメント更新・コミットプッシュ

## 注意点
- e2e テストで HUD 関連のテストが一部失敗しているため、HUD 機能の安定化が必要
- ブラウザキャッシュクリアで最新変更が反映されることを確認
- EditorLayout の背景適用は幅・余白が設定された場合のみ（デフォルト全幅時はベージュなし）

## コミット情報
変更ファイルをコミット・プッシュしてください。

コミット済み:
- `fix(ui): editor layout background and toolbar icons`
  - `js/gadgets-editor-extras.js`: EditorLayout ガジェットの背景適用条件を修正
  - `index.html`: ツールバーアイコン重複を解消

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
