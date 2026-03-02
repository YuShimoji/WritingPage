# Frozen OpenSpec Changes

このディレクトリには、一時的に凍結されたOpenSpec変更が格納されています。

## 凍結理由

### ui-enhancements
- **凍結日:** 2026-03-02
- **理由:** スコープが曖昧で、他の変更と重複の可能性あり
- **対処:** 具体的な要求が明確になった時点で、個別Issueとして再起票
- **参照:** `docs/OPENSPEC_TRIAGE_2026_03_02.md`

### story-wiki-implementation
- **凍結日:** 2026-03-02
- **理由:** `add-modular-ui-wiki-nodegraph` と重複（Wiki機能）
- **対処:** `add-modular-ui-wiki-nodegraph` に統合済み
- **参照:** `docs/OPENSPEC_TRIAGE_2026_03_02.md`

## 再開手順

凍結された変更を再開する場合:

1. 凍結理由を確認
2. 他の変更との重複がないか確認
3. スコープを明確化
4. `openspec/changes/` に移動
5. `openspec validate <change-id> --strict` で検証
