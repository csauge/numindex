import { test, expect } from '@playwright/test';

test.describe('Admin Page Reordering [TEST]', () => {
  test('Moderations should be above Invite User section', async ({ page }) => {
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });

    // Wait for the admin page to load and check if it's the admin page
    await expect(page.locator('h1.main-title')).toHaveText('Administration');

    // Get the vertical positions (y-coordinate) of the sections
    // We expect "Modérations de ressources à approuver" to be first
    // Then "Inviter un utilisateur"
    // Then "Utilisateurs"

    const moderationsHeading = page.locator('h2:has-text("Modérations de ressources à approuver"), h2:has-text("Moderations to approve")');
    const inviteHeading = page.locator('h2:has-text("Inviter un utilisateur"), h2:has-text("Invite a user")');
    const usersHeading = page.locator('h2:has-text("Utilisateurs"), h2:has-text("Users")');

    // These should all be visible (if there are suggestions, we might need to handle empty state)
    // If it's the empty state, we still want the heading to be there.
    
    // Check order
    const modBox = await moderationsHeading.boundingBox();
    const inviteBox = await inviteHeading.boundingBox();
    const usersBox = await usersHeading.boundingBox();

    if (modBox && inviteBox && usersBox) {
      console.log(`Moderations Y: ${modBox.y}`);
      console.log(`Invite Y: ${inviteBox.y}`);
      console.log(`Users Y: ${usersBox.y}`);
      
      expect(modBox.y).toBeLessThan(inviteBox.y);
      expect(inviteBox.y).toBeLessThan(usersBox.y);
    } else {
      // Fallback if elements are missing or hidden (though they should be there)
      await expect(moderationsHeading).toBeVisible();
      await expect(inviteHeading).toBeVisible();
      await expect(usersHeading).toBeVisible();
    }
  });
});
