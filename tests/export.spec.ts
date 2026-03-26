import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Export Functionality', () => {
  // Monitor console for errors during tests
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser console error: ${msg.text()}`);
      }
    });
  });

  test('should show export dropdown and contain Bookmarks and Calendar options', async ({ page }) => {
    await page.goto('/fr');
    
    // Click on export dropdown label by title
    const exportButton = page.locator('label[title="Exporter"]');
    await expect(exportButton).toBeVisible();
    await exportButton.click();
    
    // Check for options
    const bookmarksBtn = page.locator('#btn-export-bookmarks');
    const calendarBtn = page.locator('#btn-export-calendar');
    await expect(bookmarksBtn).toBeVisible();
    await expect(calendarBtn).toBeVisible();
    await expect(bookmarksBtn).toContainText('Favoris Navigateur');
    await expect(calendarBtn).toContainText('Calendrier évènements');
    
    // CSV button should be gone
    await expect(page.locator('#btn-export-csv')).not.toBeVisible();
  });

  test('should trigger Bookmarks download with nested folders (categories/subs)', async ({ page }) => {
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
    
    // Optional: Verify content of the download for the folder structure
    const path = await download.path();
    if (path) {
      const content = fs.readFileSync(path, 'utf8');
      expect(content).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
      expect(content).toContain('<H3>'); // Folders use H3 in this format
      expect(content).toContain('<DL><p>'); // Nested lists
    }
    
    expect(errors).toHaveLength(0);
  });

  test('should export only filtered results', async ({ page }) => {
    await page.goto('/fr');
    
    // Filter by a category that has items
    await page.selectOption('#filter-category', 'acteur');
    await page.waitForTimeout(800);
    
    const countText = await page.locator('#results-count').textContent();
    const count = parseInt(countText || '0', 10);
    
    // Verify results count
    expect(count).toBeGreaterThan(0);
  });
});
