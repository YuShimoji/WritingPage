# 委譲用プロンプト集

WritingPage (Zen Writer v0.3.29) の並行実行可能なタスク。
各タスクは独立しており、他のタスクと競合しない。

---

## Task A: doc:// リンクパーサー修正 (ISSUES #1)

### 概要
`js/link-graph.js` の `parseDocLinks()` が `doc://doc1#section1` を `docId = "doc1#section1"` と解釈しており、`#` 以降のセクションを正しく分離できていない。

### Prompt

```
WritingPage プロジェクトの doc:// リンクパーサーを修正してください。

対象ファイル:
- js/link-graph.js の parseDocLinks()
- e2e/wikilinks.spec.js のテスト期待値

修正内容:
1. `doc://doc1#section1` → `docId = "doc1"`, `section = "section1"` に分離する
2. `doc://doc1` → `docId = "doc1"`, `section = undefined` のまま
3. e2e/wikilinks.spec.js の期待値を新仕様に合わせて更新する
4. 既存の [[wikilink]] 機能が壊れていないことを確認する

仕様参照: docs/specs/spec-section-links.md の doc:// vs chapter:// 比較表

完了条件:
- npm run lint:js:check が通る
- 既存E2Eテストが通る（期待値を修正した上で）
- `doc://doc1#section1` の解析が正しい
```

---

## Task B: APP_SPECIFICATION.md 現行実装同期 (ISSUES #2)

### 概要
`docs/APP_SPECIFICATION.md` のサイドバー構成、テスト件数、プラグイン扱い等が古い。現行実装ベースで更新する。

### Prompt

```
WritingPage プロジェクトの docs/APP_SPECIFICATION.md を現行実装に同期してください。

確認すべき実装ファイル:
- index.html: 実際のサイドバー構成
- js/sidebar-manager.js: アコーディオンカテゴリ
- js/plugin-manager.js / js/plugin-api.js: プラグイン機能
- e2e/: テストファイル数とテストケース数

修正方針:
- 実装を仕様に寄せるのではなく、現行実装を基準に事実を書き起こす
- サイドバー構成を現行6カテゴリ (sections/structure/edit/theme/assist/advanced) に更新
- テスト件数を現行値に更新 (E2E: 271 cases / 38 spec files)
- プラグイン機能を「ローカルプラグイン(manifest駆動)として実装済み」に修正
- 「実装済み」「未実装」「将来予定」の区分を現実に合わせる
- SP-070〜076 の新規仕様7件の存在を反映する
- docs/ROADMAP.md と二重管理しない（将来予定はROADMAP参照とする）

完了条件:
- サイドバー構成が index.html / js/sidebar-manager.js と一致
- テスト件数が実際のファイル数と一致
- プラグイン機能の記述が実態に即している
```

---

## Task C: GADGETS.md 現行アーキテクチャ整合 (ISSUES #3)

### 概要
`docs/GADGETS.md` に旧4タブ前提の記述と現行6カテゴリの記述が混在している。

### Prompt

```
WritingPage プロジェクトの docs/GADGETS.md を現行アーキテクチャに合わせて整理してください。

確認すべき実装ファイル:
- index.html: data-gadget-group 属性の実際の値
- js/sidebar-manager.js: カテゴリ定義
- js/gadgets-init.js: ガジェット登録
- js/gadgets-utils.js: GADGET_GROUPS 定義

修正方針:
- 旧4タブ (structure/typography/assist/wiki) 前提の記述を削除または「過去仕様」と明記
- 現行6カテゴリ (sections/structure/edit/theme/assist/advanced) でグループ集計を更新
- data-gadget-group、ロードアウト、SidebarManager の責務説明を現行コードに合わせる
- SP-076 (ドックパネル) で将来変更が予想される旨を注記する（ただし現行と明確に分離）
- ガジェット一覧の数 (33個 + 1開発専用) が実装と一致すること

完了条件:
- 現行グループ名が index.html / js/sidebar-manager.js と一致
- 旧構成の記述が混在していない
- ガジェット数が実装と一致
```

---

## Task D: README 死リンク整理 (ISSUES #6)

### 概要
README から存在しない文書 (`docs/DESIGN.md`, `docs/USER_GUIDE.md` 等) へリンクしている。

### Prompt

```
WritingPage プロジェクトの README.md の死リンクを整理してください。

作業手順:
1. README.md 内のすべてのリンク先を列挙し、実在するか確認する
2. 存在しない文書へのリンクを以下のいずれかで処理する:
   a. 妥当な代替文書があればリンク先を差し替え
   b. 代替がなければリンクを削除し、必要な説明をインラインで補う
   c. docs/README.md があれば併せて整理
3. 「将来作成予定」の文書は現在の入口文書に混ぜない

具体的に確認すべきリンク先:
- docs/DESIGN.md
- docs/USER_GUIDE.md
- docs/PROJECT_HEALTH.md
- docs/SNAPSHOT_DESIGN.md
- docs/KNOWN_ISSUES.md

完了条件:
- README から参照している文書がすべて存在する、または削除されている
- 読者の導線が自然で、存在しないページに飛ばされない
```
