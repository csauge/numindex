import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialisation (Utilise la SERVICE_ROLE_KEY pour avoir les droits de suppression)
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erreur: PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
  console.log('🌱 Démarrage du nettoyage des images orphelines...');

  // 1. Récupérer toutes les images utilisées dans la DB
  const { data: resData } = await supabase.from('resources').select('image_url');
  const { data: sugData } = await supabase.from('suggestions').select('image_url');

  const usedImages = new Set([
    ...resData.map(r => r.image_url),
    ...sugData.map(s => s.image_url)
  ].filter(Boolean));

  console.log(`📊 Images utilisées dans la DB : ${usedImages.size}`);

  // 2. Lister les fichiers dans le bucket 'suggestions'
  const { data: files, error: listError } = await supabase.storage.from('suggestions').list();

  if (listError) {
    console.error('Erreur lors du listage des fichiers:', listError);
    return;
  }

  const filesToDelete = files
    .map(f => f.name)
    .filter(name => name !== '.emptyFolderPlaceholder' && !usedImages.has(name));

  console.log(`Waste detection: ${filesToDelete.length} fichiers orphelins trouvés.`);

  // 3. Suppression
  if (filesToDelete.length > 0) {
    const { error: deleteError } = await supabase.storage
      .from('suggestions')
      .remove(filesToDelete);

    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError);
    } else {
      console.log(`✅ Nettoyage réussi : ${filesToDelete.length} fichiers supprimés.`);
      console.log('Liste des fichiers supprimés :', filesToDelete);
    }
  } else {
    console.log('✨ Aucune image orpheline à supprimer.');
  }
}

cleanup();
