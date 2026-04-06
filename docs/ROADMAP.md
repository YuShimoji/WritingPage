# ROADMAP — Zen Writer 機能強化ロードマップ

> 最終更新: 2026-04-06 / v0.3.32

## ステータス語彙

| ステータス | 意味 |
| --------- | ---- |
| done | 実装完了、E2Eあり |
| partial | 実装途中（Phase N/M 等で進捗明記） |
| todo | 未着手 |
| removed | スコープ外（除外日を併記） |
| superseded | 後継仕様に置き換え済み |

## 現在の状態

- E2E: `e2e/*.spec.js` 64 本（session 45）。総テスト数は `npx playwright test --list` で確認
- CI: GitHub Actions green
- コア機能: 95% 成熟
- ガジェット: 28個登録
- 仕様書: spec-index.json に 56 エントリ (done 44, removed 11, superseded 1)
- 残 partial: SP-005(本ドキュメント)
- 直近 done: SP-081(エディタ体験再構築, session 33), SP-080(JSONプロジェクト保存, session 27)
- スコープ整理 (2026-03-23): EPUB/DOCX/画像管理/Canvas/Google Keep/プラグイン正式化/サイドバーP2-3/長期ビジョン7件を除外
- session 45: Focus ツールバー/グロー安定化、`e2e/toolbar-editor-geometry.spec.js`、canonical テンプレ（`FEATURE_REGISTRY` / `AUTOMATION_BOUNDARY`）

### 次スライス候補 (WP-004 / WP-001)

