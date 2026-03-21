# ROADMAP — Zen Writer 機能強化ロードマップ

> 最終更新: 2026-03-22 / v0.3.29

## ステータス語彙

| ステータス | 意味 |
|-----------|------|
| done | 実装完了、E2Eあり |
| partial | 実装途中（Phase N/M 等で進捗明記） |
| todo | 未着手 |
| deferred | 意図的に延期（理由を併記） |
| superseded | 後継仕様に置き換え済み |

## 現在の状態

- E2E: 418 passed / 1 failed (Canvas Mode既知) / 56 spec files (2026-03-22 時点)
- CI: GitHub Actions green
- コア機能: 95% 成熟
- ガジェット: 33個登録済み (+1 開発専用)
- 仕様書: spec-index.json に 42 エントリ
- 残 partial: SP-050(95%), SP-073(40%), SP-076(25%)

---

## Priority A: 執筆体験の基盤

実用的な小説執筆ツールとしての核心部分。最優先。

### A-1. モードアーキテクチャ (SP-070) -- done

Normal / Focus / Blank の3モード分離。Phase 1-3 完了。

- [x] CSS分離（Focus: ChapterListパネル、Blank: エッジホバー復帰）
- [x] ショートカット（Ctrl+Shift+F / B、Esc復帰）
- [x] Focus ChapterListスタブ（SectionsNavigatorデータ共有）
- [x] Focusオーバーレイアクセス（設定ボタン → サイドバースライドイン）
- [x] SP-071 ChapterList Phase 1 実装
- [x] SP-071 Phase 2（章ごと独立保存 — chapter-store.js 実装済み）
- [x] Phase 2: ChapterStore統合ガード（undoスタック章分離、モード遷移前flush）
- [x] Phase 3: Focusパネルリサイズ（pointer events + localStorage保存）

### A-2. チャプター管理再設計 (SP-071) -- done

Novlr式2ペイン章管理。SP-070 Focusモードの主要UI。

- 左パネルにチャプターリスト、右にエディタ
- [x] 見出し自動検出 → チャプターリスト表示
- [x] クリックナビゲーション
- [x] ダブルクリックリネーム
- [x] 右クリックコンテキストメニュー（リネーム/複製/移動/削除）
- [x] ドラッグ&ドロップ並び替え
- [x] 「+ 新しい章」ボタン
- [x] アクティブ章ハイライト + 文字数表示
- [x] Phase 2: 章ごと独立保存 (documents ストアに type:'chapter' + IDB フラッシュ機構)
- [x] 目次ページ自動生成 (SP-071 Phase 3 + SP-072連動)

### A-3. セクションリンク & インタラクティブナビ (SP-072) -- done (100%)

章末ナビ自動挿入 + ゲームブック的インタラクティブリンク。

- [x] Phase 1: 章末ナビ自動挿入 (前へ / 目次 / 次へ)
- [x] Phase 2: 章visibility設定 + export変換
- [x] Phase 3: リンク挿入モーダルUI + 壊れリンク警告
- [x] Phase 4: 外部リンク新規タブ確認 (target="_blank" + .external-link + URLバリデーション)
- [x] Phase 5: ゲームブック分岐UI (data-style属性方式 + 3層CSS + スタイル選択UI + 自動グループ化+区切り線。エフェクト転用は将来拡張)

### A-4. UI/UX 磨き上げ (残タスク)

- px→rem段階移行 -- todo (140箇所、大規模)

### A-4 完了済み

- `[BUG]` エディタスクロールバグ -- done
- コンテキストツールバーの操作感改善 -- done (現状問題なし)
- サイドバーのナビゲーション最適化 -- done (SP-052 Phase 1+2)
- サイドバー情報密度の整理 -- done
- サイドバー品質改善 -- done
- エディタの入力体験改善 -- done (タイプライターモード/プリフォーマット等)
- テーマ一貫性 CRITICAL群 -- done (CSS変数14種+JS硬コード色30箇所)
- テーマ一貫性 HIGH/MEDIUM群 -- done (global-search-ui/link-graph/keybind/swiki/command-palette/gadget-*/mini-hud)
- デッド参照根絶 -- done (旧パネル参照→MainHubPanel統一, Escape統合, デッドCSS/メソッド削除)
- サイドバー間接委譲→直接API化 -- done
- フローティングパネルのドラッグ対応 -- done (pointer events + 3px閾値 + タッチ対応)
- レスポンシブUI改善 -- done (タップターゲット44px + モバイル6件修正)
- アニメーション/トランジション -- done (モーダル/パネルフェードイン + reduced-motion対応)

