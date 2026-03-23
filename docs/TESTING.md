# TESTING

## 自動テスト

### E2E テスト (Playwright)

```bash
npm run test:e2e
```

- 518 test cases / 62 spec files (2026-03-23 時点。最新件数は `npx playwright test --list` で確認)
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

- 実行ガイド: `docs/MANUAL_TEST_GUIDE.md` を参照
- 推奨運用: 日次は「A. クイック確認」、PR前は「B. 回帰確認」
- 関連仕様: `docs/spec-index.json` の `SP-041` / `SP-048` / `SP-050`

### 印刷

- 「印刷」ボタンでブラウザの印刷ダイアログが開く
- UI が非表示になり本文のみが印刷レイアウトで表示される

### レスポンシブ (実機確認)

- 768px 以下でサイドバーが全幅スライド表示に切り替わる
- スワイプでサイドバーが閉じる

### 大容量テキスト

- 大容量テキストはブラウザの LocalStorage 制限の影響を受ける (約 5MB)

## Playwright 画面証跡（手動確認補助）

最短導線:

```bash
cd /home/planner007/code/WritingPage
npm run test:ui:capture:build
```

- `npm run build` 相当で `dist/` を再生成
- `dist/` をローカルHTTP配信して画面証跡を取得
- 出力先は `output/playwright/manual-verification-.../`

```bash
cd /home/planner007/code/WritingPage
OUT="output/playwright/manual-verification-$(date +%Y%m%d-%H%M%S)"
node scripts/capture-ui-verification.js --build --dist --port 19080 --out "$OUT"
```

- 取得先: `output/playwright/`
- 開発中の未ビルド状態を確認したい場合のみ `node scripts/capture-ui-verification.js --project` を使う
- 代表画像: メイン画面 / 設定 / ヘルプ / デスクトップサイドバー / コマンドパレット / モバイルサイドバー

## 運用メモ

- 現行サイドバーはタブUIではなくアコーディオンUI。旧 `wiki` グループは `edit` へ統合済み。
- ヘッドレス環境ではシステム日本語フォントが不足しやすいため、画面証跡ではバンドル済み `Noto Serif JP` を優先して表示を安定化している。

## フォント切り替え関連テスト (SP-054)

`e2e/editor-settings.spec.js` に以下のケースが実装済み:

| ケース | 検証内容 |
|--------|---------|
| font size quick change should preserve existing settings object | Quick Toolsでサイズ変更時に他の設定が消えない |
| legacy fontSize should normalize to editor/ui font size on load | 旧`fontSize`のみの設定を正規化して読み込む |
| Typography and quick font controls should stay in sync | Typography変更→Quick Tools反映、逆方向も同期 |
| font family change should persist after reload | フォントファミリー変更がリロード後も維持される |
| font family change via Typography should preserve other settings | フォント変更時に他設定(theme, autoSave等)が消えない |

## テスト追加方針

- E2E テストを優先。手動テストは最小限に。
- 新機能は対応する E2E テストを追加
- `e2e/helpers.js` の共通ヘルパーを活用すること
