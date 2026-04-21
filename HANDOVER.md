# Handover: Zen Writer

最終更新: 2026-04-21

## Shared Focus

- main / origin/main には **浮遊メモ実験 v2.1** と **package gate follow-up** が反映済み
- 次スレッドの主対象は packaged app の残課題 2 件の実機確認
  - Normal 起動直後に左 sidebar が期待どおり reopen するか
  - 中央上部の `Zen Writer` drag strip が packaged app で自然にドラッグ動作するか
- 浮遊メモは side quest として main に隔離着地済み。editor/chapter/autosave 本流には未接続

## Non-Negotiables

- 事実確認の起点は `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\CURRENT_STATE.md`
- 不変条件は `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\INVARIANTS.md`
- backlog / feature 状態は `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\USER_REQUEST_LEDGER.md` と `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\FEATURE_REGISTRY.md`
- packaged gate を閉じる前に unrelated refactor や本流統合へ広げない
- 浮遊メモは引き続き dev-only / experimental overlay のまま扱う

## Reused Canonical Context

- `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\CURRENT_STATE.md`
- `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\FEATURE_REGISTRY.md`
- `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\USER_REQUEST_LEDGER.md`
- `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\INTERACTION_NOTES.md`
- `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\project-context.md`

## Current Trust Assessment

- trusted
  - 浮遊メモ v2.1 の web 検証
  - docs への context 定着
  - 最新 build / electron build
- needs re-check
  - packaged app 実機での left sidebar reopen
  - packaged app 実機での center-top drag strip
- dangerous / rollback candidate
  - なし

## Active Artifact And Bottleneck

- Active artifact: packaged Windows app の最終ゲート
- Bottleneck: web 側では通っているが packaged 実機でしか確定できない 2 症状が残っている

## What Landed

- **浮遊メモ実験 v2.1**
  - `C:\Users\thank\Storage\Media Contents Projects\WritingPage\js\floating-memo-field.js`
  - `C:\Users\thank\Storage\Media Contents Projects\WritingPage\css\style.css`
  - `C:\Users\thank\Storage\Media Contents Projects\WritingPage\e2e\floating-memo-lab.spec.js`
  - touch / coarse pointer 仕様:
    - 背景 1 本指即ドラッグ + 8px slop
    - 背景 tap で foreground 化
    - 次の tap で textarea 編集
    - 2 本指 gesture 無効
    - `visualViewport` が使える環境では keyboard 回避
- **package gate follow-up**
  - `C:\Users\thank\Storage\Media Contents Projects\WritingPage\js\edge-hover.js`
  - `C:\Users\thank\Storage\Media Contents Projects\WritingPage\css\style.css`
  - packaged app 向けの sidebar reopen / drag strip 調整が入っている

## New Fossils

- `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\CURRENT_STATE.md:17`
  - session 117 snapshot と memo-lab v2.1 / package gate follow-up の現況
- `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\FEATURE_REGISTRY.md:24`
  - FR-010 に touch / coarse pointer / `visualViewport` 回避を追記
- `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\USER_REQUEST_LEDGER.md:11`
  - memo-lab v2.1 の採用仕様を記録

## Verification Already Run

- `npm run lint:js:check`
- `npx playwright test e2e/floating-memo-lab.spec.js --reporter=line`
- `npm run test:unit`
- `npm run test:smoke`
- `npm run test:e2e`
- `npm run build`
- `npm run electron:build`

直近結果:
- unit: 11 passed
- memo-lab spec: 6 passed
- full e2e: 536 passed / 2 skipped
- build: passed

## Safe Restart Plan

1. `git pull --ff-only origin main`
2. `npm run app:open`
3. packaged app で以下を手動確認
   - Normal 起動直後に左 sidebar が reopen するか
   - 中央上部 drag strip で window drag できるか
4. PASS なら `C:\Users\thank\Storage\Media Contents Projects\WritingPage\docs\CURRENT_STATE.md` に closeout を追記
5. FAIL なら該当 surface のみを最小修正し、`lint:js:check` + narrow test + `npm run electron:build` で再確認

## What Not To Do Next

- packaged gate 未確認のまま closeout しない
- 浮遊メモを editor / chapter / autosave 本流へ接続しない
- unrelated UI / sidebar / reader refactor を混ぜない
- 全量 E2E を回しただけで packaged 実機確認を省略しない

## Remote Status

- branch: `main`
- remote: `origin`
- この handoff 更新も remote へ反映して、次スレッドはそのまま再開可能な状態にする
