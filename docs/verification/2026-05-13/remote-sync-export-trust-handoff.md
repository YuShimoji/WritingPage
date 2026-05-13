# Export Trust Proof 後の remote sync handoff

日付: 2026-05-13

## 目的

Save / Resume Trust Audit の後に、Export Trust Proof で TXT / JSON の download event だけでなく実ファイル内容まで確認した。この文書は、その状態を chat 履歴ではなく project 側に残し、別端末がすぐ再開できるようにするための restart packet。

## 現在の anchor

- ブランチ: `main`
- upstream: `origin/main`
- この handoff 前の product proof commit: `372be1b test: prove export file contents`
- 再開順: `docs/CURRENT_STATE.md` -> `docs/INVARIANTS.md` -> `docs/INTERACTION_NOTES.md`
- 次スライス選定時だけ読む: `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md`

## 信頼してよいこと

- Save / Resume Trust Audit で、本文入力、保存済み status chip、Documents 発見、再起動復帰、TXT / JSON download event、Reader 復帰は確認済み。
- Export Trust Proof で、download された TXT が current editor value と一致することを実ファイル読取で確認済み。
- Export Trust Proof で、download された JSON を parse し、`document.id`、`document.name`、`document.content`、`pages` を確認済み。
- JSON 読み込みは daily UI roundtrip を確認済み。explicit chapter `pages` は `importProjectJSON` で roundtrip 確認済み。
- Reader 往復後も、再度 TXT / JSON 書き出しした内容が劣化しないことを確認済み。
- Documents の `入出力` / `管理` menu 一意性は targeted E2E で確認済み。

## 次にやらないこと

- Floating memo を保存モデル化しない。
- Cloud sync、EPUB、DOCX へ飛ばない。
- visible top chrome や常設 toolbar を戻さない。
- 次の writing trust slice に Gadget 追加を混ぜない。
- docs-only 更新だけを writer workflow の進捗として扱わない。

## 次に進めるなら

最短の次スライスは `Chapter Creation Daily Flow`。作家が章を作り、章本文を書き、Sections で見つけ、保存し、再起動で戻り、Reader で確認し、TXT / JSON で外に出しても本文と構造が壊れないことを 1 本で固定する。

別候補としては、初回の不安を下げる `First-use Save Help`、外部退避から戻す信頼を厚くする `Import Roundtrip Hardening`、Rich editing の `# 見出し` を自動変換するか判断する `Rich Editing Heading Shortcut Decision` を分けて扱う。

## 検証コマンド

Export Trust Proof slice では次を PASS 済み。

- `node --check js/storage.js`
- `node --check e2e/export-trust.spec.js`
- `npx playwright test e2e/export-trust.spec.js --workers=1 --reporter=line`
- `npx playwright test e2e/content-guard.spec.js -g "Documents toolbar separates|Documents menus stay unique" --workers=1 --reporter=line`
- `npx playwright test e2e/daily-writing-proof.spec.js --workers=1 --reporter=line`
- `npm run test:smoke`
- `git diff --check`

この handoff refresh では、少なくとも `npm run test:smoke`、`git diff --check`、remote sync proof を再確認してから push する。
