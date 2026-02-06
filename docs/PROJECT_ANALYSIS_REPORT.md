# プロジェクト徹底分析レポート

**作成日**: 2025-01-19  
**プロジェクト**: Zen Writer (WritingPage)  
**バージョン**: 0.3.18  
**分析範囲**: 全体構造、既存機能、未実装機能、進行中タスク、実装計画

---

## 1. プロジェクトの全体構造と既存機能

### 1.1 プロジェクト概要

**Zen Writer** は、ミニマルな操作体験とスタイリッシュなレイアウトで小説・ビジュアルノベル執筆を支援するWebアプリケーションです。

**主要な特徴**:
- サーバー不要・オフライン対応
- ガジェットベースアーキテクチャ（完全モジュラー設計）
- 動的タブシステム
- プリセット（ロードアウト）システム
- LocalStorageによる自動保存
- リアルタイムMarkdownプレビュー

### 1.2 技術スタック

- **言語**: JavaScript (Vanilla JS、フレームワーク不使用)
- **スタイル**: CSS (カスタムプロパティによるテーマ管理)
- **テスト**: Playwright (E2E)、Puppeteer (smoke)
- **仕様管理**: OpenSpec
- **ドキュメント**: Markdown、DocFX

### 1.3 アーキテクチャ

#### ディレクトリ構造

```
WritingPage/
├── index.html              # メインHTML
├── css/                    # スタイルシート
│   ├── style.css          # メインスタイル
│   ├── variables.css      # CSS変数
│   └── ...
├── js/                     # JavaScriptモジュール
│   ├── app.js             # アプリケーション制御
│   ├── editor.js          # エディタ機能
│   ├── storage.js         # データ永続化
│   ├── theme.js           # テーマ管理
│   ├── sidebar-manager.js # サイドバー管理
│   ├── gadgets-*.js       # ガジェットシステム
│   └── ...
├── docs/                   # ドキュメント
├── openspec/              # OpenSpec仕様管理
│   ├── specs/             # 現在の仕様
│   └── changes/           # 変更提案
└── scripts/               # 開発スクリプト
```

#### 主要コンポーネント

1. **ElementManager**: DOM要素の中央集権的管理
2. **SidebarManager**: サイドバー（タブ/パネル）管理のSSOT
3. **ZWGadgets**: ガジェット登録・レンダリング・設定管理
4. **ZenWriterStorage**: LocalStorageによるデータ永続化
5. **ThemeRegistry**: テーマ定義の集中管理

### 1.4 既存機能（実装済み）

#### コア機能
- ✅ シンプルな `textarea` ベースのエディタ
- ✅ LocalStorageによる自動保存
- ✅ 文字数・語数カウンタ
- ✅ 折りたたみ可能なサイドバー/ツールバー
- ✅ テキスト/Markdown のインポート・エクスポート
- ✅ 印刷用レイアウト（UI非表示）

#### テーマ・カスタマイズ
- ✅ プリセット（ライト/ダーク/セピア）
- ✅ カラーピッカー
- ✅ フォント種別・サイズ・行間の調整
- ✅ Visual Profile（ユーザー定義プロファイル）
- ✅ テーマごとのボタン/リンクアクセントカラー一括制御

#### ガジェットシステム
- ✅ ガジェット登録・レンダリングシステム
- ✅ ロードアウトの保存・適用機能
- ✅ 動的タブ追加・削除のAPI
- ✅ フローティングパネル機能（E-1/E-2完了）
- ✅ ガジェット設定のImport/Export UI

#### エディタ拡張機能
- ✅ タイプライターモード（ミラーDOM計測、精度向上）
- ✅ Markdown機能（ショートカット、リスト継続、ライブプレビュー）
- ✅ スナップショット機能（間隔/差分/保持数調整、復元機能）
- ✅ 検索置換機能（Ctrl+F、正規表現/大文字小文字オプション）
- ✅ Selection Tooltip v1（テキスト選択に連動した装飾/挿入ツールチップ）

#### その他
- ✅ 複数ドキュメント管理（作成/一覧/切替/改名/削除）
- ✅ 執筆目標（文字数/締切）と進捗バー
- ✅ HUD設定（位置/時間/背景色/文字色/不透明度）
- ✅ ヘルプガジェット（Wiki/エディタ/UI Labへのリンク）
- ✅ Embed SDK（ベータ版、iframe埋め込みサポート）

---

## 2. 未実装機能と進行中タスクの洗い出し

### 2.1 優先度: 高（P0/P1）

