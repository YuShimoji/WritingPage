# Runtime State — Zen Writer

> **補助ドキュメント**: 主要指標・カウンター・自己診断用。**セッション番号・直近スライス・検証結果・「信頼できること」の正本は [`docs/CURRENT_STATE.md`](CURRENT_STATE.md) のみ。**
>
> 最終カウンター同期: 2026-04-17（`CURRENT_STATE.md` session 104 に合わせて更新）。セッション別の詳細ログは [`docs/archive/session-history.md`](archive/session-history.md)。

## 現在位置

- プロジェクト: Zen Writer (WritingPage)
- バージョン: v0.3.32
- ブランチ: main (origin に対して +2 ahead、未 push)
- セッション: 104（正本は `CURRENT_STATE.md` の Snapshot）
- 主レーン: **サイドバーリサイズ修正 + UI 整備** — インラインスタイル競合で動作しなかったサイドバーリサイズを解消。edge-hover デバッグ撤去、エディタ focus 枠線消去、狭幅サイドバー修正も実施
- スライス（要約）:
  - session 104 サイドバーリサイズ修正 + edge-hover デバッグ撤去 + エディタ focus 枠線消去
  - session 103.1 Focus 歯車レイアウト崩壊 hotfix — **実機で未解消**
  - session 103 設定動線 hotfix (空モーダル問題解消 / `openSettingsModal` を advanced カテゴリ展開動線に)
  - session 102 WP-001 スライス2 (トップバー歯車・ヘルプ撤去 / `Ctrl+,` `F1` ショートカット導入)

## 最新ビルド

- 最新 Electron ビルド: 未ビルド (session 104 コミット後)
- 直近のビルド: `build-session104/win-unpacked/Zen Writer.exe` (session 103.1 反映、201 MB, 2026-04-17 01:31)
- 通常の `build/` と `build-new/` は `app.asar` がロックされて使用不可 (原因プロセス未特定)

## 次セッション再開ポイント

### 1. Focus 歯車レイアウト崩壊の根本修正 (継続)

**症状**: Focus 章パネルの歯車アイコンを押すとサイドバーが viewport 全幅占有する状態になる。session 103.1 の hotfix (openSettingsModal で `setUIMode('normal')` を先行呼び出し) でも解消しない。

**関連ファイル**:
- [js/app-ui-events.js](../js/app-ui-events.js) `openSettingsModal()` (session 103 / 103.1 で改修、L430 前後)
- [js/app.js](../js/app.js) Focus 章パネル歯車ハンドラ (`#focus-open-settings`, L591 前後の `initFocusChapterSettingsShortcut` IIFE)
- [js/sidebar-manager.js](../js/sidebar-manager.js) `activateSidebarGroup` / `toggleSidebar` / `_applyWritingFocusSidebar`
- [css/style.css](../css/style.css) `.sidebar.focus-overlay-open` / `.sidebar.open` / `[data-ui-mode="focus"]` 関連ルール

**試す候補 (優先順)**:
1. `setUIMode('normal')` 後の処理を `setTimeout(fn, 50)` または `requestAnimationFrame` で遅延させ、CSS 再計算後に `activateSidebarGroup` + `toggleSidebar` を呼ぶ
2. session 103 / 103.1 を revert (`git revert 1b52678 40510e0`) で session 102 の状態 (Focus 歯車 = 空モーダル) に戻し、設定動線 hotfix は別アプローチで再設計
3. Focus 章パネル歯車のハンドラ自体を変更し、`closeFocusOverlay()` ではなく `setUIMode('normal')` を呼ぶ + 次フレーム後に `openSettingsModal()` を呼ぶ方式に置換
4. `openSettingsModal()` を復元モード別に分岐: Focus 時は設定モーダル (空でも) 開く / Normal 時のみ advanced 展開

**コマンドパレット経由は user 実機で正常動作** (user 報告) → Normal モード状態からの呼び出しは OK、Focus 状態からの呼び出し固有の問題と確定。ただし Focus 状態でコマンドパレットから呼んだ場合も同じ症状が出るかは未検証。

### 2. 狭幅サイドバー全画面占有 (session 104 で部分修正済み)

**症状**: ウィンドウを最小幅に縮めた時、左サイドバーが viewport 全画面を占有する。

**session 104 での修正**: `style.css` の 1024px 以下メディアクエリで `width: 100%` を `var(--sidebar-width)` + `max-width: calc(100vw - 2rem)` に変更。これにより狭幅時もサイドバーが全幅化せず通常幅を維持する。

**残存リスク**: Electron ビルドでの実機確認は未実施。次回ビルド時に検証が必要。

### 3. フルドキュメント一覧 UX 3 件 (user 提起)

- (a) 複数削除中にチェックボックス外クリックで全選択外しされるが、選択数表示は残る (状態管理バグ)
- (b) ドキュメント多数で見切れる (CSS overflow / max-height 不足)
- (c) 複数選択が一つ一つしか選べない (Shift+Click 範囲選択 / 全選択ボタン未実装)

**影響領域 (推定)**: `js/gadgets-documents-hierarchy.js` / `js/gadgets-documents-tree.js` / 関連 CSS

### 4. インラインスタイル vs CSS 変数の二重管理 (技術的負債)

**背景**: session 104 でサイドバーリサイズが動作しなかった根本原因は `app.js:388` がインライン `style.width` を設定し、CSS 変数 `--sidebar-width` を上書きしていたこと。session 104 では dock-manager 側で両方を同時更新する対症的修正を適用。根本的には `app.js` 側をインラインスタイル廃止 → CSS 変数一本化すべきだが影響範囲が広いため保留。

**調査結果 (session 104)**: サイドバー以外の同種競合は現時点でなし。`--focus-panel-width` (chapter-list.js)、`--dock-left-width` (dock-manager.js) は CSS 変数のみで安全。`--editor-max-width` (EditorUI.js) は JS で設定するが CSS 側で未使用 (無害だが不要コード)。

### 5. その他の積み残し (低優先)

- スライス2 残候補: `#toggle-reader-preview` の撤去 + ショートカット昇格、リーダーモード関連の整理、ヘルプモーダル本体の再設計、`docs/wiki-help.html` / `docs/editor-help.html` 削除
- スライス3 候補 (中期): サイドバーアコーディオン 6→4 カテゴリ統廃合、カテゴリ description の冠詞統一、FEATURE_REGISTRY に 28 ガジェット分の FR エントリ一括追加

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
| セッション番号 | 104 | 103.1 |
| ガジェット数 | 28 | 28 |
| spec-index エントリ | 56 | 56 |
| spec done | 44 | 44 |
| spec partial | 0 | 0 |
| spec removed | 11 | 11 |
| superseded | 1 | 1 |
| JS impl ファイル (`js/**/*.js`) | 110 | 110 |
| CSS ファイル | 4 | 4 |
| E2E spec ファイル (`e2e/*.spec.js`) | 60 | 60 |
| E2E total | 514 (session 100 実測) | 514 |
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
