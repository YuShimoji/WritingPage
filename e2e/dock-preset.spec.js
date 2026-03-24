// @ts-nocheck
const { test, expect } = require('@playwright/test');

/**
 * SP-076 Phase 4: Dock Layout Presets
 * Tests loadout ↔ dock layout integration.
 */

test.describe('SP-076 Phase 4: Dock Layout Presets', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#editor', { timeout: 10000 });
    // Wait for DockManager + ZWGadgets initialization
    await page.waitForFunction(() => window.dockManager && window.ZWGadgets, { timeout: 10000 });
  });

  // --- captureLayout / applyLayout API ---

  test('DockManager.captureLayout returns correct structure', async ({ page }) => {
    const layout = await page.evaluate(() => window.dockManager.captureLayout());

    expect(layout).toBeTruthy();
    expect(layout).toHaveProperty('sidebarDock');
    expect(layout).toHaveProperty('leftPanel');
    expect(layout).toHaveProperty('rightPanel');
    expect(layout.leftPanel).toHaveProperty('visible');
    expect(layout.leftPanel).toHaveProperty('width');
    expect(layout.leftPanel).toHaveProperty('tabs');
    expect(layout.leftPanel).toHaveProperty('activeTab');
    expect(layout.rightPanel).toHaveProperty('width');
  });

  test('DockManager.applyLayout changes sidebar dock position', async ({ page }) => {
    // Start with known state
    await page.evaluate(() => window.dockManager.applyLayout({
      sidebarDock: 'left',
      leftPanel: { visible: false, width: 280, tabs: [], activeTab: 0 },
      rightPanel: { width: 320 }
    }));

    const dockSide = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-dock-sidebar');
    });
    expect(dockSide).toBe('left');

    // Switch to right
    await page.evaluate(() => window.dockManager.applyLayout({
      sidebarDock: 'right',
      leftPanel: { visible: false, width: 280, tabs: [], activeTab: 0 },
      rightPanel: { width: 300 }
    }));

    const dockSide2 = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-dock-sidebar');
    });
    expect(dockSide2).toBe('right');
  });

  test('DockManager.applyLayout changes left panel visibility and width', async ({ page }) => {
    await page.evaluate(() => window.dockManager.applyLayout({
      sidebarDock: 'right',
      leftPanel: { visible: true, width: 350, tabs: [], activeTab: 0 },
      rightPanel: { width: 320 }
    }));

    const result = await page.evaluate(() => {
      var dm = window.dockManager;
      return {
        visible: dm._layout.leftPanel.visible,
        width: dm._layout.leftPanel.width,
        attrOpen: document.documentElement.getAttribute('data-dock-left-open')
      };
    });
    expect(result.visible).toBe(true);
    expect(result.width).toBe(350);
    expect(result.attrOpen).toBe('true');
  });

  test('DockManager.applyLayout changes right panel width', async ({ page }) => {
    await page.evaluate(() => window.dockManager.applyLayout({
      sidebarDock: 'right',
      leftPanel: { visible: false, width: 280, tabs: [], activeTab: 0 },
      rightPanel: { width: 400 }
    }));

    const width = await page.evaluate(() => window.dockManager._layout.rightPanel.width);
    expect(width).toBe(400);

    const cssVar = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim();
    });
    expect(cssVar).toBe('400px');
  });

  // --- captureCurrentLoadout includes dockLayout ---

  test('captureCurrentLoadout includes dockLayout', async ({ page }) => {
    const captured = await page.evaluate(() => {
      return window.ZWGadgets.captureCurrentLoadout('test-capture');
    });

    expect(captured).toHaveProperty('dockLayout');
    expect(captured.dockLayout).toHaveProperty('sidebarDock');
    expect(captured.dockLayout).toHaveProperty('leftPanel');
    expect(captured.dockLayout).toHaveProperty('rightPanel');
  });

  // --- applyLoadout applies dockLayout ---

  test('applyLoadout applies dockLayout from preset', async ({ page }) => {
    // Define a custom loadout with specific dock layout
    await page.evaluate(() => {
      window.ZWGadgets.defineLoadout('test-dock-preset', {
        label: 'Test Dock',
        groups: { structure: ['Documents'] },
        dockLayout: {
          sidebarDock: 'left',
          leftPanel: { visible: true, width: 300, tabs: [], activeTab: 0 },
          rightPanel: { width: 350 }
        }
      });
    });

    // Apply it
    await page.evaluate(() => window.ZWGadgets.applyLoadout('test-dock-preset'));

    const result = await page.evaluate(() => {
      var dm = window.dockManager;
      return {
        sidebarDock: dm._layout.sidebarDock,
        leftVisible: dm._layout.leftPanel.visible,
        leftWidth: dm._layout.leftPanel.width,
        rightWidth: dm._layout.rightPanel.width
      };
    });

    expect(result.sidebarDock).toBe('left');
    expect(result.leftVisible).toBe(true);
    expect(result.leftWidth).toBe(300);
    expect(result.rightWidth).toBe(350);
  });

  // --- Legacy loadout without dockLayout (backward compat) ---

  test('applyLoadout without dockLayout does not change dock state', async ({ page }) => {
    // Set known dock state first
    await page.evaluate(() => window.dockManager.applyLayout({
      sidebarDock: 'left',
      leftPanel: { visible: true, width: 260, tabs: [], activeTab: 0 },
      rightPanel: { width: 310 }
    }));

    // Define and apply a loadout WITHOUT dockLayout
    await page.evaluate(() => {
      var data = window.ZWGadgets._ensureLoadouts();
      data.entries['legacy-test'] = {
        label: 'Legacy Test',
        groups: { structure: ['Documents', 'Outline'] }
        // no dockLayout
      };
      window.ZWGadgetsLoadouts.saveLoadouts(data);
      window.ZWGadgets._loadouts = null; // force reload
      window.ZWGadgets.applyLoadout('legacy-test');
    });

    // Dock state should remain unchanged
    const result = await page.evaluate(() => {
      var dm = window.dockManager;
      return {
        sidebarDock: dm._layout.sidebarDock,
        leftVisible: dm._layout.leftPanel.visible,
        leftWidth: dm._layout.leftPanel.width,
        rightWidth: dm._layout.rightPanel.width
      };
    });

    expect(result.sidebarDock).toBe('left');
    expect(result.leftVisible).toBe(true);
    expect(result.leftWidth).toBe(260);
    expect(result.rightWidth).toBe(310);
  });

  // --- Save and restore round-trip ---

  test('Save loadout captures dock state and restore applies it', async ({ page }) => {
    // Set specific dock state
    await page.evaluate(() => window.dockManager.applyLayout({
      sidebarDock: 'left',
      leftPanel: { visible: true, width: 290, tabs: [], activeTab: 0 },
      rightPanel: { width: 330 }
    }));

    // Capture and save
    await page.evaluate(() => {
      var config = window.ZWGadgets.captureCurrentLoadout('Round Trip');
      window.ZWGadgets.defineLoadout('roundtrip-test', config);
    });

    // Change dock state to something different
    await page.evaluate(() => window.dockManager.applyLayout({
      sidebarDock: 'right',
      leftPanel: { visible: false, width: 280, tabs: [], activeTab: 0 },
      rightPanel: { width: 320 }
    }));

    // Restore saved loadout
    await page.evaluate(() => window.ZWGadgets.applyLoadout('roundtrip-test'));

    const result = await page.evaluate(() => {
      var dm = window.dockManager;
      return {
        sidebarDock: dm._layout.sidebarDock,
        leftVisible: dm._layout.leftPanel.visible,
        leftWidth: dm._layout.leftPanel.width,
        rightWidth: dm._layout.rightPanel.width
      };
    });

    expect(result.sidebarDock).toBe('left');
    expect(result.leftVisible).toBe(true);
    expect(result.leftWidth).toBe(290);
    expect(result.rightWidth).toBe(330);
  });

  // --- Built-in presets have dockLayout ---

  test('Built-in presets include dockLayout', async ({ page }) => {
    const presets = await page.evaluate(() => {
      var p = window.ZWLoadoutPresets;
      if (!p || !p.entries) return null;
      var result = {};
      Object.keys(p.entries).forEach(function (key) {
        result[key] = !!p.entries[key].dockLayout;
      });
      return result;
    });

    expect(presets).toBeTruthy();
    expect(presets['novel-standard']).toBe(true);
    expect(presets['novel-minimal']).toBe(true);
    expect(presets['vn-layout']).toBe(true);
    expect(presets['screenplay']).toBe(true);
  });

  // --- Floating panels not affected by preset switch ---

  test('Floating panels preserved during preset switch', async ({ page }) => {
    // Add a tab and float it
    await page.evaluate(() => {
      var dm = window.dockManager;
      dm.addTab('test-float-tab', 'Float Test', function (panel) {
        panel.textContent = 'test content';
      });
      dm.floatTab('test-float-tab');
    });

    const beforeCount = await page.evaluate(() => {
      return (window.dockManager._layout.floating || []).length;
    });
    expect(beforeCount).toBe(1);

    // Apply a preset with dockLayout
    await page.evaluate(() => {
      window.ZWGadgets.defineLoadout('float-test-preset', {
        label: 'Float Test',
        groups: { structure: ['Documents'] },
        dockLayout: {
          sidebarDock: 'right',
          leftPanel: { visible: false, width: 280, tabs: [], activeTab: 0 },
          rightPanel: { width: 320 }
        }
      });
      window.ZWGadgets.applyLoadout('float-test-preset');
    });

    const afterCount = await page.evaluate(() => {
      return (window.dockManager._layout.floating || []).length;
    });
    expect(afterCount).toBe(1);
  });
});