#### P0: セキュリティ/境界条件

**P0-1: Embed SDK の same-origin 判定と origin 検証の正規化**
- **現状**: `js/embed/zen-writer-embed.js` の `sameOrigin` デフォルトが `true` で、`src` の origin から自動判定していない
- **影響範囲**: `js/embed/zen-writer-embed.js`, `js/embed/child-bridge.js`, `docs/EMBED_SDK.md`
- **受け入れ条件**:
  - [ ] cross-originで `sameOrigin` 未指定でも `targetOrigin` が `src` から推定される
  - [ ] postMessage の受信は `targetOrigin` と一致しない場合に破棄される
  - [ ] 同一originで API が見つからない場合、誤った cross-origin エラーメッセージを出さない
- **参照**: `docs/AUDIT_TASK_BREAKDOWN.md` P0-1

#### P1: 実装/ドキュメント整合

**P1-1: 設定ハブ（DESIGN_HUB）を Backlog/Change へ正式に落とす**
- **現状**: `docs/DESIGN_HUB.md` は提案のみで、`<dialog id="settings-hub">` は `index.html` に未配置
- **方針**: OpenSpec change に昇格 or `docs/BACKLOG.md` に統合
- **参照**: `docs/AUDIT_TASK_BREAKDOWN.md` P1-1

**P1-2: Wiki の「制限事項」表記の SSOT 化**
- **現状**: `docs/GADGETS.md` の Wiki 節に「リンク/AI/画像添付 未実装」がある
- **方針**: 実装済み/未実装を `docs/DEVELOPMENT_STATUS.md` または OpenSpec へ集約
- **参照**: `docs/AUDIT_TASK_BREAKDOWN.md` P1-2

**P1-3: `docs/KNOWN_ISSUES.md` のバージョン表記と実態の整合**
- **現状**: `KNOWN_ISSUES.md` に `v0.3.19` などの表記があるが、現行 `package.json` と整合しているか監査が必要
- **参照**: `docs/AUDIT_TASK_BREAKDOWN.md` P1-3

**P1-4: `docs/GADGETS.md` の「現行実装」と「将来案/旧メモ」の混在を解消**
- **現状**: 冒頭に「現行実装の説明」と「将来設計/未実装案」が混在
- **方針**: 節単位でステータスを明確化（`（現行）` / `（提案・未実装）`）
- **参照**: `docs/AUDIT_TASK_BREAKDOWN.md` P1-4

**P1-5: smoke/dev-check の期待値（「未実装扱い」）と現行実装の整合**
- **現状**: `scripts/dev-check.js` に「ガジェット設定のインポート/エクスポート API（UIは未実装のためAPIのみチェック）」という記述があるが、実際には UI が存在する
- **参照**: `docs/AUDIT_TASK_BREAKDOWN.md` P1-5

### 2.2 優先度: 中（P2）

#### P2: 技術的負債

**P2-1: ツールレジストリ（WritingTools）と UI 入口の接続方針を決める**
- **現状**: `js/tools-registry.js` はツール定義を持つが、FAB/ツールバー/ガジェットとの接続が限定的
- **設計論点**: SSOT を明確化（案A: WritingTools をSSOT / 案B: 個別UIをSSOT / 案C: ガジェット登録に統合）
- **参照**: `docs/AUDIT_TASK_BREAKDOWN.md` P2-1

**P2-2: プラグインシステムの「UI有無」を明確化**
- **現状**: `js/plugins/registry.js` / `choice.js` と `app.js: renderPlugins()` はあるが、`plugins-panel` は `index.html` に存在しない
- **設計論点**: 案A（UI追加）/ 案B（ヘッドレスとして明記）/ 案C（一旦撤去）
- **参照**: `docs/AUDIT_TASK_BREAKDOWN.md` P2-2

**P2-3: OpenSpec 未完了 change のトリアージ（重複統合 + Issue粒度への再分割）**
- **現状**: OpenSpec 上で「継続（未完了）」の change が複数あり、特に `Wiki/タブ/拡張` 領域でタスクが重複
- **方針**: Capability/領域ごとに 1 change へ統合（案A推奨）
- **参照**: `docs/AUDIT_TASK_BREAKDOWN.md` P2-3

### 2.3 OpenSpec 変更提案（継続中）

#### `ui-stability-and-cleanup`
- **状態**: 下書き/整備不足（`openspec list` 上は No tasks）
- **タスク**:
  - [ ] サイドバータブ切り替えの実装
  - [ ] ロードアウト管理のガジェット化
  - [ ] Wiki ヘルプ機能の実装
  - [ ] トップメニューのクリーンアップ
  - [ ] 執筆目標UIの改善
  - [ ] 文字数表示動作のドキュメント化

