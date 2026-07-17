# Latest-main development readiness and supervisor goal proposal

Date: 2026-07-17

## 監修役AIへ最初に伝える結論

WritingPage の `main` は configured remote の最新状態へ fast-forward 済みで、
Node/npm 契約、installed dependency tree、最小 smoke の再確認まで通っている。
この checkout は通常の開発を再開できる。

一方、内部リリース判断はまだ進めてはいけない。Web acceptance、capture、
Electron directory package の機械証拠を束ねる G3 checkpoint は実装済みで、
別の clean terminal では一度 pass しているが、package を人が実際に起動し、
短い入力と保存、終了、再起動、復帰を観察する H1 が未完了である。
したがって現在の正直な判定は `HOLD_FOR_ELECTRON_OBSERVATION` のまま。

## 今回取り込んだリモート変更

| 観点 | 読み取った事実 | 開発判断への影響 |
| --- | --- | --- |
| branch / remote | `main`、`origin = https://github.com/YuShimoji/WritingPage.git` | 正しい upstream を使用している |
| fetch | `origin/main` が `d910f9c` から `1a1fb01` へ進んでいた | 最新 handoff を取り込む必要があった |
| pull | `git pull --ff-only origin main` で `1a1fb01 docs: hand off dev-ready context` へ fast-forward | rebase、stash、history rewrite なしで同期完了 |
| parity | 同期直後 `HEAD...origin/main = 0 0` | tracked history は remote と一致 |
| local diff | `.serena/project.yml` の既存 template churn だけが残る | user/tool-owned として保持し、product / handoff commit から除外する |

`.serena/project.yml` は Serena の新しい設定テンプレートへの自動更新に見えるが、
この作業では所有者判断を代行して破棄・commitしない。通常の実装や smoke を妨げないが、
G3 の dirty-source gate は正しく反応するため、この checkout のまま final checkpoint を
生成して clean evidence と主張してはいけない。

## 開発可能性の再確認

project contract は Node `>=22.12.0 <25` / npm `>=11 <12`。
今回の project command は Codex bundled Node `v24.14.0` と Corepack npm
`11.6.2` で実行した。

| 検証 | 結果 | 何が分かったか |
| --- | --- | --- |
| `node_modules` | present | install の再実行は不要だった |
| `npm ls --depth=0` | pass | package `0.3.32` の direct dependency tree が解決している |
| `npm run test:smoke` | pass / `ALL TESTS PASSED` | dev server、主要 static surface、plugin/gadget route、embed route、docs契約、version alignment が開発入口として機能する |
| tracked product changes | none | 今回は maintenance / sync / report の境界を維持している |

full Playwright、SP-071、`release:checkpoint` 全体は再実行していない。
product code の変更がなく、G1 remote acceptance は commit `cf4b432` / GitHub
Actions run `29198025986` の smoke pass、unit 16/16、594 passed / 4 skipped を
observed evidence として維持するためである。

## 端末ローカル証拠の実態

今回の checkout には `output/release-readiness` が存在しない。remote の
2026-07-17 handoff が記録した `checkpoint-2026-07-15T04-55-55-427Z` は、
その handoff を作成した別 terminal の ignored artifact であり、Git pull では移らない。

`build/win-unpacked/Zen Writer.exe` は残っているが、次の理由で H1 に使えない。

| 項目 | この checkout の残存 package | 2026-07-15 clean checkpoint |
| --- | --- | --- |
| mtime | 2026-06-29T22:40:21+09:00 | 2026-07-15 checkpoint |
| size | 201233408 bytes | 201233408 bytes |
| SHA-256 | `314648b41c75833fe3629a0db18642087c20e6c0d08f90a83882f1a4c6d84706` | `6253997b504407f4148f7396812409a628381664027c52d9c04796204b494779` |
| operator sheet | absent | checkpoint内に生成済みだった |
| H1 suitability | no | packageとsheetを同じterminalで再生成した場合のみ候補 |

exe の存在、同じサイズ、build成功、Web screenshot は Electron behavior の観察に
代用できない。ignored evidence を転送可能と誤認しなかったこと自体が、G3 の責務境界が
機能している証拠である。

## 現在の信頼境界

| 領域 | 現在状態 | 再開時に守ること |
| --- | --- | --- |
| G1 Web acceptance | closed | 新しい failure がなければ full Playwright / SP-071 を再開しない |
| G3 H0 implementation | done | `release:checkpoint` の schema、capture ownership、package hash、dirty blocking を正本にする |
| clean H0 evidence on this checkout | not present | clean latest HEADから再生成し、古い `build/` を使わない |
| G3 H1 | pending / user-owned observation | exact package の launch、input/save、close、reopen/recovery を記録する |
| overall release-readiness | `HOLD_FOR_ELECTRON_OBSERVATION` | H1 PASS 前に READY や release approval と書かない |
| Documents tactile review | hold / nonblocking | release evidenceと好みの判断を混ぜない |
| dependency warnings | audit candidate | upgradeを暗黙実行せず、read-only auditと承認済み変更を分ける |

実装成熟度は roadmap 自己評価で約95%。ただし品質 milestone の残りは量ではなく
actor boundary で、機械証拠を増やすほど解ける問題ではない。

`実装成熟度  [█████████░] 約95%（repo roadmap estimate）`

`現行gate     G1 closed -> G3 H0 implemented -> H1 pending -> internal review blocked`

## 可能な限り先まで見通した目標スタック

