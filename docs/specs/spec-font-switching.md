# フォント切り替え 仕様書（Draft v1）

## 概要

本仕様は、Zen Writer における「フォント切り替え」を **一貫した操作体系** で提供するための開発設計を定義する。  
対象は Web/Electron 両方で、既存の Typography / Quick Tools / Command Palette の分散制御を整理し、設定の破壊的上書きを防止する。

関連資料:

- 影響マップ: `docs/specs/spec-font-switching-impact-map.md`

## 背景と課題

現状、フォント関連機能は以下に分散している。

- `js/gadgets-typography.js`: フォントファミリー、UIサイズ、エディタサイズ、行間
- `js/app-ui-events.js`: フローティングパネルの `global-font-size`（エディタサイズのみ）
- `js/modules/editor/EditorUI.js`: `setGlobalFontSize`（保存処理が単純化されすぎている）

主要課題:

1. 操作面の分散

- 「フォント切り替え（ファミリー）」と「フォントサイズ変更（クイック）」が別導線で、役割が曖昧。

2. 保存処理の破壊的更新リスク

- `EditorUI.setGlobalFontSize` が `saveSettings({ fontSize: size })` を実行しており、既存設定を丸ごと置き換える可能性がある。

3. 状態モデルの二重化

- `fontSize`（後方互換）と `editorFontSize` / `uiFontSize` の扱いが混在し、どれが正なのか分かりにくい。

## 目標

- フォント切り替えを「本文フォント」「UIサイズ」「本文サイズ」「行間」の4軸として明確化
- 主要操作を壊さず、クイック操作と詳細設定の責務を分離
- 設定保存を常にマージ方式に統一し、既存設定を破壊しない
- 既存ユーザー設定（`fontSize`のみ保持の旧形式）を後方互換で維持

## 非スコープ

- フォントファイルのアップロード機能（任意TTF/OTF取り込み）
- 章単位/選択範囲単位の部分フォント適用
- WYSIWYGのリッチテキスト固有フォント機能

## 用語定義

- 本文フォント: `--font-family`（本文・プレビューに適用するフォントファミリー）
- UIサイズ: `--ui-font-size`（UIコントロールの表示スケール）
- 本文サイズ: `--editor-font-size`（エディタ本文サイズ）
- 互換サイズ: `fontSize`（旧仕様互換用。読み込み時に本文サイズへフォールバック）

## 情報設計（推奨）

### 推奨案（採用案）

- **詳細設定**: Typography ガジェットを単一の正規UIとする
- **クイック操作**: フローティングパネルは本文サイズの増減だけを担当
- **コマンド/ショートカット**: 本文サイズのみ変更（フォントファミリー変更は対象外）

理由:

- 執筆中に最も頻繁なのは本文サイズ調整であり、クイック導線に適する
- フォントファミリーやUIサイズは副作用が大きく、詳細設定に集約すべき

## 採用済み決定（2026-03-10）

1. フォント候補セット

- 現行の固定プリセットを継続する（言語別セット分割は将来検討）。

2. Quick Tools上限値

- 本文サイズ上限は `48px` を採用する（視認性優先）。

3. 将来拡張

- OSローカルフォント列挙は将来スコープとして保持する（現フェーズでは未実装）。

## 機能仕様

### 1. フォントファミリー切り替え

- UI: Typography ガジェット内 `select`
- 値: プリセットフォント定義（既存候補を継続）
- 適用対象: `--font-family`
- 保存: `settings.fontFamily`

### 2. 本文サイズ切り替え

- UI-1: Typography（詳細）
- UI-2: Quick Tools（クイック）
- API: `ZenWriterTheme.applyFontSettings(..., editorFontSize)` もしくは専用 `updateEditorFontSize(size)`
- 保存: `settings.editorFontSize` を正とし、互換で `settings.fontSize` も同期

### 3. UIサイズ切り替え

- UI: Typography（詳細）
- 適用対象: `--ui-font-size`
- 保存: `settings.uiFontSize`
- クイック操作対象外

### 4. 行間切り替え

- UI: Typography（詳細）
- 適用対象: `--line-height`
- 保存: `settings.lineHeight`

### 5. 設定保存ルール（必須）

- `saveSettings` 呼び出し時は必ず以下で更新:
  1. `const s = loadSettings()`
  2. 必要キーのみパッチ
  3. `saveSettings(s)`
- `saveSettings({ fontSize: size })` のような単独オブジェクト保存は禁止

## データ仕様

### 保存キー

- LocalStorageキー: `zenWriter_settings`
- フォント関連フィールド:
  - `fontFamily: string`
  - `fontSize: number`（互換）
  - `uiFontSize: number`
  - `editorFontSize: number`
  - `lineHeight: number`

### 読み込み時マイグレーション

- `editorFontSize` 未設定で `fontSize` がある場合:
  - `editorFontSize = fontSize`
- `uiFontSize` 未設定時:
  - `uiFontSize = fontSize || DEFAULT_SETTINGS.fontSize`
