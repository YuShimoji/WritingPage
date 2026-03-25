# Session 22-24 包括調査レポート

> 調査日: 2026-03-25 / v0.3.29 / branch: main
> 更新: session 24 で デッドCSS 5件削除 + nodegraph API削除 + spec カウント修正

---

## 1. 定量サマリ

| 指標 | 値 (session 24 更新後) | session 22 開始時 | 差分 |
|------|----------------------|-------------------|------|
| JS impl ファイル | 107 | 117 | -10 (デッドコード削除+nodegraph API削除) |
| CSS ファイル | 4 | 10 | -6 (graphic-novel.css + デッドCSS 5件削除) |
| E2E spec ファイル | 64 | 63 | +1 |
| E2E passed | -- (要再実行) | 514 | -- |
| E2E failed | -- (要再実行) | 1 | -- |
| E2E skipped | -- (要再実行) | 5 | -2 (Clock/NodeGraph skip 削除) |
| ガジェット (GADGETS.md) | 28 | 28 | 0 |
| spec-index エントリ | 54 (done 39, partial 3, removed 11, superseded 1) | 54 | 0 |
| TODO/FIXME/HACK | 0 | 0 | 0 |
| mock ファイル | 0 | 0 | 0 |

---

## 2. 機能ステータス総覧

### 2-A. 実装済み機能 (done: 39 spec)

| カテゴリ | spec | 機能名 | 確認手段 | 確認状態 |
|----------|------|--------|----------|----------|
| core | SP-001 | アプリケーション仕様書 | E2E | 確認済み |
| core | SP-002 | アーキテクチャドキュメント | doc | 確認済み |
| core | SP-004 | ガジェットリファレンス | E2E + session19 検証 | 確認済み |
| core | SP-050 | Story Wiki | E2E 27件 | 確認済み |
| core | SP-070 | モードアーキテクチャ | E2E | 確認済み |
| core | SP-077 | IndexedDB ストレージ移行 | E2E | 確認済み |
| core | SP-078 | 読者プレビューモード | E2E 10件 | 確認済み |
| core | SP-079 | 執筆パイプライン定義 | doc | 確認済み |
| ui | SP-010 | コンテキストツールバー | E2E | 確認済み |
| ui | SP-011 | 装飾/選択ツールチップ | E2E | 確認済み |
| ui | SP-012 | Visual Profile | E2E | 確認済み |
| ui | SP-013 | テーマ | E2E | 確認済み |
| ui | SP-016 | 拡張テキストボックス | E2E | 確認済み |
| ui | SP-051 | ガジェットUX改善 | E2E | 確認済み |
| ui | SP-052 | セクションツリー/話ナビ | E2E 11件 | 確認済み |
| ui | SP-054 | フォント切り替え | E2E | 確認済み |
| ui | SP-055 | リッチテキスト強化 | E2E | 確認済み |
| ui | SP-057 | 本文マイクロタイポグラフィ | E2E 2件 | 確認済み |
| ui | SP-058 | 見出しタイポグラフィ | E2E 14件 | 確認済み |
| ui | SP-059 | 日本語組版・ルビ拡張 | E2E | 確認済み |
| ui | SP-060 | 装飾プリセット統合 | E2E 11件 | 確認済み |
| ui | SP-061 | VP Typography Pack | E2E | 確認済み |
| ui | SP-062 | テキスト表現アーキテクチャ | E2E | 確認済み |
| ui | SP-064 | フォント切り替え影響マップ | doc | 確認済み |
| ui | SP-071 | チャプター管理再設計 | E2E | 確認済み |
| ui | SP-072 | セクションリンク&ナビ | E2E 9件 | 確認済み |
| ui | SP-074 | Web小説演出統合 | E2E | 確認済み |
| system | SP-020 | Embed SDK | E2E | 確認済み |
| user | SP-033 | エディタ機能ヘルプ | E2E | 確認済み |
| user | SP-034 | トラブルシューティング | doc | 確認済み |
| user | SP-063 | Markdownリファレンス | E2E | 確認済み |
| infra | SP-040 | コーディング規約 | doc | 確認済み |
| infra | SP-041 | テスト実行方法 | doc | 確認済み |
| infra | SP-042 | 配布手順 | doc | 確認済み |
| infra | SP-043 | リリース手順 | doc | 確認済み |
| infra | SP-044 | ブランチ運用指針 | doc | 確認済み |
| infra | SP-045 | ラベル設計 | doc | 確認済み |
| infra | SP-046 | 起動手順書 | doc | 確認済み |
| infra | SP-048 | 手動テストガイド | doc | 確認済み |

