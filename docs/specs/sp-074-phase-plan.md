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

## Phase 4: スクロール連動演出 — done

**狙い**: IntersectionObserver ベースのスクロールトリガーで、読者の閲覧体験を動的にする。

**スコープ**:

- `:::zw-scroll{effect:"fade-in", delay:"200ms", threshold:"0.2"}` ブロック記法
- 対応演出: fade-in / slide-up / slide-left / slide-right / zoom-in
- IntersectionObserver (threshold デフォルト 0.2) でトリガー
- WYSIWYG: テキスト通常表示
- プレビュー / reader-preview: スクロール位置で演出開始
- HTML出力: CSS transition + IntersectionObserver 用 .zw-scroll--visible クラス
- アクセシビリティ: reduced motion 時は即時全文表示 (transition: none)

**実装成果物**:

- `js/modules/editor/ScrollTriggerController.js` (140行) — IntersectionObserver ベース
- TextboxDslParser.js に 'scroll' ブロックタイプ + effect/delay/threshold 属性追加
- TextboxEffectRenderer.js に renderScroll() 追加
- reader-preview.js: DSL退避正規表現更新 + activate/cleanup + エクスポートCSS
- CSS: `.zw-scroll` 5エフェクト + reduced-motion

**依存**: Phase 1 (テクスチャと組み合わせ可能)
**HUMAN_AUTHORITY 決定済み**: 構文方式=B (:::zw-scroll ブロック構文)

---

## Phase 5: SE (効果音) — done (最小基盤)

**狙い**: テキストに効果音を紐づける最小 SE 基盤を実装する。外部ファイル不要の Web Audio API 合成音方式。

**スコープ (5a: 最小基盤)**:

- Web Audio API による合成音 5 種: keystroke / click / whoosh / chime / ping
- タイピング連動 SE: `:::zw-typing{sfx:"keystroke"}` — 3文字おきに再生
- スクロール連動 SE: `:::zw-scroll{effect:"fade-in", sfx:"whoosh"}` — reveal 時に再生
- AudioContext.resume() をユーザー初回クリック後に実行 (モバイル対応)
- マスター音量 0.3 (デフォルト)
- reduced motion: ミュート (SE 再生しない)

**実装成果物**:

- `js/modules/editor/SoundEffectController.js` (200行) — Web Audio API 合成音
- TypingEffectController.js: sfx data属性読み取り + animateAuto/Click/Scroll に SE コールバック追加
- ScrollTriggerController.js: sfx data属性読み取り + reveal 時 SE 再生
- TextboxDslParser.js / TextboxEffectRenderer.js: typing/scroll の sfx data属性出力
- reader-preview.js: AudioContext.resume() 追加

**将来拡張 (未実装)**:

- IndexedDB 音声保存・管理UI (ユーザーアップロード SE)
- WYSIWYG スピーカーアイコン表示・ホバー試聴
- 音量制御UI (マスター + 個別 + ミュートボタン)
- インライン SE マーカー
- HTML 出力への `<audio>` 埋め込み

**依存**: Phase 2, Phase 4
**HUMAN_AUTHORITY 決定済み**: スコープ=5a (最小基盤のみ)

---

## Phase 6: ジャンルプリセット — done

**狙い**: Phase 1-5 の成果を組み合わせたプリセットを提供し、ワンクリックで演出スタイルを適用可能にする。

**スコープ**:

- 4プリセット: ADV / Web小説 / ホラー / ポエム
- CSSテーマクラス方式: reader-preview コンテナに genre-* クラスを適用
- ジャンル選択UI: reader-preview ツールバーにドロップダウン (ホバーで表示)
- 各ジャンルがダイアログ/タイピング/スクロールのデフォルトスタイルを CSS 変数で定義
- エクスポートHTMLにジャンルCSS埋め込み

**実装成果物**:

- `js/modules/editor/GenrePresetRegistry.js` (120行) — 4ジャンル定義 + apply/clear API
- CSS: .genre-adv / .genre-webnovel / .genre-horror / .genre-poem (各ジャンル固有スタイル)
- reader-preview.js: ジャンル選択ドロップダウンUI + エクスポートCSS
- .reader-genre-toolbar / .reader-genre-select CSS (ホバーフェードイン)

**依存**: Phase 1-5
**HUMAN_AUTHORITY 決定済み**: CSSテーマクラス方式

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
