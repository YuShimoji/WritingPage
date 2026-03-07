# アプリケーション起動手順書

Zen Writer v0.3.29

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
# 開発サーバーを起動（ポート9080）
npm run dev

# ブラウザで開く
# http://localhost:9080
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
# dist版をビルド
npm run build

# ビルド済みアプリを開く
npm run app:open
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

2. Chrome/Edgeで `http://localhost:9080` を開く

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
- [ ] モード切替（通常/フォーカス/ブランク）が動作する

### UI整理後の機能
- [ ] FABボタンが削除されている
- [ ] ツールバーが11個のボタンに整理されている
- [ ] メインハブパネルが表示される（ツールバーの装飾/アニメーションボタン）
- [ ] メインハブパネルのタブ切り替えが動作する

### テーマ
- [ ] ダークモード/ライトモード切り替えが動作する
- [ ] テーマ色が正しく適用される

### 保存
- [ ] LocalStorageにテキストが保存される
- [ ] リロード後もテキストが復元される

---

## トラブルシューティング

### Q: 開発サーバーが起動しない

**A:** ポート9080が既に使用されている可能性があります。

```bash
# Windowsでポート使用状況を確認
netstat -ano | findstr :9080

# プロセスを終了
taskkill /PID <プロセスID> /F
```

### Q: Electronアプリが起動しない

**A:** Electronがインストールされていない可能性があります。

```bash
# 依存関係を再インストール
npm ci
```

### Q: PWAがインストールできない

**A:** 以下を確認してください：

1. HTTPSまたはlocalhostでアクセスしているか
2. Service Workerが正常に登録されているか（開発者ツール→Application→Service Workers）
3. manifest.webmanifestが正しく読み込まれているか

### Q: Service Workerのキャッシュをクリアしたい

**A:** URLパラメータでキャッシュをクリアできます。

```
http://localhost:9080?clearCache=1
```

または、開発者ツールでUnregisterします：
1. F12 → Application → Service Workers
2. Unregister をクリック
3. Application → Storage → Clear site data

### Q: LocalStorageをリセットしたい

**A:** URLパラメータでリセットできます。

```
http://localhost:9080?reset=1
```

---

## スクリプト一覧

| スクリプト | 説明 |
|-----------|------|
| `npm run dev` | 開発サーバー起動（ポート9080） |
| `npm run dev:two` | 2サーバー起動（8080、8081） |
| `npm run electron:dev` | Electronアプリ起動（開発モード） |
| `npm run electron:build` | Electronアプリビルド（dir出力） |
| `npm run electron:dist` | Electronアプリビルド（配布版） |
| `npm run build` | dist版作成 |
| `npm run app:open` | ビルド済みアプリ起動 |
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
- [UI改修履歴](UI_REFACTORING_2026_03_05.md) - 本日実施したUI整理の詳細
