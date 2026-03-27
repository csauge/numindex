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

  test('should display the "Activate map" placeholder', async ({ page }) => {
    await page.goto('/fr/carte');
    
    const activateBtn = page.locator('#activate-map');
    await expect(activateBtn).toBeVisible();
    await expect(activateBtn).toContainText("Activer la carte interactive");
    
    const placeholder = page.locator('#map-placeholder');
    await expect(placeholder).toBeVisible();
  });

  test('should activate the map on click', async ({ page }) => {
    await page.goto('/fr/carte');
    
    const activateBtn = page.locator('#activate-map');
    await activateBtn.click();
    
    // Check for Leaflet container eventually
    const mapContainer = page.locator('#map');
    
    // Wait for the map to be initialized (opacity-0 removed)
    await expect(mapContainer).not.toHaveClass(/opacity-0/);
    
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
    
    const activateBtn = page.locator('#activate-map');
    await expect(activateBtn).toContainText("Activate interactive map");
  });
});
