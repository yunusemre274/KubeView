import { test, expect } from "@playwright/test";
import { chooseDemo, clickWorld, closeWindow } from "./world.helpers.js";

const pose = (page) =>
  page.locator("canvas").evaluate((canvas) => {
    const camera = canvas.__harbor.camera;
    return {
      position: camera.position.toArray(),
      rotation: camera.quaternion.toArray(),
      zoom: camera.zoom,
      // Camera forward projected onto the sea plane.
      forward: [
        -camera.matrixWorld.elements[8],
        0,
        -camera.matrixWorld.elements[10],
      ],
    };
  });
const distance = (a, b) =>
  Math.hypot(...a.position.map((v, i) => v - b.position[i]));
async function held(page, key, duration = 400) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
  return pose(page);
}
async function still(page, before) {
  await page.waitForTimeout(250);
  expect(distance(before, await pose(page))).toBeLessThan(0.01);
}
async function settledPose(page) {
  const deadline = Date.now() + 6000;
  let previous = await pose(page),
    stable = 0;
  const samples = [];
  while (Date.now() < deadline) {
    await page.waitForTimeout(100);
    const current = await pose(page);
    const positionDelta = distance(previous, current);
    const quaternionDelta = Math.hypot(
      ...current.rotation.map((value, i) => value - previous.rotation[i]),
    );
    samples.push({ positionDelta, quaternionDelta });
    stable = positionDelta < 1e-3 && quaternionDelta < 1e-7 ? stable + 1 : 0;
    if (stable === 3) return current;
    previous = current;
  }
  throw new Error(
    `Camera did not settle within 6s: ${JSON.stringify(samples.slice(-3))}`,
  );
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "kubeview.preferences.v1",
      JSON.stringify({
        version: 1,
        paused: true,
        sea: false,
        patrol: false,
        motionPreference: "reduced",
        quality: "low",
      }),
    ),
  );
  await chooseDemo(page);
});

test("focused scene pans horizontally in camera directions; release stops and mouse selection remains", async ({
  page,
}, testInfo) => {
  const canvas = page.locator("canvas");
  await canvas.focus();
  // Idle demand rendering must not make the first key frame jump.
  await page.waitForTimeout(800);
  const initial = await pose(page);
  let before = initial;
  for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
    const after = await held(page, key);
    const [dx, dy, dz] = after.position.map((v, i) => v - before.position[i]);
    const [fx, , fz] = before.forward;
    const along = dx * fx + dz * fz;
    const sideways = dx * -fz + dz * fx;
    expect(distance(before, after)).toBeGreaterThan(5);
    expect(distance(before, after)).toBeLessThan(60);
    expect(Math.abs(dy)).toBeLessThan(1e-6);
    for (let i = 0; i < 4; i++)
      expect(after.rotation[i]).toBeCloseTo(initial.rotation[i], 6);
    expect(after.zoom).toBe(initial.zoom);
    if (key === "ArrowUp") expect(along).toBeGreaterThan(0);
    if (key === "ArrowDown") expect(along).toBeLessThan(0);
    if (key === "ArrowLeft") expect(sideways).toBeLessThan(0);
    if (key === "ArrowRight") expect(sideways).toBeGreaterThan(0);
    await still(page, after);
    before = after;
  }
  // The next OrbitControls mouse operation must retain the translated target.
  await page.mouse.move(650, 650);
  await page.mouse.down();
  await page.mouse.move(730, 650, { steps: 8 });
  await page.mouse.up();
  // Damping advances per rendered update; wall time alone cannot establish rest.
  const rotated = await settledPose(page);
  expect(rotated.rotation).not.toEqual(initial.rotation);
  const moved = await held(page, "ArrowUp");
  const [fx, , fz] = rotated.forward;
  const [dx, , dz] = moved.position.map((v, i) => v - rotated.position[i]);
  await testInfo.attach("camera-after-orbit-arrow-pan", {
    body: JSON.stringify({
      settled: rotated,
      moved,
      crossTrack: Math.abs(dx * -fz + dz * fx),
      quaternionDelta: Math.hypot(
        ...moved.rotation.map((value, i) => value - rotated.rotation[i]),
      ),
    }),
    contentType: "application/json",
  });
  expect(dx * fx + dz * fz).toBeGreaterThan(0);
  expect(Math.abs(dx * -fz + dz * fx)).toBeLessThan(0.1);
  await page.getByRole("button", { name: "Limana dön", exact: true }).click();
  await clickWorld(page, { type: "facility", id: "center" });
  await expect(page.locator(".world-window")).toBeVisible();
  await closeWindow(page);
});

test("blur clears held arrows; panels and text fields retain keyboard behavior", async ({
  page,
}) => {
  const canvas = page.locator("canvas");
  await canvas.focus();
  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(250);
  const finder = page.getByRole("button", { name: "Bul", exact: true });
  await finder.focus();
  const blurred = await pose(page);
  await still(page, blurred);
  await canvas.focus();
  await still(page, blurred); // No latched key when focus returns before keyup.
  await page.keyboard.up("ArrowUp");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(250);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  const windowBlurred = await pose(page);
  await still(page, windowBlurred);
  await page.keyboard.up("ArrowRight");
  await finder.click();
  const input = page.locator(".world-window input").first();
  await input.fill("worker");
  await input.press("End");
  await input.press("ArrowLeft");
  expect(await input.evaluate((el) => el.selectionStart)).toBe(5);
  await input.press("ArrowDown");
  await still(page, windowBlurred);
  await closeWindow(page);
  await held(page, "ArrowUp"); // Closing a panel does not implicitly focus the scene.
  await still(page, windowBlurred);
});
