import { test, expect } from '@playwright/test';

test.describe('numindex.org Map Page', () => {
  
  test('should navigate to map page from home', async ({ page }) => {
    await page.goto('/fr');
    
    // Find the map button in FilterBar (using title or svg)
    const mapLink = page.locator('a[title="Vue Carte"]');
    await expect(mapLink).toBeVisible();
    await mapLink.click();
    
    await expect(page).toHaveURL(/\/fr\/carte\/?$/);
    const title = page.locator('header h1').first();
    await expect(title).toContainText("Carte de l'index");
  });

  test('should activate the map automatically on dedicated page', async ({ page }) => {
    await page.goto('/fr/carte');
    
    // Placeholder should be hidden eventually due to autoActivate
    const placeholder = page.locator('#map-placeholder');
    await expect(placeholder).toBeHidden();
    
    // Check for Leaflet container eventually
    const mapContainer = page.locator('#map');
    
    // Wait for the map to be initialized (opacity-100)
    await expect(mapContainer).toHaveClass(/opacity-100/);
    
    // Check if Leaflet CSS/JS are added
    const leafletCSS = page.locator('link#leaflet-css');
    await expect(leafletCSS).toHaveAttribute('rel', 'stylesheet');
  });

  test('should switch language on the map page', async ({ page }) => {
    await page.goto('/fr/carte');
    
    // Click language toggle
    await page.click('label.swap:has(#lang-toggle)');
    
    await expect(page).toHaveURL(/\/en\/carte\/?$/);
    const title = page.locator('header h1').first();
    await expect(title).toContainText("Index Map");
  });
});
