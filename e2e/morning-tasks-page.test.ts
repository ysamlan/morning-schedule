import { expect, test } from '@playwright/test';

test('morning tasks page renders in default state', async ({ page }) => {
    await page.goto('/');
    
    // Verify the mode toggle button is present
    const modeToggleButton = page.getByRole('button', { name: 'Switch to Daily Checklist' });
    await expect(modeToggleButton).toBeVisible();
    
    // Verify we start in Setup Mode
    await expect(page.getByRole('heading', { name: 'Setup Mode' })).toBeVisible();
    
    // Verify the time input and add button are present
    await expect(page.locator('input[type="time"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Time' })).toBeVisible();
    
    // Switch to Daily Checklist mode and verify
    await modeToggleButton.click();
    await expect(page.getByRole('heading', { name: 'Daily Checklist' })).toBeVisible();
    
    // Verify the mode toggle button text updates
    await expect(page.getByRole('button', { name: 'Switch to Setup Mode' })).toBeVisible();
});
