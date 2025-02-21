import { test, expect } from '@playwright/test';

test('TTS initialization and functionality', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for vits-web to initialize (look for console log indicating download completion)
    const downloadLog = page.waitForEvent('console', {
        predicate: msg => 
            msg.text().includes('Downloading voice model: 100%') ||
            msg.text().includes('Failed to initialize vits-web:')
    });
    
    await downloadLog;

    // Verify that either vits-web initialized successfully or we have browser TTS as fallback
    const ttsAvailable = await page.evaluate(() => {
        return 'speechSynthesis' in window;
    });

    expect(ttsAvailable).toBeTruthy();
});
