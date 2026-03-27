# Runtime State — Zen Writer

> 最終更新: 2026-03-27 session 28

## 現在位置

- プロジェクト: Zen Writer (WritingPage)
- バージョン: v0.3.29
- ブランチ: main
- セッション: 28
- 主レーン: Advance + Bugfix (SP-073 Phase 4 + WYSIWYG バグ修正)
- スライス: SP-073 Phase 4 フリーハンド描画 + WYSIWYG ツールバーバグ修正

---

## カウンター

| 指標 | 値 | 前回 |
| ---- | --- | ---- |
| セッション番号 | 28 | 27 |
| ガジェット数 | 28 | 28 |
| spec-index エントリ | 55 | 54 |
| spec done | 42 | 41 |
| spec partial | 1 (SP-005) | 2 |
| spec removed | 11 | 11 |
| superseded | 1 | 1 |
| JS impl ファイル | 107 | 107 |
| CSS ファイル | 4 | 4 |
| E2E spec ファイル | 63 | 65 |
| E2E passed | 542 | 535 |
| E2E failed | 0 | 0 |
| E2E skipped | 3 | 3 |
| 検証spec | 0 | 13 |
| TODO/FIXME/HACK | 0 | 0 |
| mock ファイル | 0 | 0 |

---

## 量的指標 (GPS)

| 指標 | 値 |
| ---- | --- |
| 体験成果物 | 88% |
| 基盤 | 92% |
| 残 partial | SP-005(75%) |
| IDEA POOL open | 1 (WP-001 hold → トリガー成立) |
| IDEA POOL done | 2 (WP-002, WP-003) |
| 設計課題 open | 0 (Q1-Q4 全解決) |
| ビジュアル監査 open | V-2/V-3/V-4: 解消見込み (session 26 Visual Audit で新規問題なし) |

---

## ビジュアル監査追跡

| 指標 | 値 |
| ---- | --- |
| blocks_since_visual_audit | 0 (session 28 で実施) |
| last_visual_audit_path | docs/verification/2026-03-27/ (50枚, 2026-03-27) |
| visual_evidence_status | fresh |

---

## 自己診断カウンター

| 診断項目 | 連続数 |
| --------- | ------- |
| Q4 No (成果物未前進) | 0 (JSON保存+フォーカスモード改善で前進) |
| Q6a No (基盤未獲得) | 0 (JSON保存/読込基盤) |
| Q6b No (ユーザー可視変化なし) | 0 (フォーカスモードUI変更、JSON保存/読込ボタン) |
| 保守モード連続 | 0 (Advance 実施) |

---

## Session 28 実施内容

### SP-073 Phase 4 フリーハンド描画 (Advance)
- PathHandleOverlay.js: RDP簡略化 + Catmull-Rom→ベジェ近似アルゴリズム追加
- PathHandleOverlay.js: enterDrawingMode / exitDrawingMode / isDrawing API 追加
- editor-wysiwyg.js: コンテキストメニューに「フリーハンド描画」ボタン追加
- css/style.css: .zw-pathtext-drawing ポリラインスタイル追加
- spec-path-text.md: Phase 4 仕様記述追加、ステータス done/100% に更新
- spec-index.json: SP-073 done/100%
- E2E: pathtext-handles 20→27件 (Phase 4 新規7件)

### WYSIWYG バグ修正 (Bugfix)
- editor-wysiwyg.js: 見出し(H1-H3)/段落/引用を formatBlock コマンドに修正
- editor-wysiwyg.js: リスト(UL/OL)を insertUnorderedList/insertOrderedList に修正
- css/style.css: ツールバー overflow-x:auto → overflow:hidden + flex-wrap:wrap
- index.html + editor-wysiwyg.js: textarea モード「リッチテキストに戻る」バナー追加
- editor-wysiwyg.js: ルビ挿入後カーソルを ruby 外側に配置、ポップアップ閉じ後にエディタ focus 復帰

### dock-preset.spec.js 修正
- beforeEach に data-ui-mode=normal 設定追加 (focus モードデフォルト化対応)

