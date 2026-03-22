import { test, expect } from '@playwright/test';

test.describe('User Profile & Menu', () => {
  
  test.describe('Visitor (Not Logged In)', () => {
    // Override storage state to be empty for visitor tests
    test.use({ storageState: { cookies: [], origins: [] } });

    test('Visitor should not see the user menu avatar', async ({ page }) => {
      await page.goto('/fr');
      await expect(page.locator('#user-info')).toBeHidden();
      await expect(page.locator('#login-link')).toBeVisible();
    });
  });

  test.describe('Authenticated User', () => {
    // No need to use test.use, default config has admin session

    test('Logged in user should see avatar and name on trigger', async ({ page }) => {
      await page.goto('/fr');
      
      const userInfo = page.locator('#user-info');
      await expect(userInfo).toBeVisible({ timeout: 15000 });
      
      // Check name is visible on the trigger (Desktop)
      const nameTrigger = page.locator('#user-name-trigger');
      await expect(nameTrigger).toBeVisible();
      await expect(nameTrigger).not.toBeEmpty();

      const initials = page.locator('#user-initials');
      await expect(initials).toBeVisible();
      await expect(initials).not.toBeEmpty();
    });

    test('User can open menu and see detailed info', async ({ page }) => {
      await page.goto('/fr');
      await expect(page.locator('#user-info')).toBeVisible();

      // Click trigger to open dropdown
      await page.click('#user-info [role="button"]');
      
      const dropdown = page.locator('#user-info .dropdown-content');
      await expect(dropdown).toBeVisible();
      
      // Check name and email are displayed in the menu
      await expect(page.locator('#user-name')).not.toBeEmpty();
      await expect(page.locator('#user-email')).not.toBeEmpty();
      
      // Check initials in menu too
      await expect(page.locator('#user-initials-menu')).not.toBeEmpty();
    });

    test('User can navigate to dashboard (profile)', async ({ page }) => {
      await page.goto('/fr');
      await expect(page.locator('#user-info')).toBeVisible();

      // Open menu
      await page.click('#user-info [role="button"]');
      
      // Navigate to dashboard
      await page.click('a:has-text("Tableau de bord")');
      await page.waitForURL(/\/fr\/profile/);
      
      await expect(page.locator('h1#p-name')).toBeVisible();
      const email = process.env.TEST_USER_EMAIL || 'admin@numindex.org';
      await expect(page.locator('#p-email')).toContainText(email);
    });

    test('User can logout from the dropdown menu', async ({ page }) => {
      await page.goto('/fr');
      await expect(page.locator('#user-info')).toBeVisible();

      // Open menu and logout
      await page.click('#user-info [role="button"]');
      await page.click('#logout-btn');
      
      // Should be logged out and see login link
      await expect(page.locator('#login-link')).toBeVisible();
      await expect(page.locator('#user-info')).toBeHidden();
    });
  });
});
