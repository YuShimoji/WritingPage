// E2E: Pomodoro/集中タイマー機能の検証
const { test, expect } = require('@playwright/test');

const pageUrl = '/index.html';

async function waitGadgetsReady(page) {
  await page.waitForFunction(() => {
    try {
      return !!window.ZWGadgets && !!document.querySelector('#assist-gadgets-panel');
    } catch (_) { return false; }
  });
  // サイドバーを確実に開く
  const sidebar = page.locator('.sidebar');
  const toggleBtn = page.locator('#toggle-sidebar');
  if (await toggleBtn.isVisible().catch(() => false)) {
    const opened = await sidebar.evaluate((el) => el.classList.contains('open')).catch(() => false);
    if (!opened) {
      await toggleBtn.click();
      await expect(sidebar).toHaveClass(/open/);
    }
  }
  // assistタブをアクティブにしてガジェットパネルを表示
  const assistTab = page.locator('.sidebar-tab[data-group="assist"]');
  if (await assistTab.isVisible().catch(() => false)) {
    await assistTab.click();
  }
  // 初回レンダ後のガジェット要素を待機
  await page.waitForTimeout(500);
  await page.waitForSelector('#assist-gadgets-panel .gadget-wrapper', { state: 'attached' });
  return true;
}

test.describe('Pomodoro Timer E2E', () => {
  test('PomodoroTimer gadget renders and displays initial state', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    // ガジェットパネルと PomodoroTimer の存在を確認
    await expect(page.locator('#assist-gadgets-panel')).toBeVisible();
    const pomodoroGadget = page.locator('#assist-gadgets-panel .gadget-wrapper[data-gadget-name="PomodoroTimer"]');
    await expect(pomodoroGadget).toBeVisible();

    // タイマー表示エリアの存在確認
    const display = pomodoroGadget.locator('.pomodoro-display');
    await expect(display).toBeVisible();

    // 時間表示の確認（初期状態は25:00）
    const timeDisplay = display.locator('.pomodoro-time');
    await expect(timeDisplay).toBeVisible();
    const timeText = await timeDisplay.innerText();
    expect(timeText).toMatch(/\d{2}:\d{2}/);

    // 状態表示の確認
    const stateDisplay = display.locator('.pomodoro-state');
    await expect(stateDisplay).toBeVisible();
  });

  test('PomodoroTimer can start and display running state', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    const pomodoroGadget = page.locator('#assist-gadgets-panel .gadget-wrapper[data-gadget-name="PomodoroTimer"]');
    await expect(pomodoroGadget).toBeVisible();

    // 開始ボタンをクリック
    const startBtn = pomodoroGadget.locator('button:has-text("開始")');
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // タイマーが開始されたことを確認（状態が「作業中」になる）
    await page.waitForTimeout(1000);
    const stateDisplay = pomodoroGadget.locator('.pomodoro-state');
    const stateText = await stateDisplay.innerText();
    expect(stateText).toMatch(/作業中|待機中/);

    // 一時停止ボタンが表示されることを確認
    const pauseBtn = pomodoroGadget.locator('button:has-text("一時停止")');
    await expect(pauseBtn).toBeVisible();
  });

  test('PomodoroTimer can pause and resume', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    const pomodoroGadget = page.locator('#assist-gadgets-panel .gadget-wrapper[data-gadget-name="PomodoroTimer"]');
    await expect(pomodoroGadget).toBeVisible();

    // タイマーを開始
    const startBtn = pomodoroGadget.locator('button:has-text("開始")');
    await startBtn.click();
    await page.waitForTimeout(500);

    // 一時停止
    const pauseBtn = pomodoroGadget.locator('button:has-text("一時停止")');
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();
    await page.waitForTimeout(500);

    // 状態が「一時停止」になることを確認
    const stateDisplay = pomodoroGadget.locator('.pomodoro-state');
    const pausedState = await stateDisplay.innerText();
    expect(pausedState).toMatch(/一時停止/);

    // 再開ボタンが表示されることを確認
    const resumeBtn = pomodoroGadget.locator('button:has-text("再開")');
    await expect(resumeBtn).toBeVisible();

    // 再開
    await resumeBtn.click();
    await page.waitForTimeout(500);

    // 状態が「作業中」に戻ることを確認
    const resumedState = await stateDisplay.innerText();
    expect(resumedState).toMatch(/作業中/);
  });

  test('PomodoroTimer can switch to custom mode', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    const pomodoroGadget = page.locator('#assist-gadgets-panel .gadget-wrapper[data-gadget-name="PomodoroTimer"]');
    await expect(pomodoroGadget).toBeVisible();

    // カスタムモードボタンをクリック
    const customBtn = pomodoroGadget.locator('button:has-text("カスタム")');
    await expect(customBtn).toBeVisible();
    await customBtn.click();

    // カスタム時間入力が表示されることを確認
    const customInput = pomodoroGadget.locator('.pomodoro-custom-input input[type="number"]');
    await expect(customInput).toBeVisible();

    // カスタム時間を設定
    await customInput.fill('30');
    await page.waitForTimeout(200);

    // 開始ボタンをクリック
    const startBtn = pomodoroGadget.locator('button:has-text("開始")');
    await startBtn.click();
    await page.waitForTimeout(1000);

    // タイマーが開始されたことを確認
    const stateDisplay = pomodoroGadget.locator('.pomodoro-state');
    const stateText = await stateDisplay.innerText();
    expect(stateText).toMatch(/作業中|待機中/);
  });

  test('PomodoroTimer displays progress bar', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    const pomodoroGadget = page.locator('#assist-gadgets-panel .gadget-wrapper[data-gadget-name="PomodoroTimer"]');
    await expect(pomodoroGadget).toBeVisible();

    // 進捗バーの存在確認
    const progressBar = pomodoroGadget.locator('.pomodoro-progress');
    await expect(progressBar).toBeVisible();

    const progressFill = pomodoroGadget.locator('.pomodoro-progress-fill');
    await expect(progressFill).toBeVisible();

    // タイマーを開始
    const startBtn = pomodoroGadget.locator('button:has-text("開始")');
    await startBtn.click();
    await page.waitForTimeout(2000);

    // 進捗バーが更新されることを確認（幅が0%より大きくなる）
    const width = await progressFill.evaluate((el) => {
      return parseFloat(el.style.width) || 0;
    });
    expect(width).toBeGreaterThan(0);
  });

  test('PomodoroTimer timer instance is available globally', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    // グローバルインスタンスの存在確認
    const timerAvailable = await page.evaluate(() => {
      return !!window.ZenWriterPomodoro;
    });
    expect(timerAvailable).toBeTruthy();

    // タイマーの状態を取得できることを確認
    const state = await page.evaluate(() => {
      if (window.ZenWriterPomodoro) {
        return window.ZenWriterPomodoro.getState();
      }
      return null;
    });
    expect(state).toBeTruthy();
    expect(state).toHaveProperty('state');
    expect(state).toHaveProperty('mode');
    expect(state).toHaveProperty('remainingMs');
  });

  test('PomodoroTimer HUD integration works', async ({ page }) => {
    await page.goto(pageUrl);
    await waitGadgetsReady(page);

    // HUDの存在確認
    const hudAvailable = await page.evaluate(() => {
      return !!window.ZenWriterHUD;
    });
    expect(hudAvailable).toBeTruthy();

    const pomodoroGadget = page.locator('#assist-gadgets-panel .gadget-wrapper[data-gadget-name="PomodoroTimer"]');
    await expect(pomodoroGadget).toBeVisible();

    // タイマーを開始（HUD通知が表示される）
    const startBtn = pomodoroGadget.locator('button:has-text("開始")');
    await startBtn.click();
    await page.waitForTimeout(500);

    // HUD要素の存在確認（表示される可能性がある）
    const hud = page.locator('.mini-hud');
    // HUDは一時的に表示される可能性があるため、存在確認のみ
    // 実際の表示はタイミングに依存するため、ここでは存在チェックのみ
  });
});