#### `add-modular-ui-wiki-nodegraph`
- **状態**: 継続（未完了）
- **主要タスク**:
  - [ ] UI Presentation: Sidebar tabs presentation strategies (buttons|tabs|dropdown|accordion)
  - [ ] UI Settings Gadget — persist `ui.tabsPresentation`, `ui.sidebarWidth`
  - [ ] Gadgets Framework: Respect manual group assignments when applying loadouts
  - [ ] Gadgetization — Typewriter, Snapshot Manager, Markdown Preview, Font Decoration, Text Animation
  - [ ] Wiki — CRUD, search (title/body/tags/folder), AI generation hook, gadget UI, storage schema
  - [ ] Node Graph — nodes/edges schema, drag, SVG edges+labels, open in dockable panel, storage per doc
  - [ ] Panels — API surface for multiple sidebars, floating windows, resizable sidebars; minimal docking
  - [ ] Editor — Typewriter mode re-enable (anchorRatio/stickiness), header icons working, element font scale design
  - [ ] Help as Wiki — seed help pages, link from Help button; expose specs and feature guides

#### `story-wiki-implementation`
- **状態**: 継続（未完了）
- **主要タスク**:
  - [ ] StoryWiki gadget の構造作成
  - [ ] Wiki ページ管理（CRUD操作、テンプレート、リンクシステム）
  - [ ] AI統合フレームワーク（API Key設定、コンテンツ生成プロンプト）
  - [ ] Wiki ナビゲーションと検索
  - [ ] ドキュメント更新
  - [ ] E2Eテスト

#### `polish-ui-from-test-feedback`
- **状態**: 継続（未完了）
- **主要タスク**:
  - [ ] パネルレイアウト修正（左サイドバー展開時のメインエリア隠れ）
  - [ ] カラーパレットの現在の色反映機能
  - [ ] エディタキー移動時のガクガク振動修正
  - [ ] 折り返し文字数指定機能
  - [ ] 文字数表示スタンプ機能
  - [ ] 編集ファイル/章の表示・一覧機能
  - [ ] 破棄確認・復元機能強化

#### `graphic-novel-font-decoration`
- **状態**: 継続（未完了）
- **主要タスク**:
  - [ ] 装飾構文（タグ）の確定
  - [ ] CSS（太字/下線/色/影）の最小セット実装
  - [ ] E2E: 装飾が保存/再読込で保持されること

#### `hud-customization-enhancement`
- **状態**: 継続（未完了）
- **実装差分トリアージ必要**: 現行実装が既に存在する可能性があるため、未完了なのか tasks.md 未更新なのかを判定

### 2.4 バックログ項目（優先度: 中）

#### UI/UX改善
- [ ] ビジュアルUIエディタ（クリックで要素選択、個別またはタイプ別の一括色変更）
- [ ] 柔軟なタブ配置システム（上下左右への配置、サイドバー内での順序変更）
- [ ] タブへのガジェット動的割り当て完全実装（ドラッグ&ドロップでガジェットをタブに追加）
- [ ] スペルチェック（基本的なスペル提案）

#### パフォーマンス最適化
- [x] updateWordCount デバウンス（300msデバウンスでinputイベント最適化完了）
- [x] typewriter scroll requestAnimationFrame適用（スクロール振動解消）
- [x] live previewデバウンス適用（100msデバウンスで高頻度入力時のパフォーマンス改善）
- [x] live preview差分適用（morphdomによるDOM差分更新）
- [x] selection range measurement最適化（updateCharCountStamps に100msデバウンス追加）

### 2.5 バックログ項目（優先度: 低）

#### 監査タスク
- [ ] 監査ログ（JSON）の保存先・運用手順を整備
- [ ] コード規約の明文化（ESLint/Prettier導入検討）

#### 長期課題
- [ ] プラグイン拡張システム（ユーザー定義ガジェット）
- [ ] レスポンシブUI改善（モバイル/タブレット対応）
- [ ] アクセシビリティ向上（キーボード操作、スクリーンリーダー対応）
- [ ] Typora風ツリーペイン（ドキュメント階層管理）

### 2.6 コード品質改善

#### リファクタリング必要ファイル
- `js/editor.js` (1763行 → 500行以下を目標)
- `js/app.js` (1437行 → 500行以下を目標)