- 保存時に正規化して次回以降の揺れを減らす

## UI仕様

### Typographyガジェット

- フォントファミリー選択（`select`）
- UIサイズ（`12-24`）
- 本文サイズ（`12-32`）
- 行間（`1.0-3.0`, `0.1` step）

### Quick Tools（フローティング）

- 本文サイズのみ（`12-48`）
- 上下操作時は Typography に反映される（`ZenWriterSettingsChanged` 経由）
- 役割ラベルを明示: 「本文サイズ（クイック）」

## イベント仕様

- 設定反映イベント: `window.dispatchEvent(new CustomEvent('ZenWriterSettingsChanged'))`
- Typography はこのイベントを購読して表示同期する
- Quick Tools も同イベントで表示値を同期する

## 変更対象（実装時）

- `js/modules/editor/EditorUI.js`
  - `setGlobalFontSize` の保存処理をマージ方式へ修正
- `js/gadgets-typography.js`
  - `editorFontSize` を正とした適用・同期を明示化
- `js/app-ui-events.js`
  - Quick Tools の説明文/ラベルを「本文サイズクイック調整」に統一
- `js/theme.js`
  - フォント関連更新用の小さな専用関数（任意）を追加可能
- `e2e/editor-settings.spec.js`（または新規 `e2e/font-switching.spec.js`）
  - 永続化、UI同期、ショートカット動作を追加検証

## 受け入れ基準（Acceptance Criteria）

1. フォントファミリー変更後にリロードしても同じフォントが適用される
2. 本文サイズ変更後にリロードしても `editorFontSize` が保持される
3. Quick Toolsで本文サイズ変更しても他の設定が消えない
4. Typography変更とQuick Tools変更が双方向に同期される
5. `Ctrl/Cmd + + / - / 0` 操作後も設定JSONが破損しない

## テスト計画

### E2E

- ケース1: Typographyでフォントファミリー変更 -> reload -> 維持確認
- ケース2: TypographyでUI/本文/行間変更 -> reload -> CSS変数確認
- ケース3: Quick Toolsで本文サイズ変更 -> settingsの他キー保持確認
- ケース4: コマンドパレット経由サイズ変更 -> Quick Tools表示値同期確認

### 手動確認

- Web（localhost）と Electron の両方で適用遅延・チラつきなし
- サイドバー折りたたみ/モーダル開閉時に値が巻き戻らない

## 段階導入（推奨）

1. Phase 1: 保存処理の安全化（破壊的更新排除）
2. Phase 2: UI責務分離（詳細 vs クイック）
3. Phase 3: E2E追加と既存テスト更新
4. Phase 4: ドキュメント（`docs/EDITOR_HELP.md`, `docs/TESTING.md`）更新

## 後続タイポグラフィ仕様への接続（2026-03-10）

本仕様（SP-054）完了後は、RichText/Canvas と競合しにくい順に以下を推奨する。

1. SP-058 見出しタイポグラフィ
2. SP-057 本文マイクロタイポグラフィ
3. SP-059 日本語組版・ルビ拡張
4. SP-060 装飾プリセット統合
5. SP-061 Visual Profile Typography Pack

理由:

- 1-3は Typography ガジェットとCSS変数中心で閉じやすく、編集エンジン改修を最小化できる
- 4は SP-016/055 との仕様境界を調整する必要があり、後段が安全
- 5は上位統合のため、個別仕様を先に固めたほうが移行コストを下げられる

## 実装進捗

### Phase 1（保存処理の安全化）: 完了（2026-03-10）

- `EditorUI.setGlobalFontSize` をマージ保存へ変更し、`editorFontSize` と `fontSize` を同期。
- Quick Tools の初期値読み込みを `editorFontSize` 優先に統一。
- E2E に「フォント変更時に他設定が消えない」回帰ケースを追加。

### Phase 2（UI責務分離）: 完了（2026-03-11）

- `theme.js` の `applyFontSettings` をパッチベースのマージ保存に変更。
  - `saveSettings(patch)` 呼び出しで `mergeSettings` パスを使用。
  - 保存後に `refreshSettings()` を移動し、`this.settings` を最新化。
- E2E テスト2件追加（`e2e/editor-settings.spec.js`）:
  1. `font family change should persist after reload` - フォント永続化の確認
  2. `font family change via Typography should preserve other settings` - 設定非破壊の確認

### Phase 3（E2E追加と既存テスト更新）: 完了（2026-03-11）

- `e2e/editor-settings.spec.js` に Typography/Quick Tools 双方向同期テスト追加済み。
- `index.html` Quick Tools セクションタイトルを「本文サイズ（クイック）」に更新済み。
- 合計5件のフォント関連E2Eテストケースが稼働中。

### Phase 4（ドキュメント更新）: 完了（2026-03-11）

- `docs/EDITOR_HELP.md` セクション7にフォント4軸の詳細ガイドを追加。
- `docs/TESTING.md` にフォント関連テストケース一覧を追加。
