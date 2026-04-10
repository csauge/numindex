import { chromium } from 'playwright';
import fs from 'fs';
import { computeEcoIndex } from 'ecoindex';

async function run() {
  console.log('--- 🌿 Audit EcoIndex Officiel (via Playwright) ---');
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
        // C'est le poids de transfert (compressé) s'il y a un header Content-Length
        totalBytes += parseInt(contentLength, 10);
      } else {
        // Fallback approximatif pour la compression (en général Brotli/Gzip gagne ~60% sur texte)
        const buffer = await response.body();
        totalBytes += buffer.length * 0.45; // Simule une compression moyenne de 55%
      }
    } catch (e) {
      // Ignorer les erreurs pour les requêtes secondaires
    }
  });

  try {
    await page.goto('https://numindex.org/fr', { waitUntil: 'networkidle' });

    const domCount = await page.evaluate(() => document.querySelectorAll('*').length);
    
    // Le poids final en Mo (pour l'EcoIndex officiel)
    const sizeMB = totalBytes / (1024 * 1024);

    console.log(`📊 Métriques récoltées :`);
    console.log(`- DOM: ${domCount} éléments`);
    console.log(`- Requêtes: ${requestsCount}`);
    console.log(`- Poids estimé (transfert): ${(sizeMB * 1024).toFixed(1)} Ko`);

    // --- Calcul via l'algorithme OFFICIEL (EcoIndex v1) ---
    // Le package ecoindex prend (dom, requêtes, taille_mo)
    const ecoindexScore = computeEcoIndex(domCount, requestsCount, sizeMB);

    const result = {
      ecoIndex: Math.round(ecoindexScore),
      metrics: {
        dom: domCount,
        requests: requestsCount,
        size: Math.round(sizeMB * 1024)
      }
    };

    fs.writeFileSync('ecoindex-results.json', JSON.stringify(result, null, 2));
    console.log(`✅ EcoIndex officiel calculé : ${result.ecoIndex}/100`);

  } catch (err) {
    console.error('❌ Erreur lors de l\'audit :', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
