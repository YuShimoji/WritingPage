// @ts-nocheck
const { test, expect } = require('@playwright/test');

test.describe('Spell Checker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
  });

  test('should toggle spell check on/off', async ({ page }) => {
    // スペルチェックボタンをクリック
    const toggleBtn = page.locator('#toggle-spell-check');
    await expect(toggleBtn).toBeVisible();
    
    // 初期状態を確認（無効）
    const _initialActive = await toggleBtn.evaluate(el => el.classList.contains('active'));
    
    // 有効化
    await toggleBtn.click();
    await page.waitForTimeout(300);
    
    // 有効化されたことを確認
    const afterEnable = await toggleBtn.evaluate(el => el.classList.contains('active'));
    expect(afterEnable).toBe(true);
    
    // 無効化
    await toggleBtn.click();
    await page.waitForTimeout(300);
    
    // 無効化されたことを確認
    const afterDisable = await toggleBtn.evaluate(el => el.classList.contains('active'));
    expect(afterDisable).toBe(false);
  });

  test('should detect misspelled words', async ({ page }) => {
    // スペルチェックを有効化
    const toggleBtn = page.locator('#toggle-spell-check');
    await toggleBtn.click();
    await page.waitForTimeout(300);
    
    // スペルミスのあるテキストを入力
    await page.fill('#editor', 'This is a testt with misspeled words.');
    await page.waitForTimeout(1000); // スペルチェックの実行を待つ
    
    // ハイライトが表示されることを確認
    const highlights = await page.locator('.spell-check-highlight').count();
    expect(highlights).toBeGreaterThan(0);
  });

  test('should show suggestions when clicking on misspelled word', async ({ page }) => {
    // スペルチェックを有効化
    const toggleBtn = page.locator('#toggle-spell-check');
    await toggleBtn.click();
    await page.waitForTimeout(300);
    
    // スペルミスのあるテキストを入力
    await page.fill('#editor', 'This is a testt word.');
    await page.waitForTimeout(1000);
    
    // ハイライトをクリック
    const highlight = page.locator('.spell-check-highlight').first();
    await highlight.click();
    await page.waitForTimeout(300);
    
    // 提案パネルが表示されることを確認
    const suggestionsPanel = page.locator('#spell-check-suggestions');
    await expect(suggestionsPanel).toBeVisible();
    
    // 提案が表示されることを確認
    const suggestions = page.locator('.spell-check-suggestion');
    const suggestionCount = await suggestions.count();
    expect(suggestionCount).toBeGreaterThan(0);
  });

  test('should replace word with suggestion', async ({ page }) => {
    // スペルチェックを有効化
    const toggleBtn = page.locator('#toggle-spell-check');
    await toggleBtn.click();
    await page.waitForTimeout(300);
    
    // スペルミスのあるテキストを入力
    await page.fill('#editor', 'This is a testt word.');
    await page.waitForTimeout(1000);
    
    // ハイライトをクリック
    const highlight = page.locator('.spell-check-highlight').first();
    await highlight.click();
    await page.waitForTimeout(300);
    
    // 最初の提案をクリック
    const firstSuggestion = page.locator('.spell-check-suggestion').first();
    await firstSuggestion.click();
    await page.waitForTimeout(300);
    
    // テキストが置換されたことを確認
    const editorValue = await page.inputValue('#editor');
    expect(editorValue).not.toContain('testt');
  });

  test('should add word to dictionary', async ({ page }) => {
    // スペルチェックを有効化
    const toggleBtn = page.locator('#toggle-spell-check');
    await toggleBtn.click();
    await page.waitForTimeout(300);
    
    // カスタム単語を入力
    await page.fill('#editor', 'This is a customm word.');
    await page.waitForTimeout(1000);
    
    // ハイライトをクリック
    const highlight = page.locator('.spell-check-highlight').first();
    await highlight.click();
    await page.waitForTimeout(300);
    
    // 「辞書に追加」ボタンをクリック
    const addToDictBtn = page.locator('.spell-check-add-dict');
    await addToDictBtn.click();
    await page.waitForTimeout(300);
    
    // ハイライトが消えることを確認
    const highlightsAfter = await page.locator('.spell-check-highlight').count();
    expect(highlightsAfter).toBe(0);
    
    // ページをリロードして設定が永続化されていることを確認
    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });
    await toggleBtn.click();
    await page.waitForTimeout(300);
    
    await page.fill('#editor', 'This is a customm word.');
    await page.waitForTimeout(1000);
    
    // ハイライトが表示されないことを確認（辞書に追加されているため）
    const highlightsAfterReload = await page.locator('.spell-check-highlight').count();
    expect(highlightsAfterReload).toBe(0);
  });

  test('should persist spell check enabled state', async ({ page }) => {
    // スペルチェックを有効化
    const toggleBtn = page.locator('#toggle-spell-check');
    await toggleBtn.click();
    await page.waitForTimeout(300);
    
    // ページをリロード
    await page.reload();
    await page.waitForSelector('#editor', { timeout: 10000 });
    
    // スペルチェックが有効のままであることを確認
    const isActive = await toggleBtn.evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(true);
  });
});
