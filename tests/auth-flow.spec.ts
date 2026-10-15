import { test, expect } from './fixtures';
import { newTestUser } from './helpers';

test.describe('Auth Flow', () => {
  test('register, log out, and log back in', async ({ page }) => {
    const user = newTestUser();

    await page.goto('/register');
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByTestId('dashboard-container')).toBeVisible();

    // Log out by clearing the stored session, then log in with the same account
    await page.evaluate(() => localStorage.removeItem('auth-storage'));
    await page.goto('/login');
    await page.getByLabel('Email or Username').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('dashboard-container')).toBeVisible();
    await expect(page.locator('main h1')).toContainText(user.username);
  });

  test('wrong password shows an error and stays on login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email or Username').fill('nobody@example.com');
    await page.getByLabel('Password').fill('wrong-password-123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('protected pages redirect to login when logged out', async ({ page }) => {
    await page.goto('/habits');
    await expect(page).toHaveURL(/\/login$/);
  });
});
