import { defineConfig, devices } from '@playwright/test';

// E2E runs its own API + frontend on separate ports and a separate database,
// so it never touches dev data and can run while `npm run dev` is up.
const API_PORT = 5100;
const WEB_PORT = 5174;
const E2E_MONGODB_URI =
  process.env.E2E_MONGODB_URI || 'mongodb://localhost:27017/habit-tracker-e2e';

export const AUTH_FILE = 'tests/.auth/user.json';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    // Registers a fresh user once and saves the logged-in browser state
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
      testIgnore: /auth-flow\.spec\.ts/,
    },
    {
      // The auth flow test starts logged out
      name: 'chromium-logged-out',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth-flow\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: 'npx tsx --conditions=development src/index.ts',
      cwd: './server',
      url: `http://localhost:${API_PORT}/health`,
      env: { PORT: String(API_PORT), MONGODB_URI: E2E_MONGODB_URI },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      cwd: './client',
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