### 2-B. 実装途中の機能 (partial: 3 spec)

| spec | 機能名 | 進捗 | 残作業 | 確認手段 | 確認状態 |
| ------ | -------- | ------ | -------- | ---------- | ---------- |
| SP-005 | ロードマップ | 75% | Priority C/D/E の完了に連動 | doc | 確認済み |
| SP-073 | パステキスト | 90% | Phase 4: フリーハンド描画 | E2E 20件 (Phase 1-3) | Phase 1-3 確認済み |
| SP-076 | ドックパネルシステム | 75% | Phase 4: LoadoutManager統合プリセット | E2E 45件 (Phase 1-3) | Phase 1-3 確認済み |

### 2-C. 除外済み (removed: 10, superseded: 1)

| spec | 元の機能名 | 除外理由 |
|------|-----------|----------|
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

### 2-D. 未実装機能 (ROADMAP 上の残タスク)

| 優先度 | 項目 | 状態 | 備考 |
|--------|------|------|------|
| B | SP-073 Phase 4 (フリーハンド描画) | 未着手 | Phase 1-3 完了済み |
| C | SP-076 Phase 4 (ドックプリセット) | 仕様策定済み | LoadoutManager統合 |
| E | クラウド同期基盤 | 構想のみ | 将来タスク |

---

## 3. 懸念事項・バグ

### 3-A. 解決済み (session 22-23)

| ID | 重大度 | 内容 | 対処 |
|----|--------|------|------|
| V-1 | 高 | サイドバーアコーディオン: sections カテゴリが表示されない | gadgets-utils.js KNOWN_GROUPS に sections 追加 |
| T-1 | 中 | 削除済みガジェット JS ファイル残存 (Clock/Samples/GraphicNovel/NodeGraph) | 物理削除 |
| T-2 | 中 | KNOWN_GROUPS に sections 未登録 | V-1 と同時解決 |
| T-3 | 低 | screenplay プリセットに sections キーなし | loadouts-presets.js に追加 |
| L-01 | 低 | gadgets-utils.js フォールバックに Clock 残存 | Clock → MarkdownReference に差替 |
| L-02 | 低 | CSS .gadget-clock セレクタ残存 (gadgets.css + style.css) | 削除 |
| L-03 | 高 | APP_SPECIFICATION.md ガジェット総数 33 → 28 未更新 | 更新 |
| L-04 | 高 | docs/README.md 「33個の登録ガジェット一覧」 | 28個に更新 |
| L-05 | 中 | GADGETS.md カテゴリ説明に Clock/NodeGraph/GraphicNovel 残存 | 除去 |
| L-06 | 中 | feature-reference.html に SceneGradient/Clock/UIDesign/NodeGraph/GraphicNovel | 除去 |
| L-07 | 低 | APP_SPECIFICATION.md テスト数/JS数が古い | 最新値に更新 |
| I-01 | 低 | spec-index.json SP-004 summary "33→27" | "33→28" に更新 |
| I-02 | 低 | spec-index.json SP-022 pct=20% (removed) | pct=0 に更新 |
| I-04 | 低 | ROADMAP.md UIDesign/SceneGradient 「削除」→「無効化」 | 文言修正 |

### 3-B. 未解決 (Visual Audit 必要)

| ID | 重大度 | 内容 | 対処方針 |
|----|--------|------|----------|
| V-2 | 中 | session 21 記録: 詳細未記載 | Visual Audit で特定が必要 |
| V-3 | 中 | session 21 記録: 詳細未記載 | Visual Audit で特定が必要 |
| V-4 | 低 | session 21 記録: 詳細未記載 | Visual Audit で特定が必要 |

### 3-C. 判断保留

| 項目 | 内容 | リスク | 推奨 |
|------|------|--------|------|
| nodegraph IDB ストア | storage-idb.js/storage.js に nodegraph ストアの CRUD API が残存。呼び出し元なし。ただし IDB スキーマ変更はデータ損失リスクあり | 低 (無害だが不整合) | API 関数のみ削除、IDB ストア定義は維持 (スキーマ安定性) |
| worker-prompts/worker-a4-rem-migration.md | graphic-novel.css への参照残存 | 極低 (worker prompt は開発用) | 次回 worker prompt 整理時に対応 |
| Canvas Mode E2E | betaEnabled:false で常時失敗 | 低 (既知) | 維持 (将来再有効化の可能性) |

