import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  outputDir: '../test-artifacts/playwright',
  reporter: [['list'], ['json', { outputFile: '../test-artifacts/playwright-results.json' }]],
  workers: 1,
  timeout: 30000,
  expect: { timeout: 4000 },
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 1050 },
    colorScheme: 'light',
    actionTimeout: 5000,
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'local', use: { baseURL: 'http://127.0.0.1:4173' } },
    { name: 'live', use: { baseURL: 'https://jarvis-to-do-1-0.vercel.app' } },
  ],
});