詳細は [`docs/USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md) の表を正とする。実装時は **1 トピック** に絞る。

- **WP-004**: ~~パイプライン差分の E2E 固定~~（session 46 済）。次は WYSIWYG オフ時の Reader 導線の a11y 統一 等
- **WP-001**: ~~コマンドパレットのモード切替後フォーカス~~（session 46 済）。次は狭幅ツールバー周りの体感（geometry E2E で監視）
- **中期（別起票）**: ブロック段落の左・中・右揃え — [`docs/specs/spec-rich-text-paragraph-alignment.md`](specs/spec-rich-text-paragraph-alignment.md)

---

## Priority A: 執筆体験の基盤

実用的な小説執筆ツールとしての核心部分。最優先。

### A-1. モードアーキテクチャ (SP-070) -- done

Normal / Focus / Blank の3モード分離。Phase 1-3 完了。

- [x] CSS分離（Focus: ChapterListパネル、Blank: エッジホバー復帰）
- [x] ショートカット（Ctrl+Shift+F / B、Esc復帰）
- [x] Focus ChapterListスタブ（SectionsNavigatorデータ共有）
- [x] Focusオーバーレイアクセス（設定ボタン → サイドバースライドイン）
- [x] SP-071 ChapterList Phase 1 実装
- [x] SP-071 Phase 2（章ごと独立保存 — chapter-store.js 実装済み）
- [x] Phase 2: ChapterStore統合ガード（undoスタック章分離、モード遷移前flush）
- [x] Phase 3: Focusパネルリサイズ（pointer events + localStorage保存）

### A-2. チャプター管理再設計 (SP-071) -- done

Novlr式2ペイン章管理。SP-070 Focusモードの主要UI。

- 左パネルにチャプターリスト、右にエディタ
- [x] 見出し自動検出 → チャプターリスト表示
- [x] クリックナビゲーション
- [x] ダブルクリックリネーム
- [x] 右クリックコンテキストメニュー（リネーム/複製/移動/削除）
- [x] ドラッグ&ドロップ並び替え
- [x] 「+ 新しい章」ボタン
- [x] アクティブ章ハイライト + 文字数表示
- [x] Phase 2: 章ごと独立保存 (documents ストアに type:'chapter' + IDB フラッシュ機構)
- [x] 目次ページ自動生成 (SP-071 Phase 3 + SP-072連動)

### A-3. セクションリンク & インタラクティブナビ (SP-072) -- done (100%)

章末ナビ自動挿入 + ゲームブック的インタラクティブリンク。

- [x] Phase 1: 章末ナビ自動挿入 (前へ / 目次 / 次へ)
- [x] Phase 2: 章visibility設定 + export変換
- [x] Phase 3: リンク挿入モーダルUI + 壊れリンク警告
- [x] Phase 4: 外部リンク新規タブ確認 (target="_blank" + .external-link + URLバリデーション)
- [x] Phase 5: ゲームブック分岐UI (data-style属性方式 + 3層CSS + スタイル選択UI + 自動グループ化+区切り線。エフェクト転用は将来拡張)

### A-4. Editor モード UX 統合改善 (SP-071 Phase 3) -- done

chapterMode デフォルト化 + 文字数精度統一 + ロールバック UI + Legacy 変換バナー。

- [x] Step 1: 新規ドキュメントを chapterMode で作成
- [x] Step 2: chapterMode ロールバック UI (「章モードを解除」ボタン)
- [x] Step 3: 文字数を countPlainChars() に統一 (DSL/見出し/装飾記法を除外)
- [x] Step 4: Legacy ドキュメントに「新フォーマットに変換」バナー表示

### A-5. エディタ体験再構築 (SP-081) -- done

chapterMode一本化 + Blank廃止 + setUIMode全経路統一 + Reader統合。Phase 1-4 全完了 (session 30-34)。

- [x] Phase 1: レガシー章管理削除 (-254行)、chapterMode一本化
- [x] Phase 2: メインツールバーの不要ボタン非表示
- [x] Phase 3: Blank完全除去、エッジグロー、setUIMode全経路統一
- [x] Phase 4: setUIMode force パラメータ、サイドバー永続化、Reader aria-pressed修正

### A-6. UI/UX 磨き上げ (残タスク)

- px→rem段階移行 -- done (Phase 1: font-size+CSSカスタムプロパティ+JS setProperty / Phase 2: padding+margin / Phase 3: width+height+gap+border-radius+JS静的値)

### A-4 完了済み

- `[BUG]` エディタスクロールバグ -- done
- コンテキストツールバーの操作感改善 -- done (現状問題なし)
- サイドバーのナビゲーション最適化 -- done (SP-052 Phase 1+2)
- サイドバー情報密度の整理 -- done
- サイドバー品質改善 -- done
- エディタの入力体験改善 -- done (タイプライターモード/プリフォーマット等)
- テーマ一貫性 CRITICAL群 -- done (CSS変数14種+JS硬コード色30箇所)
- テーマ一貫性 HIGH/MEDIUM群 -- done (global-search-ui/link-graph/keybind/swiki/command-palette/gadget-*/mini-hud)
- デッド参照根絶 -- done (旧パネル参照→MainHubPanel統一, Escape統合, デッドCSS/メソッド削除)
- サイドバー間接委譲→直接API化 -- done
- フローティングパネルのドラッグ対応 -- done (pointer events + 3px閾値 + タッチ対応)
- レスポンシブUI改善 -- done (タップターゲット44px + モバイル6件修正)
- アニメーション/トランジション -- done (モーダル/パネルフェードイン + reduced-motion対応)

---

## Priority B: 表現力拡張

ポストモダン文学・Web小説・ビジュアルノベルの表現に必要な機能。

### B-1. Web小説演出統合 (SP-074) -- done

テクスチャオーバーレイ / タイピング演出 / ダイアログボックス / スクロール連動 / SE / ジャンルプリセット。
SP-062 (テキスト表現アーキテクチャ) 基盤上に構築。Phase 1-6 全完了。

### B-2. パステキスト (SP-073) -- done (100%)

ベジェ曲線・円弧・フリーハンド曲線に沿ったテキスト配置。SVG textPath使用。
Phase 1-4全完了。DSL+SVGレンダリング、WYSIWYG制御点ハンドルUI、プリセットパス7種+右クリックメニュー、フリーハンド描画(RDP簡略化+ベジェ近似)。E2E 27件。

### B-3. Typography進化トラック

- Phase 0-2: done (フォント切替 / 見出し / マイクロタイポグラフィ)
- Phase 3: SP-059 日本語組版・ルビ拡張（傍点・圏点） -- done
- Phase 4: SP-060 装飾プリセット統合 -- done
- Phase 5: SP-061 Visual Profile Typography Pack -- done

### B-4. 既存機能の完成

#### Wiki/グラフビュー (SP-050)

- グラフビュー統合 -- done (力学レイアウト/カテゴリ色分け/凡例/ノードクリック遷移)
- バックリンクUI統合 -- done (詳細ペイン内/Story Wiki+Doc+現在/別名対応)
- AI生成 -- done (テンプレート+OpenAIハイブリッド/設定UI/下書きボタン)
- `[[wikilink]]` 構文の自動パース -- done
- `doc://` リンクのパースバグ修正 -- done (Issue #1, 2026-03-16 解決済み)
- 高度な自動検出(形態素解析) -- done (kuromoji.js IPAdic辞書、ZenMorphology共通モジュール)

#### ~~WYSIWYG テキストアニメーション~~ -- スコープ外 (2026-03-23)

- ~~リアルタイムプレビュー~~ -- Q3静的プレビューで代替
- ~~タイムラインコントロールUI~~ -- 動画エディタ的スコープ

#### テキストボックス (SP-016) -- done/100%

#### ~~Canvas Mode (SP-056)~~ -- スコープ外 (2026-03-23。元deferred/30%, betaEnabled: false)

### ~~B-5. 画像管理~~ -- スコープ外 (2026-03-23)

- ~~ドラッグ&ドロップでの位置調整~~
- ~~画像フィルタ/レイヤ機能~~ -- 画像エディタ的スコープ

---

## Priority C: エコシステム & 拡張性

外部連携とカスタマイズ性の拡充。

### C-1. ドックパネルシステム (SP-076) -- done (100%)

上下左右へのパネルドッキング。Editorモード専用。
Phase 1-4 全完了。Phase 4: ドックレイアウトプリセット (captureLayout/applyLayout API、LoadoutManager統合、全プリセットにdockLayout定義)。top/bottomドックはスコープ外。E2E 45件+preset spec。

### ~~C-2. Google Keep 双方向連携 (SP-075)~~ -- スコープ外 (2026-03-23)

### C-3. ガジェット整理 -- done (WP-002)

Session 19 (2026-03-23) で33→28に整理完了。削除: Clock/Samples/NodeGraph/GraphicNovel。無効化: UIDesign/SceneGradient。graphic-novelロードアウト削除。MarkdownReferenceを全ロードアウトのassistに配置。ヘルプモーダルからリファレンス機能を分離。

- [x] ガジェット利用状況分析
- [x] 不要ガジェット削除/無効化 (33→28)
- [x] ロードアウトプリセット見直し

### ~~C-4. サイドバー Phase 2-3~~ -- スコープ外 (2026-03-23)

- ~~ドラッグ&ドロップによるガジェット並び替え~~ -- SP-076で代替
- ~~ガジェット間通信の基盤整備~~ -- ユースケース不明

### ~~C-5. プラグインシステム正式化~~ -- スコープ外 (2026-03-23)

- 現行のmanifest駆動ローカルプラグインローダーで十分機能中

---

## Priority D: エクスポート刷新

必要時に対応。ブラウザ印刷で最低限のPDF出力は可能。

- PDF エクスポート -- done (ブラウザ印刷APIで動作中)
- ~~EPUB エクスポート~~ -- スコープ外 (2026-03-23)
- ~~DOCX エクスポート~~ -- スコープ外 (2026-03-23)
- ~~ワークスペース一括書き出し~~ -- スコープ外 (2026-03-23)
- ~~プラットフォーム別対応マトリクスの明文化~~ -- スコープ外 (2026-03-23。APP_SPECIFICATION.mdに記載済み)

## Priority E: ストレージ基盤刷新

- IndexedDB 移行 -- done (SP-077)。ドキュメント/アセット/スナップショット/Wiki/ノードグラフ全移行完了
- SP-071 Phase 2 (章ごと独立保存) -- done (documents ストア + IDB フラッシュ)
- SP-080 JSONプロジェクト保存 -- done (session 27。exportProjectJSON/importProjectJSON + Electronメニュー統合)
- クラウド同期基盤 -- todo (将来。IDB基盤は整備済み、具体的な同期先は未定)

---

## WP-004／WP-001 UI ロードマップ（実装順の目安）

WP-004（Reader-First WYSIWYG）と Normal サイドバー簡素化は並行可能だが、**用語・状態モデル**は先に一本化する（`docs/INTERACTION_NOTES.md` の「Zen Writer UI 状態モデル」節）。

| 順序 | トラック | 内容 | 状態 |
|------|----------|------|------|
| 0 | 共通 | 編集面 × UI モードの用語表・ラベル・コマンドパレット文言 | done |
| 1 | WP-001 | Normal サイドバー段階的開示（セクション/構造の既定折りたたみ、編集カテゴリ内ヒント） | done |
| 2 | WP-004 | Phase 2: 既定編集面・モード復帰ポリシー（`INTERACTION_NOTES` 明文化 + Reader 復帰正規化 + 復帰後フォーカス） | done |
| 3 | WP-004 | Phase 3: Reader と編集のレンダリング経路の近接化（`ZWPostMarkdownHtmlPipeline`・章リンク正規化修正・typography 等は継続） | partial |
| 4 | WP-001 | カテゴリ統合・ガジェット既定の再整理（中長期） | todo |

回帰: `e2e/reader-wysiwyg-distinction.spec.js`（Reader 時にメイン編集を隠す／WYSIWYG 切替で `data-ui-mode` は通常のまま）。

---

## 長期ビジョン (実績のみ)

- グラフビジュアライゼーションUI -- done (SP-050 Phase 2 Step 1: 力学レイアウト/カテゴリ色分け)
- AI連携 -- done (Wiki生成: SP-050 Step 3。テンプレート+OpenAIハイブリッド)

以下は 2026-03-23 にスコープ外として整理。

~~コラボレーション編集~~ / ~~Embed SDK v2~~ / ~~TypeScript段階移行~~ / ~~スペルチェック~~ / ~~ビジュアルテーマビルダー~~ / ~~ルビ自動付与~~ / ~~AI要約/シーンアイデア生成~~
