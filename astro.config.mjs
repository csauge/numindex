import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://numindex.org',
  trailingSlash: 'never',
  build: {
    format: 'file'
  },
  integrations: [tailwind(), sitemap({
    filter: (page) => page !== 'https://numindex.org/',
    i18n: {
      defaultLocale: 'fr',
      locales: {
        fr: 'fr',
        en: 'en'
      }
    }
  })],
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile', // Optimizes images at build time, avoids sharp at runtime
    platformProxy: {
      enabled: true,
    },
  }),
  vite: {
    optimizeDeps: {
      include: ['browser-image-compression'],
    },
  },
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
