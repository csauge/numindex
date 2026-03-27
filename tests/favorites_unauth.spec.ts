import { test, expect } from '@playwright/test';

// Use a new context without storage state to simulate unauthenticated user
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Favorites Functionality (Unauthenticated)', () => {
  
  test('should redirect to login when clicking star on home page', async ({ page }) => {
    await page.goto('/fr');
    
    // Wait for resources to load
    const firstCard = page.locator('.resource-card').first();
    await expect(firstCard).toBeVisible();
    
    const favBtn = firstCard.locator('.btn-favorite');
    await favBtn.click();
    
    // Should be redirected to login with redirect param
    await expect(page).toHaveURL(/\/fr\/login\?redirect=%2Ffr/);
  });

  test('should redirect to login when clicking star on detail page', async ({ page }) => {
    await page.goto('/fr');
    const firstCardLink = page.locator('.resource-card').first();
    const resourceId = await firstCardLink.evaluate(el => {
        const href = el.getAttribute('href');
        return href?.split('/').pop();
    });
    
    await firstCardLink.click();
    await page.waitForURL(/\/fr\/resource\//);
    
    const favBtn = page.locator('#btn-favorite-main');
    await favBtn.click();
    
    // Should be redirected to login with redirect param
    await expect(page).toHaveURL(new RegExp(`/fr/login\\?redirect=%2Ffr%2Fresource%2F${resourceId}`));
  });
});
