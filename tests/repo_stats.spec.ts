import { test, expect } from '@playwright/test';

test.describe('Open Source Repository Stats', () => {
  test('should allow proposing a resource with a repository URL', async ({ page }) => {
    // 1. Propose a resource
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', '[TEST] Open Source Tool');
    await page.fill('textarea[name="description"]', 'A test description for an open source tool.');
    await page.selectOption('select[name="category"]', 'outil');
    await page.selectOption('select[name="mandatory-tag"]', 'Logiciel');
    
    // Let's just fill the link first
    await page.fill('input[name="link"]', 'https://example.com');
    
    // Check if repository_url field is visible (for category tool)
    const repoInput = page.locator('input[name="repository_url"]');
    await expect(repoInput).toBeVisible();
    await repoInput.fill('https://github.com/facebook/react');

    // Check that version_date is HIDDEN for Logiciel (it's automated)
    const versionDateInput = page.locator('input[name="version_date"]');
    await expect(versionDateInput).toBeHidden();

    // Submit
    await page.click('button[type="submit"]');
    await expect(page.locator('#toast-text')).toContainText('Suggestion envoyée');

    // 3. Check in Admin
    await page.goto('/fr/admin');
    await expect(page.locator('h1.text-3xl')).toContainText('Administration');
    
    // Find our suggestion
    const card = page.locator('.suggestion-card', { hasText: '[TEST] Open Source Tool' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('https://github.com/facebook/react');

    // 4. Approve
    page.on('dialog', dialog => dialog.accept());
    await card.locator('.approve-btn').click();
    await expect(card).not.toBeVisible();

    // 5. Check on resource page
    // We need to find the ID, but for test we can just go to index and find it
    await page.goto('/fr/outils');
    const resourceLink = page.locator('a.resource-card', { hasText: '[TEST] Open Source Tool' });
    await expect(resourceLink).toBeVisible();
    await resourceLink.click();

    await expect(page.locator('h1.text-3xl')).toContainText('[TEST] Open Source Tool');
    const repoLink = page.locator('a', { hasText: 'Dépôt' });
    await expect(repoLink).toBeVisible();
    await expect(repoLink).toHaveAttribute('href', 'https://github.com/facebook/react');
  });
});
