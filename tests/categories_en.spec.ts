import { test, expect } from '@playwright/test';

test.describe('English Category Pages', () => {
  test('should load /en/events correctly', async ({ page }) => {
    const response = await page.goto('/en/events');
    expect(response?.status()).toBe(200);
    const title = await page.locator('#main-title').textContent();
    expect(title).toContain('Events');
  });

  test('should load /en/contents correctly', async ({ page }) => {
    const response = await page.goto('/en/contents');
    expect(response?.status()).toBe(200);
    const title = await page.locator('#main-title').textContent();
    expect(title).toContain('Contents');
  });

  test('should load /en/tools correctly', async ({ page }) => {
    const response = await page.goto('/en/tools');
    expect(response?.status()).toBe(200);
    const title = await page.locator('#main-title').textContent();
    expect(title).toContain('Tools');
  });

  test('should translate subcategories and filter properly', async ({ page }) => {
    await page.goto('/en/events');
    // Check if 'Conference' (translated from Conférence) is visible
    const conferenceChip = page.locator('#sub-filters-container .pill-chip', { hasText: 'Conference' });
    await expect(conferenceChip).toBeVisible();
    await conferenceChip.click();
    
    // Check if the URL has the original French tag for filtering
    await expect(page).toHaveURL(/type=Conf%C3%A9rence/);
  });
});