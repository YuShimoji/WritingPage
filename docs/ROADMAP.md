# ROADMAP — Zen Writer 機能強化ロードマップ

> 最終更新: 2026-04-09 / v0.3.32（session 85: レーンA `structure/theme` 説明密度整理・E2E 574 件を維持）

## ステータス語彙


| ステータス      | 意味                     |
| ---------- | ---------------------- |
| done       | 実装完了、E2Eあり             |
| partial    | 実装途中（Phase N/M 等で進捗明記） |
| todo       | 未着手                    |
| removed    | スコープ外（除外日を併記）          |
| superseded | 後継仕様に置き換え済み            |


## 現在の状態

- E2E: `npx playwright test --list` で確認（session 84 時点: **574 テスト / 68 ファイル**。全件実行の最新スナップは `CURRENT_STATE`「検証結果」を正とする）
- CI: GitHub Actions green
- コア機能: 95% 成熟
- ガジェット: 28個登録
- 仕様書: spec-index.json に 56 エントリ (done 44, removed 11, superseded 1)
- 残 partial: SP-005(本ドキュメント)
- 直近 done: SP-081(エディタ体験再構築, session 33), SP-080(JSONプロジェクト保存, session 27)
- スコープ整理 (2026-03-23): EPUB/DOCX/画像管理/Canvas/Google Keep/プラグイン正式化/サイドバーP2-3/長期ビジョン7件を除外
- session 45: Focus ツールバー/グロー安定化、`e2e/toolbar-editor-geometry.spec.js`、canonical テンプレ（`FEATURE_REGISTRY` / `AUTOMATION_BOUNDARY`）

### 次スライス候補 (WP-004 / WP-001)

詳細は `[docs/USER_REQUEST_LEDGER.md](USER_REQUEST_LEDGER.md)` の表を正とする。実装時は **1 トピック** に絞る。

- **進め方（推奨）**: 台帳の「開発スライスの進め方（推奨）」に従い、スライス完了ごとに `CURRENT_STATE` を更新する
- **WP-004**: ~~パイプライン差分の E2E 固定~~（session 46 済）。~~Reader 導線の文言・`aria-*` 統一~~（session 46 前後）。~~Phase 3 本線（ジャンルプリセット・シナリオ5 の style 1 項目）~~（session 76: `reader-genre-preset` に computed style 1 件）。typography 等の残差・手動パックは [`WP004_PHASE3_PARITY_AUDIT.md`](WP004_PHASE3_PARITY_AUDIT.md) に従う（読者確認は **再生オーバーレイ** 経路）
- **WP-001**: ~~コマンドパレットのモード切替後フォーカス~~（session 46 済）。~~狭幅ツールバー折り返し・余白~~（session 48: CSS + geometry E2E 強化）。~~アシスト／メタ系ガジェットの発見性~~（session 72 実施）。~~サイドバー「編集」カテゴリの情報密度~~（session 73: カテゴリ見出し）。~~ロードアウトプリセットとガジェット既定の整合~~（session 75 実施）。~~編集カテゴリの個別ガジェット説明（B1）~~（session 84 実施）。~~他カテゴリ（assist / advanced）のガジェット説明整理~~（session 86 実施）。**次候補（1トピック）**: assist/advanced 導線のコマンドパレット説明・`keywords` 整合
- **中期（別起票）**: ブロック段落の左・中・右揃え — `[docs/specs/spec-rich-text-paragraph-alignment.md](specs/spec-rich-text-paragraph-alignment.md)`（**WP-004 ではなく** `[docs/specs/spec-richtext-enhancement.md](specs/spec-richtext-enhancement.md)` のリッチテキスト・プログラム P2 として起票・優先度付けする）

---

## Priority A: 執筆体験の基盤

実用的な小説執筆ツールとしての核心部分。最優先。

### A-1. モードアーキテクチャ (SP-070) -- done

