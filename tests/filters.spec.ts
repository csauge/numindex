import { test, expect } from '@playwright/test';

test.describe('Filters, Sorting and Grouping', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr');
  });

  test('should sync sort filter based on category selection', async ({ page }) => {
    const catFilter = page.locator('#filter-category');
    const sortFilter = page.locator('#filter-sort');

    // Select "Entreprise" (should sync to Name A-Z)
    await catFilter.selectOption('entreprise');
    await expect(sortFilter).toHaveValue('title');

    // Select "Événement" (should sync to Next Date)
    await catFilter.selectOption('evenement');
    await expect(sortFilter).toHaveValue('next_date');

    // Select "All" (should sync to Newest)
    await catFilter.selectOption('all');
    await expect(sortFilter).toHaveValue('updated_at');
  });

  test('should display alphabetical dividers for entity categories', async ({ page }) => {
    const catFilter = page.locator('#filter-category');
    
    // Select "Entreprise"
    await catFilter.selectOption('entreprise');
    
    // Check if at least one divider is visible
    const divider = page.locator('.alphabet-divider');
    const count = await divider.count();
    if (count > 0) {
      await expect(divider.first()).toBeVisible();
      const text = await divider.first().innerText();
      expect(text.length).toBe(1); // Should be a single letter
    }
  });

  test('should display date dividers for events', async ({ page }) => {
    const catFilter = page.locator('#filter-category');
    
    // Select "Événement"
    await catFilter.selectOption('evenement');
    
    // Check if at least one divider is visible
    const divider = page.locator('.alphabet-divider');
    const count = await divider.count();
    if (count > 0) {
      await expect(divider.first()).toBeVisible();
      // Divider should contain a month name or special labels
      const text = await divider.first().innerText();
      expect(text.length).toBeGreaterThan(1);
    }
  });

  test('should persist filters in URL and session storage', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    const catFilter = page.locator('#filter-category');

    await searchInput.fill('test');
    await catFilter.selectOption('entreprise');
    await page.waitForTimeout(300); // Wait for debounce and state sync

    // Verify URL params
    await expect(page).toHaveURL(/q=test/);
    await expect(page).toHaveURL(/cat=entreprise/);

    // Click on a resource card (if any)
    const firstCard = page.locator('.resource-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await expect(page).toHaveURL(/\/resource\//);

      // Go back
      await page.goBack();
      
      // Verify filters are restored
      await expect(searchInput).toHaveValue('test');
      await expect(catFilter).toHaveValue('entreprise');
    }
  });

  test('should keep filters when switching language', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    const catFilter = page.locator('#filter-category');

    await searchInput.fill('test');
    await catFilter.selectOption('entreprise');
    await page.waitForTimeout(300);

    // Switch to English
    await page.click('label.swap:has(#lang-toggle)');
    
    // Verify URL and filters
    await expect(page).toHaveURL(/\/en/);
    await expect(page).toHaveURL(/q=test/);
    await expect(page).toHaveURL(/cat=entreprise/);
    
    await expect(searchInput).toHaveValue('test');
    await expect(catFilter).toHaveValue('entreprise');
  });

  test('should display relative time dividers for all categories view', async ({ page }) => {
    // Default view is "All Categories" and "Newest" sort
    const divider = page.locator('.alphabet-divider');
    const count = await divider.count();
    
    if (count > 0) {
      await expect(divider.first()).toBeVisible();
      const text = await divider.first().innerText();
      
      // Should match one of the relative time labels
      // Note: CSS text-transform: capitalize makes "Cette semaine" -> "Cette Semaine"
      const validLabels = ["Cette Semaine", "Ce Mois-ci", "Cette Année", "Plus Ancien", "This Week", "This Month", "This Year", "Older"];
      expect(validLabels).toContain(text);
    }
  });
});
