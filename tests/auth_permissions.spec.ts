import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

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

  test('Visitor should see the Proposer button and be redirected when clicking it', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    
    // 1. Visit home page as visitor
    await page.goto('/fr');
    
    // 2. Proposer button should be visible
    const proposeBtn = page.locator('#propose-btn');
    await expect(proposeBtn).toBeVisible();
    await expect(proposeBtn).toContainText('Ajouter');

    // 3. Clicking it should redirect to login with redirect param
    await proposeBtn.click();
    await expect(page).toHaveURL(/\/fr\/login\?redirect=.*propose/);

    await context.close();
  });

  test('Visitor should see Edit/Report buttons on resource page and be redirected', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    
    // 1. Visit any resource page (assuming one exists or using a known path if seeded)
    // We can get the first resource from home page
    await page.goto('/fr');
    await page.locator('.resource-card').first().click();
    await page.waitForURL(/\/fr\/resource\//);

    // 2. Edit button should be visible
    const editBtn = page.locator('a:has-text("Modifier")');
    await expect(editBtn).toBeVisible();

    // 3. Report button should be visible
    const reportBtn = page.locator('a:has-text("Supprimer")');
    await expect(reportBtn).toBeVisible();

    // 4. Clicking edit should redirect
    await editBtn.click();
    await expect(page).toHaveURL(/\/fr\/login\?redirect=.*propose/);

    await context.close();
  });

  test('Authenticated User (non-admin) should see Access Denied on /admin', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    
    // 1. Create/Login as a regular user
    const userEmail = `visitor-non-admin-${Date.now()}@example.com`;
    await page.goto('/fr/register');
    await page.fill('input[name="full_name"]', 'Regular User');
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // With email confirmation, it shows the message
    await expect(page.locator('#check-email-message')).toBeVisible({ timeout: 10000 });
    
    // Manually confirm the user
    execSync(`npx supabase db query "UPDATE auth.users SET email_confirmed_at = now(), last_sign_in_at = now() WHERE email = '${userEmail}';"`);

    // Ensure this user is NOT an admin
    execSync(`npx supabase db query "UPDATE public.profiles SET role = 'user' WHERE id IN (SELECT id FROM auth.users WHERE email = '${userEmail}');"`);

    // 2. Login
    await page.goto('/fr/login');
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/fr\/?$/);
    
    // Wait for the auth script to settle
    await expect(page.locator('#user-info')).toBeVisible({ timeout: 10000 });

    // 3. Try to access /admin
    await page.goto('/fr/admin');
    
    // Should see the Access Denied block
    const accessDenied = page.locator('#access-denied');
    await expect(accessDenied).toBeVisible({ timeout: 10000 });
    await expect(accessDenied).toContainText('Accès réservé');
    
    // Title "Modération" should be hidden
    await expect(page.locator('h1:has-text("Modération")')).toBeHidden();

    await context.close();
  });

  test('Should redirect back to original destination after login', async ({ browser }) => {
    // We use a fresh context to ensure we are a visitor
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    
    const userEmail = `redirect-test-${Date.now()}@test.org`;
    const password = 'password123';

    // 1. Create the user first so we can login
    await page.goto('/fr/register');
    await page.fill('input[name="full_name"]', 'Redirect User');
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // With email confirmation, it shows the message
    await expect(page.locator('#check-email-message')).toBeVisible({ timeout: 10000 });
    
    // Manually confirm the user
    execSync(`npx supabase db query "UPDATE auth.users SET email_confirmed_at = now(), last_sign_in_at = now() WHERE email = '${userEmail}';"`);
    
    // 2. Sign in then Sign out
    await page.goto('/fr/login');
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/fr\/?$/);
    
    await page.click('#user-info [role="button"]');
    await page.click('#logout-btn');
    await page.waitForURL(/\/fr\/?$/);
    await expect(page.locator('#login-link')).toBeVisible();

    // 3. Visit propose (as visitor) -> should redirect to login
    await page.goto('/fr/propose');
    await expect(page).toHaveURL(/\/fr\/login\?redirect=.*propose/);
    
    // 4. Login
    await page.fill('input[name="email"]', userEmail);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // 5. Should be back on propose
    await page.waitForURL(url => url.pathname.includes('/fr/propose'), { timeout: 20000 });
    await expect(page).toHaveURL(/\/fr\/propose/);
    await expect(page.locator('h2:has-text("Proposer")')).toBeVisible();

    await context.close();
  });

  test('Admin should see and be able to moderate suggestions', async ({ page }) => {
    await page.addInitScript(() => {
      window.confirm = () => true;
    });
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
    await page.addInitScript(() => {
      window.confirm = () => true;
    });
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    test.setTimeout(120000);
    const resourceTitle = `Tracking Test ${Math.floor(Math.random() * 10000)}`;
    
    // 1. Proposer un ajout
    await page.goto('/fr/propose');
    await page.fill('input[name="title"]', resourceTitle);
    await page.fill('textarea[name="description"]', 'Description tracking test');
    await page.selectOption('select[name="category"]', 'contenu');
    await page.selectOption('select[name="mandatory-tag"]', 'Article');
    await page.fill('input[name="link"]', 'https://tracking.test');
    
    // Select an optional tag
    await page.click('button:has-text("Expert")');
    
    await page.click('#submit-btn');
    await page.waitForURL(/\/fr\/?$/);

    // 2. Vérifier dans Admin
    await page.goto('/fr/admin');
    const suggestionCard = page.locator('.suggestion-card').filter({ hasText: resourceTitle });
    await expect(suggestionCard).toBeVisible();
    
    // Check tags are visible
    await expect(suggestionCard.locator('span:has-text("Expert")')).toBeVisible();
    
    // 3. Approuver
    console.log('Clicking approve for:', resourceTitle);
    await suggestionCard.locator('.approve-btn').click();
    console.log('Approve clicked, waiting for card to disappear');
    await expect(suggestionCard).not.toBeVisible({ timeout: 15000 });
    console.log('Card disappeared');

    // 4. Vérifier les détails (Ajouté par)
    await page.goto('/fr');
    await page.locator('.resource-card').filter({ hasText: resourceTitle }).click();
    await expect(page.locator('p:has-text("Soumis le")')).toBeVisible();

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

    // 7. Vérifier les détails (Modifié le)
    await page.goto(resourceUrl);
    await expect(page.locator('p:has-text("Modifié le")')).toBeVisible();  });

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

    // 2. Should show the "Check your email" message
    await expect(page.locator('#check-email-message')).toBeVisible();
    await expect(page.locator('#check-email-message h2')).toContainText('Presque fini');
    
    // Manually confirm to verify login behavior after confirmation
    execSync(`npx supabase db query "UPDATE auth.users SET email_confirmed_at = now(), last_sign_in_at = now() WHERE email = '${newUserEmail}';"`);

    // 3. Go to login
    await page.goto('/fr/login');
    await page.fill('input[name="email"]', newUserEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/fr\/?$/);
    
    // 4. User info should be visible (meaning logged in)
    await expect(page.locator('#user-info')).toBeVisible();
    
    // 5. Try to go back to login -> should be redirected to home
    await page.goto('/fr/login');
    await expect(page).toHaveURL(/\/fr\/?$/);

    await context.close();
  });
});
