import { test, expect } from '@playwright/test';

test.describe('Formulaire de proposition - Limites de caractères', () => {
  test('vérifie la présence des attributs maxlength sur les champs du formulaire', async ({ page }) => {
    // Naviguer sur la page de proposition
    await page.goto('/fr/propose');

    // Vérifier les champs principaux
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toHaveAttribute('maxlength', '100');

    const descInput = page.locator('textarea[name="description"]');
    await expect(descInput).toHaveAttribute('maxlength', '1000');

    const linkInput = page.locator('input[name="link"]');
    await expect(linkInput).toHaveAttribute('maxlength', '2048');

    // Vérifier les champs métadonnées (présents dans le DOM même si cachés)
    const addressSearch = page.locator('input[id="address-search"]');
    await expect(addressSearch).toHaveAttribute('maxlength', '255');

    const relatedSearch = page.locator('input[id="related-search"]');
    await expect(relatedSearch).toHaveAttribute('maxlength', '100');

    // Pour tester le motif de suppression, il faut accéder à la vue de suppression
    // Mais le DOM le contient déjà (potentiellement caché)
    const reasonInput = page.locator('textarea[name="reason"]');
    await expect(reasonInput).toHaveAttribute('maxlength', '500');
  });
});
