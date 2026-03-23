# 執筆パイプライン定義 — Zen Writer

> 最終更新: 2026-03-23

## 目的

このドキュメントは、Zen Writerで小説を書く際の全体パイプライン(執筆から出力まで)を定義する。
各工程で何が起き、どこが手動操作で、どこが自動化されているかを明確にする。

---

## パイプライン概要図

```
[1. 起動/文書管理] → [2. 執筆] → [3. 構造化] → [4. 装飾/表現] → [5. プレビュー/検証] → [6. 出力]
       ↑                                                                     |
       └─────────────── [7. 保存/復元] ←─────────────────────────────────────┘
```

---

## Stage 1: 起動 / 文書管理

### ユーザー操作
- ブラウザでindex.htmlを開く、またはElectronアプリを起動
- 文書ドロップダウンから既存文書を選択、または新規作成

### 自動処理
- IndexedDB + LocalStorageから前回の状態を復元
- 最後に編集していた文書を自動選択
- ガジェット配置(loadout)を復元
- UIモード(Normal/Focus/Blank/Reader)を復元

### 手動が必要な操作
- 新規文書の作成とタイトル設定
- 文書の切り替え
- 不要な文書の削除

### 関連モジュール
- `js/app.js` -- アプリ初期化
- `js/storage.js` + `js/storage-idb.js` -- IndexedDB永続化
- `js/gadgets-loadouts.js` -- ガジェット配置復元

### 状態
- **完成度: 95%**
- 未解決: Cloud Sync未実装 (マルチデバイス対応なし)

---

## Stage 2: 執筆

### ユーザー操作
- テキストエリア(Markdown記法) または WYSIWYGエディタで本文を入力
- Markdown見出し (`# 章タイトル`) で構造を暗黙的に定義

### 自動処理
- **自動保存**: 2秒遅延 + 300字変更閾値でIndexedDB + LocalStorageに保存
- **スナップショット**: 文書切替/モード遷移時に自動バックアップ
- **文字数カウント**: リアルタイム更新 (ステータスバー)
- **執筆目標追跡**: 設定した目標文字数に対する進捗表示
- **ContentGuard**: モード遷移時のデータ消失を防止

### 手動が必要な操作
- テキスト入力そのもの
- WYSIWYGとテキストモードの切り替え (Ctrl+Shift+W)
- UIモードの切り替え (Ctrl+Shift+F: Focus, Ctrl+Shift+B: Blank)
- 手動スナップショット作成 (Ctrl+Shift+Z)
- スナップショットからの復元

### 関連モジュール
- `js/editor.js` -- エディタコア
- `js/editor-wysiwyg.js` -- WYSIWYGモード (RichTextEditor)
- `js/modules/editor/` -- EditorCore / EditorUI / EditorSearch
- `js/content-guard.js` -- データ保全

### 状態
- **完成度: 95%**
- WYSIWYG主軸 (DECISION: 2026-03-12)。textareaはデバッグ用途

---

## Stage 3: 構造化

### ユーザー操作
- Focusモードで左パネルのチャプターリストを操作
- チャプターのリネーム/並べ替え/複製/削除 (コンテキストメニュー)
- `chapter://` リンクで章間参照を設定
- ゲームブック分岐リンクの設定 (data-style属性)

### 自動処理
- **見出し自動検出**: Markdown `#` からチャプターリストを自動生成
- **章ごと独立保存**: ChapterStoreがIDBに個別保存
- **目次ページ自動生成**: 章構造から目次を自動作成
- **章末ナビ自動挿入**: 「前へ/目次/次へ」を自動付与 (SP-072)
- **chapter://リンク検証**: 壊れリンクを自動警告 (編集モードのみ)
- **ゲームブック選択肢自動グループ化**: 連続リンクを選択肢グループとしてまとめる

### 手動が必要な操作
- 章の作成/命名
- 章の並べ替え (ドラッグ&ドロップ)
- 章の表示/非表示設定 (visibility)
- chapter://リンクの挿入 (モーダルUI経由)
- 分岐リンクのスタイル選択 (card/button/inline)

### 関連モジュール
- `js/chapter-list.js` -- チャプターリストUI
- `js/chapter-store.js` -- 章データ永続化
- `js/gadgets-editor-extras.js` -- セクションリンク/ゲームブックUI

### 状態
- **完成度: 100%** (SP-071, SP-072 共にdone)

---

## Stage 4: 装飾 / 表現

