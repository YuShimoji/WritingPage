## ADDED Requirements
### Requirement: Wiki Pages (Glossary)
システムは、本文からの用語抽出と、用語ページの作成・検索・編集・保存機能を提供しなければならない（SHALL）。

- 永続化は localStorage（STORAGE_KEYS.WIKI_PAGES）。
- 検索はタイトル/本文/タグ/フォルダに対して行う。
- AI 生成フック `ZenWriterAI.generateWiki(term, docText, options)` が存在すれば利用し、無ければテンプレートで生成。

#### Scenario: Create and save
- WHEN ユーザーが新規ページを作成し保存
- THEN ページが一覧に反映され、再読込後も残る

#### Scenario: Extract candidates
- WHEN ドキュメントから候補抽出を実行
- THEN 上位出現語が候補として提示される
