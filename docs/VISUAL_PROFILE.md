# VISUAL PROFILE — テーマ/背景/フォント/余白/表示モード

本書は、テーマ/背景色/フォント/余白/表示モードなどの**見た目に関する設定群**を「Visual Profile」としてまとめて扱うための仕様メモです。

> 注記: 本書は **Phase A（モデル定義と責務整理）** のドラフトです。実装やUI変更は段階的に行い、既存挙動との後方互換性を維持することを前提とします。

---

## 1. 目的

- **ユーザー視点の整理**
  - 「テーマ」「背景色」「フォント」「余白」「表示モード」がバラバラではなく、
    「執筆モードの雰囲気セット（= Visual Profile）」として理解できるようにする。
- **内部実装の整理**
  - 現在は `ThemeManager` / TypographyThemes ガジェット / EditorLayout ガジェット / 表示モードセレクト などが個別に設定を持っている。
  - これらを **1つの論理モデル（VisualProfile）から投影される値** として扱えるようにする土台を作る。
- **将来拡張の足場**
  - 将来的な「プロファイルの保存/切替UI」「作業シーンごとのプリセット」などに備え、モデル側の責務とUI側の責務を分離する。

---

## 2. 関連する現行機能の整理（2025-11 時点）

- **テーマ/背景色**
  - `ThemeManager`（`js/theme.js`）が `data-theme` 属性と CSS 変数を通じてテーマ・背景色・テキスト色を適用。
  - TypographyThemes ガジェットからプリセット切替/カスタムカラー適用を操作。
- **フォント/行間/サイズ**
  - `ThemeManager.applyFontSettings()` が `--font-family` / `--font-size` / `--line-height` / `--editor-font-size` / `--ui-font-size` を設定。
- **エディタ余白・最大幅**
  - EditorLayout ガジェットがエディタの左右余白や最大幅を制御し、設定は `ZenWriterStorage` に保存。
- **表示モード（UIモード）**
  - 通常/フォーカス/ブランクの3モード（`docs/USAGE.md` に概要あり）。
  - サイドバーやツールバーの見え方、背景の見せ方がモードごとに変化。

> Phase A では、これら既存機能の**上に薄く乗る概念モデル**として Visual Profile を定義し、
> 具体的なコード変更は小さく・後方互換を保つ範囲に限定する想定です。

---

## 3. Phase A のゴール / 非ゴール

### ゴール

- **概念モデル `VisualProfile` の定義**
  - 「1つのプロファイル = 一連の見た目設定」という対応関係を、型/構造として文書化する。
- **既存設定とのマッピング方針の整理**
  - `ZenWriterStorage` の settings と VisualProfile の対応（テーマ名/色/フォント/余白/表示モード）を明文化する。
- **適用フローの骨組みを定義**
  - `applyVisualProfile(profile)` 相当の処理フローを仕様として定義し、ThemeManager 等の既存 API をどの順で呼ぶべきか整理する。

### 非ゴール

- Visual Profile の**完全なUI**（プリセット管理・保存/読込・名前編集など）の実装。
- 既存テーマUIやガジェット構成の大規模な刷新。
- ストレージ形式の破壊的変更（既存 settings の key を変更/削除すること）。

---

## 4. VisualProfile モデル案（概念）

> ここで定義するのは「概念モデル」であり、必ずしもこのままの構造で保存することを意味しません。
> 実装では既存の settings 構造にマッピングする形を想定します。

```ts
// プロファイルID（組み込み + ユーザー定義を許容）
type VisualProfileId = 'default' | 'focus-dark' | 'blank-light' | string;

interface VisualProfile {
  id: VisualProfileId;
  label: string; // UI に表示する名前

  // テーマ/カラー
  theme: string; // 例: 'light' | 'dark' | 'sepia' など既存テーマ名
  useCustomColors: boolean;
  bgColor?: string;
  textColor?: string;

  // フォント/タイポグラフィ
  fontFamily: string;
  uiFontSize: number;      // UI 全体のフォントサイズ
  editorFontSize: number;  // エディタ本文のフォントサイズ
  lineHeight: number;      // 本文行間

  // レイアウト
  editorWidthMode: 'narrow' | 'medium' | 'wide'; // EditorLayout ガジェットの既存設定にマップ

  // 表示モード（UIモード）
  uiMode: 'normal' | 'focus' | 'blank';
}
```

### 既存 settings とのおおまかなマッピング

