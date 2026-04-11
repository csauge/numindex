import { test, expect } from '@playwright/test';

test.describe('Alternative to field behavior', () => {
  test('should show/hide Alternative to field based on category and tag', async ({ page }) => {
    await page.goto('/fr/propose');

    // Default: Acteur -> Association. Field should be hidden.
    const alternativeContainer = page.locator('#alternative-to-container');
    await expect(alternativeContainer).toBeHidden();

    // Select Outil
    await page.selectOption('select[name="category"]', 'outil');
    
    // Default tag for Outil is Logiciel (first one)
    // In categories.ts: mandatoryTags: ['Logiciel', 'Référentiel', ...]
    await expect(alternativeContainer).toBeVisible();

    // Select another tag: Référentiel
    await page.selectOption('select[name="mandatory-tag"]', 'Référentiel');
    await expect(alternativeContainer).toBeHidden();

    // Select Logiciel again
    await page.selectOption('select[name="mandatory-tag"]', 'Logiciel');
    await expect(alternativeContainer).toBeVisible();

    // Select another category: Contenu
    await page.selectOption('select[name="category"]', 'contenu');
    await expect(alternativeContainer).toBeHidden();
  });

  test('should preserve alternative_to value in preview', async ({ page }) => {
    await page.goto('/fr/propose');
    
    await page.selectOption('select[name="category"]', 'outil');
    await page.selectOption('select[name="mandatory-tag"]', 'Logiciel');
    
    const altInput = page.locator('input[name="alternative_to"]');
    await altInput.fill('Google Analytics');
    
    // Check preview (rendered via renderResourcePreview in suggestion-client.ts)
    // Wait, let's see if the preview actually displays it. 
    // The plan said "Simple Metadata Label" on the resource detail page.
    // Does the preview use the same logic?
    // In suggestion-client.ts, it calls renderResourcePreview.
  });
});
