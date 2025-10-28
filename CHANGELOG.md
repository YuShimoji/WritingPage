# Changelog

<!-- markdownlint-disable MD024 -->

## [0.3.14] - 2025-10-03

### Added

- ガジェットの設定保存/折りたたみ/並び替え（`ZWGadgets.getPrefs/setPrefs/toggle/move`）

### Changed

- `scripts/dev-check.js` にガジェットPrefs APIの静的検証を追加
- ガジェットUIのCSSクラスを整備（`.gadget*`）、インラインスタイルを削減
- `docs/GADGETS.md` に使い方/手動テスト手順を追記

## [0.3.13] - 2025-10-02

### Added

- サイドバーに `#gadgets-panel` を追加し、非埋め込み時のみ `js/gadgets.js` を動的ロード
- `js/gadgets.js` にガジェットレジストリとデフォルト `Clock` ガジェットを実装

### Changed

- `scripts/dev-check.js` にガジェット存在検証と `?embed=1` 時の静的gadgets不在チェックを追加
- 仕様ドキュメント `docs/GADGETS.md` を追加

## [0.3.12] - 2025-10-01

### Changed

- 埋め込みモード（`?embed=1`）の初期ロードを軽量化（outline/themes-advanced/plugins を非埋め込み時のみ動的ロード）
- `scripts/dev-check.js` に `embed=1` 軽量化の自動検証を追加
- `docs/EMBED_TESTING.md` にパフォーマンス計測手順（v1.2）を追記

## [0.3.11] - 2025-09-25

### Changed

- ブラウザのタブタイトルに現在のドキュメント名を反映（`<doc> - Zen Writer`）
- 作成/切替/改名/削除/初期化直後にタイトルを更新

## [0.3.10] - 2025-09-25

### Changed

- エクスポート（TXT/MD）のファイル名に現在のドキュメント名を反映（`<doc>_YYYYMMDD_HHMMSS.ext`）
- ドキュメント名の無効文字（\\ / : \* ? " < > | など）をアンダースコアにサニタイズ
- USAGE/TESTING を上記仕様に合わせて更新

## [0.3.9] - 2025-09-25

### Changed

- 「新規ドキュメント」ボタンの挙動を変更し、新しいドキュメントの作成と切替に（既存ドキュメントは保持）
- ドキュメントの updatedAt は内容変更時のみ更新するように調整（切替のみでは並び順が変わらない）
- USAGE/TESTING を上記仕様に合わせて更新

## [0.3.8] - 2025-09-25

### Changed

- ドキュメント一覧を最終更新日時の新しい順（降順）で表示
- USAGE/TESTING に並び順に関する記述を追記

## [0.3.7] - 2025-09-25

### Added

- 複数ドキュメント管理（作成/一覧/切替/改名/削除）

### Changed

- scripts/dev-check.js にドキュメント管理UIの存在チェックを追加
- README/USAGE/TESTING を複数ドキュメント管理に合わせて更新

## [0.3.6] - 2025-09-24

### Added

- 目標進捗バーをツールバーに追加。目標設定時に表示し、入力文字数に応じて幅を更新。モバイルでは自動非表示。

### Changed

- TESTING.md に進捗バーの検証手順を追加。
- scripts/dev-check.js に進捗バーの存在/スタイル検証を追加。

## [0.3.5] - 2025-09-24

### Added

- 執筆目標（目標文字数・任意の締切）を追加。ツールバーの文字数表示に進捗%と残日数を併記、達成時に通知。
- 自動チェック用スクリプト `scripts/dev-check.js` に UI/スタイル検証を追加。

### Changed

- ツールバー表示制御を root属性（`data-toolbar-hidden`）と body クラスで一元管理し、二重表示/揺れを解消。
- CSS のフォーム入力スタイルを拡充（number / date）。
- TESTING.md / KNOWN_ISSUES.md を実装に合わせて更新。

