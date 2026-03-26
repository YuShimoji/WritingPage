# Project Context

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.29)
- 直近の状態: session 27 — ミニマル執筆体験 + JSONプロジェクト保存 + Electron統合

### 運用メモ

- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- E2E: 542+ passed / 1 failed(既知Legacy) / 3 skipped (63 spec files)
- spec-index: 55エントリ (done 41, partial 2, removed 11, superseded 1)
- Q1/Q2/Q3/Q4 全解決済み
- ガジェット: 28個登録
- EPUB: スコープ外 (2026-03-23 除外決定)
- session 22-24 でデッドコード/CSS/API/ドキュメント不整合を一掃 (-5,957行)
- session 25: SP-076 done確認、レガシー最終掃除、包括調査表作成
- session 26: デッドコード根絶(-1,121行)、deprecated API削除、Visual Audit実施、V-2/V-3/V-4解消見込み
- session 27: JSONプロジェクト保存(zenwriter-v1形式)、フォーカスモードデフォルト化、Electron JSON保存メニュー、SP-080追加

---

## CURRENT DEVELOPMENT AXIS

- 主軸: ミニマル執筆体験の深化 + WP-001 再訪
- この軸を優先する理由: JSONプロジェクト保存+フォーカスモードデフォルト化で基盤完成。執筆ワークフロー統合(WP-001)の具体化が次の焦点
- 今ここで避けるべき脱線: スコープ外項目の復活、新規大型機能の追加

---

## CURRENT LANE

- 主レーン: Advance (ミニマル執筆体験)
- 副レーン: なし
- 今このレーンを優先する理由: JSONプロジェクト保存+フォーカスモード改善完了。次は実使用フローの深化
- いまは深入りしないレーン: Excise (一掃済み)、追加テスト

---

## CURRENT SLICE

- スライス名: Minimal Writing + JSON Save (session 27 完了)
- 成功状態: JSON保存/読込実装済み + フォーカスモードデフォルト化 + Electron統合
- 前提: SP-080 done。次セッションで WP-001 再訪 or 執筆体験の深化

---

## FINAL DELIVERABLE IMAGE

- 最終成果物: ブラウザ/Electron で動く小説執筆エディタ。ガジェットによるモジュラー拡張。WYSIWYG + Markdown + Reader の多モード体験
- 最終的なユーザーワークフロー: `docs/WRITING_PIPELINE.md` で定義済み (7段階: 起動→執筆→構造化→装飾→プレビュー→出力→保存)。Q1-Q3解決済み。EPUB/DOCX除外済み
- 受け入れ時の使われ方: ユーザー自身が日常の執筆ツールとして使用
- 現時点で未確定な要素:
  - SP-073 Phase 4 フリーハンド描画の仕様 (未策定)
  - WP-001 執筆ワークフロー統合の方向性

---

## DECISION LOG

-> CLAUDE.md の DECISION LOG を参照

---

## IDEA POOL

| ID | アイデア | 状態 | 関連領域 | 再訪トリガー |
| ---- | -------- | ---- | -------- | ------------ |
| WP-001 | 執筆ワークフロー統合仕様 (SP-053後継) | hold → **トリガー成立** | Experience Slice | SP-076 done (session 25 確認) |
| WP-002 | ガジェット整理 (33→27完了、追加統合は今後検討) | **done** | UI | session 19で6ガジェット削除/無効化 |
| WP-003 | デザイナーパイプライン仕様策定 | **done** | Authoring | WRITING_PIPELINE.md 完成。Q1-Q4 全解決 (2026-03-23) |

---

## HANDOFF SNAPSHOT

- 現在の主レーン: Advance (ミニマル執筆体験)
- 現在のスライス: Minimal Writing + JSON Save (session 27 完了)
- 今回 (session 27) の変更:
  - JSONプロジェクト保存/読込 (zenwriter-v1形式): storage.js + gadgets-documents-hierarchy.js
  - フォーカスモードデフォルト化: storage.js DEFAULT_SETTINGS + index.html head + app.js 自動フォーカス
  - フォーカスモードUI改善: ツールバー非表示(エッジホバー復帰) + 章パネル左エッジスライドイン
  - Electron統合: メニューにJSONプロジェクト保存/読込 + electron-bridge.jsハンドラ
  - spec-index.json: SP-080追加 (done/100%)
  - E2Eテスト修正: デフォルトfocusモード追従 (13テスト修正)
- 次回最初に確認すべきファイル:
  - index.html をブラウザで開いてフォーカスモードの見え方確認
  - 章パネルの左エッジホバー動作確認
  - JSON保存→読込のフロー確認
- 未確定の設計論点:
  - WP-001 方向性 (HUMAN_AUTHORITY)
  - Google Keep連携の是非 (以前スコープ外に除外、ユーザーが再要望)
  - 保存状態スナップショットの仕様
- 今は触らない範囲: 追加クリーンアップ
- 次回推奨:
  - [Audit] Visual Audit — フォーカスモードの見え方確認 (visual_evidence_status: stale)
  - [Advance] ファイルドロップでの.zwp.jsonインポート
  - [Unlock] WP-001 再訪 (トリガー成立)
