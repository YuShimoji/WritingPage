# AUDIT_TASK_BREAKDOWN — 監査結果タスク分解（SSOT）

本ドキュメントは、プロジェクト全体監査（docs/openspec/code）で検出した「未実装/仮実装/不整合」を Issue 粒度に分解し、優先度・影響範囲・依存関係・テスト観点をまとめた SSOT です。

## 優先度の基準

- P0: セキュリティ/データ破損/外部APIの致命不具合
- P1: 主要機能の一貫性・UX・運用（テスト/ドキュメント整合含む）
- P2: 技術的負債の返済（リファクタリング、構造整理、将来拡張の地ならし）

---

## P0: セキュリティ/境界条件

### P0-1: Embed SDK の same-origin 判定と origin 検証を実装に合わせて正規化

- **現状**
  - `js/embed/zen-writer-embed.js` は `sameOrigin` のデフォルトが `true` で、`src` の origin（computedOrigin）から自動判定していない。
  - `postMessage` 受信時の origin チェックが `sameOrigin` に依存しており、設定ミス時に検証が弱くなる余地がある。
  - `getContent/setContent/focus/takeSnapshot` の失敗時メッセージが `cross-origin mode not implemented` 固定で、同一originでも誤誘導になる。

- **設計案（比較）**
  - **案A（推奨）**: `src` の origin から `sameOrigin` を自動判定（ユーザー指定があれば上書き）。`postMessage` は `targetOrigin` が確定している場合は常に検証。
  - **案B**: `sameOrigin` は現状維持（ユーザー責務）で、エラーメッセージと destroy のみ整備。
  - **案C**: `sameOrigin` オプションを廃止し、常に origin 自動判定（breaking に近い）。

- **採用**
  - 案A（互換性を保ちつつ安全側に倒す）。

- **影響範囲**
  - `js/embed/zen-writer-embed.js`
  - `js/embed/child-bridge.js`（期待する postMessage RPC の前提は維持）
  - `docs/EMBED_SDK.md`（挙動の説明があれば整合）

- **受け入れ条件 (DoD)**
  - [ ] cross-origin（異なる origin）で `sameOrigin` 未指定でも `targetOrigin` が `src` から推定され、`ZW_EMBED_READY` を受信できる
  - [ ] postMessage の受信は `targetOrigin` と一致しない場合に破棄される
  - [ ] 同一originで API が見つからない場合、誤った cross-origin エラーメッセージを出さない

- **テスト観点**
  - `npm run test:smoke`（embed demo / child-bridge のチェックが通る）
  - 追加するなら: Playwright で `embed-demo.html` を開き、`getContent/setContent` の往復確認

---

## P1: 実装/ドキュメント整合（ユーザーが迷う不一致）

### P1-1: 設定ハブ（DESIGN_HUB）を Backlog/Change へ正式に落とす

- **現状**
  - `docs/DESIGN_HUB.md` は提案のみで、`<dialog id="settings-hub">` は `index.html` に未配置。

- **方針**
  - 仕様として採用するなら OpenSpec change（提案/タスク/設計）に昇格。
  - まだ優先度が低いなら `docs/BACKLOG.md` の該当項目に統合し、`docs/DESIGN_HUB.md` は「提案（未実装）」として明確化。

- **受け入れ条件 (DoD)**
  - [ ] どちらの扱い（OpenSpec化 or Backlog整理）かがドキュメント上で明確

### P1-2: Wiki の「制限事項」表記の SSOT 化

- **現状**
  - `docs/GADGETS.md` の Wiki 節に「リンク/AI/画像添付 未実装」がある。

- **方針**
  - 実装済み/未実装を `docs/DEVELOPMENT_STATUS.md` または OpenSpec（wiki capability）へ集約し、`docs/GADGETS.md` は参照に寄せる。

- **受け入れ条件 (DoD)**
  - [ ] Wiki の未実装項目が一箇所で追跡でき、重複/矛盾が無い

### P1-3: `docs/KNOWN_ISSUES.md` のバージョン表記と実態の整合

- **現状**
  - `KNOWN_ISSUES.md` に `v0.3.19` などの表記があるが、現行 `package.json` と整合しているか監査が必要。

- **受け入れ条件 (DoD)**
  - [ ] 現行バージョンに対して「改善済み」の表記が正しい

### P1-4: `docs/GADGETS.md` の「現行実装」と「将来案/旧メモ」の混在を解消

- **現状**
  - `docs/GADGETS.md` 冒頭に「現行実装の説明」と「将来設計/未実装案（旧計画メモを含む）」が混在している旨の注記がある。

- **方針**
  - 節単位でステータスを明確化（例: `（現行）` / `（提案・未実装）`）し、読み手が実装状況を誤認しないよう整理する。
  - 将来案が OpenSpec に存在する場合は該当 change/spec へ寄せ、`docs/GADGETS.md` 側は参照に留める。

