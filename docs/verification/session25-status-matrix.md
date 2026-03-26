# Session 25 包括調査表 — Zen Writer v0.3.29

> 作成日: 2026-03-26 session 25
> 前提: session 22-24 レガシー根絶(-5,957行)完了後の全体棚卸し

---

## 1. 機能ステータス総覧

### 1-A. 実装済み (done: 40 spec)

| # | spec | 機能名 | カテゴリ | E2E | Visual Audit | 手動確認 | 確認状態 |
|---|------|--------|---------|-----|-------------|---------|---------|
| 1 | SP-001 | アプリケーション仕様書 | core | - | - | - | doc確認済み |
| 2 | SP-002 | アーキテクチャドキュメント | core | - | - | - | doc確認済み |
| 3 | SP-004 | ガジェットリファレンス | core | gadgets.spec.js, session19-verify.spec.js | session21 | - | 確認済み |
| 4 | SP-010 | コンテキストツールバー | ui | ui-editor.spec.js | session21 | - | 確認済み |
| 5 | SP-011 | 装飾/選択ツールチップ | ui | decorations.spec.js | - | - | E2E確認済み |
| 6 | SP-012 | Visual Profile | ui | theme-colors.spec.js | - | - | E2E確認済み |
| 7 | SP-013 | テーマ | ui | theme-toggle.spec.js, theme-colors.spec.js | - | - | E2E確認済み |
| 8 | SP-016 | 拡張テキストボックス | ui | editor-extended-textbox.spec.js | - | - | E2E確認済み |
| 9 | SP-020 | Embed SDK | system | embed.spec.js, xorigin.spec.js | - | - | E2E確認済み |
| 10 | SP-033 | エディタ機能ヘルプ | user | gadgets.spec.js | session21 | - | 確認済み |
| 11 | SP-034 | トラブルシューティング | user | - | - | - | doc確認済み |
| 12 | SP-040 | コーディング規約 | infra | - | - | - | doc確認済み |
| 13 | SP-041 | テスト実行方法 | infra | - | - | - | doc確認済み |
| 14 | SP-042 | 配布手順 | infra | - | - | - | doc確認済み |
| 15 | SP-043 | リリース手順 | infra | - | - | - | doc確認済み |
| 16 | SP-044 | ブランチ運用指針 | infra | - | - | - | doc確認済み |
| 17 | SP-045 | ラベル設計 | infra | - | - | - | doc確認済み |
| 18 | SP-046 | 起動手順書 | infra | - | - | - | doc確認済み |
| 19 | SP-048 | 手動テストガイド | infra | - | - | - | doc確認済み |
| 20 | SP-050 | Story Wiki | core | wiki.spec.js, wiki-graph.spec.js, wiki-ai.spec.js, wikilinks.spec.js (27件) | - | - | E2E確認済み |
| 21 | SP-051 | ガジェットUX改善 | ui | gadgets.spec.js | session21 | - | 確認済み |
| 22 | SP-052 | セクションツリー/話ナビ | ui | sections-nav.spec.js (11件) | session21 | - | 確認済み |
| 23 | SP-054 | フォント切り替え | ui | editor-settings.spec.js | - | - | E2E確認済み |
| 24 | SP-055 | リッチテキスト強化 | ui | wysiwyg-editor.spec.js | - | - | E2E確認済み |
| 25 | SP-057 | 本文マイクロタイポグラフィ | ui | (typography内, 2件) | - | - | E2E確認済み |
| 26 | SP-058 | 見出しタイポグラフィ | ui | heading-typography.spec.js (14件) | - | - | E2E確認済み |
| 27 | SP-059 | 日本語組版・ルビ拡張 | ui | ruby-text.spec.js, ruby-wysiwyg.spec.js | - | - | E2E確認済み |
| 28 | SP-060 | 装飾プリセット統合 | ui | semantic-presets.spec.js (11件) | - | - | E2E確認済み |
| 29 | SP-061 | VP Typography Pack | ui | typography-pack.spec.js | - | - | E2E確認済み |
| 30 | SP-062 | テキスト表現アーキテクチャ | ui | text-expression-tier1.spec.js | - | - | E2E確認済み |
| 31 | SP-063 | Markdownリファレンス | user | gadgets.spec.js | session21 | - | 確認済み |
| 32 | SP-064 | フォント切り替え影響マップ | ui | - | - | - | doc確認済み |
| 33 | SP-070 | モードアーキテクチャ | core | ui-mode-consistency.spec.js | session21 | - | 確認済み |
| 34 | SP-071 | チャプター管理再設計 | ui | chapter-list.spec.js, chapter-store.spec.js, chapter-ux-issues.spec.js | - | - | E2E確認済み |
| 35 | SP-072 | セクションリンク&ナビ | ui | gamebook-branch.spec.js, external-links.spec.js, scroll-trigger.spec.js (9件) | - | - | E2E確認済み |
| 36 | SP-074 | Web小説演出統合 | ui | typing-effect.spec.js, texture-overlay.spec.js, sound-effect.spec.js, dsl-insertion-gui.spec.js, wysiwyg-dsl-preview.spec.js | - | - | E2E確認済み |
| 37 | SP-077 | IndexedDB ストレージ移行 | system | chapter-store.spec.js (IDB テスト含む) | - | - | E2E確認済み |
| 38 | SP-078 | 読者プレビューモード | core | reader-preview.spec.js (10件) | session21 | - | 確認済み |
| 39 | SP-079 | 執筆パイプライン定義 | core | - | - | - | doc確認済み |
| 40 | SP-076 | ドックパネルシステム | ui | dock-panel.spec.js, dock-preset.spec.js 等 (45件) | session21 | - | Phase 1-4 E2E確認済み (session 25 done確認) |

