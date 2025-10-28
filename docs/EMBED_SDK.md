# EMBED SDK — 埋め込み用エディター設計（v1 草案）

この文書は、Zen Writer を他サイトに埋め込むための SDK 仕様を定義します。既存の `index.html` を変更せず、別機能として提供します。

## 目的

- 外部サイト/サービスに簡単にエディターを埋め込みたい
- 親ページから本文の取得/設定、フォーカス、スナップショット等の基本操作を呼び出したい
- 将来は postMessage でクロスオリジンも安全に扱える API を用意

## アーキテクチャ

- ホスト側（親ページ）: `js/embed/zen-writer-embed.js` を読み込み、`ZenWriterEmbed.create()` で `iframe` を生成
- 子ページ（エディター）: 既存の `index.html` をロード。`?embed=1` パラメータで軽量UIに切替
- 通信: v1 では「同一オリジン最適化 + 将来の postMessage 仕様」を定義（同一オリジン時は直接 API 呼び出しで高速化）

## ホストAPI

```html
<div id="zw-container" style="height:600px"></div>
<script src="js/embed/zen-writer-embed.js"></script>
<script>
  const sdk = ZenWriterEmbed.create('#zw-container', {
    src: '/index.html?embed=1',
    width: '100%',
    height: '100%',
    sameOrigin: true, // クロスオリジンの場合は false
    // クロスオリジン例:
    // sameOrigin: false,
    // targetOrigin: new URL('https://child.example.com/index.html?embed=1', location.href).origin
  });

  // 使用例
  sdk.setContent('# タイトル\n\n本文...').then(() => sdk.focus());
  sdk.getContent().then((text) => console.log(text));
  sdk.takeSnapshot();
</script>
```

### `ZenWriterEmbed.create(target, options)`

- `target`: CSSセレクタまたは要素
- `options`:
  - `src`: 読み込むエディターのURL（既定: 現在の `index.html`）
  - `width`/`height`: `iframe` のサイズ（既定: `100%`）
  - `sameOrigin`: 同一オリジン最適化を使うか（既定: `true`）

戻り値（Promiseではなく同期オブジェクト）:

- `iframe`: 生成された `HTMLIFrameElement`
- `getContent(): Promise<string>`
- `setContent(text: string): Promise<boolean>`
- `focus(): Promise<boolean>`
- `takeSnapshot(): Promise<boolean>`

## postMessage 仕様（将来）

- チャネル: `window.postMessage`
- 子→親: `ZW_EMBED_READY`, `ZW_CONTENT_CHANGED`, `ZW_SNAPSHOT_CREATED`
- 親→子: `ZW_GET_CONTENT`, `ZW_SET_CONTENT`, `ZW_FOCUS`, `ZW_TAKE_SNAPSHOT`, `ZW_SET_THEME`
- すべて `{ type, requestId?, payload }` 形式。返信は `{ type: 'ZW_RESPONSE', requestId, ok, result?, error? }`

## セキュリティ

- クロスオリジン時は `targetOrigin` を厳密指定（親→子の postMessage 送信先origin）
- 親originを子へ伝えるため、`iframe src` に `embed_origin=<親のorigin>` を自動付加（既定ON）。子側は `event.origin === embed_origin` の場合のみ受理
- 許可するメッセージ `type` をホワイトリスト制御

## 軽量化（`?embed=1`）

- 目的: 埋め込み先のページでの初期ロードを軽くし、必要最小限のUIのみ表示
- UI: `html[data-embed="true"]` によりサイドバー/ツールバー等を非表示、エディタを全画面化（`css/style.css`）
- フォント: 埋め込み時は Google Fonts を読み込まない（非埋め込み時のみ `preconnect` + stylesheet を動的追加）
- プラグイン: `js/plugins/*.js` は非埋め込み時のみ動的ロード
- ブリッジ: `js/embed/child-bridge.js` は常に同梱するが、`?embed=1` のときのみ postMessage リスナーが有効化

## イベント通知 / 購読（v1）

- 子→親の通知イベントを購読できます。
  - `contentChanged`: 本文が変更されたとき（入力中・`setContent()` 実行後など）。payload: `{ len: number }`
  - `snapshotCreated`: スナップショットが作成されたとき

```html
<script>
  const sdk = ZenWriterEmbed.create('#zw-container', {
    src: '/index.html?embed=1',
    width: '100%',
    height: '100%',
  });
  // 購読（解除関数が返る）
  const offContent = sdk.on('contentChanged', (p) => {
    console.log('contentChanged len=', (p && p.len) || 0);
  });
  sdk.on('snapshotCreated', () => {
    console.log('snapshotCreated');
  });
  // 解除例: offContent();
</script>
```

注意:

- クロスオリジン時は、親→子の送信先 `targetOrigin` を厳密指定し、子→親の受信側では `event.origin` を検証します。
- `embed_origin` は親の `origin` を子へ伝えるために `iframe src` に付与されます（既定ON）。
- デモ: `embed-demo.html` ではイベントログ（右ペイン下部）で受信内容を確認できます。

## 今後

- `index.html` に `?embed=1` で軽量UI（サイドバー/ツールバー最小化、HUDのみ）
- ドキュメント間管理/エクスポート等のAPI拡張
