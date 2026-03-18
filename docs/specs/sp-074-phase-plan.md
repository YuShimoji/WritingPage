# SP-074 Web小説演出統合 — Phase 実装計画

## Phase 概要

SP-074 を6段階に分割し、CSS-only の低リスク機能から順に積み上げる。
各 Phase は独立してリリース可能で、前 Phase の成果物に依存する。

---

## Phase 1: テクスチャオーバーレイ (CSS-only) — done

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

## Phase 2: タイピング演出 — done

**狙い**: 1文字ずつ表示される演出を実装し、読者向け出力の基盤能力を獲得する。

**スコープ**:
- `:::zw-typing{speed:"30ms", mode:"auto"}` ブロック記法 (デフォルト30ms/字に決定)
- 3モード: auto (自動再生) / click (クリック進行, カーソル変化のみ) / scroll (IntersectionObserver)
- WYSIWYG: テキスト通常表示 (タイピングアイコンバッジは未実装)
- プレビュー / reader-preview: 実際のタイピングアニメーション再生
- 再生コントロール: 未実装 (click モードのクリック進行 + fast-forward で代替)
- アクセシビリティ: `aria-live="polite"` + `.sr-only` で全文即時提供
- reduced motion: 即座全文表示

**実装成果物**:
- `js/modules/editor/TypingEffectController.js` (232行)
- TextboxEffectRenderer に renderTyping() 追加
- reader-preview.js にパイプライン統合 + exitReaderMode クリーンアップ
- CSS: `.zw-typing` スタイル + reduced motion + sr-only
- E2E: typing-effect.spec.js 10件

**依存**: Phase 1 (テクスチャと組み合わせ可能)
**HUMAN_AUTHORITY 決定済み**: デフォルト速度=30ms/字、クリックUI=カーソル変化のみ

---

## Phase 3: ダイアログボックス (顔アイコン付き) — done

**狙い**: ADV/ビジュアルノベル的な発言表示を実現し、SP-016 のテキストボックス基盤を拡張する。

**スコープ**:
- `:::zw-dialog{speaker:"アリス", icon:"alice.png", position:"left"}` ブロック記法
- 4スタイル: default / bubble / bordered / transparent
- 3位置: left / right / center (flex-direction 制御)
- アイコン: 48px円形、object-fit cover
- CSS変数: --dialog-bg, --dialog-speaker-color, --dialog-bubble-bg 等でテーマ対応

**実装成果物**:
- TextboxEffectRenderer に renderDialog() 追加
- CSS: `.zw-dialog` 4スタイル x 3位置 + アイコン + スピーカー名
- reader-preview.js エクスポートHTML にダイアログCSS埋め込み
- E2E: typing-effect.spec.js 内にダイアログテスト1件含む

**未実装 (将来)**:
- WYSIWYG ブロック編集 (TextboxRichTextBridge 拡張)
- アイコン画像の IndexedDB 保存・管理UI
- DialogBoxRenderer.js (独立レンダラー — 現在は TextboxEffectRenderer に統合)

**依存**: Phase 1, SP-016 (done), SP-077 (done)

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
**HUMAN_AUTHORITY**: threshold / delay のデフォルト値、構文方式の選択

**構文方式の未決定事項 (session 10 で発見)**:
仕様案の `[anim type="scroll-trigger"]` は属性付きインラインタグという新パターン。既存パーサーは `[tag]...[/tag]` (属性なし) のみ対応。実装方式の選択が必要:
- A: `[anim]` 属性付きインラインタグパーサーを新設 (仕様通り、パーサー拡張コスト大)
- B: `:::zw-scroll{effect:"fade-in"}` ブロック構文 (既存DslParser拡張、低コスト)
- C: data属性方式 — 任意要素に `data-scroll-trigger="fade-in"` を付与 (DSL不要)
- D: Phase 4 後送り

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
