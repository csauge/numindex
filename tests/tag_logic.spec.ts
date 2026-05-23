import { test, expect } from '@playwright/test';

test.describe('Tag Logic [TEST]', () => {
  test('Mesure tag visibility', async ({ page }) => {
    await page.goto('/fr/propose');
    
    // Select Outil
    await page.selectOption('select[name="category"]', 'outil');
    
    // Select something other than Logiciel
    await page.selectOption('select[name="mandatory-tag"]', 'Guide');
    await expect(page.locator('#optional-tags-list button:has-text("Mesure")')).not.toBeVisible();
    
    // Select Logiciel
    await page.selectOption('select[name="mandatory-tag"]', 'Logiciel');
    await expect(page.locator('#optional-tags-list button:has-text("Mesure")')).toBeVisible();
    
    // Select something else again
    await page.selectOption('select[name="mandatory-tag"]', 'Loi');
    await expect(page.locator('#optional-tags-list button:has-text("Mesure")')).not.toBeVisible();
  });

  test('New tags visibility for Acteur', async ({ page }) => {
    await page.goto('/fr/propose');
    await page.selectOption('select[name="category"]', 'acteur');
    
    await expect(page.locator('#optional-tags-list button:has-text("Matériel")')).toBeVisible();
    await expect(page.locator('#optional-tags-list button:has-text("Hébergement")')).toBeVisible();
    await expect(page.locator('#optional-tags-list button:has-text("Service")')).toBeVisible();
  });
});
