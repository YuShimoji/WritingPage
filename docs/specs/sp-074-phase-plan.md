# SP-074 Web小説演出統合 — Phase 実装計画

## Phase 概要

SP-074 を6段階に分割し、CSS-only の低リスク機能から順に積み上げる。
各 Phase は独立してリリース可能で、前 Phase の成果物に依存する。

---

## Phase 1: テクスチャオーバーレイ (CSS-only)

**狙い**: SP-062 の TextEffect / Animation 辞書を拡張し、文字にテクスチャを重ねる基盤能力を獲得する。外部アセット不要の純 CSS 実装。

**スコープ**:
- TextAnimationDictionary に 5 種のテクスチャエントリ追加 (wave / sparkle / cosmic / fire / glitch)
- `[wave]...[/wave]` 記法 (既存 `[fade]` 等と同一パターン)
- CSS: `background-clip: text` + `@keyframes` でテクスチャアニメーション
- reduced motion: 静的テクスチャ表示に縮退 (SP-062 の drop 規則に準拠)
- プレビュー + WYSIWYG 両対応
- E2E: 各テクスチャの表示確認 + reduced motion 縮退

**依存**: SP-062 (done)
**推定工数**: 小〜中
**新規ファイル**: なし (既存辞書 + CSS 拡張)
**HUMAN_AUTHORITY**: テクスチャのビジュアルデザイン (色・速度・パターン)

---

## Phase 2: タイピング演出

**狙い**: 1文字ずつ表示される演出を実装し、読者向け出力の基盤能力を獲得する。

**スコープ**:
- `:::zw-typing{speed:"50ms", mode:"auto"}` ブロック記法
- 3モード: auto (自動再生) / click (クリック進行) / scroll (スクロール連動)
- WYSIWYG: テキスト通常表示 + タイピングアイコンバッジ
- プレビュー / HTML出力: 実際のタイピングアニメーション再生
- 再生コントロール: play / stop / reset ボタン (プレビュー内)
- アクセシビリティ: `aria-live="polite"` + `.sr-only` で全文即時提供

**依存**: Phase 1 (テクスチャと組み合わせ可能)
**推定工数**: 中
**新規ファイル**: `js/modules/editor/TypingEffectController.js`
**HUMAN_AUTHORITY**: デフォルト速度、click モードの UI デザイン

---

## Phase 3: ダイアログボックス (顔アイコン付き)

**狙い**: ADV/ビジュアルノベル的な発言表示を実現し、SP-016 のテキストボックス基盤を拡張する。

**スコープ**:
- `:::zw-dialog{speaker:"アリス", icon:"alice.png", position:"left"}` ブロック記法
- 4スタイル: default / bubble / bordered / transparent
- WYSIWYG: ブロック要素として編集 (SP-016 の TextboxRichTextBridge を拡張)
- アイコン画像: IndexedDB 保存 (SP-077 基盤活用)
- SP-072 ゲームブック分岐UI連携: 選択肢ダイアログとして応用可能な構造

**依存**: Phase 1, SP-016 (done/95%), SP-077 (done)
**推定工数**: 中〜大
**新規ファイル**: `js/modules/editor/DialogBoxRenderer.js`
**HUMAN_AUTHORITY**: ダイアログの視覚デザイン、アイコンサイズ、position バリエーション

---

## Phase 4: スクロール連動演出

**狙い**: IntersectionObserver ベースのスクロールトリガーで、読者の閲覧体験を動的にする。

**スコープ**:
- `[anim type="scroll-trigger" effect="fade-in" delay="200ms"]` 記法
- 対応演出: fade-in / slide-in / テクスチャ開始 / タイピング開始
- IntersectionObserver (threshold 0.2) でトリガー
- WYSIWYG: 通常表示 + スクロールトリガーバッジ
- プレビュー / HTML出力: スクロール位置で演出開始

**依存**: Phase 1, Phase 2
**推定工数**: 小〜中
**新規ファイル**: なし (既存モジュール拡張)
**HUMAN_AUTHORITY**: threshold / delay のデフォルト値

---

## Phase 5: SE (効果音)

**狙い**: テキストに音声を紐づける Media レイヤーを新設し、SP-062 の責務モデルを完成させる。

**スコープ**:
- インライン SE マーカー: `[se src="click.mp3" volume="0.5"]`
- タイピング連動 SE: `:::zw-typing{se="keystroke.mp3"}`
- 対応形式: mp3 / ogg / wav
- ストレージ: IndexedDB (SP-077)。1ファイル 5MB 上限、合計 50MB 上限
- WYSIWYG: スピーカーアイコン表示、ホバー試聴
- HTML出力: `<audio>` + IntersectionObserver でトリガー
- 音量制御: 個別 + マスター + ミュートボタン
- モバイル制約: AudioContext.resume() をユーザーインタラクション後に実行

**依存**: Phase 2, Phase 4, SP-077 (done)
**推定工数**: 大
**新規ファイル**: `js/modules/editor/MediaManager.js`
**HUMAN_AUTHORITY**: サイズ制限値、デフォルト音量、ミュートUI デザイン

---

## Phase 6: ジャンルプリセット

**狙い**: Phase 1-5 の成果を組み合わせたプリセットを提供し、ワンクリックで演出スタイルを適用可能にする。

**スコープ**:
- 4プリセット: ADV風 / Web小説風 / ホラー風 / ポエム風
- SP-060 の Preset sugar パターンに統合 (TextExpressionPresetResolver 拡張)
- プリセット選択UI (SP-016 の TB ドロップダウンパターンを活用)
- 各プリセットが下位レイヤ (TextEffect / Animation / Ornament / Media) に展開

**依存**: Phase 1-5, SP-060 (done)
**推定工数**: 小
**新規ファイル**: なし (既存プリセットレジストリ拡張)
**HUMAN_AUTHORITY**: プリセットの構成内容、追加プリセット案

---

## 未決定事項への設計提案

| # | 未決定事項 | 提案 | Phase |
|---|-----------|------|-------|
| 1 | テクスチャ画像のアセット管理 | Phase 1: ビルトイン6種 (CSS-only)。Phase 3以降: ユーザーアップロード (IndexedDB) | 1, 3 |
| 2 | SE ファイルのサイズ制限 | IndexedDB。1ファイル 5MB / 合計 50MB。超過時は警告 + 古いファイルの削除提案 | 5 |
| 3 | 複数演出の同時適用時の優先順位 | SP-062 の既存競合ルールを拡張。テクスチャ = Animation 層の拡張。SE は独立 Media 層 | 1 |
| 4 | HTML 出力のファイルサイズ制約 | SE: 100KB 以下は Base64 埋め込み、以上は外部参照 (`<audio src="...">`)。テクスチャは CSS のみで追加なし | 5 |
| 5 | タイピング演出のアクセシビリティ | `aria-live="polite"` + 全文を `.sr-only` span で即時提供。reduced motion 時は即時全文表示 | 2 |
| 6 | モバイル SE 自動再生制約 | `AudioContext.resume()` をユーザー初回タップ後に実行。自動再生不可時はミュートアイコン表示 + 手動再生ボタン | 5 |

---

## 推奨着手順序

```
Phase 1 (テクスチャ) ──→ Phase 2 (タイピング) ──→ Phase 4 (スクロール連動)
                                    │
                                    └──→ Phase 3 (ダイアログ)
                                                  │
Phase 1-4 完了後 ──→ Phase 5 (SE) ──→ Phase 6 (プリセット)
```

Phase 1 が最小リスクで最大の視覚的インパクトを持つため、ここから開始する。
