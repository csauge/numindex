import { test, expect } from '@playwright/test';

test.describe('Authentication & Authorization Permissions', () => {
  
  test('Visitor should be redirected to login when accessing protected pages', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    
    // Try to access propose
    await page.goto('/fr/propose');
    await expect(page).toHaveURL(/\/fr\/login\?redirect=.*propose/);

    // Try to access admin
    await page.goto('/fr/admin');
    await expect(page).toHaveURL(/\/fr\/login\?redirect=.*admin/);

    await context.close();
  });

  test('Authenticated User (non-admin) should see Access Denied on /admin', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    
    // 1. Create/Login as a regular user
    const userEmail = `user-${Date.now()}@test.org`;
    await page.goto('/fr/register');
    await page.fill('input[name="full_name"]', 'Regular User');
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // New behavior: redirects to home directly as it logs in automatically
    await page.waitForURL(/\/fr\/?$/);

    // 2. Try to access /admin
    await page.goto('/fr/admin');
    
    // Should see the Access Denied block
    const accessDenied = page.locator('#access-denied');
    await expect(accessDenied).toBeVisible();
    await expect(accessDenied).toContainText('Accès réservé');
    
    // Title "Modération" should be hidden
    await expect(page.locator('h1:has-text("Modération")')).toBeHidden();

    await context.close();
  });

  test('Should redirect back to original destination after login', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    
    // 1. Try to go to propose (as visitor)
    await page.goto('/fr/propose');
    await expect(page).toHaveURL(/\/fr\/login\?redirect=.*propose/);

    // 2. Login
    const email = process.env.TEST_USER_EMAIL || 'admin@numindex.org';
    const password = process.env.TEST_USER_PASSWORD || 'password123';
    
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // 3. Should be back on propose
    await expect(page).toHaveURL(/\/fr\/propose/);
    await expect(page.locator('h2:has-text("Proposer")')).toBeVisible();

    await context.close();
  });

  test('Admin should see and be able to moderate suggestions', async ({ page }) => {
    await page.goto('/fr/admin');
    
    // Should NOT see access denied
    await expect(page.locator('#access-denied')).toBeHidden();
    
    // Should see the title
    await expect(page.locator('h1')).toContainText('Modération');
    
    // Should eventually see list or empty state (not loading forever)
    await expect(page.locator('#loading-state')).toBeHidden({ timeout: 15000 });
    const hasSuggestions = await page.locator('.suggestion-card').count() > 0;
    const isEmpty = await page.locator('#empty-state').isVisible();
    
    expect(hasSuggestions || isEmpty).toBeTruthy();
  });

  test('Should track and display added_by / updated_by correctly', async ({ page, browser }) => {
    test.setTimeout(120000);
    const resourceTitle = `Tracking Test ${Math.floor(Math.random() * 10000)}`;
    
    // 1. Proposer un ajout
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', resourceTitle);
    await page.fill('textarea[name="description"]', 'Description tracking test');
    await page.selectOption('select[name="category"]', 'article');
    await page.fill('input[name="link"]', 'https://tracking.test');
    await page.fill('input[name="tags"]', 'test, tracking');
    await page.click('#submit-btn');
    await page.waitForURL(/\/fr\/?$/);

    // 2. Vérifier dans Admin
    await page.goto('/fr/admin');
    const suggestionCard = page.locator('.suggestion-card').filter({ hasText: resourceTitle });
    await expect(suggestionCard).toBeVisible();
    
    // Check tags are visible
    await expect(suggestionCard.locator('span:has-text("#test")')).toBeVisible();
    
    // 3. Approuver
    await suggestionCard.locator('.approve-btn').click();
    await expect(suggestionCard).not.toBeVisible();

    // 4. Vérifier les détails (Ajouté par)
    await page.goto('/fr');
    await page.locator('.resource-card').filter({ hasText: resourceTitle }).click();
    await expect(page.locator('p:has-text("Ajouté le")')).toBeVisible();
    
    // 5. Proposer une modification
    const resourceUrl = page.url();
    const resourceId = resourceUrl.split('/').pop();
    const updatedTitle = `${resourceTitle} Updated`;
    
    await page.goto(`/fr/propose?action=update&id=${resourceId}`);
    await page.fill('input[name="title"]', updatedTitle);
    await page.click('#submit-btn');
    await page.waitForURL(/\/fr\/?$/);
    
    // 6. Modérer la mise à jour
    await page.goto('/fr/admin');
    const updateSuggestion = page.locator('.suggestion-card').filter({ hasText: updatedTitle });
    await expect(updateSuggestion).toBeVisible();
    
    // Target ID should be visible for updates
    await expect(updateSuggestion.locator('p:has-text("ID cible :")')).toBeVisible();
    
    await updateSuggestion.locator('.approve-btn').click();
    await expect(updateSuggestion).not.toBeVisible();
    
    // 7. Vérifier les détails (Mis à jour le)
    await page.goto(resourceUrl);
    await expect(page.locator('p:has-text("Mis à jour le")')).toBeVisible();
  });

  test('New user registration should login automatically and redirect to home', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    
    const newUserEmail = `new-user-${Date.now()}@test.org`;
    
    // 1. Go to register
    await page.goto('/fr/register');
    await page.fill('input[name="full_name"]', 'New User');
    await page.fill('input[name="email"]', newUserEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. Should show success and redirect to home (not login)
    await expect(page).toHaveURL(/\/fr\/?$/, { timeout: 10000 });
    
    // 3. Add button should be visible (meaning logged in)
    await expect(page.locator('#propose-btn')).toBeVisible();
    
    // 4. Try to go back to login -> should be redirected to home
    await page.goto('/fr/login');
    await expect(page).toHaveURL(/\/fr\/?$/);

    await context.close();
  });
});