### ユーザー操作
- テキスト選択 → フローティング装飾バーで装飾適用
- DSL記法で高度な装飾を直接入力
- サイドバーの装飾パネルで設定

### 自動処理
- **DSLパース**: `:::zw-textbox{...}` `:::zw-typing{...}` 等を自動認識・レンダリング
- **Markdownレンダリング**: markdown-itによる自動変換
- **DSL退避/復元**: markdown-it処理前にDSLブロックを退避し、処理後に復元 (DECISION: 2026-03-18)
- **テキストエフェクト投影**: プリセット → lower layer(TextEffect/Animation/Ornament)へ自動展開
- **ルビ/傍点変換**: `{漢字|かな}` `{kenten|text}` を自動変換
- **Wikilink解決**: `[[用語]]` を自動リンク化 + 存在チェック
- **タイポグラフィパック適用**: 選択したパックのフォント/スペーシングを自動適用
- **ジャンルプリセット適用**: adventure/webnovel/horror/poem等のスタイルを自動適用

### 手動が必要な操作
- テキストボックスDSLの記述 (`:::zw-textbox{type:"dialogue"}`)
- タイピングエフェクトDSLの記述 (`:::zw-typing{speed:30}`)
- フォント装飾の選択 (色/影/縁取り/グロー)
- テキストアニメーションの選択 (wave/sparkle/cosmic/fire/glitch)
- ルビ/傍点の手動付与
- パステキスト(SP-073)のカーブ定義 -- Phase 1-3完了(DSL+SVG+ハンドルUI+プリセットパス7種)。Phase 4(フリーハンド描画)未実装
- タイポグラフィパックの選択

### DSL記法一覧 (手動入力が必要なもの)

| 記法 | 用途 | GUI化状態 |
| ---- | ---- | --------- |
| `:::zw-textbox{type:"dialogue"}` | テキストボックス | GUI済み (ツールバー挿入 + 属性モーダル) |
| `:::zw-typing{speed:30}` | タイピング演出 | GUI済み (同上) |
| `:::zw-dialog{speaker:"..."}` | ダイアログボックス | GUI済み (同上) |
| `:::zw-scroll{effect:"..."}` | スクロール連動 | GUI済み (同上) |
| `:::zw-pathtext{path:"..."}` | パステキスト | GUI済み (同上 + プリセットパス7種) |
| `{漢字\|かな}` | ルビ | GUI済み (WYSIWYG双方向: 挿入/編集/削除) |
| `{kenten\|text}` | 傍点 | 手動記述 (GUI化余地あり) |
| `[[用語]]` | Wikiリンク | 形態素解析で自動検出済み (SP-050) |
| `[text](chapter://章名)` | 章間リンク | モーダルUIあり |

### 装飾パイプライン処理順序 (実コード準拠)

```
Markdown + DSL テキスト
  [1] DSL退避: :::zw-* ブロックをプレースホルダーに置換
  [2] markdown-it.render() → HTML変換
  [3] DSL復元: プレースホルダーを TextboxRichTextBridge の結果に置換
      └→ TextboxDslParser.parseSegments()
      └→ TextboxEffectRenderer.renderSegments()
         ├→ TextExpressionPresetResolver (プリセット→属性展開)
         ├→ TextEffectDictionary (エフェクト→CSSクラス)
         ├→ TextAnimationDictionary (アニメーション→CSSクラス)
         └→ TextOrnamentDictionary (装飾→CSSクラス)
  [4] processFontDecorations(): [bold] 等 → <span class="decor-*">
  [5] processTextAnimations(): [fade] 等 → <span class="anim-*">
  [6] WikiLink変換: [[用語]] → <a class="wikilink"> (存在チェック付き)
  [7] Chapter link変換: chapter:// → <a class="chapter-link">
  [8] ルビ/傍点展開: {kanji|kana} → <ruby>, {kenten|text} → <span>
  [9] morphdom() 差分更新 (エディタプレビュー) or 全画面レイアウト (Reader)
```

### 関連モジュール
- `js/gadgets-editor-extras.js` -- テキストボックスDSL/プリセット/ゲームブック分岐UI
- `js/story-wiki.js` -- Wikiリンク/バックリンク/AI生成
- `js/editor-preview.js` -- エディタ側プレビュー (100ms debounce)
- `js/reader-preview.js` -- Readerモード全画面レンダリング
- `js/modules/editor/TextboxDslParser.js` -- DSL構文解析
- `js/modules/editor/TextboxEffectRenderer.js` -- エフェクトHTML生成
- `js/modules/editor/TextExpressionPresetResolver.js` -- プリセット展開
- `js/modules/editor/TextboxRichTextBridge.js` -- DSL→HTML統合ブリッジ
- `js/modules/editor/EditorCore.js` -- processTextAnimations / processFontDecorations
- `js/morphology.js` -- 形態素解析 (kuromoji.js / ZenMorphology共通モジュール)