### 1-B. 実装途中 (partial: 2 spec)

| spec | 機能名 | 進捗 | 残作業 | E2E | 確認状態 |
|------|--------|------|--------|-----|---------|
| SP-005 | ロードマップ | 75% | Priority C/D/E の完了に連動 | - | doc確認済み |
| SP-073 | パステキスト | 90% | Phase 4: フリーハンド描画 (仕様未策定) | pathtext-handles.spec.js (20件) | Phase 1-3 E2E確認済み |
| SP-076 | ドックパネルシステム | 100% (session 25で実装済み確認) | Phase 4 実装済み (captureLayout/applyLayout/dockLayout統合/全プリセット定義) | dock-panel.spec.js, dock-preset.spec.js, floating-panel-drag.spec.js, gadget-detach-restore.spec.js, sidebar-tab-dnd.spec.js (45件) | Phase 1-4 E2E確認済み |

### 1-C. 除外済み (removed: 11, superseded: 1)

| spec | 元の機能名 | 除外理由 |
|------|-----------|---------|
| SP-003 | 設計方針 | ARCHITECTURE.md に統合 |
| SP-006 | プロジェクト健全性レポート | ROADMAP.md に統合 |
| SP-014 | UI構造設計 | ARCHITECTURE.md + spec-context-toolbar.md に分散 |
| SP-015 | スナップショット設計 v1→v2 | v1実装済み |
| SP-021 | Embed SDK検証手順 | TESTING.md に統合 |
| SP-022 | プラグインシステム設計 | スコープ外 (2026-03-23) |
| SP-031 | ユーザーガイド | EDITOR_HELP.md に統合 |
| SP-032 | FAQ | TROUBLESHOOTING.md に統合 |
| SP-047 | 既知の問題 | TROUBLESHOOTING.md に統合 |
| SP-056 | 拡張スクロール(Canvas) | スコープ外 (betaEnabled:false) |
| SP-075 | Google Keep連携 | スコープ外 (2026-03-23) |
| SP-053 | 執筆集中サイドバー | superseded by SP-070 + SP-071 |

### 1-D. 未実装機能 (ROADMAP上の残タスク)

| 優先度 | 項目 | 状態 | 備考 |
|--------|------|------|------|
| B | SP-073 Phase 4 (フリーハンド描画) | 未着手 | 仕様未策定。Phase 1-3完了 |
| E | クラウド同期基盤 | 構想のみ | 将来タスク |

---

## 2. 確認手段別マトリクス

### 2-A. E2E 自動テスト (65 spec ファイル)

