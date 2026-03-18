# セクションリンク & インタラクティブナビゲーション 仕様書 (SP-072)

## 概要

章間のナビゲーションリンク（前へ / 目次へ / 次へ）の自動挿入と、
ゲームブック的なインタラクティブリンクによる章間ジャンプ機能を提供する。

WYSIWYG上で執筆時にも読者閲覧時にもリンクが機能し、
シームレスなナビゲーション体験を実現する。

---

## 背景課題

- 長編作品で章間を移動する読者向けのナビゲーションが存在しない
- ゲームブック / インタラクティブフィクションを作るためのリンク構造がない
- セクションリンクの手動挿入は保守コストが高く、章の並び替え時に壊れる
- 執筆時に「読者がどう遷移するか」をプレビューできない

---

## 目的

- 章末に「前へ / 目次へ / 次へ」を自動挿入できる仕組みを提供する
- 任意の箇所から任意の章・セクションへジャンプするリンクを挿入できるようにする
- WYSIWYG上でリンクをクリックすると、執筆時にも該当章にジャンプする
- 読者向け出力（HTML）でも同じリンクが機能する

---

## 機能仕様

### 1. 自動ナビゲーションリンク

#### 1.1 章末ナビゲーション

各章の末尾に自動挿入されるナビゲーションバー:

```
─────────────────────────────────
  [← 前の章]    [目次]    [次の章 →]
─────────────────────────────────
```

| 設定項目 | デフォルト | 説明 |
|---------|-----------|------|
| 自動挿入 | OFF | 作品設定で有効化 |
| 表示位置 | 章末 | 章末のみ / 章頭+章末 |
| スタイル | minimal | minimal / button / text |
| 非表示条件 | なし | 最初の章では「前へ」非表示、最後の章では「次へ」非表示 |

#### 1.2 自動生成ルール

- リンク先は SP-071 のチャプターモデルの `order` に基づく
- 章の並び替え時にリンクは自動更新される（静的テキストではなく動的参照）
- `visibility: "hidden"` の章はナビゲーションからスキップ
- 目次リンクは SP-071 の目次ページへ遷移

### 2. インタラクティブリンク（ゲームブック）

#### 2.1 リンク構文

WYSIWYG / Markdown 内で使用可能なリンク構文:

```markdown
<!-- 章へのリンク -->
[選択肢A: 森に入る](chapter://forest-chapter)

<!-- セクションへのリンク -->
[戻る](section://chapter-id#section-heading)

<!-- 条件付きリンク（将来拡張） -->
<!-- [鍵を使う](chapter://locked-room?requires=key-item) -->
```

#### 2.2 リンクの挿入UI

- フローティング装飾バーに「リンク挿入」ボタンを追加
- クリックすると章リスト + セクションリストのドロップダウンが開く
- 章を選択すると `chapter://` リンクが挿入される
- 手動でURLを入力する場合は、外部リンク (`https://`) も可

#### 2.3 WYSIWYG上の表示

- `chapter://` リンクはアンダーライン + アイコンで視覚的に区別
- クリックすると該当章にジャンプ（執筆時ナビゲーション）
- ホバーでツールチップ表示（「→ 第3章: 森の奥」）
- リンク先の章が存在しない場合は赤いアンダーラインで警告

#### 2.4 出力時の変換

HTML出力時に `chapter://` リンクを実際のアンカーリンクに変換:

```html
<!-- 入力 -->
[森に入る](chapter://forest-chapter)

<!-- 出力 -->
<a href="#forest-chapter">森に入る</a>
```

### 3. ページ公開設定

各章・各ページに公開設定を持たせる:

| 設定値 | 意味 | ナビリンク | 出力 |
|--------|------|-----------|------|
| visible | 通常表示 | 含む | 含む |
| draft | 下書き（執筆時のみ表示） | スキップ | 除外 |
| hidden | 非公開（リンク集・メモ用） | スキップ | 除外 |

- `draft` / `hidden` ページは執筆時に薄いバッジで区別表示
- 読者向け出力ではこれらのページは完全に除外される
- `hidden` ページを「書き手用リンク集」として使うことで、デバッグ用ページの需要に対応

---

## ユーザー操作フロー

### フロー1: 自動ナビの有効化

