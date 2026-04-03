import { test, expect } from '@playwright/test';
import { getLatestEmail, extractConfirmationLink } from './utils/mailpit';

test.describe('Admin Invite Flow [TEST]', () => {
  const timestamp = Date.now();
  const invitedEmail = `invited_${timestamp}@test.com`;

  test('Admin can invite a new user, who can accept and log in', 'pw' in test ? undefined : async ({ page }) => {
    // Go to admin page (already logged in as admin via auth.setup.ts)
    await page.goto('/fr/admin');
    await expect(page.locator('h1:has-text("Modération")')).toBeVisible();

    // Send Invitation
    await page.fill('input#invite-email', invitedEmail);
    await page.click('button#invite-btn');
    await expect(page.locator('p#invite-message')).toContainText('Invitation envoyée avec succès');

    // 3. User receives invitation and accepts (using a new incognito context so admin stays logged in)
    const context = await page.context().browser()!.newContext();
    const newPage = await context.newPage();

    await newPage.waitForTimeout(2000);
    const inviteEmail = await getLatestEmail(invitedEmail);
    const inviteLink = extractConfirmationLink(inviteEmail);
    expect(inviteLink).toBeTruthy();

    await newPage.goto(inviteLink!);

    // Should be automatically logged in
    await expect(newPage.locator('#user-info')).toBeVisible();
    await newPage.waitForURL(url => !url.hash.includes('access_token'), { timeout: 15000 });

    // 4. User sets a password via Profile Account Settings
    await newPage.click('#user-info [role="button"]');
    await newPage.click('text=Tableau de bord');
    await expect(newPage.locator('button#tab-settings')).toBeVisible();
    await newPage.click('button#tab-settings');
    await newPage.fill('input#new-password', 'MyNewSecurePassword123!');
    await newPage.click('button#btn-password');
    await expect(newPage.locator('p#msg-password')).toContainText('Mot de passe mis à jour avec succès');

    // 5. Verify user can login with new password
    await newPage.click('#user-info [role="button"]');
    await newPage.click('#logout-btn');
    await expect(newPage.locator('#login-link')).toBeVisible();

    // Small wait to let potential reloads settle
    await newPage.waitForTimeout(1000);

    // Ensure we are on a clean state before navigating to login
    await newPage.goto('/fr/login');
    await newPage.fill('input[type="email"]', invitedEmail);
    await newPage.fill('input[type="password"]', 'MyNewSecurePassword123!');
    await newPage.click('button[type="submit"]');
    await expect(newPage.locator('#user-info')).toBeVisible();

    await context.close();
    });
    });
