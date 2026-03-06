import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const MAX_SIZE_KB = 50;
const ALLOWED_FORMAT = '.avif';
const DIRECTORIES = ['public'];

async function checkImages(dir) {
  let issues = 0;
  const files = await readdir(dir, { recursive: true });

  for (const file of files) {
    const filePath = path.join(dir, file);
    const s = await stat(filePath);
    
    if (s.isDirectory()) continue;

    const ext = path.extname(file).toLowerCase();
    const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'].includes(ext);

    if (isImage) {
      const sizeKB = s.size / 1024;
      
      // Check format
      if (ext !== ALLOWED_FORMAT && ext !== '.svg') {
        console.warn(`⚠️  [Format] ${file} est en ${ext} (Attendu: ${ALLOWED_FORMAT} ou .svg)`);
        issues++;
      }

      // Check size
      if (sizeKB > MAX_SIZE_KB && ext !== '.svg') {
        console.warn(`⚠️  [Poids] ${file} fait ${sizeKB.toFixed(1)} Ko (Limite: ${MAX_SIZE_KB} Ko)`);
        issues++;
      }
    }
  }
  return issues;
}

console.log('--- 🌿 Audit de Sobriété Numérique ---');
const totalIssues = await checkImages('public');

if (totalIssues > 0) {
  console.log(`\n❌ ${totalIssues} alerte(s) de sobriété détectée(s).`);
} else {
  console.log('✅ Sobriété respectée !');
}