1. 作品設定（Editorモード）で「章末ナビゲーション: ON」にする
2. 各章の末尾に自動的にナビバーが表示される
3. Focusモードでも表示され、クリックで章移動
4. HTML出力にもナビバーが含まれる

### フロー2: ゲームブック的リンク

1. WYSIWYG上でテキストを選択
2. フローティングバーの「リンク」をクリック
3. 「章リンク」タブで遷移先の章を選択
4. リンクが挿入され、執筆中もクリックで遷移可能
5. HTML出力ではアンカーリンクに変換

### フロー3: 書き手用メモページ

1. 新しい章を追加し、「設定メモ」などの名前をつける
2. ページ公開設定を `hidden` にする
3. そのページにリンク集やメモを書く
4. 出力時には自動的に除外される

---

## 成功状態

- 自動ナビをONにすると、全章の末尾に前後リンクが表示される
- 章を並び替えるとナビリンクの順序も自動的に更新される
- `chapter://` リンクを挿入し、WYSIWYGでクリックすると章にジャンプする
- HTML出力で `chapter://` が正しいアンカーリンクに変換される
- `hidden` ページが出力に含まれない

---

## `doc://` リンクとの関係

既存の `doc://` リンク (link-graph.js) とは別系統として共存する:

| スキーム | スコープ | 用途 |
|---------|---------|------|
| `chapter://` | ドキュメント内の章間遷移 | 本仕様 (SP-072)。ゲームブック的ジャンプ、章末ナビ |
| `doc://` | ドキュメント間のリンク | Story Wiki (SP-050) 連携。別ドキュメントへの参照 |
| `[[wikilink]]` | Wiki エントリへのリンク | Story Wiki (SP-050)。用語・設定への参照 |

