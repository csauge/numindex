import { test, expect } from '@playwright/test';
import { getLatestEmail, extractConfirmationLink } from './utils/mailpit';

test.describe('Account Management [TEST]', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  
  const timestamp = Date.now();
  const originalEmail = `acc_mgmt_${timestamp}@test.com`;
  const newEmail = `acc_mgmt_new_${timestamp}@test.com`;
  const password = 'OldPassword123!';
  const newPassword = 'NewPassword456!';

  test('User can manage account: change password, change email, delete account', 'pw' in test ? undefined : async ({ page }) => {
    
    // 1. Signup
    await page.goto('/fr/register');
    await page.fill('input[type="email"]', originalEmail);
    await page.fill('input[type="password"]', password);
    await page.fill('input[type="text"]', 'Account Test User');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('#check-email-message')).toBeVisible();

    // Confirm signup email
    const signupEmail = await getLatestEmail(originalEmail);
    const signupLink = extractConfirmationLink(signupEmail);
    expect(signupLink).toBeTruthy();
    await page.goto(signupLink!);

    // Should be logged in and on home page
    await expect(page.locator('#user-info')).toBeVisible();

    // 2. Change Password
    await page.goto('/fr/profile');
    await page.click('button#tab-settings');
    
    await page.fill('input#new-password', newPassword);
    await page.click('button#btn-password');
    await expect(page.locator('p#msg-password')).toContainText('Mot de passe mis à jour avec succès');

    // Logout and login with new password
    await page.click('#user-info [role="button"]');
    await page.click('#logout-btn');
    await expect(page.locator('#login-link')).toBeVisible();
    await page.goto('/fr/login');
    await page.fill('input[type="email"]', originalEmail);
    await page.fill('input[type="password"]', newPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('#user-info')).toBeVisible();

    // 3. Change Email
    await page.goto('/fr/profile');
    await page.click('button#tab-settings');
    await page.fill('input#new-email', newEmail);
    await page.click('button#btn-email');
    await expect(page.locator('p#msg-email')).toContainText('Veuillez vérifier vos boîtes mail');

    // Supabase double confirm: we need to click links in BOTH old and new emails.
    // Wait a bit for emails to arrive
    await page.waitForTimeout(2000);
    
    const confirmOldEmail = await getLatestEmail(originalEmail);
    const linkOld = extractConfirmationLink(confirmOldEmail);
    expect(linkOld).toBeTruthy();
    await page.goto(linkOld!);

    const confirmNewEmail = await getLatestEmail(newEmail);
    const linkNew = extractConfirmationLink(confirmNewEmail);
    expect(linkNew).toBeTruthy();
    await page.goto(linkNew!);

    // We should be back on home page or logged in with new email
    await expect(page.locator('#user-info')).toBeVisible();
    
    // Navigate cleanly to /fr to remove any access_token from URL hash before logging out
    await page.goto('/fr');
    await expect(page.locator('#user-info')).toBeVisible();

    // Verify new email is active by logging out and logging in with new email
    await page.click('#user-info [role="button"]');
    await page.click('#logout-btn');
    await expect(page.locator('#login-link')).toBeVisible();
    await page.goto('/fr/login');
    await page.fill('input[type="email"]', newEmail);
    await page.fill('input[type="password"]', newPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('#user-info')).toBeVisible();

    // 4. Delete Account
    await page.goto('/fr/profile');
    await page.click('button#tab-settings');
    
    // Handle JS confirm dialog
    page.on('dialog', dialog => dialog.accept());
    await page.click('button#btn-delete-account');

    // Should be redirected to home and logged out
    await expect(page).toHaveURL(/.*\/fr$/);
    await expect(page.locator('#login-link')).toBeVisible();

    // Verify cannot login anymore
    await page.goto('/fr/login');
    await page.fill('input[type="email"]', newEmail);
    await page.fill('input[type="password"]', newPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('#error-message')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText('Erreur de connexion');
  });
});
