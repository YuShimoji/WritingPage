# OpenSpec トリアージ分析 2026-03-02

## 現状

**アクティブな変更:** 6件（すべて0タスク実施）

| 変更ID | タスク進捗 | 提案ファイル | 状態 |
|--------|-----------|-------------|------|
| add-modular-ui-wiki-nodegraph | 0/19 | ✅ あり | 大規模 |
| graphic-novel-font-decoration | 0/19 | ✅ あり | 中規模 |
| hud-customization-enhancement | 0/14 | ❌ なし | 小規模 |
| polish-ui-from-test-feedback | 0/18 | ✅ あり | 中規模 |
| story-wiki-implementation | 0/21 | ❌ なし | 中規模 |
| ui-enhancements | 0/24 | ❌ なし | 大規模 |

## 重複・統合分析

### グループA: Wiki機能（統合推奨）

**該当変更:**
1. `add-modular-ui-wiki-nodegraph` - Wiki + ノードグラフ + モジュラーUI
2. `story-wiki-implementation` - Wiki実装

**分析:**
- **重複度:** 高（両方ともWiki機能を含む）
- **推奨アクション:** **統合**
- **統合先:** `add-modular-ui-wiki-nodegraph`（より包括的）
- **理由:** 
  - `add-modular-ui-wiki-nodegraph` はWiki + ノードグラフ + UI拡張を含む
  - `story-wiki-implementation` はWikiのみ
  - 統合することで重複作業を回避し、一貫性を保つ

**統合後の名称案:** `add-modular-ui-wiki-nodegraph`（変更なし）

---

### グループB: UI改善（統合推奨）

**該当変更:**
1. `polish-ui-from-test-feedback` - テストフィードバックからのUI改善
2. `ui-enhancements` - UI強化全般

**分析:**
- **重複度:** 中（UI改善という広いカテゴリで重複）
- **推奨アクション:** **統合または明確化**
- **理由:**
  - 両方とも「UI改善」という曖昧なスコープ
  - `polish-ui-from-test-feedback` はテスト結果に基づく具体的改善
  - `ui-enhancements` は一般的なUI強化
  - 統合するか、スコープを明確に分離すべき

**推奨:**
- `polish-ui-from-test-feedback` を優先（具体的なフィードバックベース）
- `ui-enhancements` は凍結または `polish-ui-from-test-feedback` に統合

---

### グループC: 独立機能（維持）

**該当変更:**
1. `graphic-novel-font-decoration` - グラフィックノベル向けフォント装飾
2. `hud-customization-enhancement` - HUDカスタマイズ強化

**分析:**
- **重複度:** 低（独立した機能）
- **推奨アクション:** **維持**
- **理由:**
  - 明確に異なる機能領域
  - 他の変更と重複しない
  - TASK_054（グラフィックノベル）、中期ロードマップのHUD強化と対応

---

## 推奨アクション

### 即座に実施（Tier 1）

#### 1. Wiki関連の統合

**手順:**
```bash
# story-wiki-implementation の内容を add-modular-ui-wiki-nodegraph に統合
# 1. story-wiki-implementation/specs/wiki.md を確認
# 2. add-modular-ui-wiki-nodegraph/specs/wiki/spec.md と比較
# 3. 重複を排除し、add-modular-ui-wiki-nodegraph に統合
# 4. story-wiki-implementation を削除
```

**期待効果:**
- アクティブ変更: 6件 → 5件
- Wiki仕様の一元化

#### 2. UI改善の整理

**オプションA: 統合**
```bash
# ui-enhancements を polish-ui-from-test-feedback に統合
```

**オプションB: 凍結**
```bash
# ui-enhancements を一時凍結（将来のバックログへ）
```

**推奨:** オプションB（凍結）
- `polish-ui-from-test-feedback` は具体的なテスト結果ベース
- `ui-enhancements` は曖昧で優先度が不明確
- 凍結して、必要に応じて個別Issueに分割

**期待効果:**
- アクティブ変更: 5件 → 4件

---

## 統合後の優先順位

### 高優先度（中期ロードマップ対応）

1. **add-modular-ui-wiki-nodegraph** (0/19+21=40 tasks)
   - Wiki + ノードグラフ + モジュラーUI
   - 中期ロードマップ「Wiki機能強化」に対応
   - 工数: 大（10-14日）

2. **graphic-novel-font-decoration** (0/19 tasks)
   - グラフィックノベル機能
   - 中期ロードマップ「グラフィックノベル機能」に対応
   - TASK_054と連携
   - 工数: 中（7-10日）

3. **hud-customization-enhancement** (0/14 tasks)
   - HUDカスタマイズ
   - 中期ロードマップ「HUDカスタマイズ強化」に対応
   - 工数: 中（5-7日）

### 中優先度

4. **polish-ui-from-test-feedback** (0/18 tasks)
   - テストフィードバックベースのUI改善
   - E2Eテスト改善と連携
   - 工数: 中（5-7日）

### 凍結候補

5. **ui-enhancements** (0/24 tasks)
   - 一般的なUI強化
   - スコープが曖昧
   - **推奨:** 凍結し、個別Issueに分割

---

## 実施計画

### Phase 1: 統合作業（今日）

1. ✅ `story-wiki-implementation` の内容を確認
2. ✅ `add-modular-ui-wiki-nodegraph` と比較
3. ⏭️ 重複排除・統合
4. ⏭️ `story-wiki-implementation` 削除

### Phase 2: 凍結作業（今日）

1. ⏭️ `ui-enhancements` を `changes/frozen/` に移動
2. ⏭️ 凍結理由をドキュメント化

### Phase 3: 優先順位確定（今週）

1. ⏭️ 統合後の4件について、実装順序を決定
2. ⏭️ ロードマップと整合性確認
3. ⏭️ 最優先の1件を着手可能状態に

---

## 期待効果

**Before:**
- アクティブ変更: 6件
- 総タスク数: 115件
- 重複あり、優先度不明確

**After:**
- アクティブ変更: 4件
- 総タスク数: 91件（統合により削減）
- 優先度明確、ロードマップと整合

**品質向上:**
- Wiki仕様の一元化
- 重複作業の回避
- 明確な実装順序

---

## 次のステップ

1. ✅ 本トリアージ分析完了
2. ⏭️ Wiki統合の実施
3. ⏭️ ui-enhancements 凍結
4. ⏭️ 統合後の変更をコミット
5. ⏭️ ロードマップ更新

## 参照

- `docs/ROADMAP_2026_Q1.md` - 中期ロードマップ
- `openspec/AGENTS.md` - OpenSpec運用ガイド
- `docs/BACKLOG.md` - 機能実装状況
