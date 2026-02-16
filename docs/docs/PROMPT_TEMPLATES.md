# Prompt Templates

> レポート形式とリスク管理の標準テンプレート。

---

## 1. レポート形式

### Standard

```
目的: <goal>
現状: <current_state>
懸念: <risks>
次のアクション: <actions>
```

### Concise

```
要点: <highlights>
次のアクション: <next>
```

---

## 2. Tier別対応

| Tier   | 対象                   | 対応                                 |
| ------ | ---------------------- | ------------------------------------ |
| Tier 1 | ドキュメント、軽微修正 | 自律実行可                           |
| Tier 2 | 機能実装、リファクタ   | PR作成、品質ゲート通過で自動マージ   |
| Tier 3 | 基幹変更、本番操作     | 人間承認必須、バックアウトプラン必須 |

---

## 3. 禁止事項

- 絵文字、装飾表現
- 冗長な言い回し
- 「念のため」のテスト・フォールバック追加
- 確認なしの担当外リファクタリング

---

## 4. 参照

- 中央ルール: `docs/Windsurf_AI_Collab_Rules_v1.1.md`
- オーケストレーション: `docs/windsurf_workflow/ORCHESTRATOR_PROTOCOL.md`
- レポート設定: `REPORT_CONFIG.yml`