- `chapter://` は SP-071 のチャプターモデルの `id` を参照先とする
- `doc://` のパースバグ (`#section` 分離不可) は修正済み (2026-03-16, Issue #1 解決)
- 将来的に `chapter://` と `doc://` を統合する場合は、`doc://docId/chapterId#section` のような拡張を検討

---

## 実装状況

### Phase 1 実装済み

- **章末ナビバー**: プレビュー内の各章末尾に「← 前の章 / 目次 / 次の章 →」を自動挿入
  - 設定 `chapterNav.enabled` で有効化（デフォルトOFF）
  - `chapter-nav.js` が `editor-preview.js` のレンダリング後フックで注入
  - クリックで `ZWChapterList.navigateTo()` による章間ナビゲーション
- **`chapter://` リンク**: `[text](chapter://chapter-title)` 記法
  - プレビュー + WYSIWYG両対応
  - Markdown-it生成のHTMLから `chapter://` スキームを検出し `.chapter-link` に変換
  - クリックでタイトルマッチまたはID (`ch-N`) による章ジャンプ
  - Turndown逆変換: `<a class="chapter-link">` → `[text](chapter://...)`
- **CSS**: `.chapter-nav-bar`（minimalスタイル）+ `.chapter-link`（点線下線）

### 変更ファイル

- `js/chapter-nav.js`: 新規。ナビバー注入 + chapter://リンク変換 + 設定管理
- `js/editor-preview.js`: chapter://変換 + プレビュー後フック呼び出し
- `js/editor-wysiwyg.js`: Turndown逆変換ルール + クリックハンドラ + markdownToHtml変換
- `js/chapter-list.js`: `navigateTo` を公開APIに追加
- `css/style.css`: ナビバー + chapter-linkスタイル
- `index.html`: `chapter-nav.js` scriptタグ追加

### Phase 3 実装済み

- **リンク挿入モーダルUI**: テキスト選択→フローティングツールバー「リンク」→ドロップダウンモーダル
  - URL入力欄 (Enter確定) + 章リスト選択 (クリック確定)
  - 入力フィルタリングで章名を絞り込み
  - 章クリックで `chapter://` リンク自動挿入
  - 外部クリックまたはEscapeで閉じる
  - マウス操作が主フロー、Ctrl+Kはフォールバック
- **壊れリンク警告**: `chapter://` リンク先が存在しない場合
  - `.chapter-link--broken` クラス (赤wavy下線 + 警告アイコン)
  - ツールチップに「リンク先の章が見つかりません: {target}」
  - タイトルマッチ + IDマッチの二重解決で判定

### 変更ファイル (Phase 3)

- `js/editor-wysiwyg.js`: `insertLink()` → モーダル化、`_showLinkInsertModal()`/`_closeLinkInsertModal()`/`_getAllChaptersForLinkModal()` 追加
- `js/chapter-nav.js`: `convertChapterLinks()` に壊れリンク検出、`findChapterById()` 追加
- `css/style.css`: `.link-insert-modal` + `.chapter-link--broken` スタイル

### Phase 4: 外部リンク確認 (実装済み)

- **URLバリデーション**: `javascript:`, `data:`, `vbscript:` スキームを除外
- **自動属性設定**: `target="_blank"` + `rel="noopener noreferrer"` (セキュリティ)
- **外部リンク視覚区別**: `.external-link` クラス + `::after` で右上矢印アイコン表示
- **ヒント表示**: リンク挿入モーダルで `https://` 入力時に「外部リンク: 新規タブで開きます」表示
- **危険URL警告**: 危険なスキーム入力時に赤い警告テキスト表示

### 変更ファイル (Phase 4)

- `js/editor-wysiwyg.js`: `_showLinkInsertModal()` にURLバリデーション + ヒント表示追加、`insertLink()` で `.external-link` クラス付与
- `css/style.css`: `.external-link` スタイル + `.link-insert-modal__ext-hint` スタイル

### Phase 5: ゲームブック分岐UI (実装済み)

#### 設計思想

分岐リンクのスタイルは、テキストを基準とした段階的な表現強度で提供する。
スタイル指定は data-style 属性方式を採用し、Markdown 上では URL フラグメント
`chapter://target#style=card` 形式で保持する。SP-062 エフェクト転用は将来拡張とし、
Phase 5 では3層CSS + スタイル選択UI + 自動グループ化に集中する。

#### 3階層のリンクスタイル

**Layer 0: テキストリンク (デフォルト)**

純粋なテキスト小説でうるさくならない最小の視覚区別。
現在の `.chapter-link` (点線下線) をベースに、分岐用の矢印アイコンを追加。

```
「どうする？」

▶ 森に入る
▶ 川沿いを進む
▶ 引き返す
```

- CSS: `.chapter-link--choice` (▶ アイコン + bold + padding)
- ホバー: アクセントカラーの背景 fade-in

**Layer 1: 強調テキスト**

テキストの流れを維持しつつ、選択肢であることを明示する。
SP-062 の TextEffect / Animation を転用し、リンクの見た目を装飾する。

```
「どうする？」

▶ 森に入る       ← fadein + soft ornament
▶ 川沿いを進む    ← fadein + soft ornament
▶ 引き返す       ← fadein + soft ornament
```

- CSS: `.chapter-link--emphasis` (左枠線 + ▶ アイコン)
- DSL: `chapter://target#style=emphasis` (URLフラグメント形式)
- ホバー: アクセントカラーの背景 fade-in

**Layer 2: カード/ボタン**

ビジュアルノベル / グラフィックノベルの選択肢に近い表現。
SP-016 の TextBox プリセットを転用し、リンクをボックスとして表示する。

```
「どうする？」

┌──────────────────────────┐
│ ▶ 森に入る                │
└──────────────────────────┘
┌──────────────────────────┐
│ ▶ 川沿いを進む            │
└──────────────────────────┘
```

- CSS: `.chapter-link--card` (ボックス + border-radius + hover transform)
- DSL: `chapter://target#style=card` (URLフラグメント形式)
- ホバー: translateY + box-shadow 変化

#### スタイル指定方式

data-style 属性方式を採用。Markdown ↔ HTML の往復は URL フラグメントで保持する。

```markdown
<!-- Layer 0 (デフォルト): テキストリンク -->
[森に入る](chapter://forest)

<!-- Layer 1: 強調テキスト -->
[森に入る](chapter://forest#style=emphasis)

<!-- Layer 2: カード -->
[森に入る](chapter://forest#style=card)
```

WYSIWYG モードではリンク挿入モーダルの「スタイル」ドロップダウンで選択する。
Turndown (HTML→Markdown) 時に `#style=xxx` フラグメントとして保持し、
convertChapterLinks() (Markdown→HTML) 時に `data-style` 属性 + CSS クラスへ変換する。

#### エフェクト転用 (将来拡張)

SP-062 の TextEffect / Animation / Ornament をリンクに転用する設計は
将来拡張として保留。3層CSS表現で表現力が不足した場合に再訪する。

#### 自動グループ化 (実装済み)

連続する `.chapter-link` 要素を `autoGroupChoices()` で自動検出し、
`.chapter-choices` ラッパーで囲む。`onPreviewUpdated()` から呼ばれる。

- 同一親ノード内で空白テキストノード / `<br>` のみを挟む連続リンクをグループ化
- 2つ以上のリンクが連続する場合のみラッパーを生成
- `.chapter-choices` は上下に `border-top` / `border-bottom` 区切り線を表示
- 読者プレビュー (SP-078) でも同じグループ化が適用される

#### 将来拡張パス

- 条件付きリンク: `{requires:"flag-name"}` 属性で表示/非表示を制御
- 画像付きカード: `{img:"path/to/image"}` でサムネイル表示
- 既読マーク: 訪問済みの選択肢にチェックマーク表示
- SP-062 エフェクト転用: `data-effect` 属性でリンクにエフェクト適用

### 変更ファイル (Phase 5)

- `js/editor-wysiwyg.js`: リンク挿入モーダルにスタイル選択ドロップダウン追加、`insertLink()` で `data-style` 属性付与、Turndown chapterLink ルールに `#style=xxx` フラグメント保持
- `js/chapter-nav.js`: `parseStyleFromFragment()` 追加、`convertChapterLinks()` で URL フラグメントからスタイル解析 + `data-style` 属性出力、`autoGroupChoices()` + `areConsecutiveBlockLinks()` 追加、`onPreviewUpdated()` で自動グループ化呼び出し
- `css/style.css`: `.chapter-choices` に区切り線、`.link-insert-modal__style-row` / `__style-label` / `__style-select` スタイル追加
- `e2e/gamebook-branch.spec.js`: 4テスト追加 (data-style→クラス、自動グループ化、区切り線CSS、モーダルselect CSS)

---

## 未決定事項

- [x] `chapter://` のID体系 → Phase 1はタイトルマッチ + `ch-{offset}` ID。将来slugベースに移行検討
- [x] ページ公開設定 (visible / draft / hidden) の実装 → Phase 2 MVP
- [x] フローティングバーへの「リンク挿入」ボタン追加 → Phase 3 モーダルUI
- [x] 外部リンク (`https://`) のWYSIWYG上での扱い → Phase 4: `target="_blank"` + `.external-link` クラス + URL検証 + ヒント表示
- [x] ゲームブック的分岐UIデザイン → Phase 5 実装: data-style属性方式 + 3階層CSS + スタイル選択UI + 自動グループ化。エフェクト転用は将来拡張
- [ ] 条件付きリンクの将来実装の具体的な仕組み（変数? フラグ?）
- [ ] 印刷出力時のリンクの扱い（ページ番号に変換? 無視?）

---

## 既存仕様との関係

| 仕様 | 関係 |
|------|------|
| SP-070 モードアーキテクチャ | 全モードでリンクが機能する前提 |
| SP-071 チャプター管理 | チャプターモデルがリンク先の基盤 |
| SP-052 セクションナビゲーション | 下部ナビとの責務分離（SP-052=エディタ内スクロール、SP-072=章間遷移） |
| SP-055 リッチテキスト | WYSIWYGへのリンクUI統合 |

---

## 影響範囲

- `js/chapter-nav.js`: ナビバー注入・chapter://リンク変換・設定管理
- `js/editor-preview.js`: chapter://変換フック + プレビュー後フック
- `js/editor-wysiwyg.js`: Turndown逆変換 + クリックハンドラ + markdownToHtml変換
- `js/chapter-list.js`: `navigateTo` 公開API
- `js/chapter-model.js`: リンク先の解決・順序管理
- `css/style.css`: ナビバーとリンクスタイル
- `index.html`: `chapter-nav.js` スクリプトタグ
- エクスポート処理: `chapter://` → `#anchor` 変換（実装済み: `ZWChapterNav.convertForExport()`）
