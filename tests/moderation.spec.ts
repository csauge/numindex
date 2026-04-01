import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Moderation Flow [TEST]', () => {
  test.setTimeout(120000);

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

  const uniqueId = Math.floor(Math.random() * 10000);
  const resourceTitle = `[TEST] Resource ${uniqueId}`;
  const correctedTitle = `[TEST] Corrected ${uniqueId}`;
  const updatedTitle = `[TEST] Updated ${uniqueId}`;

  test('Complete Moderation Lifecycle: Propose, Correct, Approve, Update, Delete', async ({ page }) => {
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
    await correctedSuggestion.locator('.approve-btn').click();
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
    
    await updateSuggestion.locator('.approve-btn').click();
    await expect(updateSuggestion).not.toBeVisible();

    // 5. Deletion Proposal & Approval
    await page.goto(`/fr/propose?action=delete&id=${resourceId}`);
    await page.fill('textarea[name="reason"]', 'Test deletion');
    await page.click('#submit-btn');
    await page.waitForURL(/\/fr\/?$/);

    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const deleteSuggestion = page.locator('.suggestion-card').filter({ hasText: updatedTitle }).filter({ hasText: 'Suppression' });
    await expect(deleteSuggestion).toBeVisible();
    await deleteSuggestion.locator('.approve-btn').click();
    await expect(deleteSuggestion).not.toBeVisible();

    // 6. Final verification
    await page.goto('/fr', { waitUntil: 'networkidle' });
    await page.fill('#search-input', updatedTitle);
    await expect(page.locator('.resource-card').filter({ hasText: updatedTitle })).not.toBeVisible({ timeout: 10000 });
  });

  test('Rejection workflow', async ({ page }) => {
    const rejectedTitle = `[TEST] To Be Rejected ${uniqueId}`;
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', rejectedTitle);
    await page.fill('textarea[name="description"]', 'Rejection test');
    await page.fill('input[name="link"]', 'https://example.com/reject');
    await page.click('#submit-btn');
    await expect(page.locator('#toast-container')).toBeVisible();

    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const suggestionCard = page.locator('.suggestion-card').filter({ hasText: rejectedTitle });
    await expect(suggestionCard).toBeVisible();
    
    page.on('dialog', dialog => dialog.accept());
    await suggestionCard.locator('.reject-btn').click();
    await expect(suggestionCard).not.toBeVisible({ timeout: 10000 });
  });

  test('Bidirectional relations', async ({ page }) => {
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
    await entityCard.locator('.approve-btn').click();
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
    await linkedCard.locator('.approve-btn').click();
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
