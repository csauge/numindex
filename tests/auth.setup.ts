import { test as setup, expect } from '@playwright/test';
import { execSync } from 'child_process';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  setup.setTimeout(60000);

  // 1. Cleanup database before starting
  try {
    // Supprimer les suggestions
    execSync('npx supabase db query "DELETE FROM public.suggestions;"');
    // Supprimer les utilisateurs de test (en préservant vos emails personnels et en nettoyant les autres)
    execSync('npx supabase db query "DELETE FROM auth.users WHERE email NOT LIKE \'csauge%@gmail.com\' AND (email LIKE \'%@example.com\' OR email LIKE \'%@test.org\' OR email LIKE \'%test%\' OR email = \'admin@numindex.org\');"');
  } catch (e) {
  }
  
  const email = process.env.TEST_USER_EMAIL || 'admin@numindex.org';
  const password = process.env.TEST_USER_PASSWORD || 'password123';

  await page.goto('/fr/login');
  // ... rest of the logic
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for login or error
  try {
    const success = await Promise.race([
      page.waitForURL(/\/fr\/?$/, { timeout: 10000 }).then(() => true),
      page.waitForSelector('#error-message:visible', { timeout: 10000 }).then(() => false)
    ]);
    
    if (!success) {
      // Try unique email for registration to avoid conflicts
      const uniqueEmail = `test-${Date.now()}@example.com`;
      await page.goto('/fr/register');
      await page.fill('input[name="full_name"]', 'Test User');
      await page.fill('input[name="email"]', uniqueEmail);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      
      // After registration, it might redirect to /fr (auto-login) or /fr/login
      await Promise.race([
        page.waitForURL(/\/fr\/?$/, { timeout: 15000 }),
        page.waitForURL(/\/fr\/login/, { timeout: 15000 })
      ]);

      if (page.url().includes('/login')) {
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/fr\/?$/);
      }

      // 2. Force ADMIN role for this user
      execSync(`npx supabase db query "UPDATE public.profiles SET role = 'admin' WHERE id IN (SELECT id FROM auth.users WHERE email = '${uniqueEmail}');"`);
    }
  } catch (e) {
    throw e;
  }

  // Wait a bit for the async auth script to finish
  await expect(page.locator('#user-info')).toBeVisible({ timeout: 15000 });

  await page.context().storageState({ path: authFile });
});