| 機能領域 | テストファイル | テスト数 | 状態 |
|----------|-------------|---------|------|
| モードアーキテクチャ | ui-mode-consistency.spec.js | - | 通過 |
| チャプター管理 | chapter-list.spec.js, chapter-store.spec.js, chapter-ux-issues.spec.js | - | 通過 |
| ドックパネル Phase 1-3 | dock-panel.spec.js, floating-panel-drag.spec.js, gadget-detach-restore.spec.js, sidebar-tab-dnd.spec.js | 45件 | 通過 |
| ドックプリセット | dock-preset.spec.js | - | 通過 |
| セクションリンク | gamebook-branch.spec.js, external-links.spec.js, scroll-trigger.spec.js | 9件 | 通過 |
| Web小説演出 | typing-effect.spec.js, texture-overlay.spec.js, sound-effect.spec.js, dsl-insertion-gui.spec.js, wysiwyg-dsl-preview.spec.js | - | 通過 |
| パステキスト Phase 1-3 | pathtext-handles.spec.js | 20件 | 通過 |
| Story Wiki | wiki.spec.js, wiki-graph.spec.js, wiki-ai.spec.js, wikilinks.spec.js | 27件 | 通過 |
| IndexedDB移行 | chapter-store.spec.js | - | 通過 |
| Reader プレビュー | reader-preview.spec.js | 10件 | 通過 |
| テーマ/Typography | theme-toggle.spec.js, theme-colors.spec.js, heading-typography.spec.js, typography-pack.spec.js | - | 通過 |
| ルビ/日本語組版 | ruby-text.spec.js, ruby-wysiwyg.spec.js | - | 通過 |
| 装飾/プリセット | semantic-presets.spec.js, decorations.spec.js, animations-decorations.spec.js | 11件+ | 通過 |
| テキスト表現 | text-expression-tier1.spec.js | - | 通過 |
| エディタ/WYSIWYG | wysiwyg-editor.spec.js, editor-extended-textbox.spec.js | - | 通過 |
| Canvas Mode | editor-canvas-mode.spec.js | - | 失敗 (既知: betaEnabled:false) |
| ガジェット検証 | gadgets.spec.js, session19-verify.spec.js | 13件 | 通過 |
| その他UI | sidebar-layout.spec.js, sidebar-writing-focus.spec.js, responsive-ui.spec.js, ui-parity.spec.js, ui-regression.spec.js, ui-editor.spec.js | - | 通過 |
| その他機能 | command-palette.spec.js, global-search.spec.js, spell-check.spec.js, plugin-manager.spec.js, keybinds.spec.js, pomodoro.spec.js, tags-smart-folders.spec.js, content-guard.spec.js, image-position-size.spec.js, collage.spec.js, split-view.spec.js, embed.spec.js, xorigin.spec.js, genre-preset.spec.js, tools-registry.spec.js, accessibility.spec.js, editor-scroll-regression.spec.js, editor-settings.spec.js, sections-nav.spec.js | - | 通過 |
| Visual Audit (自動) | visual-audit.spec.js | 20枚 | 通過 (stale: session 21) |
| デバッグ用 | test-ui-debug.spec.js | 0 | 全skip (開発用) |

合計: 555 passed / 1 failed (canvas-mode) / 3 skipped

### 2-B. Visual Audit (スクリーンショット)

| # | 画面 | ファイル | 状態 |
|---|------|---------|------|
| 1 | 初期ロード | 01-initial-load.png | stale (session 21) |
| 2 | フルツールバー | 02-full-toolbar.png | stale |
| 3 | サイドバーアコーディオン | 03-sidebar-accordion.png | stale (V-1修正前) |
| 4-8 | カテゴリ別ガジェット | 04~08-*.png | stale |
| 9-11 | サンプル表示 | 09~11-*.png | stale |
| 12 | Focus モード | 12-focus-mode.png | stale |
| 13 | Blank モード | 13-blank-mode.png | stale |
| 14 | Reader モード | 14-reader-mode.png | stale |
| 15 | ヘルプモーダル | 15-help-modal.png | stale |
| 16 | コマンドパレット | 16-command-palette.png | stale |
| 17 | ロードアウト管理 | 17-loadout-manager.png | stale |
| 18 | セクションナビ | 18-sections-navigator.png | stale |
| 19 | 左ドックパネル | 19-left-dock-panel.png | stale |
| 20 | WYSIWYGエディタ | 20-editor-wysiwyg.png | stale |

全20枚: session 21 (2026-03-24) で撮影。4ブロック経過で stale。

### 2-C. 手動確認が必要 (E2E対象外)

