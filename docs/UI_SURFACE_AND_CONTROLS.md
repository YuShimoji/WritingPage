# UI Surface and Controls

**用語の正本**: UI 状態モデルは `docs/INTERACTION_NOTES.md`、挙動上の不変条件は `docs/INVARIANTS.md` を正とする。本ファイルは DOM 表面と操作入口の台帳に限定する。

## 現行モデル

| 軸 | 現行の扱い |
|----|------------|
| `top chrome` | hidden が既定。`F2` / Electron menu / command palette で明示表示する一時シェル |
| left nav | 通常時は root rail を完全非表示にし、left edge hover で fade-in する `root/category` 階層。category では active category を左上固定 |
| 再生オーバーレイ | `data-reader-overlay-open` で開閉する読者視点確認 surface。UI mode ではない |
| UI mode | 内部互換 API として `normal` / `focus` を保持。公開 UI の第一級概念にしない |
| 編集面 | Markdown source / rich edit / preview 系の作業面。再生オーバーレイとは同時操作しない |

## Surface 台帳

| Surface | 主な DOM / controller | 役割 |
|---------|----------------------|------|
| top chrome | `#top-chrome`, `js/top-chrome-controller.js` | 一時的な shell 操作・window controls・drag lane |
| left nav root | `#sidebar-left-nav`, `#sidebar-edge-rail` | edge hover 時のみ category 一覧と last active cue を表示 |
| left nav category | `#sidebar-nav-back`, `#sidebar-nav-anchor`, `#sidebar-accordion` | back icon は root 復帰、anchor icon/label は active category の表示専用、panel / gadget loadout を表示 |
| sidebar gadget body | `.gadget`, `.gadget-body` | shell token・collapse affordance・ARIA 同期を共有 |
| Documents | `js/gadgets-documents-hierarchy.js` | document tree と `+ 文書` / `+ フォルダ` / `保存` / `入出力` / `管理` controls |
| Story Wiki | `js/story-wiki.js` | `+ Wikiページ` でページ作成。shell token と gadget collapse 契約に従う |
| Link Graph | `js/link-graph.js` | sidebar 内で横 overflow 前提にしない graph surface |
| command palette | `js/command-palette.js` | visible command の集約先 |
| replay surface | `js/reader-preview.js` | 読者視点確認と HTML export |

## Action Label Lanes

| Lane | 表記 | 対象 |
|------|------|------|
| 文書作成 | `+ 文書` / `+ フォルダ` | Documents tree |
| 本文保存 | `保存` / `保存（手動・即時）` | 現在の Editor 本文 |
| 入出力 | `TXT書き出し` / `JSON書き出し` / `JSON読み込み` | ファイル入出庫 |
| Wiki作成 | `+ Wikiページ` | Story Wiki entry |
| 構成作成 | `+ 構成プリセット` | Outline level preset |
| 視覚設定 | `プロファイル適用` / `プロファイル保存` / `プロファイル削除` | Visual Profile |
| ガジェット構成 | `ロードアウト保存` / `ロードアウト複製` / `ロードアウト適用` / `ロードアウト削除` | LoadoutManager |

## 操作入口

| 操作 | 正の入口 | 補助入口 |
|------|----------|----------|
| top chrome 表示 | `F2` | command palette / Electron menu |
| left nav root へ戻る | `#sidebar-nav-back` | command palette / Electron menu |
| category 表示 | left edge hover 後の root category button | command palette の gadget jump |
| 再生オーバーレイ | command palette / shell UI | shortcut / existing replay control |
| 設定 | command palette `open-settings` / `Ctrl+,` | focus-side settings entry |
| ヘルプ | command palette `open-help` / `F1` | help modal controller |

## 更新原則

1. 公開 UI 判断で `display mode` を主語にしない。
2. 再生オーバーレイを第 3 の UI mode に戻さない。
3. left nav category の label / icon / panel / gadget loadout は必ず同じ対象を指す。
4. one-off style を増やさず、sidebar / gadget / documents controls は shell token に寄せる。
5. 入口を増やす前に command palette または既存 shell surface へ集約できないか確認する。