---

## 4. 確認手段別マトリクス

### E2E 自動テスト (64 spec ファイル)

| 機能領域 | テスト有無 | 状態 |
|----------|----------|------|
| モードアーキテクチャ (Normal/Focus/Blank/Reader) | あり | 通過 |
| チャプター管理 (作成/リネーム/D&D/独立保存/目次) | あり | 通過 |
| ドックパネル (左右/タブ/フローティング, Phase 1-3) | あり (45件) | 通過 |
| セクションリンク (章末ナビ/chapter://リンク/ゲームブック分岐) | あり (9件) | 通過 |
| Web小説演出 (テクスチャ/タイピング/ダイアログ/スクロール/SE) | あり | 通過 |
| パステキスト (DSL/SVG/制御点/プリセット, Phase 1-3) | あり (20件) | 通過 |
| Story Wiki (グラフ/バックリンク/AI生成/自動検出) | あり (27件) | 通過 |
| IndexedDB移行 (全ストア/フォールバック) | あり | 通過 |
| Reader (全画面/装飾パイプライン/HTML出力) | あり (10件) | 通過 |
| テーマ/Typography/ルビ/装飾プリセット/フォント切替 | あり | 通過 |
| ガジェット整理検証 (session19-verify) | あり (13件) | 通過 |
| Canvas Mode | あり | 失敗 (既知: betaEnabled:false) |

### スクリーンショット (session 21, stale)

| 画面 | ファイル | 備考 |
|------|---------|------|
| 初期ロード | 01-initial-load.png | |
| フルツールバー | 02-full-toolbar.png | |
| サイドバーアコーディオン | 03-sidebar-accordion.png | V-1 修正前の状態 |
| カテゴリ別ガジェット | 04~08-*.png | |
| Focus モード | 12-focus.png | |
| Blank モード | 13-blank.png | |
| Reader モード | 14-reader.png | |
| WYSIWYG エディタ | 20-editor-wysiwyg.png | |

### Visual Audit 未確認 (要実施)

- V-1 修正後のサイドバー表示状態 (sections カテゴリが正常表示されるか)
- V-2, V-3, V-4 の具体的内容の特定
- SP-076 Phase 4 実装前のプリセット UI 現況
- gadgets-loadouts.js / gadgets-loadout.js の役割重複確認

### 手動確認が必要 (E2E 対象外)

- Electron 環境での動作 (E2E は Chromium のみ)
- PWA オフライン動作
- モバイルタッチ操作

---

## 5. デッドコード・レガシー削除ログ

### 5-A. Session 22 で削除

| # | ファイル/箇所 | 種別 | 状態 |
|---|-------------|------|------|
| D-01 | `js/gadgets-clock.js` | JS ファイル | 削除済み |
| D-02 | `js/gadgets-samples.js` | JS ファイル | 削除済み |
| D-03 | `js/gadgets-graphic-novel.js` | JS ファイル | 削除済み |
| D-04 | `js/nodegraph.js` | JS ファイル | 削除済み |
| D-05 | `js/modules/graphic-novel/` (6ファイル) | JS ディレクトリ | 削除済み |
| D-06 | `css/graphic-novel.css` | CSS ファイル | 削除済み |
| D-07 | `index.html:60` CSS link タグ | HTML 参照 | 削除済み |
| D-08 | `index.html:747,762,775,783` コメントアウト script | HTML 残骸 | 削除済み |
| D-09 | `gadgets-editor-extras.js` UIDesign コメントブロック (~45行) | コメントアウトコード | 削除済み |
| D-10 | `gadgets-editor-extras.js` SceneGradient コメントブロック (~130行) | コメントアウトコード | 削除済み |
| D-11 | `e2e/gadgets.spec.js` Clock skip テスト | 無意味化テスト | 削除済み |
| D-12 | `e2e/editor-settings.spec.js` NodeGraph skip テスト | 無意味化テスト | 削除済み |

### 5-B. Session 23 (task-scout 追加発見) で削除

| # | ファイル/箇所 | 種別 | 状態 |
|---|-------------|------|------|
| L-01 | `gadgets-utils.js:259` フォールバックの Clock | コード参照 | Clock→MarkdownReference に差替 |
| L-02 | `css/gadgets.css:75-85` `.gadget-clock` | デッドCSS | 削除済み |
| L-02b | `css/style.css:3719-3729` `.gadget-clock` | デッドCSS | 削除済み |
| L-03 | `APP_SPECIFICATION.md:106` ガジェット総数 33→28 | ドキュメント不整合 | 更新済み |
| L-04 | `docs/README.md:52` 33個→28個 | ドキュメント不整合 | 更新済み |
| L-05 | `GADGETS.md:45-51` カテゴリ説明の削除済みガジェット | ドキュメント不整合 | 更新済み |
| L-06 | `feature-reference.html` SceneGradient/Clock/UIDesign/NodeGraph/GraphicNovel | コード参照 | 除去済み |
| L-07 | `APP_SPECIFICATION.md:255,263-266` テスト数/JS数 | ドキュメント不整合 | 更新済み |

### 5-C. Session 24 で削除

| # | ファイル/箇所 | 種別 | 状態 |
| --- | ------------- | ------ | ------ |
| C-01 | `css/common.css` (170行) | デッドCSS (style.css に統合済み) | 削除済み |
| C-02 | `css/layout.css` (477行) | デッドCSS (style.css に統合済み) | 削除済み |
| C-03 | `css/special.css` (460行) | デッドCSS (style.css に統合済み) | 削除済み |
| C-04 | `css/print.css` (202行) | デッドCSS (style.css に統合済み) | 削除済み |
| C-05 | `css/gadgets.css` (184行) | デッドCSS (style.css に統合済み) | 削除済み |
| C-06 | `js/storage.js` nodegraph API (loadNodegraph/saveNodegraph/キャッシュ/flush, ~50行) | デッドAPI (呼び出し元ゼロ) | 削除済み |
| C-07 | `js/storage.js` nodegraph エクスポート (module.exports + window 両方) | デッドエクスポート | 削除済み |

### 5-D. 維持判断

| ファイル | 理由 |
|---------|------|
| `e2e/session19-verify.spec.js` | ガジェット削除の回帰テスト。UIDesign/SceneGradient 無効化確認を含む。有用 |
| `e2e/test-ui-debug.spec.js` | デバッグ専用。全 skip。開発ツールとして維持 |
| `storage-idb.js` nodegraph IDBストア定義 | IDB スキーマ安定性のため維持。既存ユーザーデータ保護 |

---

## 6. 仕様不整合修正ログ

| # | 箇所 | 修正内容 | 状態 |
|---|------|----------|------|
| I-01 | spec-index.json SP-004 | summary "33→27" → "33→28" | session 22 で修正済み |
| I-02 | spec-index.json SP-022 | removed だが pct=20% → pct=0 | session 22 で修正済み |
| I-03 | runtime-state.md | ビジュアル監査追跡フィールド追加 | session 22 で追加済み |
| I-04 | ROADMAP.md | UIDesign/SceneGradient 「削除」→「無効化」 | session 22 で修正済み |
| I-05 | APP_SPECIFICATION.md | assist に Clock → Pomodoro, MarkdownReference | session 23 で修正 |
| I-06 | APP_SPECIFICATION.md | ガジェット総数 33→28 | session 23 で修正 |
| I-07 | APP_SPECIFICATION.md | テスト数/JS数を最新値に更新 | session 23 で修正 |
| I-08 | docs/README.md | 33個→28個 | session 23 で修正 |
| I-09 | GADGETS.md | カテゴリ説明から削除済みガジェット除去 | session 23 で修正 |
| I-10 | runtime-state.md | spec done 41→39, partial 2→3, removed 10→11 (誤記修正) | session 24 で修正 |
| I-11 | runtime-state.md | CSS ファイル 9→4 (デッドCSS削除反映) | session 24 で修正 |
| I-12 | ROADMAP.md | E2E spec files 62→64, spec カウント修正 | session 24 で修正 |

---

## 7. 要調査項目

| # | 項目 | 調査方法 | 優先度 | 状態 |
| --- | ------ | ---------- | -------- | ------ |
| Q-1 | V-2, V-3, V-4 の具体的内容 | Visual Audit | 中 | 未着手 |
| Q-2 | V-1 修正後のサイドバー表示 | Visual Audit | 中 | 未着手 |
| Q-3 | gadgets-loadouts.js と gadgets-loadout.js の重複可能性 | コード読解 | 低 | 未着手 |
| Q-4 | storage.js の nodegraph API 削除 | 影響分析 | 低 | **session 24 で解決** (API削除済み、IDBストア維持) |
| Q-5 | E2E 再実行 (passed/failed/skipped の最新値) | npx playwright test | 中 | 未着手 |