**現行（session 68 以降）**: UI モードは **`normal` / `focus` の 2 値**。読者視点の確認は UI モードではなく **再生オーバーレイ**（`data-reader-overlay-open` 等）で行う。`Blank` UI モードと Reader UI モードは廃止済み（Blank は session 33 前後、Reader モードは session 68）。

**歴史（Phase 1〜3 当時）**: Normal / Focus / Blank の 3 モード分離として実装された後、SP-081・session 68 で上記に収斂。

- CSS 分離（Focus: ChapterList パネル、エッジホバー復帰は Focus ヘッダー等で継続）
- ショートカット（Ctrl+Shift+F / B、Esc 復帰）
- Focus ChapterListスタブ（SectionsNavigatorデータ共有）
- Focusオーバーレイアクセス（設定ボタン → サイドバースライドイン）
- SP-071 ChapterList Phase 1 実装
- SP-071 Phase 2（章ごと独立保存 — chapter-store.js 実装済み）
- Phase 2: ChapterStore統合ガード（undoスタック章分離、モード遷移前flush）
- Phase 3: Focusパネルリサイズ（pointer events + localStorage保存）

### A-2. チャプター管理再設計 (SP-071) -- done

Novlr式2ペイン章管理。SP-070 Focusモードの主要UI。

- 左パネルにチャプターリスト、右にエディタ
- 見出し自動検出 → チャプターリスト表示
- クリックナビゲーション
- ダブルクリックリネーム
- 右クリックコンテキストメニュー（リネーム/複製/移動/削除）
- ドラッグ&ドロップ並び替え
- 「+ 新しい章」ボタン
- アクティブ章ハイライト + 文字数表示
- Phase 2: 章ごと独立保存 (documents ストアに type:'chapter' + IDB フラッシュ機構)
- 目次ページ自動生成 (SP-071 Phase 3 + SP-072連動)

### A-3. セクションリンク & インタラクティブナビ (SP-072) -- done (100%)

章末ナビ自動挿入 + ゲームブック的インタラクティブリンク。

- Phase 1: 章末ナビ自動挿入 (前へ / 目次 / 次へ)
- Phase 2: 章visibility設定 + export変換
- Phase 3: リンク挿入モーダルUI + 壊れリンク警告
- Phase 4: 外部リンク新規タブ確認 (target="_blank" + .external-link + URLバリデーション)
- Phase 5: ゲームブック分岐UI (data-style属性方式 + 3層CSS + スタイル選択UI + 自動グループ化+区切り線。エフェクト転用は将来拡張)

### A-4. Editor モード UX 統合改善 (SP-071 Phase 3) -- done

chapterMode デフォルト化 + 文字数精度統一 + ロールバック UI + Legacy 変換バナー。

- Step 1: 新規ドキュメントを chapterMode で作成
- Step 2: chapterMode ロールバック UI (「章モードを解除」ボタン)
- Step 3: 文字数を countPlainChars() に統一 (DSL/見出し/装飾記法を除外)
- Step 4: Legacy ドキュメントに「新フォーマットに変換」バナー表示

### A-5. エディタ体験再構築 (SP-081) -- done

chapterMode一本化 + Blank廃止 + setUIMode全経路統一 + Reader統合。Phase 1-4 全完了 (session 30-34)。

- Phase 1: レガシー章管理削除 (-254行)、chapterMode一本化
- Phase 2: メインツールバーの不要ボタン非表示
- Phase 3: Blank完全除去、エッジグロー、setUIMode全経路統一
- Phase 4: setUIMode force パラメータ、サイドバー永続化、Reader aria-pressed修正

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

- ガジェット利用状況分析
- 不要ガジェット削除/無効化 (33→28)
- ロードアウトプリセット見直し

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

### クラウド同期（別レーン方針・2026-04-07）

