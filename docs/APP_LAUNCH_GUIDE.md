# アプリケーション起動手順書

Zen Writer v0.3.32

## 目次

1. [開発モードで起動](#開発モードで起動)
2. [Electronアプリとして起動](#electronアプリとして起動)
3. [PWAとしてインストール](#pwaとしてインストール)
4. [トラブルシューティング](#トラブルシューティング)

---

## 開発モードで起動

### Web版（開発サーバー）

最も簡単な起動方法です。ブラウザでアクセスします。

```bash
# 開発サーバーを起動（ポート8080）
npm run dev

# ブラウザで開く
# http://localhost:8080
```

**特徴：**

- ホットリロード対応
- 最新の変更を即座に反映
- ブラウザの開発者ツールが使用可能

### 同一オリジン＋クロスオリジンテスト用

埋め込みSDKのテスト用に2つのサーバーを同時起動します。

```bash
# 2つのサーバーを起動（ポート8080、8081）
npm run dev:two
```

---

## Electronアプリとして起動

### 方法1：開発モードで即座に起動

```bash
# Electronウィンドウで開く
npm run electron:dev
```

**特徴：**

- デスクトップアプリとして動作
- ネイティブメニュー、ウィンドウ制御
- 開発者ツール利用可能

### 方法2：ビルドしてから起動

```bash
# packaged app をビルド
npm run build
npm run electron:build

# ビルド済み packaged app を安全に開く
npm run app:open
```

`npm run app:open` は Windows ホスト（PowerShell / WSL 含む）では
`build/win-unpacked/Zen Writer.exe` を優先し、起動前に
`NODE_OPTIONS` / `ELECTRON_RUN_AS_NODE` / Playwright 系環境変数をクリアします。
さらに、この repo 由来の `playwright-core/lib/server/electron/loader` を抱えた stray
`electron.exe` を終了してから packaged app を開きます。
Playwright 検証後でも packaged app を汚染なしで起動するための正本導線です。
コマンドプロンプトから実行しても hidden PowerShell を同期実行するため、
起動失敗が黙って握りつぶされず、packaged app が実際に開く状態を優先します。

dist の `index.html` を直接開きたいときだけ、次を使います。

```bash
npm run app:open:dist
```

### 方法3：インストーラー作成

Windows用の配布可能なアプリを作成します。

```bash
# ビルド＋インストール＋スタートメニューショートカット
npm run app:install

# インストール後に起動
npm run app:install:open
```

**出力先：** `build/win-unpacked/`

---

## PWAとしてインストール

### ローカルホストでPWAをインストール

1. 開発サーバーを起動

   ```bash
   npm run dev
   ```

2. Chrome/Edgeで `http://localhost:8080` を開く

3. アドレスバー右端の「インストール」アイコンをクリック

4. インストール完了後、スタンドアロンウィンドウで起動

### HTTPSサーバーでPWAをテスト

PWAは通常HTTPSが必要ですが、localhostは例外です。本番環境では以下を確認：

- Service Workerが正常に登録されているか
- manifest.webmanifestが正しく読み込まれているか
- アイコンが表示されるか

---

## 動作確認チェックリスト

アプリを起動したら、以下を確認してください：

### 基本機能

- [ ] エディタにテキストを入力できる
- [ ] 文字数カウントが表示される
- [ ] サイドバーを開閉できる
- [ ] top chrome を `F2` で表示できる
- [ ] left nav を root → category → root の順に操作できる
- [ ] 再生オーバーレイを開閉できる

### 統合シェル UI

- [ ] 常用上部バーや上端 handle が残っていない
- [ ] command palette から shell 操作へ到達できる
- [ ] gadget controls / fields / scrollbars が unified shell の見た目に揃っている

### テーマ

- [ ] ダークモード/ライトモード切り替えが動作する
- [ ] テーマ色が正しく適用される

### 保存

- [ ] LocalStorageにテキストが保存される
- [ ] リロード後もテキストが復元される

---

## トラブルシューティング

### Q: 開発サーバーが起動しない

**A:** ポート8080が既に使用されている可能性があります。

```bash
# Windowsでポート使用状況を確認
netstat -ano | findstr :8080

# プロセスを終了
taskkill /PID <プロセスID> /F
```

### Q: Electronアプリが起動しない

**A:** Electronがインストールされていない可能性があります。

```bash
# 依存関係を再インストール
npm ci
```

### Q: packaged app で `playwright-core` や `JavaScript error in the main process` が出る

**A:** アプリ本体ではなく、Playwright の Electron preload や `NODE_OPTIONS`、
あるいは残留した `electron.exe -r ...playwright-core/lib/server/electron/loader.js`
が起動環境へ混入している可能性があります。`npm run app:open` はこれらを片付けてから
packaged app を再起動する正本導線です。

### Q: packaged app 起動時に `¥¥ が見つかりません` のような Windows エラーが出る

**A:** `cmd /c start` 経由の quoting 崩れが原因になりやすいです。
Windows では `npm run app:open` の PowerShell `Start-Process` 経路を正本とし、
手動で `cmd /c start` を組み立てないでください。

### Q: コマンドプロンプトから `npm run app:open` しても、エラーなく何も開かない

**A:** hidden PowerShell を detached で投げると、`cmd.exe` 配下では起動前に失敗が
黙って消えることがあります。現在の `npm run app:open` は packaged launcher を
同期実行するので、コマンドプロンプトからでも起動結果が反映されます。

### Q: PWAがインストールできない

**A:** 以下を確認してください：

1. HTTPSまたはlocalhostでアクセスしているか
2. Service Workerが正常に登録されているか（開発者ツール→Application→Service Workers）
3. manifest.webmanifestが正しく読み込まれているか

### Q: Service Workerのキャッシュをクリアしたい

**A:** URLパラメータでキャッシュをクリアできます。

```
http://localhost:8080?clearCache=1
```

または、開発者ツールでUnregisterします：

1. F12 → Application → Service Workers
2. Unregister をクリック
3. Application → Storage → Clear site data

### Q: LocalStorageをリセットしたい

**A:** URLパラメータでリセットできます。

```
http://localhost:8080?reset=1
```

---

## スクリプト一覧

| スクリプト | 説明 |
|-----------|------|
| `npm run dev` | 開発サーバー起動（ポート8080） |
| `npm run dev:two` | 2サーバー起動（8080、8081） |
| `npm run electron:dev` | Electronアプリ起動（開発モード） |
| `npm run electron:build` | Electronアプリビルド（dir出力） |
| `npm run electron:dist` | Electronアプリビルド（配布版） |
| `npm run build` | dist版作成 |
| `npm run app:open` | packaged app を安全に起動 |
| `npm run app:open:package` | packaged app を明示起動 |
| `npm run app:open:dist` | dist/index.html を直接開く |
| `npm run app:install` | インストール＋ショートカット作成 |
| `npm run app:install:open` | インストール＋起動 |

---

## 開発環境

- **Node.js**: v22.19.0
- **Electron**: v35.0.0
- **対応OS**: Windows 11 Home 10.0.26200

---

## 次のステップ

- [アプリ仕様書](APP_SPECIFICATION.md) - 機能一覧と動作環境
- [アーキテクチャ](ARCHITECTURE.md) - 技術的な詳細
