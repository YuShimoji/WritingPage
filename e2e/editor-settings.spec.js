// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Editor Settings', () => {
  test('should toggle typewriter mode and save settings', async ({ page }) => {
    // Load the page
    await page.goto('/');

    // Open sidebar and navigate to editor tab
    await page.click('#toggle-sidebar');
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
    await page.click('#toggle-sidebar');
    await page.click('#sidebar-tab-editor');

    await expect(page.locator('#typewriter-enabled')).toBeChecked();
    await expect(page.locator('#typewriter-anchor-ratio')).toHaveValue('0.7');
    await expect(page.locator('#typewriter-stickiness')).toHaveValue('0.8');
  });

  test('should adjust snapshot settings and save', async ({ page }) => {
    // Load the page
    await page.goto('/');

    // Open sidebar and navigate to editor tab
    await page.click('#toggle-sidebar');
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

    // Reload and verify persistence
    await page.reload();
    await page.click('#toggle-sidebar');
    await page.click('#sidebar-tab-editor');

    await expect(page.locator('#snapshot-interval-ms')).toHaveValue('60000');
    await expect(page.locator('#snapshot-delta-chars')).toHaveValue('200');
    await expect(page.locator('#snapshot-retention')).toHaveValue('5');
  });
});