### 状態
- **完成度: 92%**
- SP-073 Path Text Phase 1-3完了/90%, Phase 4(フリーハンド描画)未実装
- DSL挿入GUI実装済み (Q1解決: 全4型にツールバーUI + 属性設定モーダル)
- ルビWYSIWYG双方向統合実装済み (Q2解決: 挿入/編集/削除/ラウンドトリップ)
- WYSIWYG静的プレビュー実装済み (Q3解決: 型バッジ + 実スタイル + スクロール可視化)

---

## Stage 5: プレビュー / 検証

### ユーザー操作
- Readerモードに切り替え (Ctrl+Shift+R またはモードメニュー)
- プレビューでスクロールしながら最終表示を確認
- Story Wikiで用語の一貫性を確認

### 自動処理
- **Readerモード全体レンダリング**: 全装飾パイプラインを適用した読者向けビューを自動生成
- **目次自動生成**: 可視チャプターから目次を自動作成
- **章ナビゲーションバー挿入**: 前/目次/次のナビを自動挿入
- **ドラフト章の自動除外**: visibility=hiddenの章をReader表示から除外
- **reading progress bar**: スクロール位置を自動追跡
- **Wiki用語自動検出**: 形態素解析(kuromoji.js)で未登録用語を候補表示
- **Wiki AIパイプライン**: OpenAI APIキー設定時、テンプレートからWikiエントリを自動生成

### 手動が必要な操作
- Readerモードへの切り替え操作
- 表示結果の目視確認 (操作感/タイミング/情報過不足)
- Wikiエントリの作成/編集 (AI生成結果の承認含む)
- ジャンルプリセットの切り替え

### 関連モジュール
- `js/reader-preview.js` -- Readerモード全体
- `js/story-wiki.js` -- Wiki/バックリンク/AI生成
- `js/app-mode.js` -- モード切替

### 状態
- **完成度: 95%** (SP-078 done)

---

## Stage 6: 出力

### ユーザー操作
- 出力形式を選択して実行

### 出力形式と経路

| 形式 | 操作経路 | ブラウザ | Electron | 自動化度 |
|------|----------|:--------:|:--------:|---------|
| **プレーンテキスト (.txt)** | サイドバー Documents → TXTボタン | OK | OK | 1クリック |
| **Markdown (.md)** | サイドバー Documents → MDボタン | OK | OK | 1クリック |
| **HTML (装飾付き)** | Readerモード → Exportボタン | OK | OK | 1クリック。自己完結HTML (CSS埋め込み、アニメーション含む) |
| **PDF** | ブラウザ印刷 (Ctrl+P) | OK | OK | 2ステップ (印刷ダイアログ経由) |

### 自動処理
- **HTML Export**: 装飾/アニメーション/ジャンルプリセットを全てインラインCSS+@keyframesとして埋め込み
- **chapter://リンク正規化**: Export時にchapter://をアンカーリンク(#id)に自動変換
- **ナビバー除外**: Export HTMLからは章ナビゲーションバーを自動除去
- **prefers-reduced-motion対応**: アクセシビリティ自動対応

### 手動が必要な操作
- 出力形式の選択
- ファイル保存先の指定 (ブラウザ: ダウンロードフォルダ自動 / Electron: ファイルダイアログ)
- PDF: 印刷ダイアログでの設定 (用紙サイズ/余白)

### 関連モジュール
- `js/reader-preview.js` -- HTML Export
- `js/storage.js` -- TXT/MD Export
- `electron/main.js` -- Electron Export (メニュー経由)

### 状態
- **完成度: 95%**
- TXT/MD/HTML/PDF(印刷)は動作
- 一括エクスポート (全文書まとめて) は未実装

---

## Stage 7: 保存 / 復元 (横断)

### 自動処理
- **自動保存**: 2秒遅延 + 300字変更閾値
- **IndexedDB永続化**: documents/chapters/wiki/snapshots/node-graphs/settings
- **LocalStorageフォールバック**: IDB障害時の安全弁
- **スナップショット自動作成**: 文書切替/モード遷移時
- **スナップショット保持**: 最大10件ローテーション
- **章ごと独立保存**: ChapterStoreがIDB documentsストアに個別保存
- **ContentGuard**: モード遷移時にeditor.valueの整合性を保証

