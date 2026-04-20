# UI モード × 左サイドバー・章パネル — 実装メモと残リスク

> **Status**: 現行実装の整理メモ（2026-04 時点）。E2E で網羅していない手動経路・未追跡の表示差分のメモ置き場。
>
> **関連**: [`spec-mode-architecture.md`](./spec-mode-architecture.md)（歴史仕様・用語）、[`spec-writing-focus-sidebar.md`](./spec-writing-focus-sidebar.md)（執筆集中サイドバー superseded 参照）、実装は `js/app.js`（`setUIMode`）、`js/sidebar-manager.js`（執筆レール・`sidebarSettingsOpen`）、`js/edge-hover.js`（左端レール・`peekFocusLeftChapterRail`）。

---

## 1. 状態の正体（混同しやすい軸）

| 軸 | 主な表現 | 役割 |
|----|-----------|------|
| UI モード | `data-ui-mode` = `normal` \| `focus` | 通常表示とミニマル執筆の切替。`setUIMode` が唯一の集約入口（コマンドパレット等もここ経由が望ましい）。 |
| 執筆サイドバー「詳細」 | `settings.ui.sidebarSettingsOpen` + `data-writing-settings-open` | Focus かつ本体 `#sidebar` を開いたとき、構造ガジェット等を出すか。永続。 |
| 左端レール | `data-edge-hover-left` + `#focus-chapter-panel` の CSS | 左端ホバーで章一覧パネルを出す。`ZWEdgeHover.dismissAll()` で毎回クリアされる。 |
| サイドバー開閉 | `settings.sidebarOpen` + `SidebarManager.forceSidebarState()` | UI モード切替では勝手に開閉せず、起動時復元とユーザーの明示操作を正本とする。 |

「最小」ボタンは **Normal→Focus** なので、上表のうち **UI モード** と **詳細の畳み**（後述）が同時に動く。

---

## 2. 現行の整理済み挙動（要約）

1. **`setUIMode` 内で常に `ZWEdgeHover.dismissAll()`**  
   モード切替のたびに上端・左端のエッジ状態が落ちる。章パネル／上端ハブの「一時表示」は切り替え直後に消えるのが仕様。

2. **Focus → Normal / Normal → Focus**  
   UI モード切替では `#sidebar` を自動で開き直さない。サイドバーは現在の開閉状態を維持し、ユーザーが `Alt+1` やサイドバー操作で決めた状態を尊重する。

3. **Normal → Focus（サイドバー先頭の「最小」）**  
   **`collapseWritingFocusDetailForUIModeFocus()`** で `sidebarSettingsOpen` を偽に戻して保存し、執筆レールを章ナビ中心に再適用する。

4. **E2E**  
   `e2e/ui-mode-consistency.spec.js` に「永続 `sidebarSettingsOpen` をオンにした状態から Normal→Focus で `data-writing-settings-open` が `false`」を追加済み。

---

## 3. あり得る未追跡処理・表示（傾向ベースのチェックリスト）

以下は **自動テストやドキュメントで明示されていない**、または **複数状態の組み合わせ**で再発しやすい候補である。

### 3.1 ストレージと設定の二重系

- **`sidebarOpen`（ルート）** と **`settings.sidebarVisible`（`settings-manager.js`）**  
  片方だけが更新される経路が残ると、再起動後の初期開閉が期待とずれる可能性がある。現状は `toggleSidebar` が `sidebarOpen` を書く一方、`applySettingsToUI` は `sidebarVisible` のみ参照。
- **UI モード切替**  
  `setUIMode` はサイドバーの開閉状態を勝手に反転しない。再発時は `sidebarOpen` 永続化と `forceSidebarState()` 呼び出し経路の双方を点検する。

### 3.2 ドック・レイアウト

- **`data-dock-sidebar="right"`** 時の左端レール／章パネル／`focus-overlay-open` の幾何。E2E は左ドック前提が多く、右ドック＋モード往復の視覚的ズレは未カバーになりやすい。
- **左ドックパネル**（`dock-left`）とサイドバー・章パネルの **z-index / 幅** の競合。

### 3.3 エッジホバーと別 UI

- **`MainHubPanel`** を上端で開いた直後に **モード切替**すると `dismissAll` とハブの `openedHubFromTopEdge` 解除が重なる。チラつき・二重 dismiss は `DISMISS_MS` 依存。
- **再生オーバーレイ**（`data-reader-overlay-open`）中はサイドバー非表示 CSS がある。オーバーレイ終了後に `setUIMode` していない場合、エッジ状態だけ残る経路は手動確認向き。

### 3.4 章 UI の二系統

- **`#focus-chapter-panel`**（左端・chapter-list）と **`#sidebar` 内執筆レール**（`writing-focus-rail`）は別 DOM。章ストア同期はあるが、「どちらを主に使う操作導線か」はユーザー認知で分かれやすい。
- **「詳細」を畳む**のは **Normal→Focus のモード切替時のみ** 自動。Focus 内で「詳細」を開いたあと **Esc / ショートカットだけで Normal に出る**経路では、現状は `collapseWritingFocusDetailForUIModeFocus` を通さない（永続のまま）。意図とズレるなら別タスクで Esc 経路にも畳みを寄せる検討が必要。

### 3.5 初期化順序

- **`setUIMode(..., force: true)`** の起動時一括適用と、`sidebarManager.bootstrapAccordion` / `_initWritingFocusSidebar` の順序。`force` で同一モード再入したとき、M-1a/M-1b の分岐が意図せず走るかは `currentMode` の DOM 初期値に依存する。
- **`index.html` 先頭インライン** の `data-ui-mode` と `ZenWriterStorage` の `ui.uiMode` のズレが一瞬でもあると、初回フレームの CSS が跳ぶ。

### 3.6 アクセシビリティ・入力デバイス

- **キーボードのみ**で左端レール相当を「モード切替なし」で出す操作は、ポインタ前提のエッジ検知と乖離しやすい。
- **`pointer: coarse`** やタブレット幅での `focus-chapter-panel` 全幅化（`style.css` メディアクエリ）と、本体サイドバー補助開閉の組み合わせは E2E が薄い。

### 3.7 製品判断として固定した仕様

- **「最小」で Normal→Focus に入るたび、`sidebarSettingsOpen` は畳む**（通常表示 に戻ったあと再度最小にしたときに、構造まで出た状態を持ち越さない）。長期利用で「詳細を常に開いた Focus」を望む場合は、**別フラグ**や **詳細専用の復帰**が必要になる（現状は意図的に単純化）。

---

## 4. 手動スモーク（推奨シナリオ）

E2E 外で短時間確認するなら次の順が有効である。

1. Focus・本体サイドバー閉・左端で章パネル表示 →「フル」→ 本体サイドバーが開く →「最小」→ 章ナビ中心・左レールが補助的に立つか。  
2. Focus で「詳細」→ Normal →「最小」→ `data-writing-settings-open` が `false` か。  
3. 右ドックプリセット（該当する場合）で 1 と同様。  
4. 再生オーバーレイを開いて閉じた直後に 1 を実施。

---

## 5. 変更履歴（メモ）

| 時期 | 内容 |
|------|------|
| 2026-04 | 空左防止の `sessionStorage` フラグ、Normal→Focus での `sidebarSettingsOpen` リセット、`peekFocusLeftChapterRail` の条件付き化を実装。本ドキュメントで残リスクを整理。 |