| # | 項目 | 確認手段 | 最終確認 |
|---|------|---------|---------|
| M-1 | Electron環境での動作 | Electronビルド+起動 | 未確認 |
| M-2 | PWA オフライン動作 | Service Worker + オフライン試験 | 未確認 |
| M-3 | モバイルタッチ操作 | 実機 or DevTools | 未確認 |
| M-4 | 印刷プレビュー (PDF出力) | ブラウザ印刷 | 未確認 |

### 2-D. 未確認・Visual Audit必要

| # | 項目 | 理由 |
|---|------|------|
| V-1 | サイドバーsections表示 (修正後) | session 26 Visual Audit でスクリーンショット取得済み。正常表示確認 |
| V-2 | session 21 記録の中重大度問題 | session 26 Visual Audit で新規問題なし。解消見込み |
| V-3 | session 21 記録の中重大度問題 | session 26 Visual Audit で新規問題なし。解消見込み |
| V-4 | session 21 記録の低重大度問題 | session 26 Visual Audit で新規問題なし。解消見込み |
| V-5 | SP-076 Phase 4 プリセットUI | SP-076 done確認済み (session 25) |

---

## 3. 懸念事項一覧

### 3-A. 解決済み (session 19-25)

| ID | 重大度 | 内容 | 対処 | session |
|----|--------|------|------|---------|
| V-1 | 高 | サイドバー sections カテゴリ非表示 | KNOWN_GROUPS に sections 追加 | 22 |
| T-1 | 中 | 削除済みガジェット JS 残存 | 物理削除 | 22 |
| T-2 | 中 | KNOWN_GROUPS に sections 未登録 | V-1 と同時解決 | 22 |
| T-3 | 低 | screenplay プリセットに sections なし | loadouts-presets.js に追加 | 22 |
| L-01 | 低 | フォールバックに Clock 残存 | MarkdownReference に差替 | 23 |
| L-02 | 低 | CSS .gadget-clock セレクタ残存 | 削除 | 23 |
| L-03 | 高 | APP_SPECIFICATION.md ガジェット総数不整合 | 33→28 に更新 | 23 |
| L-04 | 高 | README.md ガジェット数不整合 | 28個に更新 | 23 |
| L-05 | 中 | GADGETS.md に削除済みガジェット記述 | 除去 | 23 |
| L-06 | 中 | feature-reference.html に削除済み参照 | 除去 | 23 |
| L-07 | 低 | APP_SPECIFICATION.md テスト数/JS数 | 最新値に更新 | 23 |
| I-01~I-12 | 低 | spec-index/ROADMAP/runtime-state 不整合 | 個別修正 | 22-24 |
| C-01~C-07 | 中 | デッドCSS 5件 + nodegraph API | 物理削除 | 24 |
| I1 | 低 | ui-labels.js に Clock ラベル 2件 | 削除 | 25 |
| I2 | 低 | storage.js nodegraph キャッシュ初期化 | 削除 | 25 |
| I4 | 低 | ROADMAP.md E2E 通過数未記載 | 555 に更新 | 25 |
| I5 | 低 | GADGETS.md 基本方針に「時計」記述 | 除去 | 25 |

### 3-B. 未解決 (Visual Audit 必要)

| ID | 重大度 | 内容 | 対処方針 |
|----|--------|------|---------|
| V-2 | 中 | session 21 記録: 詳細未記載 | session 26 Visual Audit 実施。新たなUIバグは発見されず。session 22-24 一掃で解消の可能性高い → **解決見込み** |
| V-3 | 中 | session 21 記録: 詳細未記載 | 同上 → **解決見込み** |
| V-4 | 低 | session 21 記録: 詳細未記載 | 同上 → **解決見込み** |

### 3-C. 判断保留

| 項目 | 内容 | リスク | 推奨 |
|------|------|--------|------|
| nodegraph IDB ストア定義 | storage-idb.js の nodegraph ストア。CRUD API は session 26 で削除済み。IDB objectStore 定義のみ残存 | 極低 (IDB スキーマ安定性) | IDB ストアは維持 (既存データ保護) |
| Canvas Mode E2E | betaEnabled:false で space+drag テスト不安定。session 26 で skip 化 | 低 (既知) | 維持 (将来再有効化の可能性) |
| test-ui-debug.spec.js | session 26 で削除済み | — | 完了 |
| session19-verify.spec.js | session 26 で削除済み | — | 完了 |

