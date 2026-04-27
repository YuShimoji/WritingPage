# 手動テストガイド

Zen Writer の全機能を一通り確認するための手順書。サンプルプロジェクトと組み合わせて使う。

最終更新: 2026-04-27 (統合シェル UI / stale mode 導線の降格)

## 0. package / Electron 固有の最小確認

対象 build: `build/win-unpacked/Zen Writer.exe`

推奨起動:

```bash
npm run app:open
```

Windows ではこの経路が packaged app の正本起動です。`NODE_OPTIONS` /
`ELECTRON_RUN_AS_NODE` / Playwright 系環境変数を落としてから PowerShell
`Start-Process` で起動します。

この節は Web E2E の代替ではなく、**package でしか確定できない項目だけ**を確認する。

- [ ] 起動直後、top chrome は hidden で上端バー / seam / visible handle が残らない
- [ ] `F2` で top chrome が表示され、drag lane / window controls / shell 操作がまとまって見える
- [ ] `Escape` または外側操作で top chrome が閉じ、hidden 状態へシームレスに戻る
- [ ] Electron menu の `シェル` 系項目から top chrome / left nav / Reader surface に到達できる
- [ ] top chrome hidden の通常執筆状態で、左上 window grip からウィンドウを移動できる
- [ ] drag lane でウィンドウを移動できる
- [ ] left nav を root → category → root の順に操作でき、active category の label / icon / panel / gadget loadout が一致する
- [ ] Reader 右上ボタン群が重ならず操作できる
- [ ] Sections が空のとき、現在の状態と理由が読める
- [ ] preview を開いたとき、空なら理由が表示される
- [ ] アプリ終了 → 再起動後に直前状態が不自然に失われない
- [ ] Windows DPI / zoomFactor / 枠込み描画差で操作不能にならない

記録形式:

- `PASS`: 期待どおり
- `FAIL`: 再現手順 / 実際の結果 / 期待結果 / Webとの差分
- `HOLD`: package では見えたが仕様判断待ち

## 1. 環境準備

```bash
npm run dev
```

ブラウザで `http://127.0.0.1:8080` を開く。

初回起動時の期待状態:
- top chrome: hidden
- left nav: root または直前状態を復元
- 編集面: リッチ編集表示

## 2. サンプル読み込み

1. left nav root から「構造」カテゴリを開く
2. Documents の「入出力」メニュー > 「JSON読み込み」
3. `samples/sample-novel-chapters.zwp.json` を選択
4. ドキュメント一覧に「月の裏側 - 章管理サンプル」が追加されることを確認

## 3. 執筆フロー

サンプル「月の裏側」を開いた状態で確認。

### 3.1 基本入力

- [ ] リッチ編集表示で日本語テキストを入力できる
- [ ] 改行 (Enter) で新しい段落が作られる
- [ ] Undo (Ctrl+Z) / Redo (Ctrl+Shift+Z) が機能する

### 3.2 テキスト装飾

- [ ] テキスト選択 > Ctrl+B で太字
- [ ] テキスト選択 > Ctrl+I で斜体
- [ ] フローティングツールバーから下線・取り消し線を適用

### 3.3 ルビ・傍点

サンプル内に含まれるルビ表示を確認:
- [ ] `|漢字《かんじ》` がルビ付きで表示される
- [ ] 傍点が正しく表示される

### 3.4 Wikilink

サンプル内の `[[篠宮遥]]` `[[旧図書館]]` 等を確認:
- [ ] Wikilink がリンクとして表示される
- [ ] Story Wiki にエントリを登録すると、リンクがアクティブになる

### 3.5 テキストアニメーション・テクスチャ

`samples/sample-effects-showcase.zwp.json` を読み込んで確認:
- [ ] `[fade]`, `[shake]`, `[pulse]`, `[bounce]` がリッチ編集表示で動作する
- [ ] `[shadow]`, `[outline]`, `[glow]` が表示される
- [ ] テキストボックス (4 プリセット) が枠付きで表示される

### 3.6 タイピング演出・ダイアログ

sample-effects-showcase の「再生オーバーレイ演出」章で確認:
- [ ] コマンドパレット (Ctrl+P) > 「再生」で再生オーバーレイを開く
- [ ] `:::zw-typing` がタイピングアニメーションで表示される
- [ ] `:::zw-dialog` が会話ボックスとして表示される
- [ ] 速度指定 (fast/slow) が反映される
- [ ] 左/右/中央配置が反映される

### 3.7 WP-004 parity pack

`samples/sample-wp004-parity-pack.zwp.json` を別ドキュメントとして読み込み、MD プレビューと Reader を並べて確認する。差分があれば `docs/WP004_PHASE3_PARITY_AUDIT.md` に 1 行追記する。

