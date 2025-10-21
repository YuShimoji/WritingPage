// E2E: ガジェット機能の検証
const { test, expect } = require('@playwright/test');

const pageUrl = '/index.html';

async function waitGadgetsReady(page) {
  await page.waitForFunction(() => {
    try {
      return !!window.ZWGadgets && !!document.querySelector('#gadgets-panel');
    } catch (_) { return false; }
  });
  // 初回レンダ後のガジェット要素を待機
  await page.waitForSelector('#gadgets-panel section.gadget');
}

test.describe('Gadgets E2E', () => {
  test('panel exists, toggle works, settings persist, reorder and import/export', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    // Ensure sidebar is open (simulate user operations)
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    const ensureSidebarOpen = async () => {
      const showToolbar = page.locator('#show-toolbar');
      if (await showToolbar.isVisible().catch(() => false)) {
        await showToolbar.click();
      }

      const toggleBtn = page.locator('#toggle-sidebar');
      await toggleBtn.waitFor({ state: 'visible' });

      const opened = await sidebar.evaluate(el => el.classList.contains('open'));
      if (!opened) {
        await toggleBtn.click();
        await expect(sidebar).toHaveClass(/open/);
        await page.waitForFunction(() => {
          const el = document.querySelector('.sidebar');
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          return rect.left >= 0;
        });
      }
    };

    await ensureSidebarOpen();

    // ガジェットタブ(assist)をアクティブに
    const assistTab = page.locator('#sidebar-tab-assist');
    if (await assistTab.isVisible()) {
      await assistTab.click();
      await expect(assistTab).toHaveAttribute('aria-selected', 'true');
    }

    // パネル表示
    await expect(page.locator('#gadgets-panel')).toBeVisible();

    const clock = page.locator('#gadgets-panel section.gadget[data-name="Clock"]');
    await expect(clock).toBeVisible();

    // Toggle（折りたたみ）
    const cBody = clock.locator('.gadget-body');
    await expect(cBody).toBeVisible();
    await clock.scrollIntoViewIfNeeded();
    await clock.locator('.gadget-toggle').scrollIntoViewIfNeeded();
    await clock.locator('.gadget-toggle').click();
    await expect(cBody).toBeHidden();
    await clock.locator('.gadget-toggle').scrollIntoViewIfNeeded();
    await clock.locator('.gadget-toggle').click();
    await expect(cBody).toBeVisible();

    // Settings UI（12時間表示に切替）
    const settingsBtn = clock.locator('.gadget-settings-btn');
    await settingsBtn.click();
    const panel = clock.locator('.gadget-settings');
    await expect(panel).toBeVisible();
    // UI操作は再描画で要素が入れ替わりフレークになりやすいのでAPIで設定
    await page.evaluate(() => {
      try { window.ZWGadgets.setSetting('Clock', 'hour24', false); } catch(_) {}
    });

    // 設定の永続化確認（API ベース）
    const hour24 = await page.evaluate(() => {
      try { return !!(window.ZWGadgets.getSettings('Clock') || {}).hour24; } catch(_) { return true; }
    });
    expect(hour24).toBe(false);

    // 見た目上も 12H になっている目安（AM/PM を含む）
    await expect(clock.locator('.gadget-clock')).toHaveText(/AM|PM/);

    // Dummy ガジェットを登録して再描画 -> 並び替えで先頭に移動
    await page.evaluate(() => {
      try {
        window.ZWGadgets.register('Dummy', function(el){
          var d = document.createElement('div'); d.className='gadget-dummy'; d.textContent = 'dummy'; el.appendChild(d);
        });
        // 再描画トリガ（setPrefs 内で _renderLast が呼ばれる）
        window.ZWGadgets.setPrefs(window.ZWGadgets.getPrefs());
        return true;
      } catch(_) { return false; }
    });

    const dummy = page.locator('#gadgets-panel section.gadget[data-name="Dummy"]');
    await expect(dummy).toBeVisible();

    // Dummy を上に移動（Up）x2 -> 先頭に移動
    await dummy.scrollIntoViewIfNeeded();
    await dummy.locator('.gadget-move-up').scrollIntoViewIfNeeded();
    await dummy.locator('.gadget-move-up').click();
    await dummy.scrollIntoViewIfNeeded();
    await dummy.locator('.gadget-move-up').scrollIntoViewIfNeeded();
    await dummy.locator('.gadget-move-up').click();
    await page.waitForFunction(() => {
      const order = Array.from(document.querySelectorAll('#gadgets-panel section.gadget')).map(n => n.dataset.name);
      return order[0] === 'Dummy';
    });

    // Export → Prefs を書き換えて Import（Clock を折りたたみにする）
    await page.evaluate(() => {
      const p = JSON.parse(window.ZWGadgets.exportPrefs());
      p.collapsed = p.collapsed || {}; p.collapsed['Clock'] = true;
      window.ZWGadgets.importPrefs(p);
    });
    await expect(clock.locator('.gadget-body')).toBeHidden();

    // Reload 後も折りたたみ状態が保持されること
    await page.reload();
    await waitGadgetsReady(page);
    await ensureSidebarOpen();
    await expect(page.locator('#gadgets-panel section.gadget[data-name="Clock"] .gadget-body')).toBeHidden();
  });
});
