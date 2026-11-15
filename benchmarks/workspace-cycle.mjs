// Normal DOM actions for the workspace extension of the existing soak.
// A scope edit changes real workspace configuration, not injected browser state
// or Kubernetes resources. Both equivalent scopes return to the original value.
export async function workspaceSoakTransition({ page, cycle, canonicalPods }) {
  if (!Number.isInteger(cycle) || cycle < 1 || cycle > 20) throw Error('Only twenty bounded workspace cycles');
  const workspaceURL = new URL('/api/workspace', page.url()).href;
  const response = await page.request.get(workspaceURL);
  if (!response.ok()) throw Error('Workspace receipt unavailable');
  const doc = await response.json();
  if (doc.harbors.length !== 20) throw Error('Workspace soak requires twenty registered harbors');
  const harbor = doc.harbors[cycle % doc.harbors.length];
  const originalCanvas = await page.locator('canvas').elementHandle();
  const began = Date.now();
  await page.getByRole('button', { name: 'Limanlar ve deniz haritası', exact: true }).click();
  await page.locator('.workspace-port-select').filter({ has: page.getByText(harbor.name, { exact: true }) }).click();
  await page.locator('.workspace-window').waitFor({ state: 'detached', timeout: 5000 });
  await page.waitForFunction(({ name, pods }) => document.querySelector('.world-brand-control')?.textContent.includes(name) && document.querySelector('canvas')?.__harbor?.stats?.().lifecycle.canonicalPods === pods,
    { name: harbor.name, pods: canonicalPods }, { timeout: 10000 });
  let scopeEdits = 0;
  if ([5, 15].includes(cycle)) {
    const original = harbor.namespaces.join(', ');
    for (const namespaces of ['bench-0, bench-1, bench-2, bench-3', original]) {
      await page.getByRole('button', { name: 'Bağlantı ve cluster kapsamını aç', exact: true }).click();
      await page.getByRole('button', { name: 'Liman bağlantısını/kapsamını düzenle', exact: true }).click();
      await page.getByRole('textbox', { name: 'Namespace kapsamı (virgülle)', exact: true }).fill(namespaces);
      await page.getByRole('button', { name: 'Bağlantıyı dene ve kapsamı önizle', exact: true }).click();
      await page.getByRole('button', { name: 'Limanı kaydet', exact: true }).click();
      await page.locator('.workspace-window').waitFor({ state: 'detached', timeout: 10000 });
      await page.waitForFunction((pods) => document.querySelector('canvas')?.__harbor?.stats?.().lifecycle.canonicalPods === pods && !document.querySelector('.world-brand-control')?.classList.contains('is-stale'), canonicalPods, { timeout: 10000 });
      scopeEdits++;
    }
    const restored = await (await page.request.get(workspaceURL)).json();
    const actual = restored.harbors.find((h) => h.id === harbor.id);
    if (JSON.stringify(actual?.namespaces) !== JSON.stringify(harbor.namespaces)) throw Error('Soak scope did not restore');
  }
  const canvasPreserved = await page.evaluate((canvas) => canvas === document.querySelector('canvas'), originalCanvas);
  await originalCanvas.dispose();
  return { cycle, harborId: harbor.id, elapsedMs: Date.now() - began, scopeEdits,
    operationKind: scopeEdits ? 'normal UI workspace scope edits; no Kubernetes mutation' : 'normal UI harbor selection',
    canvasPreserved, canonicalPods, valid: canvasPreserved };
}
