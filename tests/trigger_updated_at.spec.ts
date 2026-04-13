import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

test.describe('Trigger updated_at [TEST]', () => {
  test.setTimeout(60000);

  if (!supabaseUrl || !supabaseServiceKey) {
    test.skip('Supabase credentials missing', () => {});
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  test.beforeEach(async ({ page }) => {
    // Gérer les boîtes de dialogue de confirmation (Approuver / Rejeter)
    page.on('dialog', dialog => {
      console.log(`[TEST] Dialog appeared: ${dialog.message()}`);
      dialog.accept();
    });
  });

  test.afterAll(async () => {
    // Nettoyage systématique
    await supabase.from('resources').delete().like('title', '[TEST] %');
    await supabase.from('suggestions').delete().like('title', '[TEST] %');
  });

  test('service_role should NOT update updated_at on resources', async () => {
    // 1. Créer une ressource de test
    const { data: res, error: createError } = await supabase
      .from('resources')
      .insert({
        title: '[TEST] SR No Update',
        description: 'Initial description',
        category: 'outil',
        link: 'https://example.com/sr-no-update',
        tags: ['Logiciel']
      })
      .select()
      .single();

    expect(createError).toBeNull();
    const initialUpdatedAt = res.updated_at;

    // Attendre un peu pour que le timestamp puisse changer
    await new Promise(r => setTimeout(r, 1500));

    // 2. Mettre à jour via service_role
    const { data: updatedRes, error: updateError } = await supabase
      .from('resources')
      .update({ description: 'Updated via service role' })
      .eq('id', res.id)
      .select()
      .single();

    expect(updateError).toBeNull();
    
    // updated_at ne doit PAS avoir changé
    expect(updatedRes.updated_at).toBe(initialUpdatedAt);

    // Cleanup
    await supabase.from('resources').delete().eq('id', res.id);
  });

  test.describe('Authenticated Admin', () => {
    // On réutilise l'authentification de l'admin configurée dans auth.setup.ts
    test.use({ storageState: 'playwright/.auth/user.json' });

    test('admin approval should update updated_at on resources', async ({ page }) => {
      // 1. Créer une ressource et une suggestion de modification
      const { data: res } = await supabase
        .from('resources')
        .insert({
          title: '[TEST] Admin Update Resource',
          description: 'Initial description',
          category: 'outil',
          link: 'https://example.com/admin-update',
          tags: ['Logiciel']
        })
        .select()
        .single();
      
      const initialUpdatedAt = res.updated_at;

      // Attendre
      await new Promise(r => setTimeout(r, 1500));

      const { data: sug } = await supabase
        .from('suggestions')
        .insert({
          resource_id: res.id,
          title: '[TEST] Admin Update Resource',
          description: 'Updated description by admin suggestion',
          category: 'outil',
          link: 'https://example.com/admin-update',
          tags: ['Logiciel'],
          action: 'update',
          status: 'pending'
        })
        .select()
        .single();

      // 2. Aller sur l'admin et approuver
      await page.goto('/fr/admin');
      
      const card = page.locator(`.suggestion-card[data-id="${sug.id}"]`);
      await expect(card).toBeVisible({ timeout: 15000 });
      
      // Cliquer sur approuver (le dialogue de confirmation est géré globalement dans les tests)
      await card.locator('button').filter({ hasText: 'Approuver' }).click();
      
      // Attendre que la carte disparaisse
      await expect(card).not.toBeVisible({ timeout: 10000 });

      // 3. Vérifier que updated_at a BIEN changé
      const { data: finalRes } = await supabase
        .from('resources')
        .select()
        .eq('id', res.id)
        .single();
      
      const oldTime = new Date(initialUpdatedAt).getTime();
      const newTime = new Date(finalRes.updated_at).getTime();
      
      expect(newTime).toBeGreaterThan(oldTime);

      // Cleanup
      await supabase.from('resources').delete().eq('id', res.id);
    });
  });
});