### Visual Audit
- 50枚のスクリーンショット取得 (docs/verification/2026-03-27/)
- UIバグ5件発見 → 4件修正済み
- 未修正: 構造アコーディオン展開ループ (textarea モード時)

### 発見した共通バグパターン (docs/verification/session28-bug-patterns.md に記録)
- execCommand 直接呼び問題、CSS overflow-x:auto の不適切使用、モード切替の復帰導線欠如、contenteditable カーソル配置

---

## Session 27 実施内容

### JSON プロジェクト保存/読込 (Advance)
- storage.js: exportProjectJSON(docId) — ドキュメント+全章を zenwriter-v1 JSON 形式で保存
- storage.js: importProjectJSON(jsonString) — JSON から章構造を完全復元
- storage.js: importProjectJSONFromFile() — ファイル選択ダイアログ経由のインポート
- gadgets-documents-hierarchy.js: 「JSON保存」「JSON読込」ボタンをツールバーに追加

### フォーカスモード改善 (Advance)
- css/style.css: フォーカスモードでツールバーを非表示化 (transform+opacity、エッジホバーで復帰)
- css/style.css: 章パネルをデフォルト非表示→左エッジホバーでスライドイン
- css/style.css: editor padding-top 調整、show-toolbar-fab 非表示
- edge-hover.js: フォーカスモード時のツールバー/章パネルのエッジホバー対応
- edge-hover.js: フォーカスモード時のサイドバー開閉スキップ

### 検証
- JSON round-trip テスト: 2章のタイトル・本文が完全一致で復元
- Focus mode: opacity=0, translateY(-100%), pointer-events=none 確認
- E2E: 48 passed / 1 failed(既知Legacy) / 1 skipped (主要5スイート)

### Nightshift 追加作業
- showFullToolbar ヘルパー: data-ui-mode=normal を追加（テスト信頼性向上）
- E2E: デフォルトfocusモードに追従 (openAssistPanel, beforeEach, 個別テスト5件)
- spec-index.json: SP-080 (JSONプロジェクト保存形式) を done で追加
- Electron: メニューに JSONプロジェクト保存/読込 を追加
- electron-bridge.js: export-project-json / import-project-json ハンドラ追加

---

## Session 26 実施内容

### デッドコード根絶 (-1,121行)
- storage-idb.js: nodegraph API 3関数 + 移行コード + export削除
- sidebar-manager.js: deprecated タブ管理5メソッド削除 (addTab/removeTab/renameTab/getTabOrder/saveTabOrder)
- gadgets-editor-extras.js: 非機能タブ管理UI削除 (タブ順序/追加/名称変更/削除)
- gadgets-core.js: addTab を no-op 化
- ui-labels.js: TAB_* ラベル5件削除
- morphology.js: 裸の console.log 削除

### テスト整理
- e2e/test-ui-debug.spec.js 削除 (全skip、デバッグ専用)
- e2e/session19-verify.spec.js 削除 (一過性検証)
- tests/e2e/ ディレクトリ削除 (旧テスト、playwright config 対象外)
- e2e/visual-audit.spec.js: baseURL修正 (localhost:8080 → /index.html)
- e2e/editor-canvas-mode.spec.js: zoom テスト skip化 (Playwright環境制約)

### Visual Audit
- 20枚のスクリーンショット更新
- V-2/V-3/V-4: session 22-24 一掃で解消見込み (新規UIバグ発見なし)
- visual-audit テストの品質問題を特定 (サンプル読込/モーダル開封の不具合はテスト側)

### ドキュメント同期
- ROADMAP.md: E2E数値更新
- README.md / docs/README.md: ISSUES.md参照削除
- docs/ISSUES.md → docs/archive/ISSUES-resolved.md にアーカイブ
- GADGETS.md: 動的タブAPI記述を更新
- session25-status-matrix.md: V-1~V-5, 判断保留項目を更新

### E2E
- 542 passed / 0 failed / 3 skipped (63 spec files)
- visual-audit 20件が通過するようになった (+20)
- session固有spec 2件削除 (-13 tests)
