# Zen Writer 再開時の現状と実装差分

- 調査日: 2026-09-28 JST
- 対象: 資料作成前の `main`、確認できた remote branch、正本資料、現行コード、ローカル検証
- 用途: 次の実装・受入範囲を決めるための共有資料。リリース承認や操作感の受入記録ではない。

この資料の反映で `main` の HEAD は文書のみの commit へ進む。以下の `b02ceb1` は
今回比較した最後の product/runtime commit であり、再開時の exact HEAD は Git で読む。

## 先に共有したい結論

Zen Writer v0.3.32 の日常執筆の芯は `main` に存在する。Rich editing、Documents、
ローカル保存と再開、TXT / Markdown / JSON の退避、MD プレビューと再生オーバーレイを
つなぐ主要な Web 経路は、今回のローカル検証と過去の exact-main CI で確認できた。
大きな機能を一から作り直す状態ではない。

再開時の難所は、**どのソースを次の候補とするか**、**そのソースと実行ファイルを
どう結び直すか**、**人が実機で何を確認したか**の三点である。`main` の live 記録は
2026-07-25 で止まっているが、その後に生成した `b02ceb1` 候補の記録、CI 証拠の
修正、Rich editing の操作改善が別ブランチに残っている。これらを `main` の実装済み
機能や、この端末にある実行ファイルとして扱うと、再開判断を誤る。

## 今回確認した基準点

