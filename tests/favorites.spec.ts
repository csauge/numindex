import { test, expect } from '@playwright/test';

test.describe('Favorites Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go to home page
    await page.goto('/fr');
    // Ensure we are logged in (wait for user info to appear)
    await expect(page.locator('#user-info')).toBeVisible({ timeout: 15000 });
  });

  test('should toggle favorite from home page', async ({ page }) => {
    // Locate the first resource card's favorite button
    const firstCard = page.locator('.resource-card').first();
    const favBtn = firstCard.locator('.btn-favorite');
    const starIcon = favBtn.locator('svg');
    const favCount = favBtn.locator('.fav-count');

    // Get initial count
    const initialCountText = await favCount.textContent();
    const initialCount = parseInt(initialCountText || '0');
    
    // Check if initially favorited (amber-500 class)
    const isInitiallyFav = await starIcon.evaluate(el => el.classList.contains('text-amber-500'));

    // Click to toggle
    await favBtn.click();
    
    // Check if count updated and icon color changed
    if (isInitiallyFav) {
      await expect(favCount).toHaveText((initialCount - 1).toString());
      await expect(starIcon).not.toHaveClass(/text-amber-500/);
    } else {
      await expect(favCount).toHaveText((initialCount + 1).toString());
      await expect(starIcon).toHaveClass(/text-amber-500/);
    }

    // Toggle back to restore state (optional but good for repeatability)
    await favBtn.click();
    await expect(favCount).toHaveText(initialCount.toString());
  });

  test('should toggle favorite from detail page', async ({ page }) => {
    // Click on the first resource to go to detail page
    const firstCardLink = page.locator('.resource-card').first();
    await firstCardLink.click();
    await page.waitForURL(/\/fr\/resource\//);

    const favBtn = page.locator('#btn-favorite-main');
    const starIcon = page.locator('#fav-star-main');
    const favCount = page.locator('#fav-count-main');

    // Get initial state
    const initialCountText = await favCount.textContent();
    const initialCount = parseInt(initialCountText || '0');
    const isInitiallyFav = await starIcon.evaluate(el => el.classList.contains('text-amber-500'));

    // Click to toggle
    await favBtn.click();

    // Check updates
    if (isInitiallyFav) {
      await expect(favCount).toHaveText((initialCount - 1).toString());
      await expect(starIcon).not.toHaveClass(/text-amber-500/);
    } else {
      await expect(favCount).toHaveText((initialCount + 1).toString());
      await expect(starIcon).toHaveClass(/text-amber-500/);
    }
  });

  test('should show favorites in profile page', async ({ page }) => {
    // Ensure at least one favorite exists
    await page.goto('/fr');
    const favBtn = page.locator('.btn-favorite').first();
    const starIcon = favBtn.locator('svg');
    const isFav = await starIcon.evaluate(el => el.classList.contains('text-amber-500'));
    
    let resourceTitle = '';
    if (!isFav) {
      resourceTitle = await page.locator('.resource-card h2').first().textContent() || '';
      await favBtn.click();
    } else {
      resourceTitle = await page.locator('.resource-card h2').first().textContent() || '';
    }

    // Go to profile
    await page.goto('/fr/profile');
    
    // Check if the resource is in the favorites list
    const favItem = page.locator('#favorites-list .favorite-item').filter({ hasText: resourceTitle });
    await expect(favItem).toBeVisible({ timeout: 10000 });

    // Test removing from profile
    const unfavBtn = favItem.locator('.btn-unfavorite');
    await unfavBtn.click();
    
    // Should disappear
    await expect(favItem).not.toBeVisible();
  });
});
