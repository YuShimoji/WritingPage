# project-context.md — Zen Writer (WritingPage)

> 最終更新: 2026-03-19 / session 13

---

## CURRENT SLICE

**SP-061 Phase 1 — Typography Pack ワンクリック適用**
- 成功状態: VisualProfile ガジェットに「作業シーン」ボタン群が表示され、4パックのいずれかをクリックすると fontFamily / fontSize / lineHeight / micro / heading / ruby が一括変更される
- 到達状態: **実装完了・VERIFY待ち**
  - `js/typography-pack.js` 新規 (4パック定義 + applyTypographyPack)
  - `js/gadgets-visual-profile.js` に作業シーンセクション追加
  - `css/style.css` に `.vp-pack-btn` スタイル追加
  - `index.html` に script タグ追加
  - `docs/spec-index.json` SP-061: todo(10%) → partial(60%)
- 残フェーズ: E2E追加 / ユーザー定義パック / Visual Profile 本体への typographyPack フィールド統合

---

## DELIVERY TRACKER

| 成果物 | 位相 | 状態 | 証跡 | 次のボトルネック |
|--------|------|------|------|----------------|
| Typography Pack (SP-061) | 実装中 | 🟢進行中 | js/typography-pack.js + gadgets-visual-profile.js | 手動確認 → E2E追加 |
| Web小説演出統合 (SP-074) | 実装中 | 🟢進行中 | Phase 1-4完了, E2E 20件 | Phase 5: SE (MediaManager.js) |
| Wiki リンク検出 (SP-050) | 実装中 | 🟢進行中 | findUnlinkedMentions 実装済み | 形態素解析のみ残 (95%) |
| チャプター管理UX (SP-079) | 調査済み | 🟡停滞 | docs/specs/spec-chapter-ux-issues.md | Phase 1実装着手 |
| Visual Profile (SP-012) | 実装中 | 🟡停滞 | visual-profile.js Phase A+B | SP-061統合後に次フェーズ |

---

## DECISION LOG

| 日付 | 決定事項 | 理由 |
|------|----------|------|
| 2026-03-19 | SP-061 Phase 1: Typography Pack は ZenWriterTheme 既存 API に委譲し差分マージ保存に任せる | 新規保存レイヤ不要。各値が自然にlocalStorageに残るため後方互換ゼロコスト |
| 2026-03-19 | SP-061 UI: VisualProfile ガジェット内上部に「作業シーン」セクションとして追加 | 既存導線（VisualProfile）に同居させることで操作コンテキストを統一。Typography ガジェットは詳細調整用として分離を維持 |
| 2026-03-19 | SP-061 パックボタンは CSS クラス `vp-pack-btn` / `is-active` で管理 | inline style 乱立を防ぎ、テーマ変数 (--accent-color 等) を正しく参照させるため |

---

## MICRO-SPEC LOG

### Promoted (今セッション)
- SP-061 Phase 1 実装仕様 → `docs/specs/spec-visual-profile-typography-pack.md` 更新対象（次セッションで実施）

### Pending
- (なし)

---

## IDEA POOL

- SP-061 Phase 2: ユーザー定義パック（現在の設定を名前付きで保存）
- SP-061 Phase 3: Visual Profile 本体の `typographyPack` フィールド統合（プロファイル保存時に現在のパックIDも含める）
- SP-074 Phase 5: SE (効果音) — MediaManager.js 新設 — Web Audio API / ローカルファイル対応
- SP-074 Phase 6: ジャンルプリセット (ADV風/Web小説風/ホラー風/ポエム風) — SP-061 パックとの連携も検討
- SP-079 チャプター管理UX: 具体的な改善リスト → `docs/specs/spec-chapter-ux-issues.md` に仕様化済み

---

## CURRENT LANE

- **主レーン**: Priority B — 表現力拡張 (Typography 進化トラック)
- **副レーン**: Priority A — チャプター管理UX改善 (SP-079)
- **次候補スライス**:
  1. SP-061 Phase 1 手動確認 + E2E → done 確定
  2. SP-074 Phase 5 SE (MediaManager.js)
  3. SP-079 チャプターUX Phase 1 実装
