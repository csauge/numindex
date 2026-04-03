import { test, expect } from '@playwright/test';
import { getLatestEmail, extractConfirmationLink } from './utils/mailpit';

test.describe('Profile Name Management [TEST]', () => {
  const timestamp = Date.now();
  const invitedEmail = `nametest_${timestamp}@test.com`;

  test('Invited user has incomplete profile warning and can update their name', 'pw' in test ? undefined : async ({ page }) => {
    // Go to admin page (already logged in as admin via auth.setup.ts)
    await page.goto('/fr/admin');
    await expect(page.locator('h1:has-text("Modération")')).toBeVisible();

    // Send Invitation
    await page.waitForTimeout(500); // Give Supabase client time to initialize session
    await page.fill('input#invite-email', invitedEmail);
    await page.click('button#invite-btn');
    await expect(page.locator('p#invite-message')).toContainText('Invitation envoyée avec succès');

    // User receives invitation and accepts (in a new context to preserve admin session)
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

    // Verify warning badge is visible on the avatar
    await expect(newPage.locator('#profile-warning-badge')).not.toHaveClass(/hidden/);

    // Open user menu
    await newPage.click('#user-info [role="button"]');

    // Verify warning item is visible in dropdown
    const warningItem = newPage.locator('#profile-warning-item');
    await expect(warningItem).not.toHaveClass(/hidden/);
    await expect(warningItem).toContainText('Profil incomplet');

    // Click on the warning item to go to profile settings
    await warningItem.locator('a').click();
    
    // Should be on profile page with settings tab open
    await expect(newPage).toHaveURL(/.*\/fr\/profile\?tab=settings/);
    await expect(newPage.locator('#section-title')).toHaveText('Paramètres du compte');

    // Change name
    await newPage.fill('input#new-name', 'John Doe NameTest');
    await newPage.click('button#btn-name');
    
    // Success message
    await expect(newPage.locator('p#msg-name')).toContainText('Nom mis à jour avec succès');

    // Verify name updated in header (which re-evaluates the badge)
    // We can reload to be absolutely sure the badge disappears on fresh load
    await newPage.reload();
    await expect(newPage.locator('#user-info')).toBeVisible();
    
    // Badge should be hidden now
    await expect(newPage.locator('#profile-warning-badge')).toHaveClass(/hidden/);

    // Name should be displayed
    await newPage.click('#user-info [role="button"]');
    await expect(newPage.locator('#profile-warning-item')).toHaveClass(/hidden/);
    await expect(newPage.locator('#user-name')).toHaveText('John Doe NameTest');

    await context.close();
  });
});