| 章 | MD preview で見る点 | Reader で見る点 | 差分の記録先 |
|----|---------------------|-----------------|--------------|
| `01 chapter-link+nav` | `chapter://` リンクが章リンクとして整形され、見出し順が崩れない | リンク遷移と章末ナビ `前へ / 次へ` が素直に繋がる | `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| `02 textbox combo` | `:::zw-textbox{preset:"inner-voice", tilt:3, anim:pulse}` と `[italic]...[/italic]` の組み合わせが崩れない | 同じ textbox の枠・傾き・装飾が Reader でも揃う | `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| `03 typing+dialog+ruby` | `:::zw-typing` / `:::zw-dialog` 内のルビが preview で読める | タイピング演出とダイアログの中でもルビ位置が揃う | `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| `04 broken wikilink` | broken wikilink が未登録リンクとして見分けられる | クリック時に未登録メッセージのポップオーバーが出て閉じられる | `docs/WP004_PHASE3_PARITY_AUDIT.md` |
| `05 genre preset probe` | 基本文字組が崩れず dialog / typing ブロックが並ぶ | Reader のジャンルを `ADV / ビジュアルノベル` に切り替え、暗色 dialog と typing の見え方を確認する | `docs/WP004_PHASE3_PARITY_AUDIT.md` |

## 4. 章管理

サンプル「月の裏側」(3 章構成) で確認。

- [ ] left nav の「セクション」カテゴリで章リストが表示される
- [ ] 章をクリックして切替できる
- [ ] 「+ 新しい章」で空タイトルの章を追加でき、保存値に `新しい章` というテンプレート文字列が入らない
- [ ] 章名をダブルクリックでリネームできる
- [ ] 右クリックメニューで削除・複製できる
- [ ] ドラッグ&ドロップで章の順序を変更できる

### 4.1 再生オーバーレイでの章ナビ

- [ ] 再生オーバーレイを開くと全章が連結表示される
- [ ] 章末に「前へ / 次へ」ナビゲーションが表示される

## 5. 統合シェル UI

### 5.1 top chrome

- [ ] 起動直後は top chrome が hidden で、上端 hover だけでは表示されない
- [ ] F2 で top chrome が表示され、フォーカスが shell 操作へ移る
- [ ] Escape / 外側クリックで top chrome が閉じる
- [ ] hidden 時に上部バー・seam・常設 handle が残らない
- [ ] hidden 時も左上 window grip が Electron frameless window の移動導線として使える

### 5.2 left nav

- [ ] 通常時は左アイコン列が完全に隠れ、左端 hover で root rail が fade-in して6カテゴリが確認できる
- [ ] root からカテゴリを選ぶと、active category が左上固定で表示される
- [ ] 非 active category は fade-out 後に hit-test 対象にならない
- [ ] category から root に戻れる
- [ ] `sections` は「セクション」+ `list-tree` + `sections-gadgets-panel` + SectionsNavigator に対応する
- [ ] `structure` は「構造」+ `file-text` + `structure-gadgets-panel` + Documents / Outline / StoryWiki / LinkGraph 系に対応する

### 5.3 再生オーバーレイ

- [ ] コマンドパレット > Reader surface の開閉 command で開く
- [ ] 「編集に戻る」ボタンで閉じる
- [ ] 閉じた後、top chrome / left nav の状態が不自然に変化しない
- [ ] 縦書き/横書き切替ボタンが機能する

## 6. テーマ・見た目

left nav > テーマ カテゴリで確認。

### 6.1 テーマ切替

- [ ] ライト / ダーク / ナイト / セピア / 高コントラスト / ソラリゼド の 6 テーマ
- [ ] 切替後にエディタ・left nav・top chrome の色が変わる

### 6.2 フォントサイズ

- [ ] Ctrl++ / Ctrl+- でフォントサイズ増減
- [ ] Ctrl+0 でリセット
- [ ] Typography ガジェットのスライダーで変更

### 6.3 見出しスタイル

- [ ] HeadingStyles ガジェットでプリセットを切替
- [ ] 見出しの装飾 (下線・中央揃え等) が変わる

### 6.4 Visual Profile

- [ ] VisualProfile ガジェットで行間・段落間隔を調整

## 7. ファイル管理

`samples/sample-file-management.zwp.json` を読み込んで手順に従う。

### 7.1 ドキュメント操作

- [ ] 「+ 文書」ボタンで新規ドキュメント作成
- [ ] ドキュメント名をダブルクリックでリネーム
- [ ] ドキュメント一覧でクリックして切替

### 7.2 フォルダ操作

- [ ] 「+ フォルダ」ボタンでフォルダ作成
- [ ] ドキュメントをフォルダにドラッグ&ドロップ
- [ ] フォルダの折りたたみ/展開

### 7.3 エクスポート/インポート

- [ ] 「入出力」> JSON書き出し で .zwp.json がダウンロードされる
- [ ] 「入出力」> JSON読み込み でファイルを選択してインポート
- [ ] インポート後、新しいドキュメントとして追加される
- [ ] 「入出力」> TXT書き出し でプレーンテキストがダウンロードされる

### 7.4 スナップショット

- [ ] バックアップガジェットの「今すぐ保存」でスナップショット作成
- [ ] スナップショット一覧に日時・文字数が表示される
- [ ] スナップショットをクリックしてプレビュー
- [ ] 「復元」で本文がスナップショット時点に戻る

### 7.5 複数選択・一括削除

- [ ] 「管理」> 複数選択でチェックボックスモード
- [ ] 複数ドキュメントを選択
- [ ] 一括削除ボタンで削除

### 7.6 手動保存

- [ ] Ctrl+S で保存が実行される (HUD に通知)
- [ ] コマンドパレット > 「保存」でも同様

## 8. ガジェット確認チェックリスト

left nav root から各カテゴリを開いて確認。`Normal` / `Focus` の切替確認として扱わず、category ごとの panel / gadget loadout 対応を見る。

### セクション
- [ ] SectionsNavigator: 見出しツリーが表示され、クリックでジャンプ

### 構造
- [ ] Documents: ドキュメント一覧・文書作成・フォルダ作成・保存・入出力・管理
- [ ] Outline: `+ 構成プリセット` が文書作成と混同しない
- [ ] StoryWiki: `+ Wikiページ` でエントリ追加・検索・カテゴリ管理
- [ ] TagsAndSmartFolders: タグ付け・スマートフォルダ
- [ ] SnapshotManager: バックアップ保存・復元

### 編集
- [ ] MarkdownPreview: MD プレビュー表示
- [ ] FontDecoration: フォント装飾パネル
- [ ] TextAnimation: テキストアニメーションパネル
- [ ] Images: 画像挿入
- [ ] ChoiceTools: 選択肢・分岐

### テーマ
- [ ] Themes: テーマ切替
- [ ] Typography: フォント・行間
- [ ] HeadingStyles: 見出しスタイル
- [ ] VisualProfile: `プロファイル適用` / `プロファイル保存` / `プロファイル削除`

### 補助
- [ ] Typewriter: タイプライターモード (カーソル中央固定)
- [ ] FocusMode: フォーカスモード設定
- [ ] WritingGoal: 執筆目標 (文字数・時間)
- [ ] HUDSettings: HUD の表示設定
- [ ] PomodoroTimer: 集中タイマー
- [ ] MarkdownReference: Markdown 記法リファレンス

### 詳細設定
- [ ] UISettings: UI 設定 (改行効果等)
- [ ] EditorLayout: エディタレイアウト
- [ ] LoadoutManager / GadgetPrefs: 標準 preset には出ず、custom loadout で明示した場合だけ利用できる
- [ ] Keybinds: キーボードショートカット設定
- [ ] PrintSettings: エクスポート (印刷/TXT)
- [ ] LinkGraph: Wiki 関係図

## 9. コマンドパレット

Ctrl+P で開き、以下のコマンドを実行:

- [ ] 「検索」 > 検索パネルが開く
- [ ] 「保存」 > 保存実行
- [ ] 「トップクロームを表示」 > top chrome が表示される
- [ ] 「左ナビのルートへ戻る」 > category から root に戻る
- [ ] Reader surface の開閉 command > 再生オーバーレイ開閉
- [ ] 「フォントサイズ拡大」 > フォントサイズ増
- [ ] 「補助」 > left nav の補助カテゴリを展開
- [ ] 「詳細設定」 > left nav の詳細設定カテゴリを展開

## 10. ロードアウト

left nav > 詳細設定 > ロードアウト管理 で確認。

- [ ] 「小説・長編」プリセット: 全ガジェット搭載
- [ ] 「ミニマル」プリセット: 必要最小限
- [ ] 「ビジュアルノベル」プリセット: 画像・選択肢あり
- [ ] 「脚本・シナリオ」プリセット: 脚本向け構成
- [ ] `ロードアウト保存` / `ロードアウト複製` / `ロードアウト適用` / `ロードアウト削除` が本文保存と混同しない
- [ ] プリセット切替後、left nav category のガジェット構成が変わる

## 11. 未実装機能 (確認不要)

以下は現時点で未実装のため、テスト対象外:

- Markdown (.md) ファイルの直接インポート
- Google Keep 連携
- EPUB/DOCX エクスポート
- OAuth / クラウド同期

## 判定基準

- PASS: 期待結果を満たし、操作に問題なし
- FAIL: 期待結果未達、またはエラー・表示崩れ
- HOLD: 仕様未確定で保留
