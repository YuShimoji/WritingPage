const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openCommandPalette, openSidebarGroup } = require('./helpers');

const pageUrl = '/index.html';

async function setupAllGadgets(page) {
  await page.goto(pageUrl);
  await page.waitForFunction(() => {
    return !!window.ZWGadgets && Array.isArray(window.ZWGadgets._list) && window.ZWGadgets._list.length > 5;
  }, { timeout: 20000 });
  await enableAllGadgets(page);
}

async function panelLabels(page, group) {
  await openSidebarGroup(page, group);
  return page.evaluate((groupId) => {
    const panel = document.getElementById(groupId + '-gadgets-panel');
    if (!panel) return [];
    return Array.from(panel.querySelectorAll('button, summary'))
      .map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }, group);
}

test.describe('UI label consistency', () => {
  test.setTimeout(60000);

  test('sidebar gadget actions use role-specific labels where context can collide', async ({ page }) => {
    await setupAllGadgets(page);

    const structureLabels = await panelLabels(page, 'structure');
    expect(structureLabels).toContain('+ 文書');
    expect(structureLabels).toContain('+ フォルダ');
    expect(structureLabels).toContain('入出力');
    expect(structureLabels).toContain('管理');
    expect(structureLabels).toContain('+ Wikiページ');
    expect(structureLabels).toContain('+ 構成プリセット');

    const themeLabels = await panelLabels(page, 'theme');
    expect(themeLabels).toContain('プロファイル適用');
    expect(themeLabels).toContain('プロファイル保存');
    expect(themeLabels).toContain('プロファイル削除');

    const advancedLabels = await panelLabels(page, 'advanced');
    expect(advancedLabels).toContain('TXT書き出し');
    expect(advancedLabels).toContain('ロードアウト保存');
    expect(advancedLabels).toContain('ロードアウト適用');
    expect(advancedLabels).toContain('ロードアウト削除');
  });

  test('command palette save copy matches the current visible save model', async ({ page }) => {
    await setupAllGadgets(page);
    await openCommandPalette(page);
    await page.fill('#command-palette-input', '保存');

    const saveItem = page.locator('.command-palette-item[data-command-id="save"]');
    await expect(saveItem).toBeVisible({ timeout: 5000 });
    await expect(saveItem).toContainText('自動保存に加えて、現在の本文をすぐローカル保存する。');
    await expect(page.locator('#command-palette-list')).not.toContainText('常設の保存ボタン');
  });
});
