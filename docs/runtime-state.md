# Runtime State — Zen Writer

> **補助ドキュメント**: 主要指標・カウンター・自己診断用。**セッション番号・直近スライス・検証結果・「信頼できること」の正本は [`docs/CURRENT_STATE.md`](CURRENT_STATE.md) のみ。**
>
> 最終カウンター同期: 2026-04-20（`CURRENT_STATE.md` session 116 に合わせて更新）。セッション別の詳細ログは [`docs/archive/session-history.md`](archive/session-history.md)。

## 現在位置

- プロジェクト: Zen Writer (WritingPage)
- バージョン: v0.3.32
- ブランチ: main (**`origin/main` と FF 同期済み・2026-04-20 push**)
- セッション: 116（正本は `CURRENT_STATE.md` の Snapshot）
- 主レーン: **package 実機ゲート残件の切り分け**と sidebar 初期レイアウト正規化
- スライス（要約）:
  - session 110 push: SectionsNavigator 修正・ドキュメント同期・`sections-nav` 回帰、ほか未コミット変更をまとめてリモート反映（検証: 全 E2E 515 passed / 2 skipped）
  - session 109 virtual heading → navigateTo 配線 / `_triggerAutoSave` デッドコード削除 / autoSave.enabled ガード / 「通常表示」統一 / 回帰 E2E 2 件
  - session 111 package baseline 固定 / Sections empty state / sidebar reopen relay 撤去 / Reader controls cluster / preview empty state / package build 再生成
  - session 112 package safe launcher / PowerShell `Start-Process` 統一 / package gate 一次切り分け
  - session 113 sidebar edge-hover stabilization / 幅変更後 + left-edge mouseleave 回帰 2 件
  - session 114 closed sidebar inert化 / edge rail 分離 / horizontal overflow clamp
  - session 115 Electron rail no-drag 回帰修正
  - session 116 sidebar 幅の正本統一 / 起動時レイアウト正規化
  - session 108 session 107 応急修正 (view-menu 同期 / Focus HUD / sections 章反映 / 全画面項目)
  - session 107 view-menu 集約 + autoSave up-migration (v2)
  - session 105 Slice 1-3 (Focus 歯車 / 一覧 UX / autoSave デフォルト ON)

## 最新ビルド

- 最新 Electron ビルド: `build/win-unpacked/Zen Writer.exe` (session 111 作業ツリーの package baseline。package 手動ゲートは未消化)
- session 108 ビルド: `build-session108/win-unpacked/Zen Writer.exe`
- session 107 ビルド: `build-session107/win-unpacked/Zen Writer.exe`
- session 105 ビルド: `build-session106/` (Slice 2+3), `build-session105/` (Slice 1)
- 通常の `build/` と `build-new/` は `app.asar` がロックされて使用不可 (原因プロセス未特定)。`--config.directories.output=build-sessionN` で退避出力を継続

## 次セッション再開ポイント

### 0. 最短再開（コマンド）

```powershell
cd "C:\Users\thank\Storage\Media Contents Projects\WritingPage"
git checkout main
git pull --ff-only origin main
npm run lint:js:check
```

続けて `docs/CURRENT_STATE.md` の Snapshot と「検証結果」の **session 110** 行を読む。

### 1. 実機確認 (user actor・最小限)

session 109 の根治修正を `build-session109/win-unpacked/Zen Writer.exe` で確認。**ショートカットや既確認機能の再テストは不要** (INTERACTION_NOTES 方針)。

- **同名章**: セクションガジェットで同名の章が複数あっても一覧に全部出ること・各行クリックで該当章へ飛ぶこと（session 110 でロジック + E2E 固定済み。実機で気になるときだけ）

- **C-1 virtual heading クリック根治**: ミニマル モードで「+追加」→ 「セクション」アコーディオン内に出る新章タイトルをクリック → editor 内容が該当章に切り替わる (session 108 の応急処置では未定義動作だった箇所)
- **C-2 保存神経系 SSOT**: サイドバー詳細設定で autoSave 設定を OFF → 入力しても HUD 通知が出ない。章内容自体は保存される (DevTools で確認可)。ON に戻すと HUD が出る
- **C-3 UI 文言統一**: view-menu の表示と docs が全て「通常表示」(空白なし) で一致
- **C-4 回帰 E2E**: 自動的に検出 (以降のビルドで退行を防止)

### 1.5 session 105 Slice 2 実務確認 (本文サンプル必要)

本文入りの状態で Slice 2 (a)(b)(c) を確認する場合、サイドバー「構造」カテゴリのドキュメントガジェット → 「...」メニュー → 「JSON読込」から `samples/sample-novel-chapters.zwp.json` 等をインポートしてください。

### 2. インラインスタイル vs CSS 変数の二重管理 (技術的負債)

**背景**: session 104 でサイドバーリサイズが動作しなかった根本原因は `app.js:388` がインライン `style.width` を設定し、CSS 変数 `--sidebar-width` を上書きしていたこと。session 104 では dock-manager 側で両方を同時更新する対症的修正を適用。根本的には `app.js` 側をインラインスタイル廃止 → CSS 変数一本化すべきだが影響範囲が広いため保留。

**調査結果 (session 104)**: サイドバー以外の同種競合は現時点でなし。`--focus-panel-width` (chapter-list.js)、`--dock-left-width` (dock-manager.js) は CSS 変数のみで安全。`--editor-max-width` (EditorUI.js) は JS で設定するが CSS 側で未使用 (無害だが不要コード)。

### 3. その他の積み残し (低優先)

- スライス2 残候補: `#toggle-reader-preview` の撤去 + ショートカット昇格、リーダーモード関連の整理、ヘルプモーダル本体の再設計、`docs/wiki-help.html` / `docs/editor-help.html` 削除
- スライス3 候補 (中期): サイドバーアコーディオン 6→4 カテゴリ統廃合、カテゴリ description の冠詞統一、FEATURE_REGISTRY に 28 ガジェット分の FR エントリ一括追加
- 保存機能の残ギャップ: 保存ファイルの物理場所指定 (Electron dialog API)、sessionStorage クラッシュ復旧、複数タブ同時編集ロック — 実機確認で顕在化したら 1 スライスに昇格

## 再開時のコマンド

```bash
# プロジェクト移動
cd "c:/Users/PLANNER007/WritingPage"

# 最新化
git fetch origin
git status -sb

# 自動検証
npm run lint:js:check
npx playwright test e2e/responsive-ui.spec.js --reporter=line
```

---

## カウンター

| 指標 | 値 | 前回 |
| ---- | --- | ---- |
| セッション番号 | 110 | 109 |
| ガジェット数 | 28 | 28 |
| spec-index エントリ | 56 | 56 |
| spec done | 44 | 44 |
| spec partial | 0 | 0 |
| spec removed | 11 | 11 |
| superseded | 1 | 1 |
| JS impl ファイル (`js/**/*.js`) | 110 | 110 |
| CSS ファイル | 4 | 4 |
| E2E spec ファイル (`e2e/*.spec.js`) | 60 | 60 |
| E2E total | 517 tests（session 110 で sections-nav +1）、実測 **515 passed / 2 skipped** | 516 |
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
