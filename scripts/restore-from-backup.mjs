import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Script de restauration de sauvegarde (Disaster Recovery)
 * Ce script permet de restaurer un projet Supabase complet à partir de Cloudflare R2.
 */

const DB_URL = process.argv[2];

if (!DB_URL) {
  console.error('❌ Erreur: L\'URL de la base de données de destination est requise.');
  process.exit(1);
}

const TEMP_DIR = resolve('.temp/recovery');
const SQL_FILE = resolve(TEMP_DIR, 'latest_backup.sql');

console.log('🌿 Initialisation du processus de restauration...');

if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
}

try {
  // 1. Récupérer et décompresser le dernier backup
  console.log('📦 Récupération du dernier backup depuis R2...');
  execSync('rclone copy r2:numindex-backups/database/ .temp/recovery/ --include "db_backup_*.sql.gz" --max-age 24h');
  
  const files = execSync('ls -t .temp/recovery/db_backup_*.sql.gz').toString().split('\n').filter(Boolean);
  if (files.length === 0) throw new Error('Aucun backup trouvé.');
  
  console.log(`📄 Décompression de ${files[0]}...`);
  execSync(`gunzip -c ${files[0]} > ${SQL_FILE}`);

  // 2. Préparation du SQL filtré
  console.log('🧹 Filtrage du SQL et préparation du nettoyage...');
  const rawSql = readFileSync(SQL_FILE, 'utf8');
  const lines = rawSql.split('\n');
  
  let restrictionToken = '';
  const filteredLines = [];
  const tablesToTruncate = new Set();
  let inPublicSchema = true;

  for (const line of lines) {
    if (line.startsWith('\\restrict ')) {
      restrictionToken = line.replace('\\restrict ', '').trim();
      continue;
    }

    if (line.startsWith('COPY ')) {
      inPublicSchema = line.includes('"public".');
      if (inPublicSchema) {
        // Extraire le nom de la table pour le TRUNCATE
        const match = line.match(/COPY "public"\."([^"]+)"/);
        if (match) tablesToTruncate.add(match[1]);
      }
    }

    if (inPublicSchema) {
      filteredLines.push(line);
    }

    if (line === '\\.') {
      inPublicSchema = true;
    }
  }

  const COMBINED_SQL = resolve(TEMP_DIR, 'filtered_restore.sql');
  
  // Construction du script final
  let finalSql = '';
  if (restrictionToken) finalSql += `\\unrestrict ${restrictionToken}\n`;
  
  finalSql += `SET session_replication_role = replica;\n`;
  finalSql += `SET search_path = public, extensions;\n\n`;
  
  // Vider les tables proprement avant de restaurer
  if (tablesToTruncate.size > 0) {
    console.log(`🗑️ Préparation du nettoyage de ${tablesToTruncate.size} tables...`);
    tablesToTruncate.forEach(table => {
      finalSql += `TRUNCATE TABLE "public"."${table}" RESTART IDENTITY CASCADE;\n`;
    });
    finalSql += `\n`;
  }

  finalSql += filteredLines.join('\n');
  finalSql += `\nSET session_replication_role = DEFAULT;`;

  writeFileSync(COMBINED_SQL, finalSql);

  // 3. Application de la structure
  console.log('🏗️ Application de la structure (migrations git)...');
  execSync('npx supabase db push');

  // 4. Restauration des données
  console.log('🧪 Restauration des données (Nettoyage + Public Schema via Docker)...');
  const PWD = process.cwd();
  const SQL_PATH = `/workspace/.temp/recovery/filtered_restore.sql`;
  
  execSync(`docker run --rm --network host -v "${PWD}:/workspace" -w /workspace postgres:17-alpine psql "${DB_URL}" -f "${SQL_PATH}"`);

  // 5. Restauration du Storage
  console.log('🖼️ Synchronisation du Storage...');
  execSync('rclone sync r2:numindex-backups/storage/ supabase-recovery: --transfers=4 --progress');

  console.log('✅ Restauration terminée avec succès !');

} catch (error) {
  console.error('❌ Erreur :', error.message);
  process.exit(1);
}
