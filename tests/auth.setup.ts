import { test as setup, expect } from '@playwright/test';
import { execSync } from 'child_process';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page, browser }) => {
  setup.setTimeout(60000);

  // 1. Cleanup database before starting
  try {
    // Supprimer dans l'ordre pour respecter les FK
    execSync('npx supabase db query "DELETE FROM public.favorites WHERE resource_id IN (SELECT id FROM public.resources WHERE title LIKE \'[TEST]%\');"');
    execSync('npx supabase db query "DELETE FROM public.suggestions WHERE title LIKE \'[TEST]%\';"');
    
    // Pour les resources, on veut aussi nettoyer les liens vers les users qu'on va supprimer
    const usersToDeleteQuery = "SELECT id FROM auth.users WHERE email NOT LIKE 'csauge%@gmail.com' AND (email LIKE '%@example.com' OR email LIKE '%@test.org' OR email LIKE '%test%' OR email = 'admin@numindex.org')";
    execSync(`npx supabase db query "UPDATE public.resources SET created_by = NULL, updated_by = NULL WHERE created_by IN (${usersToDeleteQuery}) OR updated_by IN (${usersToDeleteQuery});"`);
    
    execSync('npx supabase db query "DELETE FROM public.resources WHERE title LIKE \'[TEST]%\';"');
    
    // Supprimer les utilisateurs de test
    execSync(`npx supabase db query "DELETE FROM auth.users WHERE email NOT LIKE 'csauge%@gmail.com' AND (email LIKE '%@example.com' OR email LIKE '%@test.org' OR email LIKE '%test%' OR email = 'admin@numindex.org');"`);
    
    // S'assurer qu'on a des données de base pour les tests (Export, Filters, etc.)
    console.log("Restoring base test data...");
    execSync('node scripts/ensure-test-data.mjs');
  } catch (e) {
    console.error("Cleanup error:", e);
  }
  
  const password = process.env.TEST_USER_PASSWORD || 'password123';

  // --- Admin 1 ---
  const uniqueEmail1 = `test-admin1-${Date.now()}@example.com`;
  await page.goto('/fr/register');
  await page.fill('input[name="full_name"]', 'Test Admin 1');
  await page.fill('input[name="email"]', uniqueEmail1);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // With email confirmation enabled, it stays on the register page showing the message
  await expect(page.locator('#check-email-message')).toBeVisible({ timeout: 15000 });

  // Manually confirm the user and force ADMIN role
  execSync(`npx supabase db query "UPDATE auth.users SET email_confirmed_at = now(), last_sign_in_at = now() WHERE email = '${uniqueEmail1}';"`);
  execSync(`npx supabase db query "UPDATE public.profiles SET role = 'admin' WHERE id IN (SELECT id FROM auth.users WHERE email = '${uniqueEmail1}');"`);

  // Go to login and sign in
  await page.goto('/fr/login');
  await page.fill('input[name="email"]', uniqueEmail1);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/fr\/?$/);
  
  // Wait a bit for the async auth script to finish
  await expect(page.locator('#user-info')).toBeVisible({ timeout: 15000 });
  await page.context().storageState({ path: authFile });

  // --- Admin 2 ---
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  const uniqueEmail2 = `test-admin2-${Date.now()}@example.com`;
  
  await page2.goto('/fr/register');
  await page2.fill('input[name="full_name"]', 'Test Admin 2');
  await page2.fill('input[name="email"]', uniqueEmail2);
  await page2.fill('input[name="password"]', password);
  await page2.click('button[type="submit"]');
  
  // With email confirmation enabled, it stays on the register page showing the message
  await expect(page2.locator('#check-email-message')).toBeVisible({ timeout: 15000 });

  // Manually confirm the user and force ADMIN role
  execSync(`npx supabase db query "UPDATE auth.users SET email_confirmed_at = now(), last_sign_in_at = now() WHERE email = '${uniqueEmail2}';"`);
  execSync(`npx supabase db query "UPDATE public.profiles SET role = 'admin' WHERE id IN (SELECT id FROM auth.users WHERE email = '${uniqueEmail2}');"`);

  // Go to login and sign in
  await page2.goto('/fr/login');
  await page2.fill('input[name="email"]', uniqueEmail2);
  await page2.fill('input[name="password"]', password);
  await page2.click('button[type="submit"]');
  await page2.waitForURL(/\/fr\/?$/);
  
  // Wait a bit for the async auth script to finish
  await expect(page2.locator('#user-info')).toBeVisible({ timeout: 15000 });
  await page2.context().storageState({ path: 'playwright/.auth/user2.json' });

  await context2.close();
});
