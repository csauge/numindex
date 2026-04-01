import { test, expect } from '@playwright/test';
import { getLatestEmail, extractConfirmationLink } from './utils/mailpit';

test.describe('Complete Signup Flow with Email Confirmation', () => {

  test('User should be able to signup, receive an email, and confirm their account', async ({ browser }) => {
    // Create a fresh context without storage state
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    const uniqueEmail = `new-user-${Date.now()}@example.com`;
    const fullName = 'New Test User';
    const password = 'password123';

    // 1. Go to register page
    await page.goto('/fr/register');

    // 2. Fill the form
    await page.fill('input[name="full_name"]', fullName);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', password);

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Should see the "Check your email" message (Check that form is hidden)
    await expect(page.locator('#register-form')).toBeHidden();
    await expect(page.locator('#check-email-message')).toBeVisible();
    await expect(page.locator('#check-email-message h2')).toContainText('Presque fini');

    // 5. Fetch the email from Mailpit
    const email = await getLatestEmail(uniqueEmail);
    expect(email).not.toBeNull();
    expect(email.Subject).toContain('Confirmation de votre compte');

    // 6. Extract the link
    const confirmLink = extractConfirmationLink(email);
    expect(confirmLink).not.toBeNull();
    expect(confirmLink).toContain('verify');

    // 7. Click the link (using page.goto since it's an external-like link)
    await page.goto(confirmLink!);

    // 8. Should be redirected to home and logged in
    await page.waitForURL(/\/fr\/?(#.*)?$/);
    
    // Wait for auth UI to settle
    await expect(page.locator('#user-info')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#user-name-trigger')).toContainText(fullName);
  });
});
