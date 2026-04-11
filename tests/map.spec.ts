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
    await expect(title).toContainText("Carte des acteurs et événements");
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
    await expect(title).toContainText("Actors and Events Map");
  });

  test('should filter by category and sub-category', async ({ page }) => {
    await page.goto('/fr/carte');

    // Wait for the map and filters to load
    const categoryContainer = page.locator('#category-filters-container');
    await expect(categoryContainer).toBeVisible();

    // Check "Événements" button
    const eventBtn = categoryContainer.locator('button', { hasText: 'Événements' });
    await expect(eventBtn).toBeVisible();
    await eventBtn.click();

    // Check if sub-filters updated (e.g., "Salon" should appear for events)
    const subContainer = page.locator('#sub-filters-container');
    await expect(subContainer.locator('button', { hasText: 'Salon' })).toBeVisible();

    // Select "Salon" sub-filter
    const salonBtn = subContainer.locator('button', { hasText: 'Salon' });
    await salonBtn.click();
    await expect(salonBtn).toHaveClass(/active/);

    // Switch to "Acteurs"
    const actorBtn = categoryContainer.locator('button', { hasText: 'Acteurs' });
    await actorBtn.click();

    // Sub-filters should change (e.g., "Association" should appear)
    await expect(subContainer.locator('button', { hasText: 'Association' })).toBeVisible();
    // "Salon" should no longer be visible as a sub-filter for Acteurs
    await expect(subContainer.locator('button', { hasText: 'Salon' })).toBeHidden();
  });

  test.describe('Geolocation', () => {
    test.beforeEach(async ({ context }) => {
      // Grant geolocation permission for the context
      await context.grantPermissions(['geolocation']);
      // Mock the geolocation position (Paris)
      await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });
    });

    test('should show locate me button and center on user when clicked', async ({ page }) => {
      await page.goto('/fr/carte');
      
      const locateBtn = page.locator('#locate-me');
      
      // Wait for map to be initialized and button to be visible
      await expect(locateBtn).toBeVisible();
      
      // Click on locate me
      await locateBtn.click();
      
      // Check if user marker is added (blue pulse dot)
      const userMarker = page.locator('.user-marker');
      await expect(userMarker).toBeVisible();
      
      // We can't easily check the map view center coordinates via Playwright easily 
      // without exposing internal L.map but seeing the marker is a good sign
    });

    test('should handle geolocation error/refusal', async ({ page, context }) => {
      // Deny permissions for this specific test
      await context.clearPermissions();
      
      await page.goto('/fr/carte');
      
      const locateBtn = page.locator('#locate-me');
      await expect(locateBtn).toBeVisible();

      // Mock alert() since geolocation will fail or prompt (which we won't answer)
      let alertMessage = '';
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        await dialog.dismiss();
      });

      await locateBtn.click();
      
      // Wait for the alert to be triggered (it might take a moment if the browser times out or refuses)
      // Note: In some headless environments, it might fail instantly if no provider is available
      await expect.poll(() => alertMessage).not.toBe('');
      expect(alertMessage).toMatch(/Impossible de vous localiser|Unable to locate you/);
    });
  });
});
