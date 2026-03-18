// @ts-check
const { test, expect } = require('@playwright/test');
const { enableAllGadgets, openSidebarGroup } = require('./helpers');

test.describe('Story Wiki AI生成', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => {
      try { return !!window.ZWGadgets; } catch (_) { return false; }
    }, { timeout: 20000 });
    await enableAllGadgets(page);
    await openSidebarGroup(page, 'edit');
    await page.waitForSelector('#edit-gadgets-panel .gadget-wrapper', { state: 'attached', timeout: 10000 });
  });

  test('should expose StoryWikiAI global API', async ({ page }) => {
    const hasAPI = await page.evaluate(() => {
      return !!(window.StoryWikiAI &&
        typeof window.StoryWikiAI.generateTemplate === 'function' &&
        typeof window.StoryWikiAI.generateDraft === 'function' &&
        typeof window.StoryWikiAI.extractMentions === 'function' &&
        typeof window.StoryWikiAI.openSettings === 'function');
    });
    expect(hasAPI).toBe(true);
  });

  test('should generate category-specific template', async ({ page }) => {
    const template = await page.evaluate(() => {
      if (!window.StoryWikiAI) return '';
      return window.StoryWikiAI.generateTemplate('TestHero', 'character', []);
    });

    expect(template).toContain('## 概要');
    expect(template).toContain('## 外見');
    expect(template).toContain('## 性格');
    expect(template).toContain('## 経歴');
    expect(template).toContain('## 関連');
  });

  test('should generate location template with correct sections', async ({ page }) => {
    const template = await page.evaluate(() => {
      if (!window.StoryWikiAI) return '';
      return window.StoryWikiAI.generateTemplate('TestCity', 'location', []);
    });

    expect(template).toContain('## 概要');
    expect(template).toContain('## 地理');
    expect(template).toContain('## 歴史');
    expect(template).toContain('## 特徴');
  });

  test('should extract mentions from editor content', async ({ page }) => {
    // エディタ (contenteditable) に内容を設定
    await page.evaluate(() => {
      var editor = document.querySelector('#editor');
      if (editor) {
        editor.innerHTML = '<p>勇者アルファは王国を守る。アルファは強い。アルファの剣は伝説だ。</p>';
      }
    });

    const mentions = await page.evaluate(() => {
      if (!window.StoryWikiAI) return [];
      return window.StoryWikiAI.extractMentions('アルファ', []);
    });

    expect(mentions.length).toBeGreaterThan(0);
    expect(mentions[0]).toContain('アルファ');
  });

  test('should include mentions in template', async ({ page }) => {
    // エディタ (contenteditable) に言及を含むテキストを設定
    await page.evaluate(() => {
      var editor = document.querySelector('#editor');
      if (editor) {
        editor.innerHTML = '<p>伝説の剣エクスカリバーは王の象徴である。エクスカリバーは湖から引き上げられた。</p>';
      }
    });

    const template = await page.evaluate(() => {
      if (!window.StoryWikiAI) return '';
      return window.StoryWikiAI.generateTemplate('エクスカリバー', 'item', []);
    });

    expect(template).toContain('本文からの言及');
    expect(template).toContain('エクスカリバー');
  });

  test('should fallback to template when no API key set', async ({ page }) => {
    const result = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (!window.StoryWikiAI) { resolve({ content: '', warning: 'no API' }); return; }
        window.StoryWikiAI.generateDraft('TestTerm', 'term', [], function (content, warning) {
          resolve({ content: content, warning: warning });
        });
      });
    });

    expect(result.content).toContain('## 概要');
    expect(result.content).toContain('## 定義');
    expect(result.warning).toBeNull();
  });

  test('should show settings button in sidebar', async ({ page }) => {
    const settingsBtn = page.locator('.swiki-btn-settings');
    await expect(settingsBtn.first()).toBeVisible();
  });

  test('should open settings dialog', async ({ page }) => {
    const settingsBtn = page.locator('.swiki-btn-settings').first();
    await settingsBtn.click();
    await page.waitForTimeout(300);

    // オーバーレイが表示される
    const overlay = page.locator('.swiki-overlay');
    await expect(overlay).toBeVisible();

    // API キー入力欄がある
    const apiKeyInput = overlay.locator('input[type="password"]');
    await expect(apiKeyInput).toBeVisible();

    // モデル入力欄がある
    const modelInput = overlay.locator('input[type="text"]').last();
    expect(await modelInput.inputValue()).toBe('gpt-4o-mini');

    // 閉じる
    await page.keyboard.press('Escape');
    await expect(overlay).not.toBeVisible();
  });

  test('should show draft button in edit form', async ({ page }) => {
    // Wiki エントリを作成
    await page.evaluate(() => {
      var s = window.ZenWriterStorage;
      if (s && s.createStoryWikiEntry) {
        s.createStoryWikiEntry({ title: 'DraftTest', category: 'character', source: 'manual' });
      }
    });

    // 展開 → エントリ選択 → 編集
    const expandBtn = page.locator('.swiki-btn-expand').first();
    await expandBtn.click();
    await page.waitForTimeout(300);

    const item = page.locator('.swiki-tree-item', { hasText: 'DraftTest' });
    await item.click();
    await page.waitForTimeout(300);

    // 編集ボタンをクリック
    const editBtn = page.locator('.swiki-detail-actions .swiki-btn', { hasText: '編集' });
    await editBtn.click();
    await page.waitForTimeout(300);

    // 下書き生成ボタンが表示される
    const draftBtn = page.locator('.swiki-btn-draft');
    await expect(draftBtn).toBeVisible();

    // クリックするとテンプレートが生成される
    await draftBtn.click();
    await page.waitForTimeout(500);

    const textarea = page.locator('.swiki-textarea');
    const value = await textarea.inputValue();
    expect(value).toContain('## 概要');
  });
});
