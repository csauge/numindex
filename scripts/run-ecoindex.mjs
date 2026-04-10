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

    // --- Formule Officielle EcoIndex ---
    // Les coefficients basés sur les quantiles du Web Almanac
    const computeQuantile = (val, coefficients) => {
      const { a, b, c, d } = coefficients;
      // Formule logistique : 1 / (1 + exp(a * (val + b))) * c + d (simplifiée ici)
      // On utilise une approche par paliers (plus robuste pour un script simple)
      // car les coefficients exacts changent par année.
      // Référence simplifiée GreenIT :
      return val; 
    };

    // Calcul des rangs (plus on est bas, mieux c'est)
    // Basé sur les seuils de distribution (approximatifs pour 2024-2025)
    const getRank = (val, thresholds) => {
      for (let i = 0; i < thresholds.length; i++) {
        if (val <= thresholds[i]) return i + 1;
      }
      return thresholds.length + 1;
    };

    const thresholdsDom = [100, 250, 500, 1000, 2000, 3000];
    const thresholdsReq = [10, 30, 50, 70, 100, 150];
    const thresholdsSize = [50, 150, 300, 500, 1000, 2000]; // en Ko

    const rankDom = getRank(domCount, thresholdsDom);
    const rankReq = getRank(requestsCount, thresholdsReq);
    const rankSize = getRank(sizeKB, thresholdsSize);

    // Score final = 100 - ( ( (rank_dom) + (rank_req * 2) + (rank_size * 3) ) / 6 * 100 / 7 )
    // Mais plus simplement : 100 - (rank_total - 6) * certain_facteur
    // Voici la version pondérée standard :
    const totalRank = (rankDom + 2 * rankReq + 3 * rankSize);
    const ecoindex = Math.round(100 - (totalRank - 6) * (100 / 30)); 

    const result = {
      ecoIndex: Math.max(0, Math.min(100, ecoindex)),
      metrics: {
        dom: domCount,
        requests: requestsCount,
        size: Math.round(sizeKB)
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
