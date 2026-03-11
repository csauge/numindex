import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  setup.setTimeout(60000);
  
  const email = process.env.TEST_USER_EMAIL || 'admin@numindex.org';
  const password = process.env.TEST_USER_PASSWORD || 'password123';

  console.log(`[Auth Setup] Attempting login for ${email}`);
  
  await page.goto('/fr/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for login or error
  try {
    await Promise.race([
      page.waitForURL(/\/fr\/?$/, { timeout: 15000 }),
      page.waitForSelector('#error-message:visible', { timeout: 15000 })
    ]);
    
    const errorVisible = await page.locator('#error-message').isVisible();
    if (errorVisible) {
      const errorText = await page.textContent('#error-message');
      console.error(`[Auth Setup] Login failed with error: ${errorText}`);
      throw new Error(`Login failed: ${errorText}`);
    }
  } catch (e) {
    console.log('[Auth Setup] Login failed or timed out, attempting registration...');
    await page.goto('/fr/register');
    await page.fill('input[name="full_name"]', 'Admin Test');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    // Check for registration error too
    try {
      await page.waitForURL(/\/fr\/login/, { timeout: 10000 });
    } catch (regErr) {
      const regErrorVisible = await page.locator('#error-message').isVisible();
      if (regErrorVisible) {
        const regErrorText = await page.textContent('#error-message');
        console.error(`[Auth Setup] Registration failed with error: ${regErrorText}`);
        // If user already exists, we might still be able to login if it was just a timeout
        if (regErrorText?.includes('déjà inscrit') || regErrorText?.includes('already registered')) {
          console.log('[Auth Setup] User already registered, trying login one more time...');
        } else {
          throw regErr;
        }
      } else {
        throw regErr;
      }
    }
    
    await page.goto('/fr/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/fr\/?$/);
  }

  console.log('[Auth Setup] Verifying UI elements...');
  // Wait a bit for the async auth script to finish
  await expect(page.locator('#user-info')).toBeVisible({ timeout: 15000 });

  console.log('[Auth Setup] Saving session state');
  await page.context().storageState({ path: authFile });
});
