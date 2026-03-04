// @ts-check
const { test } = require('@playwright/test');

// デバッグ専用ユーティリティ - 通常テストでは実行しない
test.skip('UI Debug - スクリーンショット撮影', async ({ page }) => {
  await page.goto('http://localhost:8080?reset=1');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // UI初期化を待つ

  // 全体のスクリーンショット
  await page.screenshot({ path: 'debug-screenshot-full.png', fullPage: true });

  // ツールバーだけのスクリーンショット
  const toolbar = await page.locator('.toolbar');
  await toolbar.screenshot({ path: 'debug-screenshot-toolbar.png' });

  // スキップリンクの状態を確認
  const skipLink = await page.locator('.skip-link');
  const skipLinkBox = await skipLink.boundingBox();
  console.log('Skip Link Bounding Box:', skipLinkBox);

  const skipLinkStyles = await page.evaluate(() => {
    const el = document.querySelector('.skip-link');
    const styles = window.getComputedStyle(el);
    return {
      top: styles.top,
      left: styles.left,
      position: styles.position,
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      zIndex: styles.zIndex
    };
  });
  console.log('Skip Link Computed Styles:', skipLinkStyles);

  // ツールバーの全ボタンを確認
  const buttons = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.toolbar button, .toolbar-actions button'));
    return btns.map((btn, i) => ({
      index: i,
      id: btn.id,
      className: btn.className,
      text: btn.textContent.trim().substring(0, 100),
      visible: window.getComputedStyle(btn).display !== 'none',
      rect: btn.getBoundingClientRect()
    }));
  });
  console.log('Toolbar Buttons:', JSON.stringify(buttons, null, 2));

  // 「TT」を含む要素を検索
  const ttElements = await page.evaluate(() => {
    function findTextNodes(element) {
      const nodes = [];
      const walk = document.createTreeWalker(element, NodeFilter.SHOW_ALL);
      let node;
      while (node = walk.nextNode()) {
        const text = node.textContent || '';
        if (text.includes('TT') || text.trim() === 'TT') {
          nodes.push({
            nodeName: node.nodeName,
            nodeType: node.nodeType,
            text: text.substring(0, 100),
            parentClass: node.parentElement?.className,
            parentId: node.parentElement?.id
          });
        }
      }
      return nodes;
    }
    return findTextNodes(document.body);
  });
  console.log('Elements containing "TT":', JSON.stringify(ttElements, null, 2));

  // ツールバーグループラベルをすべて確認
  const groupLabels = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('.toolbar-group-label'));
    return labels.map(label => ({
      text: label.textContent,
      className: label.className,
      parentClass: label.parentElement?.className,
      computedStyle: {
        display: window.getComputedStyle(label).display,
        position: window.getComputedStyle(label).position,
        fontSize: window.getComputedStyle(label).fontSize,
        opacity: window.getComputedStyle(label).opacity,
        visibility: window.getComputedStyle(label).visibility
      },
      rect: label.getBoundingClientRect()
    }));
  });
  console.log('Toolbar Group Labels:', JSON.stringify(groupLabels, null, 2));

  // スクリーンショットの「TT」の位置（x: 1000-1100, y: 20-30あたり）にある要素を特定
  const elementsAtTTPosition = await page.evaluate(() => {
    const elements = document.elementsFromPoint(1040, 25); // TTの推定位置
    return elements.slice(0, 5).map(el => ({
      tagName: el.tagName,
      className: el.className,
      id: el.id,
      textContent: el.textContent?.substring(0, 50),
      innerHTML: el.innerHTML?.substring(0, 200),
      computedFontFamily: window.getComputedStyle(el).fontFamily,
      rect: el.getBoundingClientRect()
    }));
  });
  console.log('Elements at TT position (1040, 25):', JSON.stringify(elementsAtTTPosition, null, 2));
});
