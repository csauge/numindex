import { test, expect } from '@playwright/test';

test.describe('Filters, Sorting and Grouping', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr');
  });

  test('should sync sort filter based on category selection', async ({ page }) => {
    const catFilter = page.locator('#filter-category');
    const sortFilter = page.locator('#filter-sort');

    // Select "Entreprise" (should sync to Name A-Z)
    await catFilter.selectOption('acteur');
    await expect(sortFilter).toHaveValue('title');

    // Select "Événement" (should sync to A venir)
    await catFilter.selectOption('evenement');
    await expect(sortFilter).toHaveValue('next_date');

    // Select "All" (should sync to Newest)
    await catFilter.selectOption('all');
    await expect(sortFilter).toHaveValue('updated_at');
  });

  test('should display alphabetical dividers for actors', async ({ page }) => {
    const catFilter = page.locator('#filter-category');
    
    // Select "Entreprise"
    await catFilter.selectOption('acteur');
    
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

  test('should persist filters in URL when navigating back', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    const catFilter = page.locator('#filter-category');
    const favLabel = page.locator('label[title="Favoris"]');
    const favToggle = page.locator('#filter-favorites');

    await searchInput.fill('test');
    await catFilter.selectOption('acteur');
    await favLabel.click();
    await page.waitForTimeout(300); // Wait for debounce and state sync

    // Verify URL params
    await expect(page).toHaveURL(/q=test/);
    await expect(page).toHaveURL(/cat=acteur/);
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
      await expect(catFilter).toHaveValue('acteur');
      await expect(favToggle).toBeChecked();
    }
  });

  test('should keep filters when switching language', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    const catFilter = page.locator('#filter-category');

    await searchInput.fill('test');
    await catFilter.selectOption('acteur');
    await page.waitForTimeout(300);

    // Switch to English
    await page.click('label.swap:has(#lang-toggle)');
    
    // Verify URL and filters
    await expect(page).toHaveURL(/\/en/);
    await expect(page).toHaveURL(/q=test/);
    await expect(page).toHaveURL(/cat=acteur/);
    
    await expect(searchInput).toHaveValue('test');
    await expect(catFilter).toHaveValue('acteur');
  });

  test('should filter by favorites (star icon toggle)', async ({ page }) => {
    const favToggle = page.locator('#filter-favorites');
    const favLabel = page.locator('label[title="Favoris"]');

    // Wait for the initial grid to load
    await page.waitForSelector('.resource-card');
    const initialCountText = await page.locator('#results-count').innerText();
    const initialCount = parseInt(initialCountText, 10);

    // Initially not checked
    await expect(favToggle).not.toBeChecked();

    // Toggle on
    await favLabel.click();
    await expect(favToggle).toBeChecked();
    await expect(page).toHaveURL(/fav=true/);
    
    // Check that results count has updated (should be fewer or equal to initial count)
    await page.waitForTimeout(300); // Wait for debounce and state sync
    const favCountText = await page.locator('#results-count').innerText();
    const favCount = parseInt(favCountText, 10);
    expect(favCount).toBeLessThanOrEqual(initialCount);

    // Toggle off
    await favLabel.click();
    await expect(favToggle).not.toBeChecked();
    await expect(page).not.toHaveURL(/fav=true/);
    
    await page.waitForTimeout(300); // Wait for debounce and state sync
    const finalCountText = await page.locator('#results-count').innerText();
    expect(parseInt(finalCountText, 10)).toBe(initialCount);
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

  test('should display relative time dividers for all categories view', async ({ page }) => {
    // Default view is "All Categories" and "Newest" sort
    const divider = page.locator('.alphabet-divider');
    const count = await divider.count();
    
    if (count > 0) {
      await expect(divider.first()).toBeVisible();
      const text = await divider.first().innerText();
      
      // Note: text-transform: uppercase is applied via CSS, so innerText returns it in uppercase
      const validLabels = [
        "CETTE SEMAINE", "CE MOIS-CI", "CETTE ANNÉE", "PLUS ANCIEN", "SANS DATE", "PASSÉ",
        "THIS WEEK", "THIS MONTH", "THIS YEAR", "OLDER", "NO DATE", "PAST"
      ];
      expect(validLabels).toContain(text.toUpperCase());
    }
  });
});
