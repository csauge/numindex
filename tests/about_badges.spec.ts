import { test, expect } from '@playwright/test';

test.describe('Badges and Sobriety [TEST]', () => {
  test('EcoIndex badge should be present in the footer', async ({ page }) => {
    await page.goto('/fr');
    const footerBadge = page.locator('footer img[src="/badge-ecoindex.svg"]');
    await expect(footerBadge).toBeVisible();
    await expect(footerBadge).toHaveAttribute('alt', 'EcoIndex Score');
  });

  test('All badges should be present on the French About page', async ({ page }) => {
    await page.goto('/fr/about');
    
    const badges = [
      { src: '/badge-ecoindex.svg', alt: 'Score EcoIndex' },
      { src: '/badge-performance.svg', alt: 'Lighthouse Performance' },
      { src: '/badge-accessibility.svg', alt: 'Lighthouse Accessibilité' },
      { src: '/badge-best-practices.svg', alt: 'Lighthouse Bonnes Pratiques' },
      { src: '/badge-seo.svg', alt: 'Lighthouse SEO' }
    ];

    const content = page.locator('main');
    for (const badge of badges) {
      const locator = content.locator(`img[src="${badge.src}"]`);
      await expect(locator).toBeVisible();
      await expect(locator).toHaveAttribute('alt', badge.alt);
    }
  });

  test('All badges should be present on the English About page', async ({ page }) => {
    await page.goto('/en/about');
    
    const badges = [
      { src: '/badge-ecoindex.svg', alt: 'EcoIndex Score' },
      { src: '/badge-performance.svg', alt: 'Lighthouse Performance' },
      { src: '/badge-accessibility.svg', alt: 'Lighthouse Accessibility' },
      { src: '/badge-best-practices.svg', alt: 'Lighthouse Best Practices' },
      { src: '/badge-seo.svg', alt: 'Lighthouse SEO' }
    ];

    const content = page.locator('main');
    for (const badge of badges) {
      const locator = content.locator(`img[src="${badge.src}"]`);
      await expect(locator).toBeVisible();
      await expect(locator).toHaveAttribute('alt', badge.alt);
    }
  });
});
