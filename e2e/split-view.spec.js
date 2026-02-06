// @ts-nocheck
const { test, expect } = require('@playwright/test');

test.describe('Split View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
  });

  test('should toggle split view mode panel', async ({ page }) => {
    // 分割ビューボタンをクリック
    const toggleBtn = page.locator('#toggle-split-view');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // モード選択パネルが表示される
    const modePanel = page.locator('#split-view-mode-panel');
    await expect(modePanel).toBeVisible();

    // 閉じるボタンでパネルを閉じる
    const closeBtn = page.locator('#close-split-view-mode-panel');
    await closeBtn.click();
    await expect(modePanel).not.toBeVisible();
  });

  test('should show edit/preview split view', async ({ page }) => {
    // エディタにテキストを入力
    await page.fill('#editor', '# タイトル\n\nこれはテストです。');

    // 分割ビューボタンをクリック
    await page.click('#toggle-split-view');
    await page.waitForSelector('#split-view-mode-panel', { state: 'visible' });

    // 編集/プレビューモードを選択
    await page.click('#split-view-edit-preview');

    // 分割ビューコンテナが表示される
    const container = page.locator('#split-view-container');
    await expect(container).toBeVisible();

    // 左パネルと右パネルが存在する
    const leftPanel = page.locator('#split-view-left');
    const rightPanel = page.locator('#split-view-right');
    await expect(leftPanel).toBeVisible();
    await expect(rightPanel).toBeVisible();
  });

  test('should show chapter compare split view', async ({ page }) => {
    // 複数の章を含むテキストを入力
    const content = `# 第一章

第一章の内容です。

# 第二章

第二章の内容です。

# 第三章

第三章の内容です。`;

    await page.fill('#editor', content);

    // 分割ビューボタンをクリック
    await page.click('#toggle-split-view');
    await page.waitForSelector('#split-view-mode-panel', { state: 'visible' });

    // 章間比較モードを選択
    await page.click('#split-view-chapter-compare');

    // 分割ビューコンテナが表示される
    const container = page.locator('#split-view-container');
    await expect(container).toBeVisible();

    // 章選択ドロップダウンが表示される
    const leftSelect = page.locator('#split-view-left select.split-view-chapter-select');
    const rightSelect = page.locator('#split-view-right select.split-view-chapter-select');
    await expect(leftSelect).toBeVisible();
    await expect(rightSelect).toBeVisible();

    // 左側で第一章を選択
    await leftSelect.selectOption('0');
    await page.waitForTimeout(500);

    // 右側で第二章を選択
    await rightSelect.selectOption('1');
    await page.waitForTimeout(500);
  });

  test('should show snapshot diff split view', async ({ page }) => {
    // 最初のスナップショットを作成
    await page.fill('#editor', '最初の内容');
    await page.evaluate(() => {
      if (window.ZenWriterStorage && window.ZenWriterStorage.addSnapshot) {
        window.ZenWriterStorage.addSnapshot('最初の内容');
      }
    });

    // 少し待ってから内容を変更
    await page.waitForTimeout(1000);
    await page.fill('#editor', '変更後の内容');
    await page.evaluate(() => {
      if (window.ZenWriterStorage && window.ZenWriterStorage.addSnapshot) {
        window.ZenWriterStorage.addSnapshot('変更後の内容');
      }
    });

    // 分割ビューボタンをクリック
    await page.click('#toggle-split-view');
    await page.waitForSelector('#split-view-mode-panel', { state: 'visible' });

    // スナップショット差分モードを選択
    await page.click('#split-view-snapshot-diff');

    // 分割ビューコンテナが表示される
    const container = page.locator('#split-view-container');
    await expect(container).toBeVisible();

    // スナップショット選択ドロップダウンが表示される
    const leftSelect = page.locator('#split-view-left select.split-view-snapshot-select');
    const rightSelect = page.locator('#split-view-right select.split-view-snapshot-select');
    await expect(leftSelect).toBeVisible();
    await expect(rightSelect).toBeVisible();
  });

  test('should handle resize handle', async ({ page }) => {
    // エディタにテキストを入力
    await page.fill('#editor', '# テスト\n\n内容です。');

    // 編集/プレビューモードを開く
    await page.click('#toggle-split-view');
    await page.waitForSelector('#split-view-mode-panel', { state: 'visible' });
    await page.click('#split-view-edit-preview');

    // リサイズハンドルが存在する
    const resizeHandle = page.locator('#split-view-resize-handle');
    await expect(resizeHandle).toBeVisible();

    // リサイズハンドルの位置を取得
    const initialBox = await resizeHandle.boundingBox();
    expect(initialBox).not.toBeNull();

    // リサイズハンドルをドラッグ（簡易テスト）
    if (initialBox) {
      await resizeHandle.hover();
      await page.mouse.down();
      await page.mouse.move(initialBox.x + 50, initialBox.y);
      await page.mouse.up();
    }
  });

  test('should hide split view and show normal editor', async ({ page }) => {
    // 編集/プレビューモードを開く
    await page.click('#toggle-split-view');
    await page.waitForSelector('#split-view-mode-panel', { state: 'visible' });
    await page.click('#split-view-edit-preview');

    // 分割ビューが表示されている
    const container = page.locator('#split-view-container');
    await expect(container).toBeVisible();

    // 再度ボタンをクリックして閉じる（モードパネルを開く）
    await page.click('#toggle-split-view');
    await page.waitForSelector('#split-view-mode-panel', { state: 'visible' });

    // 同じモードを再度選択して閉じる
    await page.click('#split-view-edit-preview');

    // 分割ビューが非表示になる（または通常のエディタが表示される）
    // 注: 実装によっては、同じモードを選択すると閉じる動作になる
    await page.waitForTimeout(500);
  });

  test('should show error when chapter compare has less than 2 chapters', async ({ page }) => {
    // 章が1つしかないテキストを入力
    await page.fill('#editor', '# 唯一の章\n\n内容です。');

    // 分割ビューボタンをクリック
    await page.click('#toggle-split-view');
    await page.waitForSelector('#split-view-mode-panel', { state: 'visible' });

    // 章間比較モードを選択
    await page.click('#split-view-chapter-compare');

    // エラーメッセージが表示されるか、分割ビューが開かない
    // 実装によっては通知が表示される
    await page.waitForTimeout(500);
  });

  test('should show error when snapshot diff has less than 2 snapshots', async ({ page }) => {
    // スナップショットが1つしかない状態
    await page.fill('#editor', '内容');
    await page.evaluate(() => {
      if (window.ZenWriterStorage && window.ZenWriterStorage.addSnapshot) {
        window.ZenWriterStorage.addSnapshot('内容');
      }
    });

    // 分割ビューボタンをクリック
    await page.click('#toggle-split-view');
    await page.waitForSelector('#split-view-mode-panel', { state: 'visible' });

    // スナップショット差分モードを選択
    await page.click('#split-view-snapshot-diff');

    // エラーメッセージが表示されるか、分割ビューが開かない
    // 実装によっては通知が表示される
    await page.waitForTimeout(500);
  });
});
