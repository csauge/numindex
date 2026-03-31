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
    
    // Use waitForFunction to wait for either the grid to have children or the no-results message to be visible
    await page.waitForFunction(() => {
      const grid = document.getElementById('resources-grid');
      const noResults = document.getElementById('no-results');
      const hasCards = grid && grid.children.length > 0;
      const isNoResultsVisible = noResults && !noResults.classList.contains('hidden') && noResults.offsetHeight > 0;
      return hasCards || isNoResultsVisible;
    }, { timeout: 15000 });
    
    const grid = page.locator('#resources-grid');
    const noResults = page.locator('#no-results');
    expect(await grid.isVisible() || await noResults.isVisible()).toBe(true);
  });

  test('should filter results and show empty state if no match', async ({ page }) => {
    await page.goto('/fr');
    const searchInput = page.locator('#search-input');
    
    // Type a term that definitely doesn't exist
    await searchInput.fill('XYZ_NON_EXISTENT_TERM_PLAYWRIGHT_TEST');
    await page.waitForTimeout(300); // Wait for debounce
    
    const noResults = page.locator('#no-results');
    await expect(noResults).toBeVisible();
    
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);
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
