import { test, expect } from './fixtures';

// Logged in via tests/auth.setup.ts. Only the AI call is mocked (no real AI provider
// in tests); applying the action goes through the real API.
test.describe('AI Gateway Integration', () => {
  test('CommandBar opens, submits, and applies the confirmed action', async ({ page }) => {
    await page.route('**/api/ai/process', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'wellness',
          action: 'update',
          data: { mood: 8 },
          message: 'Mood logged successfully through AI.',
        }),
      });
    });

    await page.goto('/');

    const trigger = page.getByTestId('command-bar-trigger');
    await expect(trigger).toBeVisible();
    await trigger.click();

    const input = page.getByTestId('command-bar-input');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();

    await input.fill('I feel great today');
    await page.getByTestId('command-bar-submit').click();

    await expect(page.getByText('Mood logged successfully through AI.')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('Action Applied')).toBeVisible();
  });
});
