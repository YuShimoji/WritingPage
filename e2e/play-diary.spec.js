const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const { setupChapterModeChapters } = require('./helpers');

test.use({ storageState: { cookies: [], origins: [] } });

async function command(page, label) {
  await page.keyboard.press('F2');
  await page.locator('#command-palette-input').fill(label);
  await page.getByRole('option', { name: new RegExp(label) }).first().click();
}

const sample = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');

test('source insertion keeps surrounding paragraphs, and cancel leaves the manuscript alone', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForLoadState('networkidle');
  await command(page, 'Markdown ソース');
  const editor = page.locator('#editor');
  await editor.fill('舟着き場。\n\n帰り道。');
  await editor.press('Control+Home');
  await command(page, 'プレイ日記の場面を挿入');
  const dialog = page.locator('#play-diary-dialog');
  await dialog.getByRole('button', { name: '場面を挿入', exact: true }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await dialog.getByLabel('日記本文').fill('途中の記録。');
  await dialog.getByRole('button', { name: '場面を挿入', exact: true }).click();
  const saved = await editor.inputValue();
  expect(saved).toMatch(/^舟着き場。[\s\S]+\[!PLAY-DIARY\][\s\S]+途中の記録。[\s\S]+帰り道。$/);
  await command(page, 'プレイ日記の場面を挿入');
  await dialog.getByLabel('和訳').fill('未確定の訳');
  await dialog.press('Escape');
  await expect(editor).toHaveValue(saved);
  await expect(editor).toBeFocused();
});

test('write a scene, resume editing, preview and open its standalone HTML', async ({ page, context }, testInfo) => {
  await page.goto('/index.html');
  await page.waitForLoadState('networkidle');
  const rich = page.locator('#wysiwyg-editor');
  await expect(rich).toBeVisible();
  await rich.fill('出発前の記録');
  await command(page, 'プレイ日記の場面を挿入');
  const dialog = page.getByRole('dialog', { name: 'プレイ日記の場面を挿入' });
  await dialog.getByLabel('ゲーム内の日付').fill('霧月3日（Day 7）');
  await dialog.getByLabel('ゲーム内の台詞').fill('Which road leads to the harbor?');
  await dialog.getByLabel('和訳').fill('港に続くのはどちらの道？');
  await dialog.getByLabel('スクリーンショット').setInputFiles({ name: 'map.png', mimeType: 'image/png', buffer: sample });
  await dialog.getByLabel('画像の説明').fill('分かれ道[東]の地図');
  await dialog.getByLabel('日記本文').fill('港を目印に東へ進む。');
  await dialog.getByRole('button', { name: '場面を挿入', exact: true }).click();
  const scene = rich.locator('.play-diary-scene');
  await expect(scene.locator('blockquote em')).toHaveText('港に続くのはどちらの道？');
  await expect(rich).toContainText('出発前の記録');
  await expect(scene.getByAltText('分かれ道[東]の地図')).toHaveJSProperty('naturalWidth', 1);
  await expect(page.locator('#editor')).toHaveValue(/asset:\/\/asset_/);
  await expect(page.locator('#editor')).not.toHaveValue(/data:image/);
  await page.keyboard.type('After.');
  await page.reload();
  await expect(rich).toContainText('After.');
  await expect(scene).not.toContainText('After.');
  await expect(scene.locator('header')).toHaveText('霧月3日（Day 7）');
  await expect(scene.locator('.play-diary-note')).toContainText('港を目印に東へ進む。');
  await command(page, 'MD プレビュー');
  await expect(page.locator('#markdown-preview-panel .play-diary-scene img')).toHaveJSProperty('naturalWidth', 1);
  await page.locator('#editor-preview-back').click();
  await page.keyboard.press('Alt+Shift+r');
  const reader = page.locator('#reader-preview');
  await expect(reader.locator('.play-diary-scene img')).toHaveJSProperty('naturalWidth', 1);
  const downloadPromise = page.waitForEvent('download');
  await reader.getByRole('button', { name: 'HTMLとして保存', exact: false }).click();
  const file = testInfo.outputPath('diary.html');
  await (await downloadPromise).saveAs(file);
  const standalone = await context.newPage();
  await standalone.goto(pathToFileURL(file).href);
  const rendered = standalone.locator('.play-diary-scene');
  await expect(rendered.getByAltText('分かれ道[東]の地図')).toHaveJSProperty('naturalWidth', 1);
  const speech = rendered.locator('blockquote');
  const note = rendered.locator('.play-diary-note');
  expect((await note.boundingBox()).x).toBeGreaterThan((await speech.boundingBox()).x);
  await standalone.setViewportSize({ width: 390, height: 700 });
  expect((await note.boundingBox()).y).toBeGreaterThan((await speech.boundingBox()).y);
});

