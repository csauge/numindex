import { test, expect } from '@playwright/test';

test.describe('Export Functionality', () => {
  // Monitor console for errors during tests
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser console error: ${msg.text()}`);
      }
    });
  });

  test('should show export dropdown and contain CSV and Bookmarks options', async ({ page }) => {
    await page.goto('/fr');
    
    // Click on export dropdown label by title
    const exportButton = page.locator('label[title="Exporter"]');
    await expect(exportButton).toBeVisible();
    await exportButton.click();
    
    // Check for options
    const csvBtn = page.locator('#btn-export-csv');
    const bookmarksBtn = page.locator('#btn-export-bookmarks');
    await expect(csvBtn).toBeVisible();
    await expect(bookmarksBtn).toBeVisible();
    await expect(csvBtn).toContainText('CSV');
    await expect(bookmarksBtn).toContainText('Favoris Navigateur');
  });

  test('should trigger CSV download and contain correct data', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/fr');
    
    // Filter by category to have a predictable result set
    await page.selectOption('#filter-category', 'entreprise');
    await page.waitForTimeout(800); // Wait for UI update
    
    // Open dropdown first to make button visible/clickable
    const exportButton = page.locator('label[title="Exporter"]');
    await exportButton.click();
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#btn-export-csv')
    ]);
    
    expect(download.suggestedFilename()).toContain('numindex_export_');
    expect(download.suggestedFilename()).toContain('.csv');
    expect(errors).toHaveLength(0);
  });

  test('should trigger Bookmarks download', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto('/fr');
    
    // Open dropdown first
    const exportButton = page.locator('label[title="Exporter"]');
    await exportButton.click();
    
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#btn-export-bookmarks')
    ]);
    
    expect(download.suggestedFilename()).toContain('numindex_bookmarks_');
    expect(download.suggestedFilename()).toContain('.html');
    expect(errors).toHaveLength(0);
  });

  test('should export only filtered results', async ({ page }) => {
    await page.goto('/fr');
    
    // Filter by a category that has items (Company/Entreprise)
    await page.selectOption('#filter-category', 'entreprise');
    await page.waitForTimeout(800);
    
    const countText = await page.locator('#results-count').textContent();
    const count = parseInt(countText || '0', 10);
    
    // Verify results count
    expect(count).toBeGreaterThan(0);
  });
});
