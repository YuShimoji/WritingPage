# Project Context

## このファイルの位置づけ

日々の事実関係（セッション・検証コマンド）は [`docs/CURRENT_STATE.md`](CURRENT_STATE.md) の Snapshot と**ドキュメント地図**を見る。本ファイルは長命メモ・IDEA ラベル・暗黙仕様の補助に限定する。

---

## PROJECT CONTEXT

- プロジェクト名: Zen Writer (WritingPage)
- 環境: Node.js v22 / Playwright E2E / Electron v35
- ブランチ戦略: trunk-based (main のみ)
- 現フェーズ: β (v0.3.32)
- 直近の状態: **`docs/CURRENT_STATE.md` の Snapshot を参照**（ここではセッション番号を固定記載しない）

### 運用メモ

- session 110: SectionsNavigator の chapterMode virtual 統合は **章 id (`_chapterId`) 基準**。同名章は実見出しとの貪欲マッチ後にのみ virtual を追加する方針を `INVARIANTS` に固定済み。
- 実用の小説執筆ツール。ポートフォリオではなく実際に使うツール
- 過去のセッション列挙は [`archive/session-history.md`](archive/session-history.md) を履歴参照に限定し、現在判断は `CURRENT_STATE` を見る
- EPUB: スコープ外 (2026-03-23 除外決定)

---

## 開発軸・次スライス（概要）

- **主軸**: SP-081 は完了。現在は WP-001（UI 磨き上げ）と WP-004（Reader-First WYSIWYG）が並走しやすい構造。詳細は `CURRENT_STATE` の Snapshot と優先課題表
- **次スライス**: [`docs/ROADMAP.md`](ROADMAP.md) の「次スライス候補」と [`docs/USER_REQUEST_LEDGER.md`](USER_REQUEST_LEDGER.md) で選ぶ
- **今ここで避けるべき脱線**: 新規大型機能、コンテンツ生成系機能、OAuth/Electron配布

---

## FINAL DELIVERABLE IMAGE

- 最終成果物: ブラウザ/Electron で動く小説執筆エディタ。ガジェットによるモジュラー拡張。WYSIWYG + Markdown + Reader の多モード体験
- 最終的なユーザーワークフロー: `docs/WRITING_PIPELINE.md` で定義済み (7段階: 起動→執筆→構造化→装飾→プレビュー→出力→保存)。Q1-Q3解決済み。EPUB/DOCX除外済み
- 受け入れ時の使われ方: ユーザー自身が日常の執筆ツールとして使用
- 現時点で未確定な要素:
  - WP-001 の次スライスはユーザー要望トリガー。WP-004 は ROADMAP の候補から 1 トピック選定

---

## DECISION LOG

-> 旧 `CLAUDE.md` の Decision Log は廃止。現在判断に効く決定は `INVARIANTS.md` / `USER_REQUEST_LEDGER.md` / `CURRENT_STATE.md` に分担する。

---

## IDEA POOL

実装の優先順・具体トピックは **`ROADMAP.md` / `USER_REQUEST_LEDGER.md`** で追う。下表は長命のラベル・領域分類用。

| ID | アイデア | 状態 | 関連領域 | 再訪トリガー |
| ---- | -------- | ---- | -------- | ------------ |
| WP-001 | 執筆ワークフロー統合仕様 → **UI磨き上げ・摩擦軽減** | **着手中** | Experience Slice | ユーザー要望・`CURRENT_STATE` の WP-001 行 |
| WP-002 | ガジェット整理 (33→27完了、追加統合は今後検討) | **done** | UI | session 19で6ガジェット削除/無効化 |
| WP-003 | デザイナーパイプライン仕様策定 | **done** | Authoring | WRITING_PIPELINE.md 完成。Q1-Q4 全解決 (2026-03-23) |
| WP-004 | Reader-First WYSIWYG (書く画面=読む画面) | **着手中** | Architecture | Phase 1–3 進捗は `CURRENT_STATE`・`INTERACTION_NOTES.md` |
| WP-005 | プレビュー・比較ツール再設計 (edit-preview 廃止→リッチプレビュー化→比較ツール隔離) | **方針確定** | Architecture | session 94 で 3 スライス計画合意。`USER_REQUEST_LEDGER` の WP-005 行 |

---

## 暗黙仕様・長命メモ（補助）

[`INVARIANTS.md`](INVARIANTS.md) と重複しうるが、オンボーディング用にここに残した運用メモ。

- chapterModeは全ドキュメントで自動適用 (ensureChapterMode)
- 章追加は Store.createChapter() 経路のみ。エディタ直接テキスト挿入は禁止
- setUIMode が全モード切替の単一入口。直接 setAttribute は禁止
- hidden ui-mode-select は完全削除済み。コマンドパレットは mode-switch-btn.click() 経由
- サイドバー開閉は toggleSidebar() → s.sidebarOpen に永続化。setUIMode Normal復帰時に復元
- エッジグローはFocusモードのみ。CSS クラス方式: --near (近接 0.5) / --flash (フラッシュ 0.4)。JS は style.opacity を直接操作しない
- swiki-open-entry イベントは entryId と title の両方を受付 (title→entryId 自動変換)
- 再生オーバーレイ表示中の wikilink クリックはポップオーバー表示 (サイドバーは開かない)
- `[[` 入力補完は Normal モードのみ (Focus ではテキスト排除原則に準拠し非表示)
- リッチ編集表示（`editor-wysiwyg.js`）でアニメーション/テクスチャが即時適用 (WP-004 Phase 1)
- フローティングツールバーは再生オーバーレイ表示中も非表示
- WYSIWYG TB の縦書き/テキストエディタ切替はオーバーフローメニュー経由

### 設計経緯メモ（エッジグロー）

- 当初: ベースライン opacity 0.15 + mousemove で連続的 opacity 計算
- 問題: (1) ダークテーマ上で視認困難 (2) CSS transition 0.3s と毎フレーム style 上書きが干渉し不安定 (3) 上部/左部の検知範囲が非対称 (120px/80px) で挙動が不統一 (4) dismissGlows→hideEdge後にグロー残留
- 最終形: CSS クラス切替 (--near/--flash) に一本化。JS は近接判定のみ。検知範囲 200px 統一

---

## DECISION LOG ADDENDUM (2026-04-02)

- WYSIWYG フローティングツールバーのボタン数削減方針: 使用頻度の低い縦書き/テキストエディタ切替をオーバーフローメニューに移動。B/I/U/S/Link/Ruby/Kenten/Heading/List/Quote は常時表示を維持
- 既存の wysiwyg-dropdown パターンを再利用し、Documents ガジェットの独自 overflow 実装ではなくツールバー内統一パターンを採用