- **受け入れ条件 (DoD)**
  - [ ] 未実装/提案である内容が本文の見出し/本文で明確に区別される
  - [ ] 現行実装の説明だけを追える導線（目次や見出し）が成立する

### P1-5: smoke/dev-check の期待値（「未実装扱い」）と現行実装の整合

- **現状**
  - `scripts/dev-check.js` では、ガジェット設定のインポート/エクスポートについて API（`exportPrefs`/`importPrefs`）と UI（`GadgetPrefs`）の両方を検証している。

- **方針（比較）**
  - **案A（推奨）**: dev-check を現行実装に合わせ、UI が存在するなら UI の存在/動線を検証する。
  - **案B**: UI は存在するが smoke では API のみ検証する方針として、コメント/ドキュメントを最新化する。

- **受け入れ条件 (DoD)**
  - [ ] dev-check のコメントとチェック内容が現行実装の実態と矛盾しない
  - [ ] `npm run test:smoke` が「何を保証しているか」が読み手に一意に伝わる

---

## P2: 技術的負債（将来変更に強い構造）

### P2-1: ツールレジストリ（WritingTools）と UI 入口の接続方針を決める

- **現状**
  - `js/tools-registry.js` はツール定義を持つが、FAB/ツールバー/ガジェットとの接続が限定的。

- **設計論点（比較）**
  - **案A**: `WritingTools.listTools({ entrypoint: ... })` をSSOTにして UI を生成（宣言的）。
  - **案B**: 現行の個別UIをSSOTにし、WritingTools は将来のメタデータに留める。
  - **案C**: WritingTools を廃止し、ガジェット登録に統合。

- **受け入れ条件 (DoD)**
  - [ ] SSOT が明確（どこを変更すれば UI 入口が増えるか一意）

### P2-2: プラグインシステムの「UI有無」を明確化

- **現状**
  - `js/plugins/registry.js` / `choice.js` と `app.js: renderPlugins()` はあるが、`plugins-panel` は `index.html` に存在しない。
  - `docs/REFACTORING_PLAN.md` でも「`plugins-panel` は `index.html` に未配置（プラグインUIは現状オプション）」と記述がある。

- **設計論点（比較）**
  - **案A**: `plugins-panel` を UI に追加し、プラグインアクションを露出。
  - **案B（推奨）**: 現状はヘッドレス（将来用）として、`renderPlugins()` は残すが docs に「未実装」と明記。
  - **案C**: プラグイン機構を一旦撤去し、OpenSpec で再導入。

- **受け入れ条件 (DoD)**
  - [ ] docs/REFACTORING_PLAN.md と実装の説明が一致

### P2-3: OpenSpec 未完了 change のトリアージ（重複統合 + Issue粒度への再分割）

- **現状**
  - OpenSpec 上で「継続（未完了）」の change が複数あり、特に `Wiki/タブ/拡張` 領域でタスクが重複している。
  - 各 change の `tasks.md` は未着手前提の粒度が多く、現行実装（SidebarManager/ガジェット基盤/Helpリンク等）との差分が明確でない。

- **統合方針（比較: 3案）**
  - **案A（推奨）: Capability/領域ごとに 1 change へ統合**
    - Wiki: `story-wiki-implementation` と `add-modular-ui-wiki-nodegraph` の Wiki 項目を統合
    - Tabs/UI基盤: `ui-enhancements` と `add-modular-ui-wiki-nodegraph` の UI presentation を統合
    - 利点: SSOT が明確、重複実装/二重仕様を防げる
    - 懸念: 既存 change の整理（archive/移管）が必要
  - **案B: change は維持し、責務境界を明文化して分担**
    - 利点: 既存 change を崩さずに進められる
    - 懸念: 仕様/実装が分散しやすく、後から整合コストが増える
  - **案C: OpenSpec は「近々実装する範囲」のみ保持し、遠い将来は Backlog に降格**
    - 利点: OpenSpec の運用コストを下げ、現状の実装に集中できる
    - 懸念: 将来機能の設計資産が散逸しやすい

- **暫定決定**
  - 監査SSOTでは **案A** を前提にタスク分解を行い、実装着手時に change の再編（統合/アーカイブ/差分整理）を行う。

#### P2-3-1: `hud-customization-enhancement` の実装差分トリアージ

- **対象 change**
  - `openspec/changes/hud-customization-enhancement/tasks.md`

- **ねらい**
  - 現行実装が既に存在する可能性があるため、「未完了」なのか「tasks.md 未更新」なのかを判定し、OpenSpec を現実に合わせて整備する。

