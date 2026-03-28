import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://numindex.org',
  integrations: [tailwind(), sitemap()],
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile', // Optimizes images at build time, avoids sharp at runtime
    platformProxy: {
      enabled: true,
    },
  }),
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true
    }
  },
  redirects: {
    '/admin': '/fr/admin',
    '/propose': '/fr/propose',
  }
});
