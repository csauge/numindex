import { test, expect } from '@playwright/test';

test.describe('Salvia Home Page', () => {
  
  test('should redirect root to /fr', async ({ page }) => {
    await page.goto('/');
    // Support both /fr and /fr/ (trailing slash)
    await expect(page).toHaveURL(/\/fr\/?$/);
  });

  test('should have the correct title', async ({ page }) => {
    await page.goto('/fr');
    await expect(page).toHaveTitle(/Salvia/);
    // Using ID to avoid strict mode violation if other h1s exist (e.g. Astro dev tools)
    const header = page.locator('#main-title');
    await expect(header).toContainText("L'annuaire du numérique responsable");
  });

  test('should display resource cards', async ({ page }) => {
    await page.goto('/fr');
    // Wait for Supabase data to load if any, or check for grid presence
    const grid = page.locator('#resources-grid');
    await expect(grid).toBeVisible();
  });

  test('should filter results when searching', async ({ page }) => {
    await page.goto('/fr');
    const searchInput = page.locator('#search-input');
    
    // Type a term that likely doesn't exist to check empty state or filtering
    await searchInput.fill('XYZ_NON_EXISTENT_TERM');
    await page.waitForTimeout(300); // Wait for debounce
    
    const noResults = page.locator('#no-results');
    await expect(noResults).toBeVisible();
    
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);
    await expect(noResults).toBeHidden();
  });

  test('should switch language', async ({ page }) => {
    await page.goto('/fr');
    await page.click('#lang-en');
    await expect(page).toHaveURL(/\/en\/?$/);
    const header = page.locator('#main-title');
    await expect(header).toContainText("Sustainable Digital Directory");
  });
});
