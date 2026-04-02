import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Moderation Flow [TEST]', () => {
  test.setTimeout(60000);

  // Systematic cleanup after each test
  test.afterEach(async () => {
    try {
      // Delete all resources and suggestions with the [TEST] prefix
      execSync(`npx supabase db query "DELETE FROM public.resources WHERE title LIKE '[TEST] %';"`);
      execSync(`npx supabase db query "DELETE FROM public.suggestions WHERE title LIKE '[TEST] %';"`);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  test.beforeEach(async ({ page }) => {
    // Automatically accept all confirmation dialogs (for reject/approve)
    page.on('dialog', dialog => {
      console.log(`[TEST] Dialog appeared: ${dialog.message()}`);
      dialog.accept();
    });
  });

  test('Complete Moderation Lifecycle: Propose, Correct, Approve, Update, Delete', async ({ page }) => {
    const uniqueId = Math.floor(Math.random() * 100000);
    const resourceTitle = `[TEST] Resource ${uniqueId}`;
    const correctedTitle = `[TEST] Corrected ${uniqueId}`;
    const updatedTitle = `[TEST] Updated ${uniqueId}`;

    // 1. Propose
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', resourceTitle);
    await page.fill('textarea[name="description"]', 'Initial description.');
    await page.selectOption('select[name="category"]', 'outil');
    await page.selectOption('select[name="mandatory-tag"]', 'Logiciel');
    await page.fill('input[name="link"]', 'https://example.com/test');
    await page.click('#submit-btn');
    await expect(page.locator('#toast-container')).toBeVisible({ timeout: 10000 });
    await page.waitForURL(/\/fr\/?$/);

    // 2. Admin Correction
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const suggestionCard = page.locator('.suggestion-card').filter({ hasText: resourceTitle });
    await expect(suggestionCard).toBeVisible({ timeout: 10000 });
    await suggestionCard.locator('text=Corriger').click();
    await page.waitForURL(/\/fr\/propose\?sid=/);
    
    await expect(page.locator('input[name="title"]')).toHaveValue(resourceTitle);
    await page.fill('input[name="title"]', correctedTitle);
    await page.click('#submit-btn');
    await expect(page.locator('#toast-container')).toBeVisible();
    await page.waitForURL(/\/fr\/admin\/?$/);

    // 3. Approval
    const correctedSuggestion = page.locator('.suggestion-card').filter({ hasText: correctedTitle });
    await expect(correctedSuggestion).toBeVisible();
    const correctedId = await correctedSuggestion.getAttribute('data-id');
    await page.click(`#approve-${correctedId}`);
    await expect(correctedSuggestion).not.toBeVisible({ timeout: 10000 });

    // 4. Update Proposal & Diff Highlighting
    await page.goto('/fr', { waitUntil: 'networkidle' });
    await page.fill('#search-input', correctedTitle);
    const resourceCard = page.locator('.resource-card').filter({ hasText: correctedTitle });
    await expect(resourceCard).toBeVisible({ timeout: 10000 });
    
    const resourceUrl = await resourceCard.getAttribute('href');
    const resourceId = resourceUrl?.split('/').pop();
    
    await page.goto(`/fr/propose?action=update&id=${resourceId}`);
    await page.fill('input[name="title"]', updatedTitle);
    await page.click('#submit-btn');
    await page.waitForURL(/\/fr\/?$/);

    // Verify Diff in Admin
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const updateSuggestion = page.locator('.suggestion-card').filter({ hasText: updatedTitle });
    await expect(updateSuggestion).toBeVisible();
    await expect(updateSuggestion.locator('h2')).toHaveClass(/ring-red-500/); // Diff highlight
    
    const updateId = await updateSuggestion.getAttribute('data-id');
    await page.click(`#approve-${updateId}`);
    await expect(updateSuggestion).not.toBeVisible();

    // 5. Deletion Proposal & Approval
    await page.goto(`/fr/propose?action=delete&id=${resourceId}`);
    await page.fill('textarea[name="reason"]', 'Test deletion');
    await page.click('#submit-btn');
    await page.waitForURL(/\/fr\/?$/);

    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const deleteSuggestion = page.locator('.suggestion-card').filter({ hasText: updatedTitle }).filter({ hasText: 'Suppression' });
    await expect(deleteSuggestion).toBeVisible();
    const deleteId = await deleteSuggestion.getAttribute('data-id');
    await page.click(`#approve-${deleteId}`);
    await expect(deleteSuggestion).not.toBeVisible();

    // 6. Final verification
    await page.goto('/fr', { waitUntil: 'networkidle' });
    await page.fill('#search-input', updatedTitle);
    await expect(page.locator('.resource-card').filter({ hasText: updatedTitle })).not.toBeVisible({ timeout: 10000 });
  });

  test('Rejection workflow', async ({ page }) => {
    const uniqueId = Math.floor(Math.random() * 100000);
    const rejectedTitle = `[TEST] To Be Rejected ${uniqueId}`;
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', rejectedTitle);
    await page.fill('textarea[name="description"]', 'Rejection test');
    await page.fill('input[name="link"]', 'https://example.com/reject');
    await page.click('#submit-btn');
    await expect(page.locator('#toast-container')).toBeVisible();

    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    
    // Wait for loading to finish
    await expect(page.locator('#loading-state')).not.toBeVisible();
    
    const suggestionCard = page.locator('.suggestion-card').filter({ hasText: rejectedTitle });
    await expect(suggestionCard).toBeVisible({ timeout: 15000 });
    
    const id = await suggestionCard.getAttribute('data-id');
    console.log(`[TEST] Rejecting card with ID: ${id}`);
    
    // Use dispatchEvent to bypass potential overlay issues if force click doesn't work
    await page.click(`#reject-${id}`, { force: true });
    
    // UI should remove the card immediately after success
    await expect(page.locator('.suggestion-card').filter({ hasText: rejectedTitle })).not.toBeVisible({ timeout: 15000 });
  });

  test('Bidirectional relations', async ({ page }) => {
    const uniqueId = Math.floor(Math.random() * 100000);
    const entityTitle = `[TEST] Entity ${uniqueId}`;
    const linkedTitle = `[TEST] Linked Resource ${uniqueId}`;

    // 1. Propose & Approve Entity
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', entityTitle);
    await page.fill('textarea[name="description"]', 'Entity description');
    await page.selectOption('select[name="category"]', 'acteur');
    await page.selectOption('select[name="mandatory-tag"]', 'Entreprise');
    await page.fill('input[name="link"]', 'https://entity.test');
    await page.click('#submit-btn');
    await expect(page.locator('#toast-container')).toBeVisible();
    await page.waitForURL(/\/fr\/?$/);
    
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    await expect(page.locator('#loading-state')).toBeHidden();
    const entityCard = page.locator('.suggestion-card').filter({ hasText: entityTitle });
    await expect(entityCard).toBeVisible({ timeout: 15000 });
    const entityId = await entityCard.getAttribute('data-id');
    await page.click(`#approve-${entityId}`);
    await expect(entityCard).not.toBeVisible();

    // 2. Propose Linked Resource
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', linkedTitle);
    await page.fill('textarea[name="description"]', 'Linked resource description');
    await page.selectOption('select[name="category"]', 'contenu');
    await page.selectOption('select[name="mandatory-tag"]', 'Article');
    await page.fill('input[name="link"]', 'https://linked.test');
    
    await page.fill('#related-search', entityTitle);
    await page.locator(`#related-results button:has-text("${entityTitle}")`).click();
    await page.click('#submit-btn');
    await expect(page.locator('#toast-container')).toBeVisible();
    await page.waitForURL(/\/fr\/?$/);

    // 3. Approve Linked Resource
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    await expect(page.locator('#loading-state')).toBeHidden();
    const linkedCard = page.locator('.suggestion-card').filter({ hasText: linkedTitle });
    await expect(linkedCard).toBeVisible({ timeout: 15000 });
    const linkedId = await linkedCard.getAttribute('data-id');
    await page.click(`#approve-${linkedId}`);
    await expect(linkedCard).not.toBeVisible();

    // 4. Verify relations on detail pages
    await page.goto('/fr');
    await page.locator('.resource-card').filter({ hasText: linkedTitle }).click();
    await expect(page.locator('a:has-text("' + entityTitle + '")')).toBeVisible();

    await page.goto('/fr');
    await page.locator('.resource-card').filter({ hasText: entityTitle }).click();
    await expect(page.locator('a:has-text("' + linkedTitle + '")')).toBeVisible();
  });
});
