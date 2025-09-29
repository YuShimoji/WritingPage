# EMBED_TESTING — 埋め込みSDK検証手順（様式）

この文書は、`embed-demo.html` および `ZenWriterEmbed` SDK の機能を体系的に検証するための標準手順（テンプレート）です。

## 前提
- Node.js がインストール済み
- 開発サーバー: `node scripts/dev-server.js`
- テスト対象URL:
  - アプリ本体: `http://127.0.0.1:8080/index.html`
  - 埋め込みデモ: `http://127.0.0.1:8080/embed-demo.html`

## 起動
1. ターミナルで開発サーバーを起動
   - `node scripts/dev-server.js`
2. ブラウザで `embed-demo.html` を開く
   - ページタイトル: "Zen Writer Embed Demo"
   - 左側に iframe（埋め込みエディター）、右に操作パネルが表示される
3. デベロッパーツール/コンソールでエラーが無いこと
   - favicon 404 が出ないこと（`/favicon.ico` は `favicon.svg` にフォールバックされます）

## 機能テスト（同一オリジンモード）
- すべての操作はデモページ右ペインのボタンから実施します。

### 1) setContent()
- 手順
  - テキストエリアに任意の本文を入力し、[setContent()] をクリック
- 期待結果
  - iframe 内のエディターに本文が反映される
  - 直後にエディターへフォーカス移動を実施する場合は [focus()] を続けて実行

### 2) getContent()
- 手順
  - [getContent()] をクリック
- 期待結果
  - iframe 内の本文が右ペインの `pre#out` に表示される

### 3) focus()
- 手順
  - [focus()] をクリック
- 期待結果
  - iframe 内の `textarea#editor` がフォーカスを得る

### 4) takeSnapshot()
- 手順
  - [takeSnapshot()] をクリック
- 期待結果
  - iframe 側の LocalStorage にスナップショットが1件追加される（アプリ本体のサイドバー「バックアップ」一覧に反映）
  - デモでは成功後にアラートが表示される

## 埋め込みモード（?embed=1）最小UI
- 仕組み
  - `index.html` はクエリ `?embed=1` を検出すると、`<html data-embed="true" data-toolbar-hidden>` を設定
  - `css/style.css` の `html[data-embed="true"]` セレクタにより、サイドバー/ツールバー等が非表示化
- 確認
  - iframe の `src` が `/index.html?embed=1` であること
  - エディターのみの最小UIで表示されること

## SDK とアプリのブリッジ
- 安定API: `window.ZenWriterAPI`
  - `getContent()` / `setContent(text)` / `focus()` / `takeSnapshot()`
- SDK 側（`js/embed/zen-writer-embed.js`）の挙動
  - 同一オリジン時は `ZenWriterAPI` を優先利用
  - 未定義時のフォールバックとして、従来の `ZenWriterEditor` / `ZenWriterStorage` にアクセス
  - クロスオリジン（将来）は postMessage 実装で対応予定

### クロスオリジン時のセキュリティ注記（v1 実装済み）
- 親→子: `ZenWriterEmbed.create()` は `iframe src` に `embed_origin=<親origin>` を自動付与（既定ON）
- 子→親: `js/embed/child-bridge.js` は `event.origin === embed_origin` の場合のみメッセージを受理
- 親→子のRPC送信: cross-origin では `options.targetOrigin` の指定が必須
- これらにより、許可されたオリジン間でのみ postMessage が機能します

## 失敗時の対処
- iframe が READY にならない
  - `index.html` が完全に読込済みか（ネットワーク/コンソール）
  - `?embed=1` で強制的にツールバー非表示になっているか
  - `ZenWriterAPI` がウィンドウに公開されているか（`child.contentWindow.ZenWriterAPI`）
- get/set/focus/takeSnapshot が失敗する
  - 同一オリジンか（デモは同一オリジン）
  - `js/app.js` が正しく読み込まれているか
  - API 呼び出し前に `await sdk.<method>()` で準備を待っているか

## 回帰チェック
- `css/style.css` や `index.html` に変更を加えた場合、埋め込みモードの最小UIが維持されること
- `js/app.js` の内部構造が変わっても `ZenWriterAPI` のシグネチャは維持されること

---
更新履歴
- v1: 初版作成（同一オリジン向け）。クロスオリジン対応は今後の postMessage 実装で追加予定。

## 付録: クロスオリジン実機テスト（2ポート）

同一マシンで 2 つのローカルポートを使って、親(8080) → 子(8081) のクロスオリジン挙動を確認できます。

### サーバー起動

- 既定の 8080 で親を起動
  - `node scripts/dev-server.js`
- 子側を 8081 で起動
  - `node scripts/dev-server.js --port 8081`

補足: `scripts/dev-server.js` は `PORT` 環境変数、`--port/-p` 引数、数値単独引数のいずれでもポート指定可能です。

### デモページ

- 親側（8080）で以下を開く
  - `http://127.0.0.1:8080/embed-xorigin-demo.html`
  - iframe の `src` は `http://127.0.0.1:8081/index.html?embed=1`
  - SDK オプションは `sameOrigin:false`、`targetOrigin: 'http://127.0.0.1:8081'`

### 確認ポイント

- ボタン操作
  - setContent()/getContent()/focus()/takeSnapshot() が成功すること
- イベント
  - 右ペインの Events に `contentChanged` / `snapshotCreated` が表示されること
  - 入力や setContent() 実行で `contentChanged len=...` が更新されること
- セキュリティ
  - `embed_origin` が iframe の URL に付与される（親の origin）
  - 子は `event.origin === embed_origin` の場合のみメッセージを受理
  - 親→子の RPC は `targetOrigin` に 8081 を指定して送信

### トラブルシュート

- 8080 が既に使用中
  - 別ターミナルで起動していないか確認、もしくは `--port 8082` などに変更
- READY にならない
  - 8081 側の `index.html` が正常に配信・表示されているか（ネットワーク/コンソール）