---

## Priority B: 表現力拡張

ポストモダン文学・Web小説・ビジュアルノベルの表現に必要な機能。

### B-1. Web小説演出統合 (SP-074) -- done

テクスチャオーバーレイ / タイピング演出 / ダイアログボックス / スクロール連動 / SE / ジャンルプリセット。
SP-062 (テキスト表現アーキテクチャ) 基盤上に構築。Phase 1-6 全完了。

### B-2. パステキスト (SP-073) -- partial (40%)

ベジェ曲線・円弧・フリーハンド曲線に沿ったテキスト配置。SVG textPath使用。
Phase 1完了 (:::zw-pathtext DSL + SVGレンダリング)。残: Phase 2 WYSIWYG制御点ハンドルUI。

### B-3. Typography進化トラック

- Phase 0-2: done (フォント切替 / 見出し / マイクロタイポグラフィ)
- Phase 3: SP-059 日本語組版・ルビ拡張（傍点・圏点） -- done
- Phase 4: SP-060 装飾プリセット統合 -- done
- Phase 5: SP-061 Visual Profile Typography Pack -- done

### B-4. 既存機能の完成

#### Wiki/グラフビュー (SP-050)

- グラフビュー統合 -- done (力学レイアウト/カテゴリ色分け/凡例/ノードクリック遷移)
- バックリンクUI統合 -- done (詳細ペイン内/Story Wiki+Doc+現在/別名対応)
- AI生成 -- done (テンプレート+OpenAIハイブリッド/設定UI/下書きボタン)
- `[[wikilink]]` 構文の自動パース -- done
- `doc://` リンクのパースバグ修正 -- done (Issue #1, 2026-03-16 解決済み)
- 高度な自動検出(形態素解析) -- todo

#### WYSIWYG テキストアニメーション

- リアルタイムプレビュー -- todo
- タイムラインコントロールUI -- todo

#### テキストボックス (SP-016) -- done/100%

#### Canvas Mode (SP-056) -- deferred/30% (betaEnabled: false)

### B-5. 画像管理

- ドラッグ&ドロップでの位置調整 -- todo
- 画像フィルタ/レイヤ機能 -- todo

---

## Priority C: エコシステム & 拡張性

外部連携とカスタマイズ性の拡充。

### C-1. ドックパネルシステム (SP-076) -- todo

上下左右へのパネルドッキング。Editorモード専用。
Phase 1: 左右ドック / Phase 2: タブグループ / Phase 3: フローティング & スナップ。

### C-2. Google Keep 双方向連携 (SP-075) -- todo

Phase 1: Takeoutベースインポート / Phase 2: テキストエクスポート / Phase 3: API連携(将来)。

### C-3. ガジェット整理

33個は多すぎる可能性。SP-070のモード分離で一部は解消する見込み。

- ガジェット利用状況分析
- 類似ガジェット統合
- ロードアウトプリセット見直し

### C-4. サイドバー Phase 2-3

- ドラッグ&ドロップによるガジェット並び替え -- todo (SP-076と統合検討)
- ガジェット間通信の基盤整備 -- todo

### C-5. プラグインシステム正式化

- 現行: manifest駆動のローカルプラグインローダーが実装済み
- 正式仕様への昇格が必要 (Issue #5)

---

## Priority D: エクスポート刷新

必要時に対応。ブラウザ印刷で最低限のPDF出力は可能。

- PDF エクスポート -- ブラウザ印刷API or jsPDF
- EPUB エクスポート -- epub-gen等。章構造をTOCに反映
- DOCX エクスポート -- docx.js等
- ワークスペース一括書き出し
- プラットフォーム別対応マトリクスの明文化 (Issue #4)

## Priority E: ストレージ基盤刷新

- IndexedDB 移行 -- done (SP-077)。ドキュメント/アセット/スナップショット/Wiki/ノードグラフ全移行完了
- SP-071 Phase 2 (章ごと独立保存) -- done (documents ストア + IDB フラッシュ)
- クラウド同期基盤 -- 将来のクラウド同期への布石

---

## 長期ビジョン

- グラフビジュアライゼーションUI -- done (SP-050 Phase 2 Step 1: 力学レイアウト/カテゴリ色分け)
- AI連携 -- partial (Wiki生成: done SP-050 Step 3, 要約/シーンアイデア生成: todo)
- コラボレーション編集
- Embed SDK v2 (イベントストリーム、状態同期)
- TypeScript段階移行
- スペルチェック (日本語形態素解析)
- ビジュアルテーマビルダー
- ルビ自動付与 (形態素解析)
