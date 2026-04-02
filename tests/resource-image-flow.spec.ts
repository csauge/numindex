import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

test.describe('Resource Image Flow [TEST]', () => {
  test.afterEach(async () => {
    try {
      execSync(`npx supabase db query "DELETE FROM public.resources WHERE title LIKE '[TEST] %';"`);
      execSync(`npx supabase db query "DELETE FROM public.suggestions WHERE title LIKE '[TEST] %';"`);
    } catch (e) {}
  });

  test('Should display resource image in grid after approval', async ({ page }) => {
    // Mock confirm
    await page.addInitScript(() => {
      window.confirm = () => true;
    });
    // 1. Setup a test image
    const testImagePath = path.join(process.cwd(), 'test-image.png');
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    fs.writeFileSync(testImagePath, Buffer.from(base64Image, 'base64'));

    try {
      const resourceTitle = `[TEST] Image Resource ${Math.floor(Math.random() * 10000)}`;

      // 2. Proposer une ressource avec image
      await page.goto('/fr/propose');
      await page.fill('input[name="title"]', resourceTitle);
      await page.fill('textarea[name="description"]', 'Description image test');
      await page.selectOption('select[name="category"]', 'contenu');
      await page.selectOption('select[name="mandatory-tag"]', 'Article');
      await page.fill('input[name="link"]', 'https://image.test');
      
      // Upload image
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.locator('input[name="image"]').click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(testImagePath);
      
      // Wait for preview to confirm upload is ready
      await expect(page.locator('#resource-preview-container img')).toBeVisible();

      await page.click('#submit-btn');
      await page.waitForURL(/\/fr\/?$/);

      // 3. Modérer la ressource (Approuver)
      await page.goto('/fr/admin');
      const suggestionCard = page.locator('.suggestion-card').filter({ hasText: resourceTitle });
      await expect(suggestionCard).toBeVisible();
      
      // Verify image is visible in admin
      await expect(suggestionCard.locator('img')).toBeVisible();
      
      await suggestionCard.locator('.approve-btn').click();
      await expect(suggestionCard).not.toBeVisible();

      // 4. Vérifier dans la grille (Accueil)
      await page.goto('/fr');
      const resourceCard = page.locator('.resource-card').filter({ hasText: resourceTitle });
      await expect(resourceCard).toBeVisible();
      
      const gridImg = resourceCard.locator('img');
      await expect(gridImg).toBeVisible({ timeout: 10000 });
      
      // Wait for image to load
      await gridImg.evaluate(async (img: HTMLImageElement) => {
        if (img.complete && img.naturalWidth > 0) return;
        return new Promise((resolve, reject) => {
          img.onload = () => resolve(true);
          img.onerror = () => reject(new Error('Image failed to load'));
          // In case it's already loaded but naturalWidth is 0 (broken)
          if (img.complete && img.naturalWidth === 0) reject(new Error('Image broken'));
        });
      });

      const isLoaded = await gridImg.evaluate((img: HTMLImageElement) => img.naturalWidth > 0);
      expect(isLoaded).toBeTruthy();

      // 5. Vérifier dans le détail
      await resourceCard.click();
      await page.waitForURL(/\/fr\/resource\//);
      const detailImg = page.locator('img[alt=""]'); 
      await expect(detailImg).toBeVisible();
      
      const isDetailLoaded = await detailImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
      expect(isDetailLoaded).toBeTruthy();

    } finally {
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }
  });
});