以下は監修判断用の提案であり、既存 backlog の `approved` への昇格や、signing / publication
の承認を意味しない。前段 gate を満たした時だけ次段を起動する。

| 段階 | 目標 | 解消する摩擦 | 必要条件と担当 | 完了すると可能になること |
| --- | --- | --- | --- | --- |
| M0 完了 | latest-main dev-ready | 別 terminal の会話や環境を再構築しないと開発できない | assistant: sync、runtime/dependency/smoke readback | 通常の bounded product / maintenance slice を開始できる |
| M1 最優先 | clean G3 evidence package の再生成 | この端末に transferable checkpoint がなく、古い package しかない | assistant: `.serena` 差分を失わない clean secondary worktree、またはowner解決後のclean checkoutから `npm run release:checkpoint` | 同一commit/hash/operator sheetへ結び付いた観察対象ができる |
| M2 必須gate | H1 Electron observation を閉じる | package-only behavior が未観察 | user: exact hash packageを起動し、短い入力・保存・終了・再起動・復帰を観察。observer/time/result/findingsをsheetへ記録 | `PASS` なら内部リリース判定へ進める。`FAIL` なら再現証拠に基づくnarrow fixを起票できる |
| M3 条件付き | internal release review | 機械証拠と人間観察が別々でgo/hold判断しづらい | shared: H1 PASSをcheckpointへ取り込み、全gateをreadback | `READY_FOR_INTERNAL_RELEASE_REVIEW` を評価できる。外部公開・署名はまだ別gate |
| M4 並行可能 | Documents tactile debt closure | empty hint、`現在` marker、focus return の体感が自動証拠では閉じない | user: 実使用windowで自由文review。assistant: feedbackを1 batchの狭い修正へ整理 | daily writing の「見つける・選ぶ・本文へ戻る」感触を閉じられる |
| M5 条件付き | maintenance risk budget | locked tree のdeprecated warningが将来の更新コストを不透明にする | assistant: read-only dependency audit。user/supervisor: upgrade範囲をred-band gateで承認 | 必要な依存更新だけを回帰コスト付きで1 outcome sliceにできる |
| M6 将来 | observed-friction driven product cycle | 成熟済み機能を理由なく再開すると価値より回帰面が増える | shared: 実使用FAIL、新しいpreview/Reader差分、または明示したcreative opportunityの価値検証 | WP-001/WP-004 narrow fix、専用comparison surface、または新しいwriting trust sliceを正当なbottleneckから選べる |
| M7 最遠gate | release / distribution strategy decision | internal readiness と外部配布の責務がまだ分離されている | user/supervisorの明示承認。signing、publication、update distribution、support boundaryを別outcomeとして定義 | 初めて外部配布計画へ進める。現時点では未承認・非対象 |

### 推奨する一本道

最短で価値が大きい順序は `M1 -> M2 -> M3`。これは新機能を増やさず、すでに
揃っている実装と機械証拠を、実際に使える内部リリース判断へ変える。

M4 は H1 を止めずに並行できるが、preference-driven な feedback は1 batchにまとめる。
M5 は H1後でもよく、dependency warning が現行のdev-ready判定を汚していないうちは
upgradeを急がない。M6 は新しい観測が起動条件であり、旧 roadmap の完了済み項目を
「次がないから」という理由で再開しない。

## 次の outcome package 提案

次に監修役AIが executor へ渡すなら、micro-step の列ではなく次の1 packageにする。

**Outcome**: user-owned `.serena` 差分を失わず、latest committed `main` から clean G3
checkpoint と exact-hash Electron package/operator sheet を再生成し、H1の人手観察へ
渡せる状態にする。

**Autonomy envelope**: assistant は clean secondary worktree の作成、dependency readback、
`npm run release:checkpoint`、generated JSON/Markdown/hash のreadback、repo-local status更新、
通常のGit follow-throughまで担当できる。既存 checkout の `.serena/project.yml` を破棄・commit
しない。

**Hard stops**: product/UI/storage code変更、dependency upgrade、dirty sourceをcleanと偽る操作、
package existenceをElectron観察に代用、signing/publication、H1結果の代理入力を行わない。

**Acceptance**: clean source identity、machine gates、7 capture/readback、Electron package hash、
operator sheetが同一checkpoint内で整合し、overallが正直に
`HOLD_FOR_ELECTRON_OBSERVATION`。userが観察できる絶対pathとexact hashを報告する。

## 監修役AIが避けるべき再開

- G1、full Playwright、SP-071 を新しい failure なしで再実行する。
- 6月29日の残存 package、7月15日の別 terminal hash、Web capture だけで H1 を完了扱いする。
- `.serena/project.yml` の差分を黙ってrestore、stash、commit、skip-worktree化する。
- Documents tactile reviewをrelease blockerへ変える、またはH1と同じ質問に混ぜる。
- dependency warningから即座にpackage upgradeへ進む。
- MkDocs / GitHub Pages、signing、publication、cloud/account、EPUB/DOCX、Floating memo正式化を
  現行milestoneへ混ぜる。

## 再開用の権威順序

1. `docs/CURRENT_STATE.md` の live block
2. `docs/INVARIANTS.md`
3. `docs/INTERACTION_NOTES.md`
4. workflow / decision / handoff時は `docs/ai/*.md`
5. 次スライス選定時だけ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md`
6. G3実装は `docs/verification/2026-07-13/g3-release-readiness-checkpoint.md`

今回の report は maintenance evidence であり、product behavior、release approval、外部publication
の証拠ではない。