### 手動が必要な操作
- 手動スナップショット作成 (Ctrl+Shift+Z)
- スナップショットからの復元 (UIから選択)
- バックアップのダウンロード/インポート

### 関連モジュール
- `js/storage.js` + `js/storage-idb.js`
- `js/chapter-store.js`
- `js/content-guard.js`

### 状態
- **完成度: 95%** (SP-077 done)
- Cloud Sync未実装

---

## プレビュー段階間の機能差マトリクス

各プレビュー段階で対応している機能の差を示す。
デザイナーが「どこで確認すれば演出を見られるか」を判断する根拠になる。

| 機能 | WYSIWYG | Editor Preview | Reader Preview |
|------|:-------:|:--------------:|:--------------:|
| テキスト装飾 (太字/斜体等) | ○ | ○ | ○ |
| テキストアニメーション (shake/fade/wave等) | ○ (CSS) | ○ (CSS) | ○ (CSS) |
| テキストボックス (プリセット) | ○ | ○ | ○ |
| ルビ | ○ (HTML) | ○ | ○ |
| 傍点 | ○ | ○ | ○ |
| テクスチャオーバーレイ | × | ○ | ○ |
| タイピング演出 | ○ (静的+バッジ) | × (静的) | ○ (インタラクティブ) |
| ダイアログボックス | ○ (静的+バッジ) | ○ (静的) | ○ |
| スクロール連動演出 | ○ (静的+バッジ) | ○ (静的) | ○ |
| SE (効果音) | × | × | ○ |
| chapter:// リンクジャンプ | × | × | ○ |
| 目次 | × | × | ○ (自動生成) |
| ナビバー | × | × | ○ (自動生成) |
| Wikilink | × | ○ (自動リンク) | ○ (自動リンク) |

---

## デザイナーワークフローパス

### パス A: テキスト中心の小説

```
1. WYSIWYG で本文を執筆
2. ツールバーで太字/斜体/傍点を適用
3. Editor Preview で確認
4. ブラウザ印刷 or HTML エクスポート
```

手動介入: ルビは Markdown 記法 `{漢字|かな}` で手書き

### パス B: 演出付き Web 小説

```
1. WYSIWYG で本文を執筆
2. テキストボックスプリセットをツールバーから適用
3. タイピング/ダイアログ/スクロール演出を DSL で手書き
4. Reader Preview で演出を確認・調整
5. HTML エクスポート
```

手動介入: 演出系 DSL は全て手書き。DSL 記法の学習コストが発生

### パス C: ゲームブック / インタラクティブ小説

```
1. 章構造を ChapterList で管理
2. 分岐リンクをリンク挿入モーダルで設定
3. Wikilink で用語をクロスリファレンス
4. Reader Preview で分岐を通しテスト
5. HTML エクスポート
```

手動介入: Wikilink は手書き or 自動検出。分岐構造の設計はデザイナー判断

---

## サンプルストーリー × 機能カバレッジマトリクス

`samples/` のサンプルファイルが、各機能をどれだけカバーしているかを示す。
空白は検証素材の不足を意味する。

| サンプル | 装飾 | ルビ | 傍点 | TB | アニメ | テクスチャ | タイピング | ダイアログ | リンク | Wiki | 画像 |
|---------|:----:|:----:|:----:|:--:|:-----:|:---------:|:---------:|:---------:|:-----:|:----:|:----:|
| full-feature-showcase | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | × | × |
| gamebook-branch-demo | × | × | × | × | × | × | × | × | ○ | × | × |
| wiki-and-chapters-demo | × | ○ | ○ | ○ | × | × | × | × | × | ○ | × |
| heading-typography-novel | × | × | × | × | × | × | × | × | × | × | × |
| heading-typography-scenario | × | × | × | × | × | × | × | × | × | × | × |
| **web-novel-effects-demo** | × | ○ | ○ | ○ | ○ | ○ | ○ | ○ | ○ | × | × |
| **gamebook-styled-demo** | × | × | × | ○ | ○ | ○ | ○ | ○ | ○ | × | × |

### カバレッジの空白

- **画像**: どのサンプルにも含まれていない (挿入は D&D/ペースト対応済みだがサンプル未作成)
- **SE (効果音)**: サンプルなし (DSL `sfx` 属性は実装済み)
- **ジャンルプリセット**: サンプルなし (Reader Preview で選択するもの、サンプルには埋め込めない)
- **パステキスト**: full-feature-showcase にのみ含まれる

