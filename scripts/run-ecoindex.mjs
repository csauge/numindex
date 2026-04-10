import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
  console.log('--- 🌿 Audit EcoIndex (via Playwright) ---');
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'] 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  let requestsCount = 0;
  let totalBytes = 0;

  page.on('request', request => {
    requestsCount++;
  });

  page.on('response', async response => {
    try {
      const headers = response.headers();
      const contentLength = headers['content-length'];
      if (contentLength) {
        totalBytes += parseInt(contentLength, 10);
      } else {
        // Fallback for transfer size if content-length is missing
        const securityDetails = await response.securityDetails();
        const serverAddr = await response.serverAddr();
        // Since we can't get exact body size easily without downloading, 
        // we'll use buffer size if content-length is missing
        const buffer = await response.body();
        totalBytes += buffer.length;
      }
    } catch (e) {
      // Ignore errors for some responses (like trackers/extensions)
    }
  });

  try {
    await page.goto('https://numindex.org/fr', { waitUntil: 'networkidle' });

    const domCount = await page.evaluate(() => document.querySelectorAll('*').length);
    const sizeKB = totalBytes / 1024;

    console.log(`📊 Métriques récoltées :`);
    console.log(`- DOM: ${domCount} éléments`);
    console.log(`- Requêtes: ${requestsCount}`);
    console.log(`- Poids: ${sizeKB.toFixed(1)} Ko`);

    // Formule simplifiée EcoIndex (basée sur les quantiles GreenIT)
    // On calcule le score de chaque métrique par rapport aux seuils (clamped 0-100)
    const computePart = (val, max) => Math.max(0, Math.min(100, 100 * (1 - val / max)));
    
    const scoreDom = computePart(domCount, 3000); // Seuil 3000 éléments
    const scoreRequests = computePart(requestsCount, 250); // Seuil 250 requêtes
    const scoreSize = computePart(sizeKB, 1000); // Seuil 1000 Ko (1 Mo)

    const ecoindex = Math.round((scoreDom + scoreRequests + scoreSize) / 3);

    const result = {
      ecoIndex: ecoindex,
      metrics: {
        dom: domCount,
        requests: requestsCount,
        size: sizeKB
      }
    };

    fs.writeFileSync('ecoindex-results.json', JSON.stringify(result, null, 2));
    console.log(`✅ EcoIndex calculé : ${ecoindex}/100`);

  } catch (err) {
    console.error('❌ Erreur lors de l\'audit Playwright :', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
