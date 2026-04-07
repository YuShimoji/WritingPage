# リッチテキスト: 改行と装飾・書式の関係（将来）

## 目的

「改行で装飾や効果が切れる」挙動と、「改行後も書式を持続させる」モード／ショートカットを、**将来スライス**で実装する際の論点を整理する。  
現状の **データ上の挙動** の正本は `effectBreakAtNewline`（既定 `true`、BL-002）。本書は **製品としての選択肢** を置く。

## 現状（仕様）

- 改行位置でインライン装飾・アニメーション等の効果が **切れる** のが既定（`effectBreakAtNewline !== false` 時）。
- 設定ストレージ: `js/storage.js` 既定、参照 `js/editor-wysiwyg.js`。

### 設定・ショートカット（実装前に固定する表）

| 項目 | 内容 |
|------|------|
| **設定キー** | `effectBreakAtNewline`（`settings.editor` 配下。永続化は `js/storage.js` の既定とユーザー設定のマージ結果） |
| **既定** | `true` — 改行で効果を切断する（BL-002） |
| **ショートカット** | **未割当**（持続モードや「1 行だけ効果継続」等を実装するスライスで、`INTERACTION_NOTES.md` のキーボード一覧に追加する） |
| **設定 UI** | サイドバー **詳細設定（advanced）** の **UI Settings** ガジェット内チェック「改行で装飾・効果を切る（既定オン・BL-002）」（要素 id: `effect-break-at-newline`）。実装: [`js/gadgets-editor-extras.js`](../../js/gadgets-editor-extras.js)（session 61） |

### 持続モード用の追加キー（session 55 確定・session 56 で Enter 接続）

`effectPersistDecorAcrossNewline === true` のとき、BL-002 の Enter 後処理で **decor-* スパンからカーソルを外す処理だけをスキップ**する（ネイティブ bold 等のトグル解除は `effectBreakAtNewline` 経路どおり継続）。実装: [`js/editor-wysiwyg.js`](../../js/editor-wysiwyg.js)。`js/storage.js` に既定 `false`。

| 項目 | 内容 |
|------|------|
| **設定キー** | `effectPersistDecorAcrossNewline`（`settings.editor`） |
| **既定** | `false` — 現状どおり Enter 後に **decor-* スパンからカーソルを外す**（`js/editor-wysiwyg.js` の BL-002 経路） |
| **`true` の意味（将来）** | Enter 後も **カスタム装飾スパン（decor-*）** を継続（ネイティブ bold 等との組み合わせは実装スライスでテストで固定） |
| **既存キーとの関係** | `effectBreakAtNewline !== false` のときのみ BL-002 の Enter 後処理が走る。持続を **`effectBreakAtNewline: false` だけで代替しない**（意味が紛らわしいため、decor 持続は本キーで明示する） |
| **ショートカット** | **Ctrl+Shift+Alt+D**（macOS は **⌘+Shift+Option+D**）— WYSIWYG フォーカス時に `effectPersistDecorAcrossNewline` をトグルし `ZenWriterStorage.saveSettings` で永続化（session 57） |
| **設定 UI** | サイドバー **詳細設定（advanced）** の **UI Settings** ガジェット内チェック「改行後も装飾スパン内にカーソルを残す」（要素 id: `effect-persist-decor-across-newline`）。実装: [`js/gadgets-editor-extras.js`](../../js/gadgets-editor-extras.js)（session 60） |

## 将来の拡張（未実装）

| 項目 | 内容 |
|------|------|
| **持続モード** | 改行後も同一装飾スパンを継続する編集モード（ON/OFF）。既定は現状どおり「切れる」でよいか、別途決定。 |
| **ショートカット** | モード切替または 1 行限定の「効果を継続」トグル。キーバインドは `INTERACTION_NOTES` のキーボード一覧に追加する。 |
| **仕様の依存** | Turndown / Markdown への変換で「改行が効果の境界」であることと矛盾しないよう、MD 正本のルールを先に固定する。 |

## 関連

- `docs/USER_REQUEST_LEDGER.md` — backlog への起票（改行まわり・持続モード）
- `docs/specs/spec-richtext-enhancement.md` — リッチテキスト・プログラム全体
- `docs/INTERACTION_NOTES.md` — キーボード・操作の正本

## 状態

- **decor 持続キーは Enter に接続済み**（session 56）。**Ctrl+Shift+Alt+D**（macOS は ⌘+Shift+Option+D）でトグル可能（session 57）。**UI Settings ガジェット**からも永続化可能（session 60）。**`effectBreakAtNewline`** も同ガジェットからチェックで永続化可能（session 61）。