---

## 設計課題

### Q1: 演出系 DSL の挿入 UI をどこまで作るか — **解決済み (A)**

**決定**: 全 DSL 型にツールバー挿入ボタンを追加 (typing/dialog/scroll/pathtext)
**実装**: editor-wysiwyg.js に _insertTypingBlock/_insertDialogBlock/_insertScrollBlock/_insertPathtextBlock + _showDslModal (属性設定モーダル)

### Q2: ルビ挿入 UI の形態 — **解決済み (A+B ハイブリッド)**

**決定**: ツールバーボタン → インラインポップアップ (選択→挿入/既存ルビクリック→編集/削除)
**実装**: editor-wysiwyg.js に _handleRubyAction/_showRubyInsertPopup/_showRubyEditPopup/_applyRuby + Turndown双方向ルール
**重要**: 双方向性 (テキスト→ルビ/ルビ→テキストに戻す) が核心要件

### Q3: WYSIWYG での演出プレビュー範囲 — **解決済み (A)**

**決定**: 型バッジ + 実スタイル。各DSLブロックに型ラベル (タイピング/ダイアログ/スクロール) を表示し、実CSSスタイルを適用。アニメーションは静止。
**実装**: css/style.css に `.wysiwyg-editor .zw-*::before` 擬似要素バッジ + スクロールブロック opacity:1 上書き + editor-preview 同等対応
**バグ修正**: `.zw-scroll-trigger` → `.zw-scroll` クラス名統一 / EffectRenderer dialog data-* 属性追加 (ラウンドトリップ修正)

### Q4: サンプルストーリーの位置づけ — **解決済み (B)**

**決定**: 機能検証用モック (開発/テスト専用)。`samples/` はアプリにバンドルせず、開発時の動作確認用として維持。

---

## パイプライン全体の手動/自動マトリクス

| 工程 | 自動化されている操作 | 手動が必要な操作 | 自動化の余地 |
|------|---------------------|-----------------|-------------|
| 起動/文書管理 | 状態復元、ガジェット配置復元 | 新規作成、文書切替、削除 | Cloud Sync (マルチデバイス) |
| 執筆 | 自動保存、スナップショット、文字数カウント | テキスト入力、モード切替 | 音声入力連携 (外部) |
| 構造化 | 見出し検出、目次生成、章末ナビ、リンク検証 | 章作成/命名/並べ替え、リンク設定 | 章テンプレート |
| 装飾/表現 | DSLパース、Markdown変換、ルビ変換、Wiki検出、DSL挿入GUI (Q1解決) | 傍点付与、装飾選択 | 傍点GUI化 |
| プレビュー | 全装飾レンダリング、目次/ナビ生成、ドラフト除外 | モード切替、目視確認 | 差分プレビュー |
| 出力 | CSS埋め込み、リンク正規化、ナビ除去 | 形式選択、保存先指定 | 一括出力 |
| 保存/復元 | 自動保存、IDB永続化、スナップショット | 手動スナップショット、復元操作 | Cloud Sync |

---

## 自動化の優先改善候補

以下は、手動操作の摩擦が高く、自動化/GUI化の効果が大きい箇所。

### 1. DSL挿入GUI (装飾工程の最大摩擦)

**現状**: Q1で解決済み。全DSL型にツールバー挿入ボタン + 属性設定モーダルを実装。
**効果**: DSL記法を知らなくてもGUIから全演出を挿入できる。

### 2. ルビ/傍点の選択付与UI

**現状**: ルビはQ2で解決済み (WYSIWYG双方向: 挿入/編集/削除)。傍点 `{kenten|text}` は手動記述のまま。
**改善案**: 傍点にも同様の選択→適用UIを追加。
**効果**: 傍点付与の手間を半減。

---

## パイプラインの健全性指標

| 指標 | 現状 | 目標 |
|------|------|------|
| 起動→執筆開始までの手順 | 0ステップ (自動復元) | 維持 |
| 章構造変更→プレビュー反映 | Readerモード切替1回 | リアルタイム反映 (将来) |
| 装飾適用→プレビュー反映 | Readerモード切替1回 | リアルタイム反映 (将来) |
| 出力可能な形式数 | 4 (TXT/MD/HTML/PDF) | 維持 |
| データ消失リスク | 極低 (IDB+LS+スナップショット) | 維持 |
| DSL記法なしで使える装飾 | 全DSL型GUI化済み (Q1解決) | 維持 |
