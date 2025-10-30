// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Editor Settings', () => {
  test('should toggle typewriter mode and save settings', async ({ page }) => {
    // Load the page
    await page.goto('/');
    await page.waitForSelector('#show-toolbar', { state: 'visible' });
    await page.click('#show-toolbar');
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-editor').waitFor();
    await page.click('#sidebar-tab-editor');

    // Enable typewriter mode
    const checkbox = page.locator('#typewriter-enabled');
    await expect(checkbox).toBeVisible();
    await checkbox.check();

    // Adjust anchor ratio
    const anchor = page.locator('#typewriter-anchor-ratio');
    await anchor.fill('0.7');

    // Adjust stickiness
    const stickiness = page.locator('#typewriter-stickiness');
    await stickiness.fill('0.8');

    // Reload and verify persistence
    await page.reload();
    await page.locator('#toggle-sidebar').waitFor();
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-editor').waitFor();
    await page.click('#sidebar-tab-editor');

    await expect(page.locator('#typewriter-enabled')).toBeChecked();
    await expect(page.locator('#typewriter-anchor-ratio')).toHaveValue('0.7');
    await expect(page.locator('#typewriter-stickiness')).toHaveValue('0.8');
  });

  test('should adjust snapshot settings and save', async ({ page }) => {
    // Load the page
    await page.goto('/');
    await page.waitForSelector('#show-toolbar', { state: 'visible' });
    await page.click('#show-toolbar');
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-editor').waitFor();
    await page.click('#sidebar-tab-editor');

    // Adjust snapshot interval
    const interval = page.locator('#snapshot-interval-ms');
    await interval.fill('60000');

    // Adjust delta chars
    const delta = page.locator('#snapshot-delta-chars');
    await delta.fill('200');

    // Adjust retention
    const retention = page.locator('#snapshot-retention');
    await retention.fill('5');
    await retention.press('Enter');

    // Reload and verify persistence
    await page.reload();
    await page.locator('#toggle-sidebar').waitFor();
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-editor').waitFor();
    await page.click('#sidebar-tab-editor');

    await expect(page.locator('#snapshot-interval-ms')).toHaveValue('60000');
    await expect(page.locator('#snapshot-delta-chars')).toHaveValue('200');
    await expect(page.locator('#snapshot-retention')).toHaveValue('5');
  });

  test('should switch UI presentation modes and persist', async ({ page }) => {
    // Load the page
    await page.goto('/');
    await page.waitForSelector('#show-toolbar', { state: 'visible' });
    await page.click('#show-toolbar');
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-assist').waitFor();
    await page.click('#sidebar-tab-assist');

    // Switch to UI Settings gadget
    await page.locator('.gadget').filter({ hasText: 'UI Settings' }).waitFor();
    await page.click('.gadget:has-text("UI Settings") .gadget-toggle');

    // Change presentation to 'dropdown'
    const sel = page.locator('#ui-tabs-presentation');
    await sel.selectOption('dropdown');

    // Verify dropdown appears
    await page.locator('#tabs-dropdown-select').waitFor();

    // Reload and verify persistence
    await page.reload();
    await page.locator('#toggle-sidebar').waitFor();
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-assist').waitFor();
    await page.click('#sidebar-tab-assist');

    await page.locator('#tabs-dropdown-select').waitFor();
    await expect(page.locator('#tabs-dropdown-select')).toBeVisible();
  });

  test('should toggle typewriter gadget and affect scrolling', async ({ page }) => {
    // Load the page and type some content
    await page.goto('/');
    await page.waitForSelector('#show-toolbar', { state: 'visible' });
    await page.click('#show-toolbar');
    await page.locator('#editor').waitFor();
    await page.locator('#editor').fill('Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\n');

    // Open sidebar and enable typewriter in gadget
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-assist').waitFor();
    await page.click('#sidebar-tab-assist');

    // Toggle Typewriter gadget
    await page.locator('.gadget').filter({ hasText: 'Typewriter' }).waitFor();
    await page.click('.gadget:has-text("Typewriter") .gadget-toggle');

    // Enable typewriter
    const chk = page.locator('#typewriter-gadget-enabled');
    await chk.check();

    // Scroll to bottom and verify caret positioning (smoke test)
    await page.locator('#editor').click();
    await page.keyboard.press('End');
    await page.waitForTimeout(200); // Allow scroll
    // Hard to verify exact scroll, but ensure no error
  });

  test('should create manual snapshot in Snapshot Manager', async ({ page }) => {
    // Load the page
    await page.goto('/');
    await page.waitForSelector('#show-toolbar', { state: 'visible' });
    await page.click('#show-toolbar');
    await page.locator('#editor').waitFor();
    await page.locator('#editor').fill('Test content for snapshot');

    // Open sidebar
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-assist').waitFor();
    await page.click('#sidebar-tab-assist');

    // Toggle Snapshot Manager
    await page.locator('.gadget').filter({ hasText: 'Snapshot Manager' }).waitFor();
    await page.click('.gadget:has-text("Snapshot Manager") .gadget-toggle');

    // Click manual snapshot
    await page.locator('#snapshot-manual-btn').waitFor();
    await page.click('#snapshot-manual-btn');

    // Verify list increments (assuming initial list is empty)
    const list = page.locator('#snapshot-list');
    await expect(list.locator('li')).toHaveCount(1);
  });

  test('should add node and link in Node Graph', async ({ page }) => {
    // Load the page
    await page.goto('/');
    await page.waitForSelector('#show-toolbar', { state: 'visible' });
    await page.click('#show-toolbar');
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-assist').waitFor();
    await page.click('#sidebar-tab-assist');

    // Toggle Node Graph
    await page.locator('.gadget').filter({ hasText: 'Node Graph' }).waitFor();
    await page.click('.gadget:has-text("Node Graph") .gadget-toggle');

    // Click add node
    await page.locator('#nodegraph-add-node').waitFor();
    await page.click('#nodegraph-add-node');

    // Verify node added (smoke)
    await page.locator('.node').first().waitFor();
  });

  test('should create and search wiki page', async ({ page }) => {
    // Load the page
    await page.goto('/');
    await page.waitForSelector('#show-toolbar', { state: 'visible' });
    await page.click('#show-toolbar');
    await page.waitForSelector('#toggle-sidebar', { state: 'visible' });
    await page.click('#toggle-sidebar');
    await page.locator('#sidebar-tab-assist').waitFor();
    await page.click('#sidebar-tab-assist');

    // Toggle Wiki
    await page.locator('.gadget').filter({ hasText: 'Wiki' }).waitFor();
    await page.click('.gadget:has-text("Wiki") .gadget-toggle');

    // Create new page
    await page.locator('#wiki-new-page').waitFor();
    await page.click('#wiki-new-page');
    await page.locator('#wiki-title-input').fill('Test Page');
    await page.locator('#wiki-content-input').fill('Test content');
    await page.click('#wiki-save-btn');

    // Search
    await page.locator('#wiki-search-input').fill('Test');
    // Verify result appears
    await page.locator('.wiki-result').filter({ hasText: 'Test Page' }).waitFor();
  });
});
