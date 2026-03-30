import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Image Preview', () => {
  test('should display a preview when an image is selected', async ({ page }) => {
    await page.goto('/fr/propose');

    // Create a dummy image file for testing
    const testImagePath = path.join(process.cwd(), 'test-image.png');
    // Simple 1x1 transparent PNG or just some data
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    fs.writeFileSync(testImagePath, Buffer.from(base64Image, 'base64'));

    try {
      // 1. Initially, no image preview
      const previewImgContainer = page.locator('#resource-preview-container');
      await expect(previewImgContainer).toBeVisible();
      // Initially it contains an SVG icon
      await expect(previewImgContainer.locator('svg')).toBeVisible();

      // 2. Select an image
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.locator('input[name="image"]').click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(testImagePath);

      // 3. Verify the preview contains an img tag now
      await expect(previewImgContainer.locator('img')).toBeVisible({ timeout: 5000 });
      
      // 4. Verify the src is a data URL
      const src = await previewImgContainer.locator('img').getAttribute('src');
      expect(src).toContain('data:image/png;base64');
    } finally {
      // Cleanup
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }
  });
});
