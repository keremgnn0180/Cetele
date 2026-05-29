import { test, expect, _electron as electron } from '@playwright/test';

test('Electron app opens the dashboard shell', async () => {
  const app = await electron.launch({
    args: ['.'],
    env: {
      ...process.env,
      CETELE_E2E: '1'
    }
  });

  const page = await app.firstWindow();
  await expect(page.locator('text=Çetele').first()).toBeVisible({ timeout: 15_000 });
  await app.close();
});
