const { test, expect } = require('@playwright/test');
const { ensureNormalMode } = require('./helpers');

async function setMarkdownAndOpenPreview(page, markdown) {
  await page.evaluate((value) => {
    const editor = document.getElementById('editor');
    editor.value = value;
    const panel = document.getElementById('editor-preview');
    if (panel.classList.contains('editor-preview--collapsed')) {
      window.ZenWriterEditor.togglePreview();
    }
    window.ZenWriterEditor.renderMarkdownPreview();
  }, markdown);
}

test.describe('MD preview effect visibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForSelector('#editor', { state: 'attached', timeout: 10000 });
    await ensureNormalMode(page);
  });

  test('WYSIWYG underline reaches Markdown and the open preview', async ({ page }) => {
    await page.evaluate(() => {
      const rte = window.richTextEditor;
      if (!rte.isWysiwygMode) rte.switchToWysiwyg();
      rte.wysiwygEditor.innerHTML = '<p>下線を引く</p>';
      const range = document.createRange();
      range.selectNodeContents(rte.wysiwygEditor.querySelector('p'));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      window.ZenWriterEditor.togglePreview();
      rte.executeCommand('underline');
    });

    await expect(page.locator('#markdown-preview-panel .decor-underline')).toHaveText('下線を引く');
    const markdown = await page.evaluate(() => document.getElementById('editor').value);
    expect(markdown).toContain('[underline]下線を引く[/underline]');
  });

  test('glow and shadow stay distinguishable from plain text on dark themes', async ({ page }) => {
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await setMarkdownAndOpenPreview(page, '[glow]光彩[/glow]\n\n[shadow]影[/shadow]');

    const glow = page.locator('#markdown-preview-panel .decor-glow');
    const shadow = page.locator('#markdown-preview-panel .decor-shadow');
    await expect(glow).toBeVisible();
    const styles = await page.evaluate(() => ({
      glow: getComputedStyle(document.querySelector('#markdown-preview-panel .decor-glow')).textShadow,
      shadow: getComputedStyle(document.querySelector('#markdown-preview-panel .decor-shadow')).textShadow,
      bg: getComputedStyle(document.body).backgroundColor
    }));
    // 暗い背景の上で、背景色に近い灰色や黒の影にならないこと
    expect(styles.glow).toContain('rgb(142, 197, 255)');
    expect(styles.shadow).toContain('rgba(255, 255, 255, 0.5)');
    await expect(shadow).toBeVisible();
  });

  test('narrow viewport still shows the preview once it is opened', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 });
    await setMarkdownAndOpenPreview(page, '**太字**');

    const preview = page.locator('#editor-preview');
    await expect(preview).not.toHaveClass(/editor-preview--collapsed/);
    await expect(page.locator('#markdown-preview-panel strong')).toBeVisible();
    const box = await preview.boundingBox();
    expect(box && box.width).toBeGreaterThan(0);
  });
});
