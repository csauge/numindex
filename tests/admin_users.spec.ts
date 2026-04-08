import { test, expect } from '@playwright/test';

test.describe('Admin Users List [TEST]', () => {

  test('Admin can view the list of users', async ({ page }) => {
    // Navigate to admin page
    await page.goto('/fr/admin');
    
    // Check if the page title has updated (optional but good)
    await expect(page.locator('h1').first()).toHaveText('Administration');

    // Check if the users section is visible
    const usersSection = page.locator('#users-section');
    await expect(usersSection).toBeVisible();
    await expect(usersSection.locator('h2')).toHaveText('Utilisateurs');

    // Wait for the table to be visible (loading state should hide)
    const usersTable = page.locator('#users-table');
    await expect(usersTable).toBeVisible({ timeout: 10000 });

    // Check if there are rows in the table
    const rows = usersTable.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    // Verify the presence of at least one admin badge
    const adminBadge = usersTable.locator('.badge-primary', { hasText: 'Admin' });
    await expect(adminBadge.first()).toBeVisible();
    
    // Verify an email is visible (since admins should see them)
    // We expect the email of the logged in user or a test user to be there
    const emails = await usersTable.locator('td.text-stone-500').allInnerTexts();
    expect(emails.some(email => email.includes('@'))).toBeTruthy();
  });

  test('API endpoint /api/users is protected', async ({ request }) => {
    // Test without auth
    const responseNoAuth = await request.get('/api/users');
    expect(responseNoAuth.status()).toBe(401);

    // Note: Testing with a non-admin token would require creating a non-admin user 
    // and getting their token, which is more complex in a single test file.
    // The basic 401 check confirms the protection is active.
  });
});