#### 技術的負債
- ガジェット登録APIの型安全性強化
- 汎用フローティングパネル機能（任意ガジェットの切り離し）
- ガジェットD&D機能の実装（将来機能）

---

## 3. 優先順位付けと実装計画の策定

### 3.1 優先度分類基準

- **P0（緊急）**: セキュリティ/データ破損/外部APIの致命不具合
- **P1（高）**: 主要機能の一貫性・UX・運用（テスト/ドキュメント整合含む）
- **P2（中）**: 技術的負債の返済（リファクタリング、構造整理、将来拡張の地ならし）
- **P3（低）**: 長期課題、将来拡張

### 3.2 クリティカルパス上の作業

#### Phase 1: セキュリティ・整合性の確保（最優先）

1. **P0-1: Embed SDK の same-origin 判定と origin 検証の正規化**
   - **見積もり**: 2-3日
   - **依存関係**: なし
   - **影響**: セキュリティリスクの解消

2. **P1-3: `docs/KNOWN_ISSUES.md` のバージョン表記と実態の整合**
   - **見積もり**: 0.5日
   - **依存関係**: なし
   - **影響**: ドキュメントの信頼性向上

3. **P1-1/P1-2/P1-4/P1-5: ドキュメントの SSOT 化**
   - **見積もり**: 2-3日
   - **依存関係**: P1-3完了後
   - **影響**: 開発効率の向上、混乱の解消

#### Phase 2: UI安定化と基盤整備

4. **`ui-stability-and-cleanup` の実装**
   - **見積もり**: 5-7日
   - **依存関係**: Phase 1完了後
   - **影響**: ユーザー体験の向上

5. **`polish-ui-from-test-feedback` の実装（優先項目のみ）**
   - **見積もり**: 3-5日
   - **依存関係**: Phase 2-4完了後
   - **影響**: UI/UXの改善

#### Phase 3: 機能拡張

6. **Wiki機能の統合実装（`story-wiki-implementation` × `add-modular-ui-wiki-nodegraph`）**
   - **見積もり**: 10-14日
   - **依存関係**: Phase 2完了後
   - **影響**: 情報設計の強化

7. **Node Graph機能の実装**
   - **見積もり**: 7-10日
   - **依存関係**: Phase 3-6完了後
   - **影響**: 関係図の可視化

#### Phase 4: コード品質改善

8. **editor.js / app.js のリファクタリング**
   - **見積もり**: 7-10日
   - **依存関係**: Phase 3完了後
   - **影響**: 保守性の向上

9. **ツールレジストリとプラグインシステムの整理**
   - **見積もり**: 3-5日
   - **依存関係**: Phase 4-8完了後
   - **影響**: アーキテクチャの明確化

### 3.3 実装順序の推奨フロー

```
Phase 1: セキュリティ・整合性の確保
  ↓
Phase 2: UI安定化と基盤整備
  ↓
Phase 3: 機能拡張
  ↓
Phase 4: コード品質改善
```

### 3.4 各タスクの見積もりと依存関係

詳細は `docs/IMPLEMENTATION_PLAN.md` を参照してください。

---

## 4. 推奨対応フローの作成と実行

### 4.1 実装手順（各優先度レベルごと）

#### P0/P1 タスクの実装手順

1. **事前準備**
   - 関連ドキュメントの確認（`docs/AUDIT_TASK_BREAKDOWN.md`）
   - 既存コードの調査
   - テストケースの確認

2. **実装**
   - 小さな単位で実装
   - 各ステップでテスト実行
   - ドキュメントの随時更新

3. **検証**
   - `npm run test:smoke` の実行
   - `npm run lint` の実行
   - `npm run test:e2e:ci` の実行

4. **ドキュメント更新**
   - `CHANGELOG.md` の更新
   - 関連ドキュメントの更新
   - OpenSpec の更新（該当する場合）

#### P2 タスクの実装手順

1. **設計決定**
   - 設計論点の整理
   - 案の比較検討
   - 採用案の決定

2. **実装**
   - 設計に基づいた実装
   - 段階的なリファクタリング
   - テストの追加

3. **検証・ドキュメント更新**
   - 上記P0/P1と同様

### 4.2 コード品質基準

#### テストカバレッジ
- **Smoke Test**: 必須（`npm run test:smoke`）
- **E2E Test**: 新機能追加時は必須（`npm run test:e2e:ci`）
- **Lint**: 必須（`npm run lint`）

