import { test as base, expect } from '@playwright/test';

// Pages call the AI endpoint on load (e.g. the dashboard "pulse"). Tests must not depend
// on a real AI provider (cost, rate limits, no key in CI), so it is stubbed by default.
// A test can register its own page.route() for the same URL; the newest route wins.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/api/ai/process', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ type: 'none', action: 'none', message: 'AI stub for E2E tests.' }),
      }),
    );
    await use(page);
  },
});

export { expect };