- `settings.theme` ↔ `profile.theme`
- `settings.useCustomColors` / `settings.bgColor` / `settings.textColor` ↔ `profile.useCustomColors` / `bgColor` / `textColor`
- `settings.fontFamily` / `settings.uiFontSize` / `settings.editorFontSize` / `settings.lineHeight` ↔ フォント/タイポ系のフィールド
- EditorLayout 関連の settings ↔ `profile.editorWidthMode` 等
- 表示モード用 settings（例: `settings.viewMode` 相当） ↔ `profile.uiMode`

※ 正確な key 名やデフォルト値は `js/storage.js` の `DEFAULT_SETTINGS` を参照する想定です。

---

## 5. 適用フロー案 `applyVisualProfile(profile)`

Phase A では、以下のような**呼び出し順と責務の分担**を仕様として定義します（擬似コード）。

```ts
function applyVisualProfile(profile: VisualProfile) {
  // 1) テーマと色
  ZenWriterTheme.applyTheme(profile.theme);
  if (profile.useCustomColors && profile.bgColor && profile.textColor) {
    ZenWriterTheme.applyCustomColors(profile.bgColor, profile.textColor, true);
  } else {
    ZenWriterTheme.clearCustomColors();
  }

  // 2) フォント/行間
  ZenWriterTheme.applyFontSettings(
    profile.fontFamily,
    profile.editorFontSize,   // 後方互換のため editorFontSize をベースに扱う想定
    profile.lineHeight,
    profile.uiFontSize,
    profile.editorFontSize,
  );

  // 3) レイアウト（余白/幅）
  //   EditorLayout ガジェット側に「profile 互換の設定適用」インターフェイスを用意する想定
  //   例: EditorLayout.applyWidthMode(profile.editorWidthMode)

  // 4) 表示モード（UIモード）
  //   既存の表示モード切替処理をラップし、profile.uiMode に応じて切り替える。
  //   例: ZenWriterUI.setViewMode(profile.uiMode)
}
```

- 実装では上記のような関数を **どこに配置するか（ThemeManager 側か、より上位の UI 管理コードか）** を別途検討します。
- `ZenWriterSettingsChanged` イベントは、すでに ThemeManager 周辺で発火しているため、Visual Profile 適用処理でも従来どおり利用します。

---

## 6. ストレージとの関係（Phase A 時点）

- Phase A では、次のような方針をとります。
  - **既存の settings 構造をそのまま維持**し、VisualProfile は「解釈レイヤー」として扱う。
  - 必要であれば `settings.visualProfileId` のような **任意フィールドを追加**し、
    「どのプロファイルからスタートしたか」を記録するが、
    個々のテーマ/フォント/余白設定は引き続きフラットに保存する。
- 将来的な Bフェーズ以降では、
  - プロファイル定義一覧を別ストレージキーで管理する（例: `zenWriter_visualProfiles`）。
  - settings には「現在の状態 = プロファイル + 差分」という関係を明記する。

---

## 7. UI 仕様の方向性（概要）

Phase A では、**フル機能のUIではなく「最小限のプリセットセレクト」**として実装します。

- **配置場所**
  - 左サイドバーの Typography 系パネル内、「テーマ & フォント」ガジェット（TypographyThemes）の一部として、
    小さな `Visual Profile` セクションを追加します。
- **Phase A で実装する UI 要素**
  - プロファイル選択セレクトボックス（例: `標準レイアウト`, `集中レイアウト（ダーク）`, `ブランクレイアウト（ライト）`, `カスタム`）。
  - 選択に応じて、`theme` / `fontFamily` / `editorFontSize` / `uiFontSize` / `lineHeight` / `uiMode` を一括適用します。
  - 既存のテーマボタン・色・フォント/行間スライダはそのまま残り、選択後にユーザーが個別に微調整可能です。
- **ユーザーから見える変化のイメージ**
  - セレクトボックスでプロファイルを切り替えると、
    - テーマ/背景色（プロファイル側で指定されていれば）
    - フォント/行間/サイズ
    - 表示モード
    がまとまって変わり、「執筆モードを切り替えた」感覚を得られます。
- **今後の拡張（Bフェーズ以降の候補）**
  - プロファイル一覧の管理UI（保存/読込/名前変更）。
  - EditorLayout ガジェットの余白・幅設定とのより厳密な連動。
  - ユーザー定義プロファイルと「カスタムとの差分」表示。

---

## 8. 今後のタスク候補（メモ）

- VisualProfile ↔ settings の厳密なマッピング表を作成する。
- EditorLayout ガジェット側に「幅モード」を適用するための薄いラッパー（例: `applyWidthMode`）を定義する。
- 組み込み Visual Profile の案出し（2〜3個）と、それぞれのテーマ/フォント/余白/表示モードの組み合わせを決める。
- Bフェーズ仕様として「プロファイルの保存/読込UI」「プリセット管理」の詳細を詰める。