- **現状**: 実装スパイクはトランクでは未着手。同期先プロバイダ・認証モデル・オフライン競合解決はプロダクト判断が必要。
- **非ゴール（当面）**: 特定 SaaS への早期ロックイン、または UI なしのバックグラウンド同期のみの先行実装は行わない（設計合意まで `todo` のまま据え置き）。
- **起票の目安**: ユーザー要望またはリリース戦略が固まった時点で 1 スライス（調査のみ / PoC）として `USER_REQUEST_LEDGER` に明示行を追加する。

### クラウド同期 PoC 最小仕様（session 86 ドラフト）

- **目的**: 「単一端末内の自動保存」前提を壊さず、複数端末利用時の復旧性と継続性を検証する。
- **方式候補（比較）**
  - **A. JSONスナップショット同期**: ドキュメント単位で JSON を丸ごと送受信。実装は最小だが競合解決が粗い。
  - **B. ドキュメント単位差分同期（推奨PoC）**: `documentId` ごとに更新単位を固定。競合時はドキュメント単位で分岐保存しやすい。
  - **C. 操作ログ同期（CRDT/OT系）**: 将来拡張性は高いが現段階では過剰投資。
- **PoCで採用する前提**
  - 方式Bを基準に、`updatedAt` と `clientId` を使った **Last-Write-Wins + 競合時複製** を実装候補とする。
  - 競合時は自動マージせず、`<docName> (conflict yyyy-mm-dd hh:mm)` を生成してデータ消失を回避する。
- **PoC完了条件（最小）**
  - 2端末想定で「同一ドキュメント編集」「オフライン復帰」「競合発生」の3ケースで消失ゼロ。
  - 失敗時にローカルスナップショットへ確実にロールバックできること。
  - セキュリティ要件（`SECURITY.md`）に沿った認証情報の非ハードコードと通信路保護方針を明文化。

---

## WP-004／WP-001 UI ロードマップ（実装順の目安）

WP-004（Reader-First WYSIWYG）と Normal サイドバー簡素化は並行可能だが、**用語・状態モデル**は先に一本化する（`docs/INTERACTION_NOTES.md` の「Zen Writer UI 状態モデル」節）。


| 順序  | トラック   | 内容                                                                                       | 状態      |
| --- | ------ | ---------------------------------------------------------------------------------------- | ------- |
| 0   | 共通     | 編集面 × UI モードの用語表・ラベル・コマンドパレット文言                                                          | done    |
| 1   | WP-001 | Normal サイドバー段階的開示（セクション/構造の既定折りたたみ、編集カテゴリ内ヒント）                                           | done    |
| 2   | WP-004 | Phase 2: 既定編集面・モード復帰ポリシー（`INTERACTION_NOTES` 明文化 + オーバーレイ終了時の復帰正規化 + 復帰後フォーカス）              | done    |
| 3   | WP-004 | Phase 3: **再生オーバーレイ** と編集のレンダリング経路の近接化（`ZWPostMarkdownHtmlPipeline`・章リンク正規化修正・typography 等は継続） | partial |
| 4   | WP-001 | カテゴリ統合・ガジェット既定の再整理（中長期）                                                                  | todo    |


回帰: `e2e/reader-wysiwyg-distinction.spec.js`（**再生オーバーレイ表示中**にメイン編集を隠す／WYSIWYG 切替で `data-ui-mode` は `normal`/`focus` のまま）。

---

## 長期ビジョン (実績のみ)

- グラフビジュアライゼーションUI -- done (SP-050 Phase 2 Step 1: 力学レイアウト/カテゴリ色分け)
- AI連携 -- done (Wiki生成: SP-050 Step 3。テンプレート+OpenAIハイブリッド)

以下は 2026-03-23 にスコープ外として整理。

~~コラボレーション編集~~ / ~~Embed SDK v2~~ / ~~TypeScript段階移行~~ / ~~スペルチェック~~ / ~~ビジュアルテーマビルダー~~ / ~~ルビ自動付与~~ / ~~AI要約/シーンアイデア生成~~