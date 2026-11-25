# Zen Writer サンプルファイル

エディタに読み込んで各機能を確認するためのサンプル集です。

## プロジェクトファイル (.zwp.json)

左端の「原稿」を開き、「入出力」→「JSON読み込み」からファイルを選びます。

| ファイル | 内容 | 確認できる機能 |
|----------|------|----------------|
| sample-novel-chapters.zwp.json | 3章構成の短編小説 | 章管理, 章切替, 再生オーバーレイ章ナビ, ルビ, 傍点, Wikilink |
| sample-effects-showcase.zwp.json | 装飾・演出の全種サンプル | テキストアニメ, テクスチャ, テキストボックス, タイピング演出, ダイアログ, 再生オーバーレイ |
| sample-file-management.zwp.json | ファイル管理操作ガイド | インポート/エクスポート, フォルダ作成, D&D移動, スナップショット, 複数選択削除 |
| sample-wp004-parity-pack.zwp.json | WP-004 手動パック専用の 5 章サンプル | chapter:// 相互リンク, textbox 複合, typing/dialog + ルビ, broken wikilink, Reader genre preset 手動比較 |
| [七人目の渡し賃](ash-ferry-inquiry.zwp.json) | NarrativeGenで遊んだ聞き込み経路 | 話者別の場面、話題と旅の手帳の開閉、5章の目次 |
| [玄武岩砦の当番帳](basalt-watch.zwp.json) | [Boatmurdered](https://lparchive.org/Dwarf-Fortress-Boatmurdered/) を参考にした架空の日記 | 3人の担当交代、見取り図、開いて読める伝言 |
| [雨の日、窓辺の席](lamp-in-the-window.zwp.json) | [Alice and Kev](https://aliceandkev.wordpress.com/2009/06/09/alice-and-kev/) を参考にした架空の日記 | 時刻順の観察、2枚の挿絵とキャプション |
| [北堰の十二年](twelve-years-at-the-dam.zwp.json) | [The Eternal War](https://www.reddit.com/r/gaming/comments/uxpil/ive_been_playing_the_same_game_of_civilization_ii/) を参考にした架空の日記 | 4時点の比較図、判断が分かれた2人の聞き込み、数値の記録 |

## Markdown サンプル (.md)

コピー&ペーストでエディタに取り込みます。

| ファイル | 内容 | 確認できる機能 |
|----------|------|----------------|
| full-feature-showcase.md | 全機能を一つにまとめたショーケース | 見出しH1-H6, テキスト装飾, リスト, 引用, コード, ルビ(2記法), 傍点, テキストボックス4種, テキストアニメ4種, テクスチャ, タイピング演出, ダイアログ3配置, セクションリンク, 長文テスト |
| gamebook-branch-demo.md | ゲームブック形式の分岐小説 | セクションリンク, 章間ナビ, 分岐構造, 引用ブロック, 4エンディング |
| wiki-and-chapters-demo.md | Wikilink活用の物語 | `[[wikilink]]`, チャプター構造, テキストボックスプリセット, ルビ, 傍点, 用語管理 |
| heading-typography-novel.md | 小説向け見出し構成 | H1-H4の見出し階層, 小説的な節構成 |
| heading-typography-scenario.md | シナリオ向け見出し構成 | シナリオ/脚本形式の見出し |
| web-novel-effects-demo.md | Web小説演出統合デモ | タイピング3モード, ダイアログ4スタイル, スクロール連動4種, テクスチャ, テキストボックス4プリセット, ルビ, 傍点 |
| gamebook-styled-demo.md | ゲームブック分岐スタイルデモ | 分岐スタイル3種(default/card/button), ダイアログ, タイピング, スクロール, テキストボックス, テクスチャ |

## 使い方

### .zwp.json ファイル

1. `npm run dev` でエディタを起動
2. 左端の「原稿」で「入出力」→「JSON読み込み」を選び、サンプルファイルを開く
3. Alt+Shift+R で読者表示を開く。「HTMLとして保存」でブラウザだけで読めるファイルを保存

### .md ファイル

1. `npm run dev` でエディタを起動
2. サンプルファイルの内容をコピー
3. エディタにペースト
4. WYSIWYGモードとプレビューで表示を確認
5. 再生オーバーレイ (コマンドパレット Ctrl+P > 再生) でタイピング演出・ダイアログを確認

## 注意

- タイピング演出 (`:::zw-typing`) とダイアログ (`:::zw-dialog`) は再生オーバーレイで動作します
- テキストアニメーション (`[shake]`, `[fade]` 等) はWYSIWYGで即時表示されます
- Wikilink (`[[用語]]`) は Story Wiki にエントリを登録すると自動リンクされます
- .zwp.json のインポートは新しいドキュメントとして作成されます（既存データは上書きされません）
