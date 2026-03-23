// Session 19 verification: ガジェット整理 + レガシー仕様クリーンアップの検証
// スクリーンショットを e2e/verification-screenshots/ に保存する

const { test, expect } = require('@playwright/test');
const {
  enableAllGadgets,
  openSidebarGroup,
  showFullToolbar,
  openSettingsModal,
  expandAllGadgets,
  disableWritingFocus,
  expandAccordion,
} = require('./helpers');
const path = require('path');

const pageUrl = '/index.html';
const ssDir = path.join(__dirname, 'verification-screenshots');

// --- Helper ---
async function waitReady(page) {
  await page.waitForFunction(
    () => !!window.ZWGadgets && !!document.querySelector('#editor'),
    { timeout: 20000 }
  );
  await enableAllGadgets(page);
  await showFullToolbar(page);
  await disableWritingFocus(page);
  await page.waitForTimeout(500);
}

// --- サンプルテキスト挿入 ---
async function insertSampleText(page) {
  await page.evaluate(() => {
    const editor = document.getElementById('editor');
    if (!editor) return;
    editor.value = [
      '# 第一章 旅立ち',
      '',
      '　夜明けの光が窓から差し込んだとき、少年は旅立ちを決意した。',
      '長い冬が終わり、雪解け水が川を満たす季節。',
      '',
      '## 街道にて',
      '',
      '　荷物をまとめ、母に別れを告げた。',
      '「気をつけてね」と母は言い、小さな守り袋を手渡した。',
      '',
      ':::textbox[title="旅の記録" style="parchment"]',
      '出発: 三月二十四日',
      '目的地: 北の塔',
      '所持金: 銀貨三枚',
      ':::',
      '',
      '　街道を歩きながら、少年は{振|ふ}り{返|かえ}った。',
      '故郷の煙突から細い煙が昇っていた。',
    ].join('\n');
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(300);
}

// --- サイドバーグループを開いてパネルのスクリーンショットを撮る ---
async function screenshotSidebarGroup(page, group, filename) {
  await openSidebarGroup(page, group);
  await page.waitForTimeout(500);
  // パネル展開
  const panelSel = `#${group}-gadgets-panel`;
  await expandAllGadgets(page, panelSel);
  await page.waitForTimeout(300);

  // パネル要素を直接スクロール表示してスクリーンショット
  const panel = page.locator(panelSel);
  if (await panel.count() > 0) {
    await panel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await panel.screenshot({ path: path.join(ssDir, filename) });
  } else {
    await page.screenshot({ path: path.join(ssDir, filename), fullPage: true });
  }

  // パネル内のガジェット名を取得
  const gadgets = await page.locator(`${panelSel} .gadget-wrapper`).all();
  const names = [];
  for (const g of gadgets) {
    names.push(await g.getAttribute('data-gadget-name'));
  }
  return names;
}

test.describe('Session 19 Verification', () => {
  test.setTimeout(120000);

  test('01: エディタ初期状態 + サンプルテキスト', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);
    await insertSampleText(page);
    await page.screenshot({ path: path.join(ssDir, '01-editor-with-sample.png'), fullPage: true });
  });

  test('02: 登録ガジェット一覧 — 削除ガジェット不在', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);

    const info = await page.evaluate(() => {
      const g = window.ZWGadgets;
      if (!g || !Array.isArray(g._list)) return { count: 0, names: [], deleted: [], disabled: [] };
      const names = g._list.map(e => e.name).sort();
      const DELETED = ['Clock', 'Samples', 'NodeGraph', 'GraphicNovel'];
      const DISABLED = ['UIDesign', 'SceneGradient'];
      const deleted = names.filter(n => DELETED.includes(n));
      const disabled = names.filter(n => DISABLED.includes(n));
      return { count: names.length, names, deleted, disabled };
    });

    console.log(`[VERIFY] Registered gadgets: ${info.count}`);
    console.log(`[VERIFY] Names: ${info.names.join(', ')}`);
    console.log(`[VERIFY] Deleted (should be empty): [${info.deleted.join(', ')}]`);
    console.log(`[VERIFY] Disabled (should be empty): [${info.disabled.join(', ')}]`);

    // 削除済みガジェットが登録されていないこと
    expect(info.deleted).toEqual([]);
    // 無効化ガジェットも登録されていないこと
    expect(info.disabled).toEqual([]);
  });

  test('03: サイドバー structure グループ', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);
    await page.waitForSelector('#structure-gadgets-panel .gadget-wrapper', {
      state: 'visible', timeout: 10000,
    });
    const names = await screenshotSidebarGroup(page, 'structure', '03-sidebar-structure.png');
    console.log(`[VERIFY] Structure gadgets: ${names.join(', ')}`);
  });

  test('04: サイドバー edit グループ', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);
    const names = await screenshotSidebarGroup(page, 'edit', '04-sidebar-edit.png');
    console.log(`[VERIFY] Edit gadgets: ${names.join(', ')}`);
  });

  test('05: サイドバー theme グループ', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);
    const names = await screenshotSidebarGroup(page, 'theme', '05-sidebar-theme.png');
    console.log(`[VERIFY] Theme gadgets: ${names.join(', ')}`);
  });

  test('06: サイドバー assist グループ — MarkdownReference配置確認', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);
    const names = await screenshotSidebarGroup(page, 'assist', '06-sidebar-assist.png');
    console.log(`[VERIFY] Assist gadgets: ${names.join(', ')}`);
    // MarkdownReferenceが配置されていること
    expect(names).toContain('MarkdownReference');
  });

  test('07: サイドバー advanced グループ', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);
    const names = await screenshotSidebarGroup(page, 'advanced', '07-sidebar-advanced.png');
    console.log(`[VERIFY] Advanced gadgets: ${names.join(', ')}`);
  });

  test('08: ヘルプモーダル — セクション確認・Lucideアイコンなし', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);

    // toggleModal + renderHelpModal で help-modal を開く
    await page.evaluate(() => {
      if (typeof window.toggleModal === 'function') {
        window.toggleModal('help-modal', true);
      }
      if (window.ZenWriterHelpModal && typeof window.ZenWriterHelpModal.render === 'function') {
        window.ZenWriterHelpModal.render();
      }
    });
    await page.waitForTimeout(800);

    // ヘルプモーダル全体をスクリーンショット
    // modal-overlay が display:block になっているはずなので、そのままページ全体を撮影
    await page.screenshot({ path: path.join(ssDir, '08-help-modal.png') });

    // ヘルプナビゲーションのセクション数を確認
    const sections = await page.evaluate(() => {
      const body = document.getElementById('help-modal-body');
      if (!body) return { navCount: 0, labels: [], bodyExists: false };
      const navBtns = body.querySelectorAll('.help-nav-btn, [data-help-section]');
      return {
        navCount: navBtns.length,
        labels: Array.from(navBtns).map(b => b.textContent.trim()),
        bodyExists: true,
      };
    });
    console.log(`[VERIFY] Help modal body exists: ${sections.bodyExists}`);
    console.log(`[VERIFY] Help nav sections: ${sections.navCount} - ${sections.labels.join(', ')}`);

    // Lucideアイコンが残っていないこと
    const lucideIcons = await page.evaluate(() => {
      return document.querySelectorAll('.help-nav-icon i[data-lucide]').length;
    });
    console.log(`[VERIFY] Lucide icons in help (should be 0): ${lucideIcons}`);
    expect(lucideIcons).toBe(0);
  });

  test('09: 設定モーダル — 全体スクリーンショット', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);
    await openSettingsModal(page);
    await page.waitForTimeout(500);

    // 設定モーダルの要素を撮影
    const modal = page.locator('#settings-modal');
    if (await modal.count() > 0) {
      await modal.screenshot({ path: path.join(ssDir, '09-settings-modal.png') });
    } else {
      await page.screenshot({ path: path.join(ssDir, '09-settings-modal.png'), fullPage: true });
    }
  });

  test('10: ロードアウト確認 — 4プリセット・graphic-novel削除', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);

    const presets = await page.evaluate(() => {
      const p = window.ZWLoadoutPresets;
      if (!p || !p.entries) return { names: [], active: '' };
      return {
        names: Object.keys(p.entries).sort(),
        active: p.active || '',
        details: Object.entries(p.entries).map(([k, v]) => ({
          name: k,
          groups: Object.keys(v.groups || {}),
          gadgetCount: Object.values(v.groups || {}).reduce((sum, arr) => sum + arr.length, 0),
        })),
      };
    });

    console.log(`[VERIFY] Loadout presets: ${presets.names.join(', ')}`);
    console.log(`[VERIFY] Active: ${presets.active}`);
    if (presets.details) {
      presets.details.forEach(d => {
        console.log(`[VERIFY]   ${d.name}: groups=[${d.groups.join(',')}] gadgets=${d.gadgetCount}`);
      });
    }

    // graphic-novel プリセットが削除されていること
    expect(presets.names).not.toContain('graphic-novel');
    // 4プリセットが存在すること
    expect(presets.names).toContain('novel-standard');
    expect(presets.names).toContain('novel-minimal');
    expect(presets.names).toContain('vn-layout');
    expect(presets.names).toContain('screenplay');
  });

  test('11: MarkdownReference ガジェット詳細', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);
    await openSidebarGroup(page, 'assist');
    await page.waitForTimeout(500);

    // assist パネル内のMarkdownReferenceに限定
    const mdRef = page.locator('#assist-gadgets-panel .gadget-wrapper[data-gadget-name="MarkdownReference"]');
    await expect(mdRef).toBeVisible({ timeout: 10000 });

    // 展開
    await page.evaluate(() => {
      if (window.ZWGadgets && window.ZWGadgets._setGadgetCollapsed) {
        window.ZWGadgets._setGadgetCollapsed('MarkdownReference', false);
      }
    });
    await page.waitForTimeout(500);
    await mdRef.screenshot({ path: path.join(ssDir, '11-markdown-reference.png') });
    console.log('[VERIFY] MarkdownReference gadget: visible in assist panel');
  });

  test('12: ui-labels ヘルプセクション名確認', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);

    const label = await page.evaluate(() => {
      return window.UILabels && window.UILabels.HELP_SECTION
        ? window.UILabels.HELP_SECTION
        : '(not found)';
    });
    console.log(`[VERIFY] HELP_SECTION label: ${label}`);
    // 「ヘルプ / リファレンス」ではなく「ヘルプ」であること
    expect(label).toBe('ヘルプ');
  });

  test('13: 全グループのガジェット数サマリー', async ({ page }) => {
    await page.goto(pageUrl);
    await waitReady(page);

    const summary = await page.evaluate(() => {
      const groups = ['structure', 'edit', 'theme', 'assist', 'advanced'];
      const result = {};
      let total = 0;
      groups.forEach(g => {
        const panel = document.getElementById(g + '-gadgets-panel');
        const wrappers = panel ? panel.querySelectorAll('.gadget-wrapper') : [];
        const names = Array.from(wrappers).map(w => w.getAttribute('data-gadget-name'));
        result[g] = names;
        total += names.length;
      });
      result._total = total;

      // 全登録ガジェット名
      const allRegistered = (window.ZWGadgets && window.ZWGadgets._list)
        ? window.ZWGadgets._list.map(g => g.name).sort()
        : [];
      result._registered = allRegistered;
      result._registeredCount = allRegistered.length;

      return result;
    });

    console.log(`[VERIFY] === Gadget Summary ===`);
    console.log(`[VERIFY] Registered: ${summary._registeredCount} gadgets`);
    console.log(`[VERIFY] In panels: ${summary._total} gadgets`);
    const groups = ['structure', 'edit', 'theme', 'assist', 'advanced'];
    groups.forEach(g => {
      console.log(`[VERIFY]   ${g} (${summary[g].length}): ${summary[g].join(', ')}`);
    });

    // 全ガジェットがいずれかのパネルに配置されていること
    const allInPanels = new Set();
    groups.forEach(g => summary[g].forEach(n => allInPanels.add(n)));
    const unplaced = summary._registered.filter(n => !allInPanels.has(n));
    if (unplaced.length > 0) {
      console.log(`[VERIFY] WARNING: Unplaced gadgets: ${unplaced.join(', ')}`);
    }
  });
});
