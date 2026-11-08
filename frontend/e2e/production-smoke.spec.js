import { test, expect } from '@playwright/test';

test('production bundle mounts the harbor and opens its connection window', async ({ page }) => {
  const errors = [];
  let rejectRuntime;
  const runtimeFailure = new Promise((_, reject) => { rejectRuntime = reject; });
  const onError = (error) => {
    // This smoke has no credentials or cluster. Strip URL query fragments anyway.
    const message = error.message.replace(/\?[^\s)]+/g, '?[redacted]').slice(0, 240);
    errors.push(message);
    rejectRuntime(new Error(`Production JavaScript runtime error: ${message}`));
  };
  page.on('pageerror', onError);
  try {
    await page.goto(process.env.KV_PRODUCTION_URL || 'http://127.0.0.1:18081', { waitUntil: 'domcontentloaded' });
    const connect = page.getByRole('button', { name: 'Bağlantı ve cluster kapsamını aç', exact: true });
    await Promise.race([expect(connect).toBeVisible({ timeout: 10000 }), runtimeFailure]);
    await connect.click();
    await expect(page.getByRole('dialog', { name: 'Bağlantı ve kapsam', exact: true })).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(1);
    expect(errors).toEqual([]);
  } finally { page.off('pageerror', onError); }
});
