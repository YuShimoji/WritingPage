# WritingPage

Claude Code 用の薄い adapter。運用ルールや再開判断の正本をここへ再掲しない。

## Read Order

1. `AGENTS.md`
2. `docs/CURRENT_STATE.md` の live block
3. `docs/INVARIANTS.md`
4. `docs/INTERACTION_NOTES.md`

必要な場合のみ `docs/USER_REQUEST_LEDGER.md` / `docs/ROADMAP.md` / `docs/FEATURE_REGISTRY.md` を読む。

## Adapter Rules

- セッション番号・直近スライス・検証結果・再開手順は `docs/CURRENT_STATE.md` を正とする。
- 旧再開・健康・カウンター文書は削除済み。再作成せず、`docs/CURRENT_STATE.md` に集約する。
- Decision Log をこのファイルへ戻さない。長命の決定は `docs/INVARIANTS.md`、要求・backlog は `docs/USER_REQUEST_LEDGER.md`、現在地は `docs/CURRENT_STATE.md` に分担する。
- Codex へ渡す開発 Prompt を作る場合は `docs/ai/prompts/supervisor_to_codex.md` を使い、micro-step の列ではなく 1 つの outcome package として出力する。
