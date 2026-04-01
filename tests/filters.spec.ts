import { test, expect } from '@playwright/test';

test.describe('Filters, Sorting and Grouping', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr');
  });

  test('should sync sort filter based on category selection', async ({ page }) => {
    const sortFilter = page.locator('#filter-sort');

    // Select "Acteurs" (should sync to Name A-Z)
    await page.click('nav[aria-label="Categories"] a:has-text("Acteurs")');
    await expect(sortFilter).toHaveValue('title');

    // Select "Événements" (should sync to A venir)
    await page.click('nav[aria-label="Categories"] a:has-text("Événements")');
    await expect(sortFilter).toHaveValue('next_date');

    // Select "Tout" (should sync to Newest)
    await page.click('nav[aria-label="Categories"] a:has-text("Tout")');
    await expect(sortFilter).toHaveValue('updated_at');
  });

  test('should display dividers when sorting', async ({ page }) => {
    // Select "Acteurs"
    await page.click('nav[aria-label="Categories"] a:has-text("Acteurs")');
    await expect(page.locator('.alphabet-divider').first()).toBeVisible();

    // Select "Événements"
    await page.click('nav[aria-label="Categories"] a:has-text("Événements")');
    await expect(page.locator('.alphabet-divider').first()).toBeVisible();
  });

  test('should persist filters in URL when navigating back', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    const favLabel = page.locator('label[title="Favoris"]');
    const favToggle = page.locator('#filter-favorites');

    await searchInput.fill('test');
    await page.click('nav[aria-label="Categories"] a:has-text("Acteurs")');
    await favLabel.click();
    
    // Verify URL params
    await expect(page).toHaveURL(/q=test/);
    await expect(page).toHaveURL(/\/acteurs/);
    await expect(page).toHaveURL(/fav=true/);

    // Click on a resource card (if any)
    const firstCard = page.locator('.resource-card').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await expect(page).toHaveURL(/\/resource\//);

      // Go back
      await page.goBack();
      
      // Verify filters are restored
      await expect(searchInput).toHaveValue('test');
      await expect(page).toHaveURL(/\/acteurs/);
      await expect(favToggle).toBeChecked();
    }
  });

  test('should keep filters when switching language', async ({ page }) => {
    const searchInput = page.locator('#search-input');

    await searchInput.fill('test');
    await page.click('nav[aria-label="Categories"] a:has-text("Acteurs")');

    // Switch to English
    await page.click('label.swap:has(#lang-toggle)');
    
    // Verify URL and filters
    await expect(page).toHaveURL(/\/en\/(actors|acteurs)/);
    await expect(page).toHaveURL(/q=test/);
    await expect(searchInput).toHaveValue('test');
  });

  test('should filter by favorites (star icon toggle)', async ({ page }) => {
    const favToggle = page.locator('#filter-favorites');
    const favLabel = page.locator('label[title="Favoris"]');

    await expect(page.locator('.resource-card').first()).toBeVisible();
    const initialCount = parseInt(await page.locator('#results-count').innerText(), 10);

    await favLabel.click();
    await expect(favToggle).toBeChecked();
    await expect(page).toHaveURL(/fav=true/);
    
    const favCount = parseInt(await page.locator('#results-count').innerText(), 10);
    expect(favCount).toBeLessThanOrEqual(initialCount);

    await favLabel.click();
    await expect(favToggle).not.toBeChecked();
    await expect(parseInt(await page.locator('#results-count').innerText(), 10)).toBe(initialCount);
  });

  test('should clear search input when clear button is clicked', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    const clearBtn = page.locator('#clear-search');

    // Initially hidden (opacity-0 class)
    await expect(clearBtn).toHaveClass(/opacity-0/);

    // Type something
    await searchInput.fill('test');
    await expect(clearBtn).not.toHaveClass(/opacity-0/);
    await expect(clearBtn).toBeVisible();

    // Click clear
    await clearBtn.click();

    // Should be empty and hidden again
    await expect(searchInput).toHaveValue('');
    await expect(clearBtn).toHaveClass(/opacity-0/);
    await expect(searchInput).toBeFocused();
  });
});
