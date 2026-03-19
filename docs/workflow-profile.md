# workflow-profile.md — Zen Writer (WritingPage)

> 最終更新: 2026-03-19

---

## Active Profile

**profile**: `ux-storytelling`
（UI/UX磨き + 表現力拡張の複合フェーズ。実際に使うツールとしての品質向上が主目的）

---

## インライン値（profile 重要値の展開）

| 値 | 設定 | 理由 |
|----|------|------|
| `creative_budget` | medium | 新規表現機能（SP-074/SP-061）と UX改善を並走。創造系1+選択肢を毎回含める |
| `delivery_bias` | medium | 成果物主軸だが基盤ブロックも許容（IndexedDB/ContentGuard等の既存基盤は完成済み） |
| `infra_tolerance_blocks` | 2 | 基盤作業のみで2ブロック超えたら成果物に戻る |

---

## Failure Modes（このプロジェクトで過去に発生した停滞パターン）

- **タイポグラフィ設定の散在**: 各ガジェットが個別に inline style を持ち、CSS変数が使われない → CSS変数 (--accent-color 等) を徹底使用
- **WYSIWYG/textarea の二重管理**: contenteditable と textarea の値が乖離してデータ消失 → ContentGuard API 経由で統一
- **E2Eなしで done 宣言**: 受け入れ基準未確認のまま実装完了扱い → VERIFY フェーズで手動確認リストを必ず出す
- **プロファイル適用順序の不明確**: theme→typography→layout の適用順が不定になり反映漏れ → applyXxx 呼び出し順を typography-pack.js で固定

---

## Override（一時的な優先変更）

（現在なし）

---

## 主軸レーン

1. **Typography 進化トラック** (Priority B-3): SP-061(60%) → 完成後 SP-074 Phase 5 へ
2. **チャプター管理UX** (Priority A, SP-079): 調査完了 → 次セッションで実装着手
3. **Web小説演出** (SP-074, 75%): Phase 5 SE → Phase 6 ジャンルプリセット

---

## Not-Done-If チェックリスト

- [ ] パック適用後にリロードして設定が消えていたら未完成
- [ ] ボタンが `is-active` を更新しなかったら未完成
- [ ] テーマ変更後にパックボタンの色が壊れていたら未完成（CSS変数未使用）
