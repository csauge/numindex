import { test, expect } from '@playwright/test';

test.describe('Profile Monthly Digest Opt-In', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('should allow user to toggle monthly digest preference', async ({ page }) => {
    await page.goto('/fr/profile?tab=settings');
    await expect(page.locator('#section-title')).toHaveText('Paramètres du compte');

    const digestCheckbox = page.locator('#digest-opt-in');
    await expect(digestCheckbox).toBeVisible();

    const initialState = await digestCheckbox.isChecked();

    // Toggle
    await digestCheckbox.click();

    // Wait for the success message
    const msgDigest = page.locator('#msg-digest');
    await expect(msgDigest).toBeVisible();
    await expect(msgDigest).toHaveText('Préférence mise à jour.');

    // Verify it changed
    const newState = await digestCheckbox.isChecked();
    expect(newState).toBe(!initialState);
  });
});