# WritingPage task allocation — 2026-11-02

## 着手時の正本と状態

- 対象: `C:\Users\PLANNER007\WritingPage`。開始時 `main == origin/main == 99c626998a27d0ece2f2355a5596a581b42936b8`、追跡対象は clean。現在は割当元から提供された未追跡ファイル3件と添付ログ原本のみ存在し、保持する。
- 観察元: `docs/CURRENT_STATE.md` live block、`docs/INVARIANTS.md`、`docs/INTERACTION_NOTES.md`、`docs/ai/CORE_RULESET.md`、`CODEX_OPERATIONS.md`、`DECISION_GATES.md`、`WORKFLOWS_AND_PHASES.md`、`STATUS_AND_HANDOFF.md`、および `docs/ai/prompts/writingpage-*-20261102.md`。
- 親の直接観察と CURRENT_STATE 記述は不一致。CURRENT_STATE は直前の4件統合について `43432f75...` と記録するが、この担当開始時の実 checkout は `99c62699...` で remote と一致している。候補ソースの確定は先行CI担当が実際に行い、Wiki側はその正確な結果を再読する。
- ログ原本: `docs/verification/2026-11-02/task-allocation-source.txt`。未追跡の3 Prompt は他担当・分析チャットの入力なので本記録の所有外、変更・削除しない。

## 担当表と依存

| 順 | 担当 / チャット | 範囲・所有 | 依存 / 完了条件 |
|---|---|---|---|
| 1 | CI / Electron 候補担当 — `01a19aaa-d36d-7621-acd9-8f9448315c53` (local) | `scripts/release-*`、限定されたElectron/package起動、担当指定のテスト、`docs/verification/2026-11-02/ci-package-verification.md`、候補前の `CURRENT_STATE.md` | 4件修正済みsourceと厳密に対応する候補を固定し、担当編集・Git・GUIを終了。最終結果は担当固有証跡とチャットで判定。候補生成の人受入はWiki着手条件にしない。 |
| 2 | Story Wiki 実装担当 — 新規独立チャットを作成予定 | `js/story-wiki.js`、Wiki専用CSS selector、Wiki focused E2E、`docs/specs/spec-story-wiki.md`、Wiki関連 `docs/APP_SPECIFICATION.md`、`docs/verification/2026-11-02/wiki-requirements-verification.md`。先行担当終了後に限り CURRENT_STATE live block | 同名作成・改名を利用者に分かる形で防ぎ、自分自身への改名は許可。既存重複記事の削除・統合なし。カスタムカテゴリ追加→記事割当→reload後維持、データ互換性、狭幅を含む実画面readbackとfocused回帰、資料同期、所有差分だけ通常commit/push。 |
| 3 | Rich / 保存候補比較担当 — `docs/ai/prompts/writingpage-rich-comparison-20261102.md` を将来の実行入力として保持 | 読み取り専用。ファイル編集、Git、npm/build、GUIなし | 独立チャットとしては未作成。この環境の追加セッション枠はStory Wikiへ割当。他環境は本人へPromptを渡す。比較表と根拠、未確認、次の所有ファイル/確認をチャットで返す。 |

## 共有checkout運用

- 先行担当が占有を終えるまでWiki担当は読み取り専用の実装案調査のみ。候補commitやCI成功を推測せず、clean・候補SHA・占有終了を `wait_threads` と証跡で確認する。
- 先行担当がHOLDでも占有終了し、Wiki所有範囲のファイルが独立しGitが安全なら進行可。進行した場合、Wiki入り候補とは表現しない。生成途中ファイルには触れない。
- Wiki着手後、branch切替/reset/stash/force-pushなし。`git add` は所有パスを明示。無関係な未追跡Promptや他者差分は保持。
- `scripts/release-*`、Electron、package/lock、`editor-wysiwyg`、storage schemaはWiki所有外。CURRENT_STATEはCI担当の引渡し後だけ更新。
- 担当プロンプトの逐語版は `docs/ai/prompts/writingpage-wiki-20261102.md`。他環境向けのRich比較Promptはユーザー側に提示する。

## 起動・モデル指定

- Codex独立チャットの `create_thread` は指定モデル引数を利用できる仕様で、本人指定 `GPT-6 Luna / low` を指定してStory Wiki担当を作成する。
- CI担当チャットは既存のlocal独立チャット。Rich比較担当は同じcheckoutを変更しない読み取り専用作業なので今回は内部補助では起動せず、Promptをユーザーへ渡す。
- Story Wiki担当の残り見込み: 初回10–20分の既存UI/API調査後に再推定し、実装・focused検証・画面確認・文書・commit/pushを含め概ね1–3時間。先行担当待ち時間は未確定で時間目安は停止期限にしない。

## 所有と履歴

- この割当記録だけを親が所有。担当が受領・着手・終了したら thread ID、モデル指定/実確認、変更状態、成果・証跡、次担当をここへ追記する。
- 本記録はログの複製や10月候補全体の再統合を許可しない。成果選定は今回明示されたStory Wikiの2要件に限る。