- **受け入れ条件 (DoD)**
  - [ ] `DEFAULT_SETTINGS.hud`（幅/フォントサイズ）の既定値が現行コードに反映されているか確認できる
  - [ ] HUDSettings ガジェットに該当UI（width/fontSize）が存在するか確認できる
  - [ ] `e2e` に相当テストが存在するか確認できる（無ければ追加タスク化）
  - [ ] 結果に応じて「実装タスク」または「tasks.md 更新/アーカイブ」タスクへ分岐できる

- **テスト観点**
  - `npm run test:smoke`
  - 必要に応じて `npm run test:e2e:ci`

#### P2-3-2: Wiki機能の統合トリアージ（`story-wiki-implementation` × `add-modular-ui-wiki-nodegraph`）

- **対象 change**
  - `openspec/changes/story-wiki-implementation/tasks.md`
  - `openspec/changes/add-modular-ui-wiki-nodegraph/tasks.md`（1.5 Wiki / 2.6 E2E Wiki）

- **設計判断（暫定）**
  - Wiki は「ガジェット + ストレージAPI + 検索 + インポート/エクスポート」を 1セットとして扱う。
  - AI 統合は API Key を要し Tier が上がるため、最初は **スタブ/フックのみ**（外部呼び出し無し）を先行し、実装は別 Issue へ分離する。

- **Issue 粒度のタスク（案）**
  - [ ] Wiki CRUD のSSOT（ストレージAPI: create/update/delete/search）を確定
  - [ ] Wiki ガジェットUI（一覧/編集/テンプレ）を実装（既存実装がある場合は差分整理）
  - [ ] ページ間リンク（未実装）を「要件化」し、保存形式/リンク解決ルールを確定
  - [ ] Wiki データの import/export（localStorage前提）を実装 or 仕様化
  - [ ] E2E: Wiki create/search/save + リロード永続
  - [ ] docs: `docs/GADGETS.md` の未実装表記を SSOT 参照へ整理（P1-2 と連動）

- **受け入れ条件 (DoD)**
  - [ ] 既存 docs の「Wiki 制限事項（リンク/AI/画像）」が、実装と一致する
  - [ ] E2E により CRUD の最低限が回帰しない

#### P2-3-3: タブ/UI基盤の統合トリアージ（`ui-enhancements` × `add-modular-ui-wiki-nodegraph`）

- **対象 change**
  - `openspec/changes/ui-enhancements/tasks.md`
  - `openspec/changes/add-modular-ui-wiki-nodegraph/tasks.md`（1.1 UI Presentation / 2.2 E2E presentation）

- **設計判断（暫定）**
  - タブ管理のSSOTは `SidebarManager` とし、`UI Settings` は永続化/適用のみに責務を限定する。

- **Issue 粒度のタスク（案）**
  - [ ] `ui.tabsPresentation` の候補（buttons|tabs|dropdown|accordion）を定義し、HTML/CSS/A11y とセットで要件化
  - [ ] プレゼン切替の再描画（状態保持/フォーカス維持/スクロール位置）ルールを確定
  - [ ] E2E: presentation 切替が永続化され、再読み込み後も一致する

#### P2-3-4: UI polish（`polish-ui-from-test-feedback`）の Issue 化

- **対象 change**
  - `openspec/changes/polish-ui-from-test-feedback/tasks.md`

- **分割方針**
  - 体感・回帰しやすい項目（レイアウト/スクロール/破棄確認）を先行し、計測/検証が必要な項目は別 Issue に分離する。

- **Issue 粒度のタスク（案）**
  - [ ] レイアウト: 左サイドバー展開時にメインが隠れる問題の再現条件と修正
  - [ ] スクロール: キー移動時の振動の再現条件と修正
  - [ ] 破棄/復元: 確認UIと復元導線の要件化（誤操作防止）
  - [ ] E2E: 回帰が出やすい操作（タブ切替/サイドバー開閉/入力/保存）の安定化

#### P2-3-5: グラフィックノベル向け装飾（`graphic-novel-font-decoration`）の段階導入

- **対象 change**
  - `openspec/changes/graphic-novel-font-decoration/tasks.md`

- **設計判断（暫定）**
  - まずは「Markdownタグ（装飾構文）」「描画（preview/overlay）」を最小スコープで定義し、アニメーションは後続に分離する。

- **Issue 粒度のタスク（案）**
  - [ ] 装飾構文（タグ）を確定し、既存記法との衝突を検証
  - [ ] CSS（太字/下線/色/影）を最小セットで実装
  - [ ] E2E: 装飾が保存/再読込で保持されること

---

## 進め方（実装順の推奨）

1. P0-1（Embed SDK 正規化）
2. P1-3（KNOWN_ISSUES のバージョン整合）
3. P1-1/P1-2（ドキュメントの SSOT 化）
4. P2（ツール/プラグインのSSOT設計）
