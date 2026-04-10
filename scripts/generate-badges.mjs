import fs from 'fs';
import path from 'path';

const LH_RESULTS_DIR = '.lighthouseci';
const PUBLIC_DIR = 'public';

function getGrade(ecoindex) {
  if (ecoindex >= 80) return { label: 'A', color: '#1a5e1a' };
  if (ecoindex >= 70) return { label: 'B', color: '#33cc33' };
  if (ecoindex >= 55) return { label: 'C', color: '#ffff00', textColor: '#000' };
  if (ecoindex >= 40) return { label: 'D', color: '#ffcc00', textColor: '#000' };
  if (ecoindex >= 25) return { label: 'E', color: '#ff9900' };
  if (ecoindex >= 10) return { label: 'F', color: '#ff6600' };
  return { label: 'G', color: '#ff0000' };
}

function getPerfColor(score) {
  if (score >= 90) return '#1a5e1a';
  if (score >= 50) return '#ffcc00';
  return '#ff0000';
}

function generateBadgeSVG(label, value, color, textColor = '#fff') {
  const labelWidth = 85;
  const valueWidth = 35;
  const totalWidth = labelWidth + valueWidth;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth/2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth/2}" y="14" fill="${textColor}">${value}</text>
  </g>
</svg>`;
}

async function run() {
  if (!fs.existsSync(LH_RESULTS_DIR)) {
    console.error('❌ Dossier .lighthouseci introuvable. Lancer LHCI avant ce script.');
    process.exit(1);
  }

  const files = fs.readdirSync(LH_RESULTS_DIR).filter(f => f.startsWith('lhr-') && f.endsWith('.json'));
  if (files.length === 0) {
    console.error('❌ Aucun rapport Lighthouse trouvé.');
    process.exit(1);
  }

  // On prend le dernier rapport (ou on pourrait moyenner)
  const reportPath = path.join(LH_RESULTS_DIR, files[files.length - 1]);
  const lhr = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

  // Extraction scores
  const perfScore = Math.round((lhr.categories?.performance?.score || 0) * 100);
  const ecoindexScore = Math.round((lhr.categories?.ecoindex?.score || lhr.audits?.['ecoindex']?.score || 0) * 100);
  
  const ecoGrade = getGrade(ecoindexScore);
  const perfColor = getPerfColor(perfScore);

  console.log(`📊 Résultats audit :`);
  console.log(`- Performance: ${perfScore}%`);
  console.log(`- EcoIndex: ${ecoindexScore}/100 (Grade ${ecoGrade.label})`);

  // Sauvegarde des badges
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);
  
  fs.writeFileSync(path.join(PUBLIC_DIR, 'badge-performance.svg'), generateBadgeSVG('Lighthouse Performance', `${perfScore}%`, perfColor));
  fs.writeFileSync(path.join(PUBLIC_DIR, 'badge-ecoindex.svg'), generateBadgeSVG('EcoIndex', ecoGrade.label, ecoGrade.color, ecoGrade.textColor || '#fff'));

  console.log('✅ Badges SVG générés dans le dossier public/.');
}

run();
