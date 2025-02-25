import { test, expect } from '@playwright/test';

test('Toast notifications appear when announcements are played', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForSelector('button:has-text("Add Time")');

    // Add a new time
    await page.getByRole('textbox').fill('09:00');
    await page.getByRole('button', { name: 'Add Time' }).click();

    // Add a task to the time block
    await page.getByRole('button', { name: 'Add Task' }).first().click();
    await page.getByPlaceholder('Enter task').fill('Test task');
    await page.keyboard.press('Enter');

    // Click the play button to trigger an announcement
    await page.getByRole('button', { name: 'Play Announcement' }).first().click();

    // Wait for and verify the toast notification
    const toast = await page.waitForSelector('.toast', { timeout: 5000 });
    const toastText = await toast.textContent();
    expect(toastText).toContain('🔔 Time for 09:00');
    expect(toastText).toContain('Test task');

    // Verify toast disappears after its duration
    await expect(toast).toBeHidden({ timeout: 5000 });
});