test('speaker turns keep their names, translations and reading order through editing and export', async ({ page, context }, testInfo) => {
  await page.goto('/index.html');
  const rich = page.locator('#wysiwyg-editor');
  await expect(rich).toBeVisible();
  await rich.fill('渡し場のプレイ日記');
  await command(page, 'プレイ日記の場面を挿入');
  const dialog = page.locator('#play-diary-dialog');
  await dialog.getByLabel('ゲーム内の日付').fill('霧月3日（Day 7）');
  const player = dialog.getByRole('group', { name: '発言 1' });
  await player.getByLabel('話者の種類').selectOption('player');
  await player.getByLabel('話者名').fill('旅人');
  await player.getByLabel('ゲーム内の台詞').fill('Which road leads to the harbor?');
  await player.getByLabel('和訳').fill('港に続くのはどちらの道？');
  await dialog.getByRole('button', { name: '発言を追加' }).click();
  const npc = dialog.getByRole('group', { name: '発言 2' });
  await npc.getByLabel('話者の種類').selectOption('npc');
  await npc.getByLabel('話者名').fill('渡し守');
  await npc.getByLabel('ゲーム内の台詞').fill('Take the path along the river.');
  await npc.getByLabel('和訳').fill('川沿いの道を行って。');
  await dialog.getByRole('button', { name: '発言を追加' }).click();
  await dialog.getByRole('group', { name: '発言 3' }).getByRole('button', { name: 'この発言を外す' }).click();
  await dialog.getByLabel('日記本文').fill('道標のところで地図を開く。川は東に曲がっていて、その先に灯台が見えた。');
  await dialog.getByRole('button', { name: '場面を挿入' }).click();
  const assertScene = async (scene) => {
    const turns = scene.locator('.play-diary-turn');
    await expect(turns).toHaveCount(2);
    await expect(turns.nth(0)).toHaveAttribute('data-speaker', 'player');
    await expect(turns.nth(0).locator('.play-diary-caption strong')).toHaveText('旅人');
    await expect(turns.nth(0).locator('em')).toHaveText('港に続くのはどちらの道？');
    await expect(turns.nth(1)).toHaveAttribute('data-speaker', 'npc');
    await expect(turns.nth(1).locator('.play-diary-caption strong')).toHaveText('渡し守');
    await expect(turns.nth(1).locator('em')).toHaveText('川沿いの道を行って。');
    await expect(scene.locator('.play-diary-note .play-diary-caption')).toHaveText('筆者の記録');
  };
  await assertScene(rich);
  await page.keyboard.type(' ');
  await expect(page.locator('#editor')).toHaveValue(/\[!SPEAKER:player\] 旅人[\s\S]*\[!SPEAKER:npc\] 渡し守/);
  await page.reload();
  await assertScene(rich);
  await command(page, 'MD プレビュー');
  await assertScene(page.locator('#markdown-preview-panel'));
  await page.locator('#editor-preview-back').click();
  await page.keyboard.press('Alt+Shift+r');
  const reader = page.locator('#reader-preview');
  await assertScene(reader);
  const download = page.waitForEvent('download');
  await reader.getByRole('button', { name: 'HTMLとして保存' }).click();
  const file = testInfo.outputPath('speaker-layouts.html');
  await (await download).saveAs(file);
  const html = await context.newPage();
  await html.setViewportSize({ width: 900, height: 700 });
  await html.goto(pathToFileURL(file).href);
  await assertScene(html.locator('article'));
  const scene = html.locator('.play-diary-scene');
  const turns = scene.locator('.play-diary-turn');
  expect((await turns.first().boundingBox()).x).toBeGreaterThan((await turns.last().boundingBox()).x);
  await scene.screenshot({ path: testInfo.outputPath('speaker-wide.png') });
  await html.setViewportSize({ width: 390, height: 760 });
  const note = await scene.locator('.play-diary-note').boundingBox();
  const last = await turns.last().boundingBox();
  expect(note.y).toBeGreaterThanOrEqual(last.y + last.height - 1);
  expect(await html.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await scene.screenshot({ path: testInfo.outputPath('speaker-narrow.png') });
});

test('an older diary keeps unattributed speech, and speaker names round-trip as literal text', async ({ page }) => {
  await page.goto('/index.html');
  const rich = page.locator('#wysiwyg-editor');
  await expect(rich).toBeVisible();
  await command(page, 'Markdown ソース');
  await page.locator('#editor').fill('> [!PLAY-DIARY]\n>\n> > 誰だろう。\n>\n> 振り返った。');
  await page.getByRole('button', { name: 'リッチテキストに戻る' }).click();
  await expect(rich.locator('.play-diary-turn .play-diary-caption')).toHaveText('ゲーム内の台詞');
  await expect(rich.locator('.play-diary-note')).toContainText('振り返った。');
  await command(page, 'プレイ日記の場面を挿入');
  const dialog = page.locator('#play-diary-dialog');
  await dialog.getByLabel('話者名').fill('A&B <港> [西]');
  await dialog.getByRole('button', { name: '場面を挿入' }).click();
  await expect(dialog.getByRole('alert')).toContainText('発言 1');
  await dialog.getByLabel('和訳').fill('こんにちは。');
  await dialog.getByRole('button', { name: '場面を挿入' }).click();
  await expect(rich.locator('.play-diary-caption strong')).toHaveText('A&B <港> [西]');
  await expect(page.locator('#editor')).toHaveValue(/\[!SPEAKER:unknown\]/);
  await page.reload();
  await expect(rich.locator('.play-diary-caption strong')).toHaveText('A&B <港> [西]');
  await expect(rich.locator('.play-diary-turn em')).toHaveText('こんにちは。');
});

test('each visible episode has a working contents, previous and next link in the exported file', async ({ page, context }, testInfo) => {
  await page.goto('/index.html');
  await expect(page.locator('#wysiwyg-editor')).toBeVisible();
  const docId = await setupChapterModeChapters(page, [
    { title: '渡し場', content: '> [!PLAY-DIARY]\n>\n> 川辺で待つ。\n\n### 舟に乗る' },
    { title: '下書きの寄り道', content: '保留中の原稿' },
    { title: '渡し場', content: '対岸に着いた。' }
  ]);
  await page.evaluate(id => {
    const store = window.ZWChapterStore;
    store.updateChapterMeta(store.getChaptersForDoc(id)[1].id, { visibility: 'draft' });
  }, docId);
  await page.keyboard.press('Alt+Shift+r');
  const reader = page.locator('#reader-preview');
  await expect(reader.getByRole('navigation', { name: '日記の目次' }).getByRole('link')).toHaveCount(2);
  const downloading = page.waitForEvent('download');
  await reader.locator('#reader-export-html').click();
  const file = testInfo.outputPath('episodes.html');
  await (await downloading).saveAs(file);
  const standalone = await context.newPage();
  await standalone.goto(pathToFileURL(file).href);
  await expect(standalone.locator('body')).not.toContainText('保留中の原稿');
  await standalone.locator('#diary-contents a').first().click();
  await expect(standalone).toHaveURL(/#diary-entry-1$/);
  await standalone.getByRole('link', { name: '次の話' }).click();
  await expect(standalone).toHaveURL(/#diary-entry-2$/);
  await standalone.getByRole('link', { name: '前の話' }).click();
  await expect(standalone).toHaveURL(/#diary-entry-1$/);
  await standalone.locator('#diary-entry-1').getByRole('link', { name: '目次' }).click();
  await expect(standalone).toHaveURL(/#diary-contents$/);
});

test('large screenshots travel once in JSON and restore in an empty browser', async ({ page, browser }, testInfo) => {
  test.slow(); // Two fresh contexts transfer and decode a full-resolution image.
  await page.goto('/index.html');
  await expect(page.locator('#wysiwyg-editor')).toBeVisible();
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    const pixels = ctx.createImageData(canvas.width, canvas.height);
    let seed = 17;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      pixels.data[i] = seed >>> 24;
      pixels.data[i + 1] = (seed >>> 16) & 255;
      pixels.data[i + 2] = (seed >>> 8) & 255;
      pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    return canvas.toDataURL().split(',')[1];
  });
  expect(png.length).toBeGreaterThan(5 * 1024 * 1024);
  await command(page, 'プレイ日記の場面を挿入');
  const dialog = page.locator('#play-diary-dialog');
  await dialog.getByLabel('スクリーンショット').setInputFiles({ name: 'scene.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await dialog.getByRole('button', { name: '場面を挿入', exact: true }).click();
  await expect(page.locator('#wysiwyg-editor .play-diary-scene img')).toHaveJSProperty('naturalWidth', 1600);
  await page.reload();
  await expect(page.locator('#wysiwyg-editor .play-diary-scene img')).toHaveJSProperty('naturalWidth', 1600);
  async function openManuscriptMenu(tab) {
    // Startup repaints the gadgets once, including their popup controls.
    await tab.waitForLoadState('networkidle');
    await tab.evaluate(() => window.sidebarManager.activateSidebarGroup('manuscript'));
    await tab.locator('#documents-io-menu-btn').click();
  }
  await openManuscriptMenu(page);
  const downloading = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'JSON書き出し' }).click();
  const file = testInfo.outputPath('diary.zwp.json');
  await (await downloading).saveAs(file);
  const backup = JSON.parse(await require('node:fs/promises').readFile(file, 'utf8'));
  const assets = Object.values(backup.assets);
  expect(assets).toHaveLength(1);
  expect(assets[0].dataUrl === 'data:image/png;base64,' + png).toBe(true);
  expect(backup.document.content).not.toContain('data:image');
  const fresh = await browser.newContext();
  try {
    const restored = await fresh.newPage();
    await restored.goto(page.url());
    await expect(restored.locator('#wysiwyg-editor')).toBeVisible();
    await openManuscriptMenu(restored);
    const choosing = restored.waitForEvent('filechooser');
    await restored.getByRole('menuitem', { name: 'JSON読み込み' }).click();
    await (await choosing).setFiles(file);
    const image = restored.locator('#wysiwyg-editor .play-diary-scene img');
    await expect(image).toHaveJSProperty('naturalWidth', 1600);
    await restored.reload();
    await expect(image).toHaveJSProperty('naturalWidth', 1600);
  } finally { await fresh.close(); }
});

test('a scene written in the assembled manuscript stays in its episode after reopening', async ({ page }) => {
  await page.goto('/index.html');
  await setupChapterModeChapters(page, [
    { title: '渡し場', content: '### 道標\n\n地図を開く。' },
    { title: '渡し場', content: '対岸に着いた。' }
  ]);
  await page.reload();
  const rich = page.locator('#wysiwyg-editor');
  await rich.getByText('地図を開く。', { exact: true }).click();
  await command(page, 'プレイ日記の場面を挿入');
  const dialog = page.locator('#play-diary-dialog');
  await dialog.getByLabel('日記本文').fill('風がやんだ。');
  await dialog.getByRole('button', { name: '場面を挿入', exact: true }).click();
  await page.keyboard.insertText('次の船を待つ。');
  await page.keyboard.press('Alt+Shift+r');
  const entries = page.locator('#reader-preview .play-diary-entry');
  await expect(entries).toHaveCount(2);
  await expect(entries.first()).toContainText('風がやんだ。');
  await expect(entries.first()).toContainText('次の船を待つ。');
  await expect(entries.last()).toContainText('対岸に着いた。');
  await page.reload();
  await expect(rich.locator('h2')).toHaveCount(2);
  await expect(rich.locator('h3')).toHaveText('道標');
  await expect(rich.locator('.play-diary-scene')).toContainText('風がやんだ。');
  await rich.locator('h2').last().click();
  await page.keyboard.press('End');
  await page.keyboard.insertText('の対岸');
  await page.reload();
  await expect(rich.locator('h2').last()).toHaveText('渡し場の対岸');
});

test('Markdown episode headings become standalone links without chapter records', async ({ page }) => {
  await page.goto('/index.html');
  await command(page, 'Markdown ソース');
  await page.locator('#editor').fill('## 出港\n\n> [!PLAY-DIARY]\n>\n> 船を待つ。\n\n### 風向き\n\n西風。\n\n## 入港\n\n桟橋へ。');
  await page.keyboard.press('Alt+Shift+r');
  const reader = page.locator('#reader-preview');
  await expect(reader.locator('#diary-contents a')).toHaveText(['出港', '入港']);
  await expect(reader.locator('#diary-entry-1 h3')).toHaveText('風向き');
});
