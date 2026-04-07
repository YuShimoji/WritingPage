# リッチテキスト: 段落の横方向揃え（左・中央・右）

## 目的

本文ブロックを、一般的なワープロのように **左揃え / 中央揃え / 右揃え** で表示・編集できるようにするための仕様の置き場。  
現状の「エディタ列のキャンバス上での中央配置」とは **別レイヤー** の概念として扱う。

## 用語の区別


| 概念             | 意味                                                   | 現状の近似                  |
| -------------- | ---------------------------------------------------- | ---------------------- |
| **キャンバス／列配置**  | 編集域全体（`max-width` + `margin: 0 auto` 等）をウィンドウ内どこに置くか | ツールバー等の「レイアウト」系 UI・テーマ |
| **段落（ブロック）揃え** | 1 段落（または見出し等のブロック）内の行ボックスの `text-align`              | **未実装（本仕様の対象）**        |


Focus モード表の「エディタ | 中央配置」は **キャンバス／列** の話であり、Word の「段落の中央揃え」とは一致しない。  
詳細は `docs/specs/spec-mode-architecture.md` の Focus 行と本書を併読すること。

## スコープ（将来実装）

- **単位**: ブロック単位（段落・見出しは別属性でもよいが、原則は「カーソルがあるブロック」）。
- **値**: `start`（左） / `center` / `end`（右）。RTL 時は `start`/`end` の意味が逆になる前提（ブラウザの論理プロパティに寄せる）。
- **UI**: WYSIWYG ツールバー（または段落コンテキスト）から切り替え。Normal / Focus のどちらでも同じモデル（表示のみモードで差をつけない）。
- **Markdown**: 当面は拡張記法または HTML インラインのいずれかで永続化方針を決める（既存の `zw-textbox` 等の装飾プリセットとの整合を別タスクで検討）。
- **Reader / エクスポート**: HTML 生成パイプラインで `text-align`（またはクラス）が再現されること。

## 非スコープ（明示的に後回し）

- 両端揃え（justified）の細かい組版ルール。
- 縦書きモードとの完全な二重仕様（縦書き時は横方向揃えの意味が変わるため、別表で定義する）。
- キャンバス中央配置 UI の削除（段落揃え導入後も、列幅・余白の制御は独立して残しうる）。

## 関連ドキュメント

- `docs/specs/spec-mode-architecture.md` — UI モードと Focus のエッジ UI・エディタ列配置。
- `docs/specs/spec-decoration-semantic-presets.md` — 装飾プリセットと `text-align` の既存利用。

## 状態

- **永続化モデルは確定**（session 54）。WYSIWYG コマンド・Turndown 実装・プレビュー反映は **リッチテキスト・プログラム**（`[spec-richtext-enhancement.md](spec-richtext-enhancement.md)` と本書）の後続スライスとして着手する。
- **WP-004 Phase 3**（`[INTERACTION_NOTES.md](../INTERACTION_NOTES.md)` § WP-004 Phase 3）とは別トラック。Phase 3 は MD→HTML **後処理パイプライン**の preview/reader 整合であり、段落 `text-align` の編集 UI・永続化は含めない。
- 優先度の付け直しは [`docs/ROADMAP.md`](../ROADMAP.md) / [`docs/USER_REQUEST_LEDGER.md`](../USER_REQUEST_LEDGER.md) を参照。

## 永続化モデル（確定・P2 スライス1）

本節を **P2 実装の単一の正** とする（session 54 で確定）。

- **ブロック単位**: WYSIWYG では `p` / `h1`–`h3` / `blockquote` / `li` 等の「ブロック根」に対して揃えを保持する。
- **HTML 表現（推奨）**: ブロック要素に **`data-zw-align="start"|"center"|"end"`**（論理値。LTR では start=左、end=右）。レンダリングは `style="text-align: …"` またはクラス `.zw-align-center` 等へ投影する。
- **Markdown 往復（受け入れ条件）**: 純 Markdown のみの原稿では、段落揃えの属性は **表現しきれない** 可能性がある。段落揃えを使った原稿は **HTML フラグメントを含む**（または将来の拡張記法）ことを受け入れ条件に含める。純 MD のみへの完全な落とし込みは後続スライスで検討する。
- **Reader / エクスポート**: パイプライン後の HTML に `text-align` または上記クラスが残ること（WP-004 の章リンク後処理と独立した後段または `projectRenderedHtml` 以降で扱う）。

### Turndown / HTML→Markdown 往復（本書で固定する範囲）

- **HTML→MD**: [`js/editor-wysiwyg.js`](../../js/editor-wysiwyg.js) の `turndownService` に **カスタムルール**を追加する（実装はスライス2の直前またはスライス2と同時）。対象ブロック（`p` / `h1`–`h3` / `blockquote` / `li` 等）に `data-zw-align` がある場合、Turndown 出力から **属性を落とさない**。実装方針の例: 該当ブロックを **生 HTML パススルー**（または `html` オプション相当の断片として保持）し、既存のルビ・傍点・章リンクルールと競合しない順序で登録する。
- **MD→HTML**: WYSIWYG の `markdownToHtml` 経路で、上記 HTML 断片がそのまま DOM に載る。`RichTextCommandAdapter.sanitizeHtml` の許可リスト（属性・タグ）の拡張は **スライス2（WYSIWYG コマンド）** で行う。
- **許容値**: `start` / `center` / `end` のみ。それ以外は無視または除去する。

## 推奨実装スライス順（P2 着手時）

**1 スライス = 下表の 1 行**。WP-004 のパイプライン変更と同一 PR にしない。

| 順 | スライス | 成果物の目安 |
| -- | -------- | ------------ |
| 1 | **永続化モデル** | **確定済み（session 54）** — 本書の「永続化モデル（確定）」および Turndown 往復の固定範囲 |
| 2 | **WYSIWYG コマンド** | **実装済み（session 55–56）**: `alignstart` / `aligncenter` / `alignend`、paste、Turndown、WYSIWYG CSS、**コマンドパレット**（段落左・中央・右）および **WYSIWYG「その他」メニュー**からの呼び出し |
| 3 | **プレビュー / Reader** | **実装済み（session 57）**: パイプライン出力の `data-zw-align` を **`#markdown-preview-panel` / `.reader-preview__content`** で `text-align` 投影（`css/style.css`）。役割分担は `docs/INTERACTION_NOTES.md`（WP-004 Phase 3 節） |
| 4 | **回帰 E2E** | **一部済み（session 57）**: `reader-wysiwyg-distinction.spec.js` にパイプライン残存 + `getComputedStyle(text-align)` の最小 assert。WYSIWYG 直操作は従来どおり `rich-text-block-align.spec.js` |

縦書き・RTL は上表の後続フェーズとして別表で切り出す。