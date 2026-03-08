import { test, expect } from '@playwright/test';

test.describe('Moderation Lifecycle', () => {
  test.setTimeout(60000); // Increase timeout for database operations

  const resourceTitle = `Test Resource ${Math.floor(Math.random() * 10000)}`;
  const updatedTitle = `${resourceTitle} Updated`;

  test('should propose, approve, update, and delete a resource', async ({ page }) => {
    // 1. Propose a new resource
    console.log(`[Step 1] Proposing: ${resourceTitle}`);
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', resourceTitle);
    await page.fill('textarea[name="description"]', 'Une description de test pour cette ressource.');
    await page.selectOption('select[name="category"]', 'logiciel');
    await page.fill('input[name="link"]', 'https://example.com/test-resource');
    
    await page.click('#submit-btn');
    
    await expect(page.locator('#toast-container')).toBeVisible();
    await expect(page.locator('#toast-text')).toContainText('Suggestion envoyée !');
    await page.waitForURL(/\/fr\/?$/);
    console.log('[Step 1] Proposal submitted');

    // 2. Moderate (Approve)
    console.log('[Step 2] Navigating to Admin');
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const suggestionCard = page.locator('.suggestion-card').filter({ hasText: resourceTitle });
    await expect(suggestionCard).toBeVisible();
    
    console.log('[Step 2] Approving proposal');
    await suggestionCard.locator('.approve-btn').click();
    await expect(suggestionCard).not.toBeVisible();
    console.log('[Step 2] Proposal approved');

    // 3. Verify on home page
    console.log('[Step 3] Verifying on Home');
    await page.goto('/fr', { waitUntil: 'networkidle' });
    const resourceCard = page.locator('.resource-card').filter({ hasText: resourceTitle });
    await expect(resourceCard).toBeVisible();

    // 4. Propose an update
    const resourceUrl = await resourceCard.getAttribute('href');
    const resourceId = resourceUrl?.split('/').pop();
    console.log(`[Step 4] Proposing update for ${resourceId}`);
    
    await page.goto(`/fr/propose?action=update&id=${resourceId}`, { waitUntil: 'networkidle' });
    await expect(page.locator('input[name="title"]')).toHaveValue(resourceTitle);
    
    await page.fill('input[name="title"]', updatedTitle);
    await page.click('#submit-btn');
    
    await expect(page.locator('#toast-container')).toBeVisible();
    await page.waitForURL(/\/fr\/?$/);
    console.log('[Step 4] Update submitted');

    // 5. Moderate Update (Approve)
    console.log('[Step 5] Approving update in Admin');
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const updateSuggestion = page.locator('.suggestion-card').filter({ hasText: updatedTitle });
    await expect(updateSuggestion).toBeVisible();
    await updateSuggestion.locator('.approve-btn').click();
    await expect(updateSuggestion).not.toBeVisible();
    console.log('[Step 5] Update approved');

    // 6. Verify update on home page
    console.log('[Step 6] Verifying update on Home');
    await page.goto('/fr', { waitUntil: 'networkidle' });
    await expect(page.locator('.resource-card').filter({ hasText: updatedTitle })).toBeVisible();

    // 7. Propose deletion
    console.log('[Step 7] Proposing deletion');
    await page.goto(`/fr/propose?action=delete&id=${resourceId}`, { waitUntil: 'networkidle' });
    await page.fill('textarea[name="reason"]', 'Motif de suppression de test');
    await page.click('#submit-btn');
    
    await expect(page.locator('#toast-container')).toBeVisible();
    await page.waitForURL(/\/fr\/?$/);

    // 8. Moderate Deletion (Approve)
    console.log('[Step 8] Approving deletion in Admin');
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const deleteSuggestion = page.locator('.suggestion-card').filter({ hasText: updatedTitle }).filter({ hasText: 'Suppression' });
    await expect(deleteSuggestion).toBeVisible();
    await deleteSuggestion.locator('.approve-btn').click();
    await expect(deleteSuggestion).not.toBeVisible();

    // 9. Verify deletion on home page
    console.log('[Step 9] Verifying deletion on Home');
    await page.goto('/fr', { waitUntil: 'networkidle' });
    await expect(page.locator('.resource-card').filter({ hasText: updatedTitle })).not.toBeVisible();
  });

  test('should handle metadata fields (City, Dates) for specific categories', async ({ page }) => {
    // 1. Check Event fields (City and Next Date)
    await page.goto('/fr/propose');
    await page.selectOption('select[name="category"]', 'evenement');
    
    await expect(page.locator('#city-container')).toBeVisible();
    await expect(page.locator('#next-date-container')).toBeVisible();
    await expect(page.locator('#date-container')).toBeHidden(); // No publication date for events by default (group is ACTEURS)

    // Fill City with search mock (or just manual if search is complex)
    await page.fill('#city-search', 'Lyon');
    await page.waitForTimeout(500); // debounce
    // Even if Photon isn't mocked, it might work if network is allowed, 
    // but better to just fill and verify it updates the hidden field or preview.
    await page.click('#city-results button:first-child'); 
    await expect(page.locator('#badge-city')).toContainText('Lyon');

    // Fill Next Date
    const nextDate = '2026-12-31';
    await page.fill('input[name="next_date"]', nextDate);
    await expect(page.locator('#badge-next-date')).toContainText(nextDate);

    // 2. Check Content fields (Publication Date)
    await page.selectOption('select[name="category"]', 'article');
    await expect(page.locator('#city-container')).toBeHidden();
    await expect(page.locator('#next-date-container')).toBeHidden();
    await expect(page.locator('#date-container')).toBeVisible();

    const pubDate = '2026-01-01';
    await page.fill('input[name="published_at"]', pubDate);
    await expect(page.locator('#badge-date')).toContainText(pubDate);
  });

  test('should display bidirectional relations correctly on detail pages', async ({ page }) => {
    const entityTitle = `Entity ${Math.floor(Math.random() * 10000)}`;
    const linkedResourceTitle = `Article by Entity ${Math.floor(Math.random() * 10000)}`;

    // 1. Propose an Entity
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', entityTitle);
    await page.fill('textarea[name="description"]', 'A testing entity');
    await page.selectOption('select[name="category"]', 'entreprise');
    await page.fill('input[name="link"]', 'https://entity.example.com');
    await page.click('#submit-btn');
    await page.waitForURL(/\/fr\/?$/);

    // 2. Approve Entity
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const entityCard = page.locator('.suggestion-card').filter({ hasText: entityTitle });
    await expect(entityCard).toBeVisible();
    await entityCard.locator('.approve-btn').click();
    await expect(entityCard).not.toBeVisible();

    // 3. Propose a Resource linked to that Entity
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', linkedResourceTitle);
    await page.fill('textarea[name="description"]', 'An article linked to our entity');
    await page.selectOption('select[name="category"]', 'article');
    await page.fill('input[name="link"]', 'https://article.example.com');
    
    // Link the entity
    await page.fill('#related-search', entityTitle);
    const resultButton = page.locator(`#related-results button:has-text("${entityTitle}")`);
    await expect(resultButton).toBeVisible();
    await resultButton.click();
    
    await page.click('#submit-btn');
    await page.waitForURL(/\/fr\/?$/);

    // 4. Approve linked resource
    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const resourceCard = page.locator('.suggestion-card').filter({ has: page.locator('h2', { hasText: linkedResourceTitle, exact: true }) });
    await expect(resourceCard).toBeVisible();
    await resourceCard.locator('.approve-btn').click();
    await expect(resourceCard).not.toBeVisible();

    // 5. Verify mentions on Resource page (Proposé par)
    await page.goto('/fr');
    await page.locator('.resource-card').filter({ hasText: linkedResourceTitle }).click();
    await expect(page.locator('h2:has-text("Proposé par :")')).toBeVisible();
    await expect(page.locator('a:has-text("' + entityTitle + '")')).toBeVisible();

    // 6. Verify mentions on Entity page (Ressources proposées)
    await page.goto('/fr');
    await page.locator('.resource-card').filter({ hasText: entityTitle }).click();
    await expect(page.locator('h2:has-text("Ressources proposées :")')).toBeVisible();
    await expect(page.locator('a:has-text("' + linkedResourceTitle + '")')).toBeVisible();
  });

  test('should be able to reject a suggestion', async ({ page }) => {
    test.setTimeout(60000);
    const rejectedTitle = `To Be Rejected ${Math.floor(Math.random() * 10000)}`;

    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', rejectedTitle);
    await page.fill('textarea[name="description"]', 'This will be rejected');
    await page.fill('input[name="link"]', 'https://example.com/rejected');
    await page.click('#submit-btn');
    await page.waitForURL(/\/fr\/?$/);

    await page.goto('/fr/admin', { waitUntil: 'networkidle' });
    const suggestionCard = page.locator('.suggestion-card').filter({ hasText: rejectedTitle });
    
    page.once('dialog', dialog => dialog.accept());
    await suggestionCard.locator('.reject-btn').click();
    
    await expect(suggestionCard).not.toBeVisible();

    await page.goto('/fr', { waitUntil: 'networkidle' });
    await expect(page.locator('.resource-card').filter({ hasText: rejectedTitle })).not.toBeVisible();
  });
});
