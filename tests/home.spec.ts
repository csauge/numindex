import { test, expect } from '@playwright/test';

test.describe('numindex.org Home Page', () => {
  
  test('should redirect root to /fr', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/fr\/?$/);
  });

  test('should have the correct title', async ({ page }) => {
    await page.goto('/fr');
    await expect(page).toHaveTitle(/numindex.org/);
    const header = page.locator('#main-title');
    await expect(header).toContainText("NumIndex — Annuaire Numérique Responsable");
  });

  test('should display resource cards or empty state', async ({ page }) => {
    await page.goto('/fr');
    
    const firstCard = page.locator('.resource-card').first();
    const noResults = page.locator('#no-results');
    
    // Wait for either the grid to be populated OR the no-results message to be visible
    await expect(firstCard.or(noResults.filter({ visible: true }))).toBeVisible();
  });

  test('should filter results and show empty state if no match', async ({ page }) => {
    await page.goto('/fr');
    const searchInput = page.locator('#search-input');
    
    await searchInput.fill('XYZ_NON_EXISTENT_TERM_PLAYWRIGHT_TEST');
    
    const noResults = page.locator('#no-results');
    await expect(noResults).toBeVisible();
  });

  test('should switch language', async ({ page }) => {
    await page.goto('/fr');
    // Click the label for the language toggle (the input might be hidden/not stable)
    await page.click('label.swap:has(#lang-toggle)');
    await expect(page).toHaveURL(/\/en\/?$/);
    const header = page.locator('#main-title');
    await expect(header).toContainText("NumIndex — Sustainable Digital Directory");
  });

});
