import { test, expect } from '@playwright/test';

test('production bundle opens first-harbor onboarding from an empty workspace with one canvas', async ({ page }) => {
  const errors = [];
  let sockets = 0;
  let workspaceMutations = 0;
  let initialCanvas;
  let rejectRuntime;
  const runtimeFailure = new Promise((_, reject) => { rejectRuntime = reject; });
  const onError = (error) => {
    // This smoke has no credentials or cluster. Strip URL query fragments anyway.
    const message = error.message.replace(/\?[^\s)]+/g, '?[redacted]').slice(0, 240);
    errors.push(message);
    rejectRuntime(new Error(`Production JavaScript runtime error: ${message}`));
  };
  const onSocket = () => { ++sockets; };
  const onRequest = (request) => {
    if (request.method() !== 'GET' && new URL(request.url()).pathname.startsWith('/api/workspace')) ++workspaceMutations;
  };
  page.on('pageerror', onError);
  page.on('websocket', onSocket);
  page.on('request', onRequest);
  try {
    const workspaceResponse = page.waitForResponse((response) =>
      response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/workspace', { timeout: 10000 });
    await page.goto(process.env.KV_PRODUCTION_URL || 'http://127.0.0.1:18081', { waitUntil: 'domcontentloaded' });
    const response = await Promise.race([workspaceResponse, runtimeFailure]);
    expect(response.ok()).toBe(true);
    const workspace = await response.json();
    // Assert a safe projection; a failed assertion must not print workspaceNonce.
    expect({ schemaVersion: workspace.schemaVersion, hasId: typeof workspace.id === 'string' && workspace.id.length > 0,
      hasConnections: Array.isArray(workspace.connections), harborCount: Array.isArray(workspace.harbors) ? workspace.harbors.length : null,
      hasRelations: Array.isArray(workspace.relations) }).toEqual({ schemaVersion: 1, hasId: true, hasConnections: true, harborCount: 0, hasRelations: true });
    const firstHarbor = page.getByRole('button', { name: 'İlk limanını bağla', exact: true });
    await Promise.race([expect(firstHarbor).toBeEnabled({ timeout: 10000 }), runtimeFailure]);
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveCount(1);
    initialCanvas = await canvas.elementHandle();
    await firstHarbor.click();
    const form = page.getByRole('dialog', { name: 'Liman ekle', exact: true });
    await expect(form).toBeVisible();
    await expect(form.getByRole('textbox', { name: 'Liman adı', exact: true })).toBeVisible();
    await expect(form.getByRole('combobox', { name: 'Cluster / context', exact: true })).toBeVisible();
    await expect(form.getByRole('textbox', { name: 'Namespace kapsamı (virgülle)', exact: true })).toHaveValue('default');
    await expect(form.getByRole('button', { name: 'Bağlantıyı dene ve kapsamı önizle', exact: true })).toBeVisible();
    await expect(form.getByRole('button', { name: 'Limanı kaydet', exact: true })).toBeDisabled();
    await form.getByRole('button', { name: 'Pencereyi kapat', exact: true }).click();
    await expect(form).toHaveCount(0);
    await expect(firstHarbor).toBeVisible();
    await page.getByRole('button', { name: 'Bağlantı ve cluster kapsamını aç', exact: true }).click();
    await expect(form).toBeVisible();
    await expect(canvas).toHaveCount(1);
    expect(await canvas.evaluate((element, original) => element === original, initialCanvas)).toBe(true);
    expect(sockets).toBe(0);
    expect(workspaceMutations).toBe(0);
    expect(errors).toEqual([]);
  } finally {
    page.off('pageerror', onError);
    page.off('websocket', onSocket);
    page.off('request', onRequest);
    await initialCanvas?.dispose();
    await page.goto('about:blank');
  }
});