## [0.3.4] - 2025-09-24

### Changed

- ツールバーを sticky 化して表示トグル時のレイアウト揺れを軽減。エディタ高さは一定（100vh）にし、ツールバー表示時のみ上余白を追加。
- 初期状態の上書きを削除し、early-boot と設定反映の結果を尊重（toolbarVisible の整合改善）。
- HUD の初期化を堅牢化（DOM状態に応じて即時初期化、既定位置 `pos-bl` を付与）。

### Added

- HUDテスト表示ボタンをサイドバーに追加。
- バックアップ（スナップショット）の手動保存/一覧/復元/削除 UI を追加。
- 自動バックアップ（2分かつ300文字以上の変化）をエディタ入力時に実行。

## [0.3.3] - 2025-09-24

### Added

- 印刷機能を追加（サイドバーの「印刷」ボタン）。印刷時は画面UIを隠し、本文のみを `print-view` に整形して出力。

## [0.3.2] - 2025-09-24

### Added

- HUD 設定UIを追加（表示位置/時間/背景色/文字色/不透明度）。設定は LocalStorage に保存され、即時反映されます。

## [0.3.1] - 2025-09-24

### Fixed

- ショートカットの誤作動を修正（`Alt+W` のみに統一、長押しの自動リピートで二重トグルしないように）
- カラーピッカー操作中にサイドバーが不安定になる問題を改善（`change` で保存・再描画）
- グローバルクリックでエディタへ強制フォーカスしていた処理を削除（エディタ領域クリック時のみフォーカス）

### Changed

- 仕様外だった「賞/メタ情報」機能を撤去（UI/JS/CSS/ドキュメントから削除）
- `favicon.svg` を追加し、`index.html` から参照（404 解消）

## [0.3.0] - 2025-09-23

### Added

- ツールバー（文字数バー）の開閉と表示状態の保存（Alt+W ショートカット）
- ミニHUD（左下に文字数/語数をフェード表示、拡張可能）
- テーマセクションの折りたたみ（details）で左サイドバーのUIを極小化
- アウトライン項目の上下並び替え（保存/反映）

### Changed

- CSS: toolbar-hidden時のエディタ全高、detailsスタイル、ミニHUDスタイル、小ボタン汎用スタイル
- Docs: USAGE/TESTING 更新

## [0.2.1] - 2025-09-23

### Fixed

- storage.js の構文エラー（saveContent の閉じカッコ欠落）を修正
- これにより `window.ZenWriterStorage` が未定義になる連鎖エラー（theme.js / editor.js / outline.js）を解消
- アプリ初期化時の依存エラーで UI が反応しない問題を解消

## [0.2.0] - 2025-09-22

### Added

- テーマ適用の改善（カスタム色の上書き制御、リセットボタン追加）
- ツールバー復帰用フローティングボタン（⌨️ FAB）
- ファイル読み込み（.txt/.md）機能
- フローティングフォントパネル（⚙️）と数値/スライダーでの全体フォント調整
- フォントサイズショートカット（Ctrl/Cmd + + / - / 0）
- アウトライン（部/章/節 等）プリセットの作成・切替・色変更・挿入
- GitHub Pages 用ワークフロー（.github/workflows/deploy-pages.yml）

### Docs

- USAGE/TESTING/README を新機能に合わせて更新
- ISSUES に階層テンプレート、賞データの演出、自動配色抽出、高度なテーマプリセットを追加

## [0.1.0] - 2025-09-18

### Added (initial release)

- 初版: Zenライク執筆ページを作成（HTML/CSS/JS）
- 自動保存、文字数/語数、プリセットテーマ、カラーピッカー、フォント調整
- エクスポート（TXT/MD）、サイドバー、ツールバー、フルスクリーン
- ドキュメント（README, DESIGN, TESTING, ROADMAP, Choices-Driven Development）
- Issueテンプレート雛形
<!-- markdownlint-enable MD024 -->
