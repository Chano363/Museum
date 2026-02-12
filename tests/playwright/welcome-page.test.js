import { test, expect } from '@playwright/test';

test('欢迎页面测试', async ({ page }) => {
  // 访问欢迎页面
  await page.goto('/');

  // 验证页面标题
  await expect(page).toHaveTitle(/探古/);

  // 验证欢迎页面元素
  const welcomeView = page.locator('.welcome-view');
  await expect(welcomeView).toBeVisible();

  // 验证标题
  const appTitle = page.locator('.app-title');
  await expect(appTitle).toBeVisible();
  await expect(appTitle).toHaveText('探古');

  // 验证副标题
  const appSubtitle = page.locator('.app-subtitle');
  await expect(appSubtitle).toBeVisible();
  await expect(appSubtitle).toHaveText('文物3D交互展示系统');

  // 验证进入博物馆按钮
  const enterBtn = page.locator('.enter-btn');
  await expect(enterBtn).toBeVisible();
  await expect(enterBtn).toHaveText('进入博物馆');

  // 验证手势教学按钮
  const gestureBtn = page.locator('.gesture-btn');
  await expect(gestureBtn).toBeVisible();
  await expect(gestureBtn).toHaveText('手势教学');

  // 截图保存
  await page.screenshot({
    path: 'tests/playwright/screenshots/welcome-page.png',
    fullPage: true
  });

  // 测试进入博物馆按钮点击
  await enterBtn.click();
  
  // 验证是否进入主界面
  await expect(page.locator('.main-interface')).toBeVisible();
});

test('欢迎页面响应式测试', async ({ page }) => {
  // 测试不同屏幕尺寸
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 768, height: 1024 },
    { width: 375, height: 667 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    // 验证元素可见性
    await expect(page.locator('.app-title')).toBeVisible();
    await expect(page.locator('.app-subtitle')).toBeVisible();
    await expect(page.locator('.enter-btn')).toBeVisible();
    await expect(page.locator('.gesture-btn')).toBeVisible();

    // 截图保存
    await page.screenshot({
      path: `tests/playwright/screenshots/welcome-page-${viewport.width}x${viewport.height}.png`,
      fullPage: true
    });
  }
});