#### パフォーマンス指標
- 長文貼り付け: 5k-50k文字で約300ms以内（許容範囲）
- 文字数更新: デバウンス300ms
- ライブプレビュー: デバウンス100ms
- タイプライタースクロール: `requestAnimationFrame` 使用

#### コード品質
- ファイルサイズ: 1ファイル300行以下を目標（500行超は分割検討）
- 命名規則: 一貫性を保つ
- コメント: 公開APIにはDoxygenコメントを記述

### 4.3 定期的な進捗確認と優先順位の見直しメカニズム

#### 週次レビュー
- 完了タスクの確認
- 未完了タスクの進捗確認
- 優先順位の見直し

#### 月次レビュー
- バックログの整理
- 技術的負債の評価
- ロードマップの更新

#### 実装完了時の確認事項
- [ ] すべてのテストが通過
- [ ] ドキュメントが更新されている
- [ ] OpenSpec が更新されている（該当する場合）
- [ ] `CHANGELOG.md` が更新されている
- [ ] `AI_CONTEXT.md` が更新されている

---

## 5. 実装と品質保証

### 5.1 単体テスト・結合テスト

#### 現在のテスト構成

- **Smoke Test**: `scripts/dev-check.js`
  - UI要素の存在確認
  - スタイルの検証
  - ガジェット構造の検証
  - ヘルプ導線の確認

- **E2E Test**: Playwright
  - `e2e/editor-settings.spec.js`: 設定永続化検証
  - `e2e/gadgets.spec.js`: ガジェット機能検証
  - `e2e/theme-colors.spec.js`: テーマ機能検証
  - その他: sidebar-layout, wiki, embed, decorations, xorigin

#### テスト実行手順

```bash
# 開発サーバー起動
npm run dev

# Smoke Test
npm run test:smoke

# Lint
npm run lint

# E2E Test
npm run test:e2e:ci

# 全テスト
npm test
```

### 5.2 コードレビューとCI/CDパイプライン

#### CI/CD構成

- **CI Smoke**: push（`main`, `develop`, `feat/**`）、pull_request、workflow_dispatch で起動
- **共有ワークフロー**: `YuShimoji/shared-workflows/.github/workflows/*.yml@v0.1.0`

#### コードレビューチェックリスト

- [ ] テストが通過している
- [ ] Lintエラーがない
- [ ] ドキュメントが更新されている
- [ ] セキュリティリスクがない
- [ ] パフォーマンスに問題がない

### 5.3 ドキュメントの随時更新と技術的負債の管理

#### ドキュメント更新タイミング

- **機能追加時**: `CHANGELOG.md`, `docs/USAGE.md`, `docs/TESTING.md` を更新
- **仕様変更時**: OpenSpec を更新
- **バグ修正時**: `docs/KNOWN_ISSUES.md` を更新
- **設計変更時**: `docs/ARCHITECTURE.md`, `docs/DESIGN.md` を更新

#### 技術的負債の管理

- **追跡**: `docs/BACKLOG.md`, `docs/AUDIT_TASK_BREAKDOWN.md`
- **優先度付け**: P0/P1/P2/P3 で分類
- **定期的な見直し**: 月次レビューで評価

---

## 6. まとめと次のステップ

### 6.1 分析結果の要約

- **プロジェクト状態**: 機能的には充実しているが、ドキュメント整合性とセキュリティ面で改善の余地あり
- **未実装機能**: OpenSpec に複数の変更提案があり、優先順位付けと統合が必要
- **技術的負債**: 大規模ファイルのリファクタリング、アーキテクチャの明確化が必要

### 6.2 推奨される次のアクション

1. **即座に着手すべきタスク（P0/P1）**
   - P0-1: Embed SDK の same-origin 判定と origin 検証の正規化
   - P1-3: `docs/KNOWN_ISSUES.md` のバージョン表記と実態の整合
   - P1-1/P1-2/P1-4/P1-5: ドキュメントの SSOT 化

2. **短期（1-2週間）**
   - `ui-stability-and-cleanup` の実装
   - `polish-ui-from-test-feedback` の優先項目実装

3. **中期（1-2ヶ月）**
   - Wiki機能の統合実装
   - Node Graph機能の実装
   - editor.js / app.js のリファクタリング

4. **長期（3ヶ月以上）**
   - プラグイン拡張システム
   - レスポンシブUI改善
   - アクセシビリティ向上

### 6.3 継続的な改善

- 週次レビューで進捗確認
- 月次レビューで優先順位の見直し
- 四半期レビューでロードマップの更新

---

**更新履歴**:
- 2025-01-19: 初版作成




