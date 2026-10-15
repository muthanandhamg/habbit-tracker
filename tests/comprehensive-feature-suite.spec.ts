import { test, expect } from './fixtures';
import { uniqueId } from './helpers';

// Logged in via tests/auth.setup.ts (real user, real API, E2E database)
test.describe('Life-OS Comprehensive Feature Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('dashboard-container')).toBeVisible();
  });

  test('Navigation: Should navigate between all core modules', async ({ page }) => {
    const modules = [
      { id: 'nav-habits', url: '/habits', title: 'Habits' },
      { id: 'nav-tasks', url: '/tasks', title: 'Tasks' },
      { id: 'nav-wellness', url: '/wellness', title: 'Wellness' },
      { id: 'nav-journal', url: '/journal', title: 'The Ledger of' },
      { id: 'nav-dashboard', url: '/', title: /Good/ },
    ];

    for (const module of modules) {
      await page.getByTestId(module.id).click();
      await page.waitForURL(new RegExp(`${module.url}$`));
      await expect(page.locator('main h1')).toContainText(module.title);
    }
  });

  test('Habits: Should add and toggle a new habit', async ({ page }) => {
    await page.getByTestId('nav-habits').click();
    await expect(page.locator('main h1')).toContainText('Habits');

    await page.getByTestId('add-habit-button').click();
    const habitName = `Test Habit ${uniqueId()}`;
    await page.getByTestId('new-habit-name').fill(habitName);
    await page.getByTestId('save-habit-button').click();

    const habitItem = page.getByTestId(`habit-item-${habitName.toLowerCase().replace(/\s+/g, '-')}`);
    await expect(habitItem).toBeVisible();

    const toggle = habitItem.getByTestId('habit-toggle');
    await toggle.click();
    await expect(toggle).toHaveClass(/bg-accent-habit/);
  });

  test('Tasks: Should add and complete a must-do task', async ({ page }) => {
    await page.getByTestId('nav-tasks').click();
    await expect(page.locator('main h1')).toContainText('Tasks');

    await page.getByTestId('add-task-button').click();
    const taskTitle = `Critical Task ${uniqueId()}`;
    await page.getByTestId('new-task-title').fill(taskTitle);
    // The checkbox itself is hidden; users click its label
    await page.getByText('High Intensity Focus').click();
    await expect(page.getByTestId('must-do-toggle')).toBeChecked();
    await page.getByTestId('save-task-button').click();

    const taskItem = page.getByTestId(`task-item-${taskTitle.toLowerCase().replace(/\s+/g, '-')}`);
    await expect(taskItem).toBeVisible();

    // Completing moves it out of the Must-Do list into the done list (struck through)
    await taskItem.getByTestId('task-toggle').click();
    await expect(taskItem).toHaveCount(0);
    await expect(page.getByText(taskTitle, { exact: true })).toHaveClass(/line-through/);
  });

  test('Wellness: Should log water intake and keep it after reload', async ({ page }) => {
    await page.getByTestId('nav-wellness').click();
    await expect(page.locator('main h1')).toContainText('Wellness');

    await page.getByTitle('750ml', { exact: true }).click();
    await expect(page.getByTestId('water-intake')).toHaveText('750');

    await page.reload();
    await expect(page.getByTestId('water-intake')).toHaveText('750');
  });

  test('Journal: Should save a new journal entry', async ({ page }) => {
    await page.getByTestId('nav-journal').click();
    await expect(page.locator('main h1')).toContainText('The Ledger of');

    await page.getByRole('button', { name: 'Capture Thought' }).click();
    const entryText = `End-to-end test entry ${uniqueId()}`;
    await page.getByPlaceholder('Transcribe the whispers of the mind...').fill(entryText);
    await page.getByRole('button', { name: 'Commit to Archive' }).click();

    await expect(page.getByText(entryText)).toBeVisible();
  });
});
