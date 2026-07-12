// @ts-check
const { test, expect } = require('@playwright/test');
const { ensureNormalMode, openSidebarGroup } = require('./helpers');

const pageUrl = '/index.html';

async function readLeftNavState(page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const readCategory = (id) => {
      const section = document.querySelector(`.accordion-category[data-category="${id}"]`);
      const header = section ? section.querySelector('.accordion-header') : null;
      const content = section ? section.querySelector('.accordion-content') : null;
      return {
        exists: !!section,
        ariaHidden: section ? section.getAttribute('aria-hidden') : null,
        expanded: header ? header.getAttribute('aria-expanded') : null,
        contentHidden: content ? content.hidden || window.getComputedStyle(content).display === 'none' : null,
        activeClass: section ? section.classList.contains('is-active-category') : false,
        lastActiveClass: section ? section.classList.contains('is-last-active-category') : false
      };
    };
    return {
      navState: html.getAttribute('data-left-nav-state'),
      active: html.getAttribute('data-left-nav-active'),
      lastActive: html.getAttribute('data-left-nav-last-active'),
      anchorLabel: document.getElementById('sidebar-nav-anchor-label')?.textContent?.trim() || '',
      sections: readCategory('sections'),
      structure: readCategory('structure'),
      advanced: readCategory('advanced')
    };
  });
}

test.describe('Sidebar root/category shell contract', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(pageUrl);
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);
  });

  test('launch starts at the left-nav root with category buttons available', async ({ page }) => {
    const state = await readLeftNavState(page);

    expect(state.navState).toBe('root');
    expect(state.active).toBeNull();
    expect(state.sections.exists).toBe(true);
    expect(state.structure.exists).toBe(true);
    expect(state.advanced.exists).toBe(true);
  });

  test('activating a category shows only that category content', async ({ page }) => {
    await openSidebarGroup(page, 'structure');
    await page.waitForSelector('#structure-gadgets-panel', { state: 'visible', timeout: 10000 });

    const state = await readLeftNavState(page);

    expect(state.navState).toBe('category');
    expect(state.active).toBe('structure');
    expect(state.anchorLabel).toBe('構造');
    expect(state.structure.expanded).toBe('true');
    expect(state.structure.contentHidden).toBe(false);
    expect(state.structure.activeClass).toBe(true);
    expect(state.sections.ariaHidden).toBe('true');
    expect(state.sections.contentHidden).toBe(true);
  });

  test('returning to root preserves the last-active cue but does not reopen content', async ({ page }) => {
    await openSidebarGroup(page, 'advanced');
    await page.evaluate(() => window.sidebarManager.returnToLeftNavRoot());
    await page.waitForTimeout(150);

    const state = await readLeftNavState(page);

    expect(state.navState).toBe('root');
    expect(state.active).toBeNull();
    expect(state.lastActive).toBe('advanced');
    expect(state.advanced.lastActiveClass).toBe(true);
    expect(state.advanced.expanded).toBe('false');
    expect(state.advanced.contentHidden).toBe(true);
  });

  test('reload starts at root while keeping the last-active category cue', async ({ page }) => {
    await openSidebarGroup(page, 'structure');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await ensureNormalMode(page);

    const state = await readLeftNavState(page);

    expect(state.navState).toBe('root');
    expect(state.active).toBeNull();
    expect(state.lastActive).toBe('structure');
    expect(state.structure.lastActiveClass).toBe(true);
    expect(state.structure.expanded).toBe('false');
  });

  test.skip('category-header drag and drop is not implemented in the current root/category shell', async () => {});
});