| 観点 | 2026-09-28 の確認結果 | 判断上の意味 |
| --- | --- | --- |
| 実装比較の基準 | 調査開始時 `main` = `origin/main` = `b02ceb1c42fcbad38fa1e5acb40efe7cd3831ef8`。作業ツリー clean、左右差 `0 0`。remote `main` も同 SHA | この端末での product/runtime 検証基準。資料反映後の HEAD は別 |
| 系譜 | 受理済み H2 head `c37c8ae` は現在の `main` の祖先 | H2 統合をやり直す必要はない |
| 最後の product/runtime 変更 | Markdown linkification の DoS 対応。`markdown-it 14.3.0` / `linkify-it 5.0.2` と browser vendor bundle を更新 | 7 月の旧 package とは異なるソース |
| exact-main CI | GitHub Actions run [`30200150522`](https://github.com/YuShimoji/WritingPage/actions/runs/30200150522)、head SHA `b02ceb1`、`completed/success`。実施日は 2026-07-26 | Web / Node acceptance の記録。9 月の package 実機確認ではない |
| この端末の環境 | Node `v22.19.0`、npm `10.9.3`、`npm ls --depth=0` pass。`package.json` は Node `>=22.12.0 <25`、npm `>=11 <12`、`npm@11.6.2` を指定 | Node は範囲内、npm は再現用契約から外れる。次の候補生成前に揃える |
| ローカル再検証 | smoke pass、unit `36/36`、JS lint pass、dist build pass。執筆開始・文書切替・保存/復帰の focused E2E `3/3` | 現行 checkout の主要 Web 経路を再確認。full E2E と Electron 実機は今回未実施 |
| この端末の候補現物 | `output/release-readiness` に見える checkpoint は 2026-07-13 / 15 のもの。`build/win-unpacked/Zen Writer.exe` と 2026-07-28 の候補 checkpoint は、この checkout では見つからない | 別ブランチの証拠記録だけで package を観察済みとはできない |

### 証拠の読み分け

- **この端末で確認**: Git / remote ref / CI API の readback、ソース、依存ツリー、今回のテスト結果。
- **別ブランチの記録**: そのブランチの検証文書とコミットを読んだもの。候補実行ファイルの
  bytes や起動挙動を、この端末で再検証した意味ではない。
- **人の観察待ち**: exact package の起動、入力、保存、終了、再起動、復帰、通常サイズでの
  操作感。Web E2E や PNG capture から合格へ昇格させない。

## 本来の到達点と、今 `main` が満たす範囲

正本が描く本筋は「起動 → 執筆 → 構造化 → 装飾 → preview → 出力 → 保存・再開」。
公開 UI は command palette、left nav の root/category、再生オーバーレイで説明し、
`normal` / `focus` は内部互換値とする。本文を AI が代筆すること、cloud sync、
EPUB / DOCX、Floating memo の正式保存を、現フェーズの完了条件へ追加しない。
根拠は [`INVARIANTS.md`](../../INVARIANTS.md)、
[`INTERACTION_NOTES.md`](../../INTERACTION_NOTES.md)、
[`ROADMAP.md`](../../ROADMAP.md)、
[`USER_REQUEST_LEDGER.md`](../../USER_REQUEST_LEDGER.md)。

| 作家の導線 | 期待されている挙動 | `main` と証拠 | 残る距離 |
| --- | --- | --- | --- |
| 起動して書く | Rich editing を既定の単一執筆面とし、保存前提と入口を短く示す | `index.html` の `#wysiwyg-editor` と `#writing-status-chip`、`first-writing-comfort` E2E pass | empty hint の邪魔さは通常サイズでの人の感触待ち |
| 原稿を見つけて続ける | Documents で文書を識別・切替し、保存後に再開できる | `daily-document-lifecycle` と `editor-trust-workflow` E2E pass。`js/storage.js` は IDB と LocalStorage の経路を持つ | `現在` marker と文書選択後 focus の操作感は未受入 |
| 構造・装飾を編集する | 章と文書を分け、Rich / Markdown の意味を保つ | 章 store、Rich editor、装飾・リンク・preset の実装と回帰 spec がある | Rich 選択 toolbar の衝突改善は別ブランチにあり `main` 未統合 |
| 読者側の見え方を見る | MD プレビューと再生オーバーレイを、同じ原稿の別 surface として扱う | `ZWPostMarkdownHtmlPipeline`、Reader、章リンク等が `main` にある | WP-004 Phase 3 は roadmap 上 `partial`。長文・見た目の manual parity pack は新しい差分時／リリース前の確認境界 |
| 外へ退避する | TXT / Markdown / JSON の出力と JSON 読み込みを確認し、失敗時は現文書を保持する | `editor-trust-workflow` E2E pass。過去の export proof は実ファイル内容を確認 | この回で package 上の出力先・実ファイルは再確認していない |
| 候補を判断する | exact source → CI → checkpoint → capture → package SHA → 人の観察 → derivative の順に証拠を結ぶ | `release:checkpoint` / `release:observe` は `main` にある | `main` の CI metadata は旧 run 固定。`b02ceb1` 候補の現物はこの端末で未発見、exact package 観察も未記録 |

上の「実装がある」は、画面上の好みや packaged Electron の受入まで意味しない。
逆に、WP-004 Phase 3 の `partial` や WP-001 中長期枠の `todo` を、現行の
執筆・保存経路が丸ごと未実装という意味にも広げない。

## 実装・資料・受入の具体的な乖離

### 1. 配布候補は作られたが、`main` とこの端末からは辿りにくい

`main` の [`CURRENT_STATE.md`](../../CURRENT_STATE.md) と
[`USER_REQUEST_LEDGER.md`](../../USER_REQUEST_LEDGER.md) は、次の到達点を
「integrated main から release-candidate identity を作る」と書いたままだった。
一方、remote `codex/release-candidate-identity-b02ceb1` の
[2026-07-28 記録](https://github.com/YuShimoji/WritingPage/blob/ef8cfffafffcd643b80af8a930cfc2a3b6f81bbb/docs/verification/2026-07-28/release-candidate-identity-b02ceb1.md)
は、source `b02ceb1` / dirty false、checkpoint SHA
`24f69ed13de23322784e84e1ecf67fe76714fd8fabf54545054c8c635c174891`、
`Zen Writer.exe` 201233408 bytes / SHA
`3a877a0f912dac6c17352e68d78e53a8eb9c3a59626ad5d3a12e44f1a75bece8`
を報告している。判定は `HOLD_FOR_ELECTRON_OBSERVATION` である。

候補は **`b02ceb1` 由来として記録済み**だが、その checkpoint と package は Git
管理外で、この端末の checkout にない。ブランチの記録を source/package hash の
現物 readback や操作結果に置き換えられない。旧 `889a642` package の観察を、
この候補の起動・保存復帰として継承することもできない。

### 2. `main` の checkpoint は exact-current CI を自動で結べない

`scripts/release-readiness-checkpoint.js` は現在も `remoteFull.runId = 29198025986`、
commit `cf4b432...` を定数で入れる。これは過去の repository baseline で、
現在の source `b02ceb1` の exact CI run `30200150522` ではない。
候補の 7 月記録はこのずれを明記し、別途 CI を readback していた。

remote `codex/release-ci-evidence-binding` の
[2026-07-29 記録](https://github.com/YuShimoji/WritingPage/blob/0ac3c0dbd1f109aafe095f253653afb81bdd0cfb/docs/verification/2026-07-29/release-checkpoint-exact-ci-binding.md)
とコードは、`--remote-full-run-id` を受け取り、run ID・完了・成功・head SHA の
一致を checkpoint 生成前に検査する。しかし commit `0ac3c0d` は `main` にない。
したがって次回 `main` で checkpoint を生成する時は、旧 CI を現在の CI と誤記しない
運用か、この修正の受理・統合が先に必要である。既存 `b02ceb1` 候補の checkpoint
を後から書き換える理由にはならない。

### 3. Rich editing の操作改善は受理判断が残る

remote `codex/rich-editor-control-friction` は基準 `b02ceb1` から 2 commits 先にあり、
実装 commit `19ea977` と文書 closeout `e2c72d4` を含む。
[検証記録](https://github.com/YuShimoji/WritingPage/blob/e2c72d4daa1f52079554aeea95ecfe48e9effd9b/docs/verification/2026-07-27/rich-editor-control-friction.md)
によると、文字選択時の floating toolbar が選択行・隣接行を覆う問題を抑え、
URL / email の surface ごとの変換時点と Rich 側の下線も確認した。実装 commit の
[CI run `30213655549`](https://github.com/YuShimoji/WritingPage/actions/runs/30213655549)
は成功している。

しかし現在の `main` の `js/editor-wysiwyg.js` は `selectionchange` ごとに
`_showFloatingToolbar(range)` を呼ぶ旧経路である。ブランチの成功を `main` の
挙動として報告できない。次の配布候補にこの改善を含めるかは、ブランチの
scope/evidence を受理して main 統合する判断に依存する。既存 `b02ceb1` binary
にはこの変更は入らない。

### 4. 自動 PASS と体感・実機の間に明確な受入残差がある

Documents の empty hint、`現在` marker、文書選択後の editor focus は Web E2E で
経路が通った。通常利用サイズでの見え方と邪魔にならない感触は、
[`PROJECT_COCKPIT.md`](../../PROJECT_COCKPIT.md) と ledger で user-owned の
deferred review とされている。WP-004 の Reader / MD preview parity も、自動層と
人の並べ確認を分けている。いずれも今すぐ機能を広げる根拠ではなく、観察結果が
戻った時に狭い修正へ変えるための残差である。

release の受入はさらに別で、exact `Zen Writer.exe` の起動、テスト用本文入力、
保存、終了、再起動、復帰が必要となる。候補記録上も `HOLD` のままであり、
checkpoint 生成、CI 成功、PNG の視認から Electron の PASS は導けない。

### 5. 入口資料の一部は現行の実装・判断とずれる

[`APP_SPECIFICATION.md`](../../APP_SPECIFICATION.md) は、公開された分割ビューを
「実装済み」、自動保存先を「LocalStorage」、章操作面を「Focus モード左パネル」と
説明する。一方、[`USER_REQUEST_LEDGER.md`](../../USER_REQUEST_LEDGER.md) は
WP-005 で公開の比較入口を退避したと記録し、`js/storage.js` / `js/storage-idb.js`
には IndexedDB と LocalStorage の経路がある。公開 UI の正本は
[`INTERACTION_NOTES.md`](../../INTERACTION_NOTES.md) の unified shell である。

これは直ちに製品不具合を証明するものではなく、**説明の古さ**である。新しい人が
`APP_SPECIFICATION.md` だけから実装範囲を決めると、旧分割ビューや公開 Focus
モードの復活を誤って期待しうる。今回の再開資料と `CURRENT_STATE` から現行正本へ
辿れるようにし、仕様書の局所的な同期は別の狭い文書整備として扱う。

### 6. この端末の再現環境は候補生成の契約と一致しない

Node `v22.19.0` は `package.json` の範囲内だが、npm `10.9.3` は
指定された `>=11 <12` から外れる。今回の smoke、unit、lint、build、focused E2E
は通ったため、現行 Web の調査は続けられる。ただし次の exact-source package を
作るときは npm `11.6.2` を揃え、clean source と独立 install を記録してから、
成果物の SHA を取る必要がある。今回の `dist` build を候補 package と呼ばない。

## ブランチと証拠の所在

2026-09-28 に `git ls-remote` で remote head を確認した。open PR の有無だけを
authority にせず、`main` と各ブランチの commit・証拠を区別する。

| ブランチ | remote head | 位置づけ | この端末で未確認のもの |
| --- | --- | --- | --- |
| `main` | `b02ceb1c42fcbad38fa1e5acb40efe7cd3831ef8` | 調査時の product / release tooling の統合済みソース。資料反映で docs-only HEAD へ進む | 新 package と Electron 実機 |
| `codex/release-candidate-identity-b02ceb1` | `ef8cfffafffcd643b80af8a930cfc2a3b6f81bbb` | `b02ceb1` 由来の checkpoint / package identity を記録。基準から文書 1 commit 先 | ignored checkpoint と executable の bytes、操作観察 |
| `codex/release-ci-evidence-binding` | `0ac3c0dbd1f109aafe095f253653afb81bdd0cfb` | exact CI binding のコード・テスト・文書。候補 branch を祖先に持ち、基準から 2 commits 先 | この head の remote full CI、main 統合 |
| `codex/rich-editor-control-friction` | `e2c72d4daa1f52079554aeea95ecfe48e9effd9b` | Rich 選択 toolbar の実装と closeout。実装 `19ea977` の CI 成功 | main 統合、packaged での見た目と操作 |

これらの branch はいずれも `main` を祖先に持つが、別々の目的で並行した履歴で
ある。候補 binary の source は `b02ceb1` のままで、後続ブランチのコードを
含むとみなさない。ブランチ上の `CURRENT_STATE` もそのブランチ時点の記録であり、
この checkout の `main` に自動で反映されたわけではない。

## 今回の検証と未確認領域

| 確認 | 結果 | 射程 |
| --- | --- | --- |
| `git status --short --branch`、remote SHA、H2 ancestry | clean / parity / ancestor yes | ソース同一性 |
| `npm ls --depth=0` | pass | この端末の依存解決。npm 本体の契約一致は別 |
| `npm run test:smoke` | `ALL TESTS PASSED` | 静的・軽量な app entry / resource / contract |
| `npm run test:unit` | `36/36` pass | storage、release 判定、Markdown linkify 等の Node unit |
| `npm run lint:js:check` / `npm run build` | pass / pass | JS lint と `dist` の生成 |
| `npx playwright test e2e/first-writing-comfort.spec.js e2e/daily-document-lifecycle.spec.js e2e/editor-trust-workflow.spec.js --workers=1` | `3/3` pass | Web の起動から書く、文書切替、保存/復帰、import/export の focused path |
| exact-main CI run `30200150522` | `completed/success`、head `b02ceb1` | 2026-07-26 の remote acceptance。今回の再実行ではない |

この回は full Playwright、Electron directory build、`release:checkpoint`、
`release:observe`、packaged app launch、保存後の実機再起動、UI の人による体感 review、
依存 advisory の現時点での再監査を実施していない。unit の invalid JSON / 強制保存失敗
の stderr は負例テスト由来で、集計は pass。書き込みはこの資料と
`CURRENT_STATE` の再開入口更新に限る。

## 次に推奨する作業

一度に一つの user outcome を選び、同じ受入判断に branch 統合、候補生成、
人の操作感、外部公開を束ねない。

| 取っ掛かり | ほどく摩擦と次に可能になること | 必要な境界 |
| --- | --- | --- |
| **Audit — ソース選定** | `b02ceb1` を次の候補ソースとするか、Rich toolbar 改善を先に受理するかを決める。決まれば candidate の source SHA が一意になる | `19ea977` の scope と証拠を review。branch CI success は main 統合の代わりではない |
| **Verify — 候補現物の所在** | `b02ceb1` の checkpoint と exe を所在・hash まで再発見できれば、exact package の operator 観察に進める。見つからなければ、選んだ clean source から新 identity を作る | 既存候補 folder は上書きしない。旧 package の観察を移植しない |
| **Advance — CI 証拠の結合** | `0ac3c0d` の exact-run 検証を review して取り込めば、次の checkpoint が旧 run を current CI と誤記しにくくなる | 候補の既存 checkpoint は immutable。コード変更は別の scoped tooling slice |
| **Review — 人の受入** | exact executable で起動・入力・保存・終了・再起動・復帰を観察し、PASS / FAIL / HOLD を返す。Documents の 3 点の操作感は通常サイズで自由文 review にする | package SHA と operator sheet の一致が先。電子的/手動の証拠を別々に記録 |

推奨順は、まず **次の source SHA を確定し、候補現物を照合すること**。
もし `b02ceb1` 候補をこのまま評価するなら、既存 candidate の hash を再確認して
実機観察へ進める。Rich toolbar branch を次候補へ入れるなら、その受理・統合後の
source で別 candidate identity を作る。どちらの場合も、観察結果が戻ってから
`release:observe` で original を変更しない sibling derivative を作り、内部 review
判断へ進める。

## 再開時の読み順

1. `git status --short --branch`、`git ls-remote --heads origin main`、
   `git rev-list --left-right --count HEAD...origin/main` で正本と手元を合わせる。
2. [`CURRENT_STATE.md`](../../CURRENT_STATE.md) の live block →
   [`INVARIANTS.md`](../../INVARIANTS.md) →
   [`INTERACTION_NOTES.md`](../../INTERACTION_NOTES.md) を読む。
3. この資料で `main`、三つの後続 branch、ignored candidate 現物、実機観察を分ける。
   個別判断が必要な時だけ branch 固定の検証記録を開く。
4. product 変更を選ぶ場合は [`USER_REQUEST_LEDGER.md`](../../USER_REQUEST_LEDGER.md)、
   [`ROADMAP.md`](../../ROADMAP.md)、該当 spec を読む。`proposed` の選択だけで
   実装承認へ昇格させない。
