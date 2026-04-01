import { test, expect } from '@playwright/test';
import { getLatestEmail, extractConfirmationLink } from './utils/mailpit';

test.describe('Admin Invite Flow [TEST]', () => {
  const timestamp = Date.now();
  const invitedEmail = `invited_${timestamp}@test.com`;

  test('Admin can invite a new user, who can accept and log in', 'pw' in test ? undefined : async ({ page }) => {
    // Go to admin page (already logged in as admin via auth.setup.ts)
    await page.goto('/fr/admin');
    await expect(page.locator('h1:has-text("Modération")')).toBeVisible();

    // 2. Send Invitation
    await page.fill('input#invite-email', invitedEmail);
    await page.click('button#invite-btn');
    await expect(page.locator('p#invite-message')).toContainText('Invitation envoyée avec succès');

    // Logout
    await page.click('#user-info [role="button"]');
    await page.click('#logout-btn');
    await expect(page.locator('#login-link')).toBeVisible();

    // 3. User receives invitation and accepts
    await page.waitForTimeout(2000);
    const inviteEmail = await getLatestEmail(invitedEmail);
    const inviteLink = extractConfirmationLink(inviteEmail);
    expect(inviteLink).toBeTruthy();

    await page.goto(inviteLink!);

    // Should be automatically logged in (Supabase handles token in URL hash)
    await expect(page.locator('#user-info')).toBeVisible();
    await page.waitForURL(url => !url.hash.includes('access_token'), { timeout: 15000 });

    // 4. User sets a password via Profile Account Settings
    await page.click('#user-info [role="button"]');
    await page.click('text=Tableau de bord');
    await expect(page.locator('button#tab-settings')).toBeVisible();
    await page.click('button#tab-settings');
    await page.fill('input#new-password', 'MyNewSecurePassword123!');
    await page.click('button#btn-password');
    await expect(page.locator('p#msg-password')).toContainText('Mot de passe mis à jour avec succès');

    // 5. Verify user can login with new password
    await page.click('#user-info [role="button"]');
    await page.click('#logout-btn');
    await expect(page.locator('#login-link')).toBeVisible();
    
    // Small wait to let potential reloads settle
    await page.waitForTimeout(1000);
    
    // Ensure we are on a clean state before navigating to login
    await page.goto('/fr/login');
    await page.fill('input[type="email"]', invitedEmail);
    await page.fill('input[type="password"]', 'MyNewSecurePassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('#user-info')).toBeVisible();
  });
});
