# Runtime State — Zen Writer

> **補助ドキュメント**: 主要指標・カウンター・自己診断用。**セッション番号・直近スライス・検証結果・「信頼できること」の正本は [`docs/CURRENT_STATE.md`](CURRENT_STATE.md) のみ。**
>
> 最終カウンター同期: 2026-04-16（`CURRENT_STATE.md` session 99 に合わせて更新）。セッション別の詳細ログは [`docs/archive/session-history.md`](archive/session-history.md)。

## 現在位置

- プロジェクト: Zen Writer (WritingPage)
- バージョン: v0.3.32
- ブランチ: main
- セッション: 99（正本は `CURRENT_STATE.md` の Snapshot）
- 主レーン: **WP-001 継続 (Phase C: 執筆モード整理)** を候補として保留。直近は Electron ビルド版 3バグ修正 + Phase B (リッチ編集改行トグル昇格) を完了。
- スライス（要約）:
  - session 97 WP-005 スライスC 完了 (比較ツール導線集約)
  - session 98 Electron 3バグ修正 (終了 hang / サイドバー初期非表示 / edge-hover 閉じ不能 / フォント過大)
  - session 99 WP-001 Phase B (リッチ編集改行トグルをコマンドパレットへ昇格)

## 次セッション再開ポイント

1. **実機検証の消化**: user が `build-new/win-unpacked/Zen Writer.exe` (2026-04-16 03:54 ビルド) を起動し Phase A/B の 6 点 (終了挙動 / サイドバー初期表示 / edge-hover 閉じる / フォントサイズ / 状態保持 / コマンドパレットのリッチ編集カテゴリ) を確認する
2. **旧 build/ ディレクトリの掃除**: `build/win-unpacked/resources/app.asar` が OS/Defender ロック残留で削除不能。**PC 再起動後** に `rm -rf build/win-unpacked` → 次回ビルドから `build/` に戻す (electron-builder 既定)
3. **Phase C 候補選定**: WP-001 執筆モード整理の 3 候補 (保存UI常設境界 / focus モードでのガジェット露出 / normal 時の補助操作導線) から 1 スライス選定
4. **検証で NG 発生時の優先修正**: zoomFactor 0.9 が違和感あれば 0.85 〜 1.0 で再調整、サイドバー既定値が違和感あれば storage.js を再検討

---

## カウンター

| 指標 | 値 | 前回 |
| ---- | --- | ---- |
| セッション番号 | 99 | 97 |
| ガジェット数 | 28 | 28 |
| spec-index エントリ | 56 | 56 |
| spec done | 44 | 44 |
| spec partial | 0 | 0 |
| spec removed | 11 | 11 |
| superseded | 1 | 1 |
| JS impl ファイル (`js/**/*.js`) | 110 | 111 |
| CSS ファイル | 4 | 4 |
| E2E spec ファイル (`e2e/*.spec.js`) | 60 | 65 |
| E2E total | 514 (session 94 実測) | 566 |
| E2E failed | （正本: `CURRENT_STATE.md` 検証節） | — |
| E2E skipped | （同上） | — |
| 検証spec | 3 (sp081-*.spec.js) | 3 |
| TODO/FIXME/HACK | 0 | 0 |
| mock ファイル | 0 | 0 |

---

## 量的指標 (GPS)

| 指標 | 値 |
| ---- | --- |
| 体験成果物 | 90% |
| 基盤 | 93% |
| 残 partial | なし (SP-005 done化) |
| IDEA POOL open | 0 (WP-001 は session 90 で closeout → 監視モード) |
| IDEA POOL done | 2 (WP-002, WP-003) |
| 設計課題 open | 0 (Q1-Q4 全解決) |
| ビジュアル監査 open | V-2/V-3/V-4: 解消見込み (session 26 Visual Audit で新規問題なし) |

---

## ビジュアル監査追跡

| 指標 | 値 |
| ---- | --- |
| blocks_since_visual_audit | 0 (session 40 で Visual Audit スクリーンショット更新) |
| last_visual_audit_path | e2e/visual-audit-screenshots/ (20枚, 2026-04-02 session 40) |
| visual_evidence_status | fresh |

---

## 自己診断カウンター

| 診断項目 | 連続数 |
| --------- | ------- |
| Q4 No (成果物未前進) | 0 |
| Q6a No (基盤未獲得) | 0 |
| Q6b No (ユーザー可視変化なし) | 0 |
| 保守モード連続 | 0 |

---

## セッション別詳細ログ

session 26〜40 台の実施内容・2026-04-06 HANDOFF メモは **[`docs/archive/session-history.md`](archive/session-history.md)** に統合移動した。session 41 以降は **`docs/CURRENT_STATE.md`** のセクションを正とする。
