// @ts-check
const { test, expect } = require('@playwright/test');
const { openSidebarGroup } = require('./helpers');

test.describe('Plugin Manager', () => {
  test('loads manifest plugins in non-embed mode', async ({ page }) => {
    await page.goto('/');

    await page.waitForFunction(() => {
      try {
        return !!(
          window.ZWPluginManager &&
          window.ZenWriterPlugins &&
          typeof window.ZenWriterPlugins.list === 'function' &&
          window.ZenWriterPlugins.list().some((p) => p && p.id === 'choice')
        );
      } catch (_) {
        return false;
      }
    }, { timeout: 15000 });

    const hasChoice = await page.evaluate(() => {
      if (!window.ZenWriterPlugins || typeof window.ZenWriterPlugins.list !== 'function') return false;
      return window.ZenWriterPlugins.list().some((p) => p && p.id === 'choice');
    });

    expect(hasChoice).toBe(true);
  });

  test('settings can enable a local gadget mod for next reload', async ({ page }) => {
    await page.goto('/');

    await page.waitForFunction(() => {
      return !!(
        window.ZWPluginManager &&
        typeof window.ZWPluginManager.getPluginList === 'function' &&
        window.ZWPluginManager.getPluginList().some((p) => p && p.id === 'sample-word-count-gadget')
      );
    }, { timeout: 15000 });

    await page.evaluate(() => {
      const modal = document.getElementById('settings-modal');
      if (modal) modal.style.display = 'flex';
      if (window.ZWGadgets && typeof window.ZWGadgets.init === 'function') {
        window.ZWGadgets.init('#settings-gadgets-panel', { group: 'settings' });
      }
    });

    const toggle = page.locator('[data-plugin-toggle="sample-word-count-gadget"]');
    await expect(toggle).toBeVisible();
    await expect(toggle).not.toBeChecked();
    await toggle.check();

    await expect(page.locator('[data-plugin-status="sample-word-count-gadget"]')).toContainText('再読み込み');
    const enabledMap = await page.evaluate(() => JSON.parse(localStorage.getItem('zw_plugin_manager_enabled') || '{}'));
    expect(enabledMap['sample-word-count-gadget']).toBe(true);
  });

  test('markdown preview gadget mod is listed disabled by default', async ({ page }) => {
    await page.goto('/');

    await page.waitForFunction(() => {
      return !!(
        window.ZWPluginManager &&
        typeof window.ZWPluginManager.getPluginList === 'function' &&
        window.ZWPluginManager.getPluginList().some((p) => p && p.id === 'markdown-preview-gadget')
      );
    }, { timeout: 15000 });

    const plugin = await page.evaluate(() => {
      return window.ZWPluginManager.getPluginList().find((p) => p && p.id === 'markdown-preview-gadget');
    });
    expect(plugin.enabled).toBe(false);
    expect(plugin.loaded).toBe(false);

    await page.evaluate(() => {
      const modal = document.getElementById('settings-modal');
      if (modal) modal.style.display = 'flex';
      if (window.ZWGadgets && typeof window.ZWGadgets.init === 'function') {
        window.ZWGadgets.init('#settings-gadgets-panel', { group: 'settings' });
      }
    });

    const toggle = page.locator('[data-plugin-toggle="markdown-preview-gadget"]');
    await expect(toggle).toBeVisible();
    await expect(toggle).not.toBeChecked();
    await expect(page.locator('[data-plugin-status="markdown-preview-gadget"]')).toContainText('停止中');
  });

  test('enabled local gadget mods register as plugin-sourced gadgets', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('zw_plugin_manager_enabled', JSON.stringify({ 'sample-word-count-gadget': true }));
    });
    await page.goto('/');

    await page.waitForFunction(() => {
      try {
        return !!(
          window.ZWGadgets &&
          Array.isArray(window.ZWGadgets._list) &&
          window.ZWGadgets._list.some((g) => g && g.name === 'SampleWordCountMod' && g.source === 'plugin')
        );
      } catch (_) {
        return false;
      }
    }, { timeout: 15000 });

    const registered = await page.evaluate(() => {
      const item = window.ZWGadgets._list.find((g) => g && g.name === 'SampleWordCountMod');
      return item ? { name: item.name, source: item.source, pluginId: item.pluginId, groups: item.groups } : null;
    });
    expect(registered).toEqual({
      name: 'SampleWordCountMod',
      source: 'plugin',
      pluginId: 'sample-word-count-gadget',
      groups: ['assist'],
    });
  });

  test('enabled markdown preview mod renders in edit panel and toggles preview', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('zw_plugin_manager_enabled', JSON.stringify({ 'markdown-preview-gadget': true }));
      localStorage.setItem('zenwriter-gadget-collapsed', JSON.stringify({ MarkdownPreview: true }));
    });
    await page.goto('/');

    await page.waitForFunction(() => {
      try {
        return !!(
          window.ZWGadgets &&
          Array.isArray(window.ZWGadgets._list) &&
          window.ZWGadgets._list.some((g) => g && g.name === 'MarkdownPreview' && g.source === 'plugin')
        );
      } catch (_) {
        return false;
      }
    }, { timeout: 15000 });

    const registered = await page.evaluate(() => {
      const item = window.ZWGadgets._list.find((g) => g && g.name === 'MarkdownPreview');
      return item ? { name: item.name, source: item.source, pluginId: item.pluginId, groups: item.groups } : null;
    });
    expect(registered).toEqual({
      name: 'MarkdownPreview',
      source: 'plugin',
      pluginId: 'markdown-preview-gadget',
      groups: ['edit'],
    });

    await openSidebarGroup(page, 'edit');
    const wrapper = page.locator('#edit-gadgets-panel .gadget-wrapper[data-gadget-name="MarkdownPreview"]');
    await expect(wrapper).toBeVisible();

    const previewPanel = page.locator('#editor-preview');
    const initialCollapsed = await previewPanel.evaluate((el) => el.classList.contains('editor-preview--collapsed'));
    await wrapper.getByRole('button', { name: 'プレビュー開閉' }).click();
    const newCollapsed = await previewPanel.evaluate((el) => el.classList.contains('editor-preview--collapsed'));
    expect(newCollapsed).not.toBe(initialCollapsed);
  });
});
