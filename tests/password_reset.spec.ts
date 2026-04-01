import { test, expect } from '@playwright/test';
import { getLatestEmail, extractConfirmationLink } from './utils/mailpit';
import { execSync } from 'node:child_process';

test.describe('Password Reset Flow [TEST]', () => {

  test('User should be able to request a password reset, receive an email, and change password', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    const uniqueEmail = `reset-user-${Date.now()}@example.com`;
    const fullName = 'Reset Test User';
    const oldPassword = 'password123';
    const newPassword = 'newpassword456';

    // 1. Register a user
    await page.goto('/fr/register');
    await page.fill('input[name="full_name"]', fullName);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', oldPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('#check-email-message')).toBeVisible();

    // Force confirm user in DB so they can actually log in later
    execSync(`npx supabase db query "UPDATE auth.users SET email_confirmed_at = now() WHERE email = '${uniqueEmail}';"`);

    // 2. Go to login page, then forgot password
    await page.goto('/fr/login');
    
    // Find the link text dynamically to avoid strict matches failing
    await page.locator('a[href*="/forgot-password"]').click();

    // 3. Submit forgot password form
    await page.waitForURL(/\/fr\/forgot-password/);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.click('button[type="submit"]');

    // 4. Should see success message
    await expect(page.locator('#success-message')).toBeVisible();
    await expect(page.locator('#form-container')).toBeHidden();

    // 5. Fetch the email from Mailpit
    // Wait a bit to ensure the second email is delivered and is the latest
    await page.waitForTimeout(2000);
    const email = await getLatestEmail(uniqueEmail);
    expect(email).not.toBeNull();
    expect(email.Subject).toContain('Réinitialisation');

    // 6. Extract the link
    const resetLink = extractConfirmationLink(email);
    expect(resetLink).not.toBeNull();
    expect(resetLink).toContain('verify');

    // 7. Click the link
    await page.goto(resetLink!);

    // 8. Should be on reset-password page
    await expect(page).toHaveURL(/\/fr\/reset-password/);
    await expect(page.locator('h1').first()).toContainText('Nouveau mot de passe');

    // 9. Fill the new password
    await page.fill('input[name="password"]', newPassword);
    await page.fill('input[name="confirmPassword"]', newPassword);
    await page.click('button[type="submit"]');

    // 10. Should see success message
    await expect(page.locator('#success-message')).toBeVisible();

    // 11. Go back to login and login with new password
    await page.click('text="Se connecter"');
    await page.waitForURL(/\/fr\/login/);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', newPassword);
    await page.click('button[type="submit"]');

    // 12. Should be logged in
    await page.waitForURL(/\/fr\/?(#.*)?$/);
    await expect(page.locator('#user-info')).toBeVisible({ timeout: 15000 });
  });
});