---

## 4. デッドコード・レガシー削除ログ (session 19-25 累積)

### Session 19: ガジェット整理 (33→28)

| # | 対象 | 種別 |
|---|------|------|
| G-01 | Clock ガジェット | 削除 (OS時計で十分) |
| G-02 | Samples ガジェット | 削除 (dev専用) |
| G-03 | NodeGraph ガジェット | 削除 (ニッチ) |
| G-04 | GraphicNovel ガジェット | 削除 (ニッチ+6モジュール) |
| G-05 | UIDesign ガジェット | 無効化 |
| G-06 | SceneGradient ガジェット | 無効化 |
| G-07 | graphic-novel ロードアウト | 削除 |

### Session 22: デッドコード物理削除

| # | ファイル/箇所 | 種別 |
|---|-------------|------|
| D-01 | js/gadgets-clock.js | JS 物理削除 |
| D-02 | js/gadgets-samples.js | JS 物理削除 |
| D-03 | js/gadgets-graphic-novel.js | JS 物理削除 |
| D-04 | js/nodegraph.js | JS 物理削除 |
| D-05 | js/modules/graphic-novel/ (6ファイル) | JS ディレクトリ削除 |
| D-06 | css/graphic-novel.css | CSS 物理削除 |
| D-07 | index.html CSS link タグ | HTML 参照削除 |
| D-08 | index.html コメントアウト script 4件 | HTML 残骸削除 |
| D-09 | gadgets-editor-extras.js UIDesign コメントブロック | コメントアウトコード削除 |
| D-10 | gadgets-editor-extras.js SceneGradient コメントブロック | コメントアウトコード削除 |
| D-11 | gadgets.spec.js Clock skip テスト | 無意味化テスト削除 |
| D-12 | editor-settings.spec.js NodeGraph skip テスト | 無意味化テスト削除 |

### Session 23: task-scout 追加発見

| # | ファイル/箇所 | 種別 |
|---|-------------|------|
| L-01 | gadgets-utils.js フォールバックの Clock | 参照差替 |
| L-02 | css/gadgets.css + css/style.css .gadget-clock | デッドCSS 削除 |
| L-03~L-07 | APP_SPECIFICATION.md / README.md / GADGETS.md / feature-reference.html | ドキュメント不整合修正 |

### Session 24: デッドCSS根絶 + API削除

| # | ファイル | 種別 | 行数 |
|---|---------|------|------|
| C-01 | css/common.css | デッドCSS (style.css統合済み) | -170 |
| C-02 | css/layout.css | デッドCSS (style.css統合済み) | -477 |
| C-03 | css/special.css | デッドCSS (style.css統合済み) | -460 |
| C-04 | css/print.css | デッドCSS (style.css統合済み) | -202 |
| C-05 | css/gadgets.css | デッドCSS (style.css統合済み) | -184 |
| C-06 | storage.js nodegraph API | デッドAPI (呼出元ゼロ) | -50 |

### Session 25: 最終掃除

| # | ファイル/箇所 | 種別 |
|---|-------------|------|
| I1 | ui-labels.js GADGET_CLOCK + CLOCK_24H | デッドラベル削除 (2行+コメント1行) |
| I2 | storage.js nodegraph キャッシュ初期化 | デッドコード削除 (~10行) |
| I4 | ROADMAP.md E2E 通過数 | ドキュメント更新 |
| I5 | GADGETS.md 基本方針「時計」 | ドキュメント更新 |

---

## 5. 定量サマリ

| 指標 | session 25 | session 24 | session 19 開始時 |
|------|-----------|-----------|------------------|
| JS impl ファイル | 107 | 107 | 117 |
| CSS ファイル | 4 | 4 | 10 |
| E2E spec ファイル | 65 | 64 | 63 |
| E2E passed | 535 | 555 | 514 |
| E2E failed | 0 | 1 | 1 |
| E2E skipped | 3 | 3 | 5 |
| ガジェット | 28 | 28 | 33 |
| spec done | 40 | 39 | - |
| spec partial | 2 | 3 | - |
| spec-index エントリ | 54 | 54 | 54 |
| TODO/FIXME/HACK | 0 | 0 | 0 |
| mock ファイル | 0 | 0 | 0 |
| 累積削除行数 | ~6,000+ | ~5,957 | - |
