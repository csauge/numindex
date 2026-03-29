import fs from 'fs';
import path from 'path';

const routesPath = path.resolve('dist/_routes.json');

if (!fs.existsSync(routesPath)) {
  console.error('❌ _routes.json not found in dist/');
  process.exit(1);
}

try {
  const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
  
  // Les sitemaps à exclure explicitement
  const sitemaps = [
    '/sitemap.xml',
    '/sitemap-index.xml',
    '/sitemap-0.xml'
  ];

  // Nettoyage : retirer les null et ajouter les sitemaps s'ils n'y sont pas
  const currentExcludes = (routes.exclude || []).filter(item => item !== null);
  
  sitemaps.forEach(s => {
    if (!currentExcludes.includes(s)) {
      currentExcludes.push(s);
    }
  });

  routes.exclude = currentExcludes;

  fs.writeFileSync(routesPath, JSON.stringify(routes, null, 2));
  console.log('✅ _routes.json fixed with sitemap exclusions.');
} catch (err) {
  console.error('❌ Failed to process _routes.json:', err);
  process.exit(1);
}
