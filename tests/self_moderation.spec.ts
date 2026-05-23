import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Self-moderation [TEST]', () => {
  // Systematic cleanup after each test
  test.afterEach(async () => {
    try {
      execSync(`npx supabase db query "DELETE FROM public.suggestions WHERE title LIKE '[TEST] %';"`);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  test('Admin cannot moderate their own suggestion', async ({ page }) => {
    const uniqueId = Math.floor(Math.random() * 100000);
    const resourceTitle = `[TEST] Self-Mod ${uniqueId}`;

    // 1. Propose as current admin
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', resourceTitle);
    await page.fill('textarea[name="description"]', 'Self-moderation test.');
    await page.fill('input[name="link"]', 'https://example.com/self');
    await page.click('#submit-btn');
    await expect(page.locator('#toast-container')).toBeVisible();
    await page.waitForURL(/\/fr\/?$/);

    // 2. Go to admin and check UI
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    await expect(page.locator('#loading-state')).toBeHidden();
    const suggestionCard = page.locator('.suggestion-card').filter({ hasText: resourceTitle });
    await expect(suggestionCard).toBeVisible({ timeout: 15000 });
    
    // Buttons should NOT be visible
    await expect(suggestionCard.locator('.approve-btn')).not.toBeVisible();
    await expect(suggestionCard.locator('.reject-btn')).not.toBeVisible();
    
    // Warning message should be visible
    await expect(suggestionCard.locator('text=Auto-modération impossible')).toBeVisible();
  });
});
