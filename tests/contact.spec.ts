import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test('should submit the contact form successfully', async ({ page }) => {
    // Mock the API response to avoid real email sending
    await page.route('/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/fr/contact');

    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('textarea[name="message"]', 'Ceci est un message de test.');

    await page.click('#submit-btn');

    const statusMessage = page.locator('#toast-container');
    await expect(statusMessage).toBeVisible();
    await expect(statusMessage).toContainText('Message envoyé');
    await expect(page.locator('input[name="name"]')).toHaveValue('');
  });

  test('should show error message on API failure', async ({ page }) => {
    // Mock a failure
    await page.route('/api/contact', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/fr/contact');

    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('textarea[name="message"]', 'Ceci est un message de test.');

    await page.click('#submit-btn');

    const statusMessage = page.locator('#toast-container');
    await expect(statusMessage).toBeVisible();
    await expect(statusMessage).toContainText('Une erreur est survenue');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/fr/contact');

    await page.click('#submit-btn');

    // HTML5 validation should prevent submission, status message should stay hidden
    const statusMessage = page.locator('#toast-container');
    await expect(statusMessage).toBeHidden();
    
    // Check if name field is invalid
    const isNameInvalid = await page.locator('input[name="name"]').evaluate((input: HTMLInputElement) => !input.checkValidity());
    expect(isNameInvalid).toBe(true);
  });
});
