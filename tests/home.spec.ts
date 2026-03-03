import { test, expect } from '@playwright/test';

test.describe('Salvia Home Page', () => {
  
  test('should redirect root to /fr', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/fr\/?$/);
  });

  test('should have the correct title', async ({ page }) => {
    await page.goto('/fr');
    await expect(page).toHaveTitle(/Salvia/);
    const header = page.locator('#main-title');
    await expect(header).toContainText("L'annuaire du numérique responsable");
  });

  test('should display resource cards or empty state', async ({ page }) => {
    await page.goto('/fr');
    const grid = page.locator('#resources-grid');
    const noResults = page.locator('#no-results');
    
    // One of them must be visible
    const isGridVisible = await grid.isVisible();
    const isNoResultsVisible = await noResults.isVisible();
    
    expect(isGridVisible || isNoResultsVisible).toBe(true);
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
    
    // If DB is empty, noResults stays visible. If not, it should hide.
    // This part of the test is tricky with an empty DB.
  });

  test('should switch language', async ({ page }) => {
    await page.goto('/fr');
    await page.click('#lang-en');
    await expect(page).toHaveURL(/\/en\/?$/);
    const header = page.locator('#main-title');
    await expect(header).toContainText("Sustainable Digital Directory");
  });
});
