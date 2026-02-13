import { test, expect } from '@playwright/test';

test('文物切换页面测试', async ({ page }) => {
  // 访问主界面
  await page.goto('/');

  // 点击进入博物馆按钮
  await page.click('.enter-btn');

  // 验证主界面加载完成
  await expect(page.locator('.main-interface')).toBeVisible();

  // 验证文物切换栏
  const thumbBar = page.locator('.thumb-bar');
  await expect(thumbBar).toBeVisible();

  // 验证文物卡片
  const thumbItems = page.locator('.thumb-item');
  await expect(thumbItems).toHaveCount(5); // 应该显示5个卡片

  // 截图保存
  await page.screenshot({
    path: 'tests/playwright/screenshots/thumb-bar.png',
    fullPage: true
  });

  // 测试点击文物卡片
  const firstItem = thumbItems.nth(2); // 中间的卡片（选中项）
  await firstItem.click();

  // 验证是否有动画效果（等待动画完成）
  await page.waitForTimeout(600);

  // 再次截图
  await page.screenshot({
    path: 'tests/playwright/screenshots/thumb-bar-after-click.png',
    fullPage: true
  });

  // 测试响应式设计
  await testResponsive(page);
});

async function testResponsive(page) {
  // 测试不同屏幕尺寸
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 768, height: 1024 },
    { width: 375, height: 667 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    
    // 验证文物切换栏可见
    const thumbBar = page.locator('.thumb-bar');
    await expect(thumbBar).toBeVisible();

    // 验证文物卡片
    const thumbItems = page.locator('.thumb-item');
    await expect(thumbItems).toBeVisible();

    // 截图保存
    await page.screenshot({
      path: `tests/playwright/screenshots/thumb-bar-${viewport.width}x${viewport.height}.png`,
      fullPage: true
    });
  }
}
