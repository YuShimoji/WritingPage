# TESTING

## 自動テスト

### E2E テスト (Playwright)

```bash
npm run test:e2e
```

- 201 passed / 0 failed / 2 skipped (2026-03-06 時点)
- 失敗時は `test-results/` にスクリーンショットとトレースが保存される
- CI: `.github/workflows/ci-e2e.yml` で push/PR 時に自動実行

### スモークテスト

```bash
npm run test:smoke
```

- index.html の配信、主要 CSS/JS の読み込み、ガジェット API の存在を検証

### リンター

```bash
npm run lint
```

- ESLint + markdownlint

## 手動確認が必要な項目

以下は自動テストでカバーしきれない体験的な検証項目。

### 印刷

- 「印刷」ボタンでブラウザの印刷ダイアログが開く
- UI が非表示になり本文のみが印刷レイアウトで表示される

### レスポンシブ (実機確認)

- 768px 以下でサイドバーが全幅スライド表示に切り替わる
- スワイプでサイドバーが閉じる

### 大容量テキスト

- 大容量テキストはブラウザの LocalStorage 制限の影響を受ける (約 5MB)

## テスト追加方針

- E2E テストを優先。手動テストは最小限に。
- 新機能は対応する E2E テストを追加
- `e2e/helpers.js` の共通ヘルパーを活用すること
