import { test, expect } from '@playwright/test';

test.describe('Moderation Correction Workflow', () => {
  test.setTimeout(90000);

  // Helper to wait for DB stability if needed
  const waitDB = () => new Promise(resolve => setTimeout(resolve, 1000));

  test('should allow a moderator to correct a suggestion before approving', async ({ page }) => {
    page.on('console', msg => console.log(`[Browser LOG] ${msg.type()}: ${msg.text()}`));

    const resourceTitle = `Initial Title ${Math.floor(Math.random() * 10000)}`;
    const correctedTitle = `${resourceTitle} Corrected By Admin`;

    // 1. User proposes a new resource
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', resourceTitle);
    await page.fill('textarea[name="description"]', 'Initial description.');
    await page.selectOption('select[name="category"]', 'outil');
    await page.selectOption('select[name="mandatory-tag"]', 'Logiciel');
    await page.fill('input[name="link"]', 'https://example.com/initial');
    await page.click('#submit-btn');
    await expect(page.locator('#toast-container')).toBeVisible();
    await page.waitForURL(/\/fr\/?$/);

    // 2. Admin goes to moderation, sees the suggestion, and clicks "Correct"
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const suggestionCard = page.locator('.suggestion-card').filter({ hasText: resourceTitle });
    await expect(suggestionCard).toBeVisible({ timeout: 10000 });
    
    await suggestionCard.locator('text=Corriger').click();
    await page.waitForURL(/\/fr\/propose\?sid=/);

    // 3. Admin modifies the title and description
    await expect(page.locator('input[name="title"]')).toHaveValue(resourceTitle);
    await page.fill('input[name="title"]', correctedTitle);
    await page.fill('textarea[name="description"]', 'Corrected description by admin.');
    await page.click('#submit-btn');
    
    await expect(page.locator('#toast-container')).toBeVisible();
    await expect(page.locator('#toast-text')).toContainText('Corrections enregistrées !');
    await page.waitForURL(/\/fr\/admin\/?$/);

    // 4. Admin verifies the corrected title is now visible in moderation
    const updatedSuggestion = page.locator('.suggestion-card').filter({ hasText: correctedTitle });
    await expect(updatedSuggestion).toBeVisible({ timeout: 10000 });

    // 5. Admin approves the corrected suggestion
    await updatedSuggestion.locator('.approve-btn').click();
    
    // Wait for the card to disappear (indicates successful reload after approval)
    await expect(page.locator('.suggestion-card').filter({ hasText: correctedTitle })).not.toBeVisible({ timeout: 15000 });

    // 6. Verify on home page that the CORRECTED title is published
    await page.goto('/fr', { waitUntil: 'networkidle' });
    
    // Ensure search is cleared to avoid filtering issues
    await page.fill('#search-input', '');
    
    // Use search to find it if not visible (helps with sorting/scrolling)
    await page.fill('#search-input', correctedTitle);
    
    const finalResource = page.locator('.resource-card h2').filter({ hasText: correctedTitle });
    await expect(finalResource).toBeVisible({ timeout: 15000 });
    
    // Check that original title is NOT present
    await page.fill('#search-input', resourceTitle);
    const oldResource = page.locator('.resource-card h2').filter({ hasText: new RegExp(`^${resourceTitle}$`, 'i') });
    await expect(oldResource).not.toBeVisible();
  });

  test('should highlight modified fields in an update suggestion', async ({ page }) => {
    page.on('console', msg => console.log(`[Browser LOG] ${msg.type()}: ${msg.text()}`));

    const baseTitle = `Diff Test ${Math.floor(Math.random() * 10000)}`;
    const updatedTitle = `${baseTitle} MODIFIED`;

    // 1. Create a resource first
    console.log('[Step 1] Creating base resource');
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', baseTitle);
    await page.fill('textarea[name="description"]', 'Original description.');
    await page.selectOption('select[name="category"]', 'outil');
    await page.selectOption('select[name="mandatory-tag"]', 'Logiciel');
    await page.fill('input[name="link"]', 'https://example.com/diff');
    await page.click('#submit-btn');
    await page.waitForURL(/\/fr\/?$/);

    // Approve it
    console.log('[Step 2] Approving base resource');
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const suggestionCardToApprove = page.locator('.suggestion-card').filter({ hasText: baseTitle });
    await expect(suggestionCardToApprove).toBeVisible({ timeout: 10000 });
    await suggestionCardToApprove.locator('.approve-btn').click();
    await expect(suggestionCardToApprove).not.toBeVisible({ timeout: 15000 });
    
    // Wait for the resource to be available on home
    console.log('[Step 3] Waiting for resource on home page');
    await page.goto('/fr', { waitUntil: 'networkidle' });
    await page.fill('#search-input', baseTitle);
    const resourceCard = page.locator('.resource-card').filter({ hasText: baseTitle });
    await expect(resourceCard).toBeVisible({ timeout: 15000 });

    // 2. Propose an update with a changed title
    const resourceUrl = await resourceCard.getAttribute('href');
    const resourceId = resourceUrl?.split('/').pop();
    console.log(`[Step 4] Proposing update for ${resourceId}`);

    await page.goto(`/fr/propose?action=update&id=${resourceId}`);
    await page.fill('input[name="title"]', updatedTitle);
    await page.click('#submit-btn');
    await page.waitForURL(/\/fr\/?$/);

    // 3. Verify highlighting in admin
    console.log('[Step 5] Verifying highlighting in Admin');
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const modifiedSuggestion = page.locator('.suggestion-card').filter({ hasText: updatedTitle });
    await expect(modifiedSuggestion).toBeVisible({ timeout: 10000 });
    
    // The title should have the diffClass (ring-2 ring-red-500)
    // In admin.astro, h2 has the diffClass
    const titleHeader = modifiedSuggestion.locator('h2');
    await expect(titleHeader).toHaveClass(/ring-red-500/);
    
    // The description should NOT have the diffClass since we didn't change it
    const descPara = modifiedSuggestion.locator('p').filter({ hasText: 'Original description.' });
    await expect(descPara).not.toHaveClass(/ring-red-500/);
  });
});
