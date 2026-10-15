import { test as setup, expect } from './fixtures';
import { AUTH_FILE } from '../playwright.config';
import { newTestUser } from './helpers';

// Logs in through the real UI once; the other tests reuse the saved browser state
setup('register a test user', async ({ page }) => {
  const user = newTestUser();

  await page.goto('/register');
  await page.getByLabel('Username').fill(user.username);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.getByTestId('dashboard-container')).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
