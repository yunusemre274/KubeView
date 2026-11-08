import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: 'production-smoke.spec.js', workers: 1, timeout: 30000,
  reporter: 'list', use: { viewport: { width: 1440, height: 900 }, trace: 'off' },
});
