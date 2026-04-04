import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import 'dotenv/config';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erreur: Les clés Supabase sont manquantes dans le .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET = 'suggestions';

// Helper pour formater la taille
const formatSize = (bytes) => (bytes / 1024).toFixed(2) + ' KB';

async function optimizeExistingImages() {
  console.log("🚀 Démarrage de l'optimisation des images existantes...");

  // 1. Lister tous les fichiers
  const { data: files, error: listError } = await supabase.storage.from(BUCKET).list();

  if (listError) {
    console.error('Erreur listage:', listError);
    return;
  }

  const images = files.filter(f => f.name !== '.emptyFolderPlaceholder');
  console.log(`📸 ${images.length} images trouvées.`);

  let totalSaved = 0;

  for (const file of images) {
    console.log(`\n--- Traitement de ${file.name} ---`);

    // 2. Télécharger l'image
    const { data: blob, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(file.name);

    if (downloadError) {
      console.error(`❌ Erreur téléchargement ${file.name}:`, downloadError);
      continue;
    }

    const initialSize = blob.size;
    console.log(`📏 Taille initiale : ${formatSize(initialSize)}`);

    // 3. Optimiser avec Sharp
    try {
      const buffer = Buffer.from(await blob.arrayBuffer());
      const optimizedBuffer = await sharp(buffer)
        .resize({ width: 600, withoutEnlargement: true })
        .avif({ quality: 50 })
        .toBuffer();

      const finalSize = optimizedBuffer.length;
      const saved = initialSize - finalSize;
      totalSaved += saved;

      const newFileName = file.name.replace(/\.[^.]+$/, '.avif');
      console.log(`✨ Taille optimisée : ${formatSize(finalSize)} (-${((saved / initialSize) * 100).toFixed(1)}%)`);

      // 4. Uploader le nouveau format
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(newFileName, optimizedBuffer, {
          contentType: 'image/avif',
          upsert: true
        });

      if (uploadError) {
        console.error(`❌ Erreur upload ${newFileName}:`, uploadError);
        continue;
      }

      // 5. Mettre à jour la base de données
      const { error: dbError } = await supabase
        .from('resources')
        .update({ image_url: newFileName })
        .eq('image_url', file.name);

      const { error: sugError } = await supabase
        .from('suggestions')
        .update({ image_url: newFileName })
        .eq('image_url', file.name);

      if (dbError || sugError) {
        console.error(`❌ Erreur DB pour ${file.name}:`, dbError || sugError);
      } else {
        console.log(`✅ DB mise à jour (Resources & Suggestions) : ${file.name} -> ${newFileName}`);
        
        // 6. Supprimer l'ancien fichier si l'extension a changé
        if (newFileName !== file.name) {
          await supabase.storage.from(BUCKET).remove([file.name]);
          console.log(`🗑️ Ancien fichier ${file.name} supprimé du Bucket.`);
        }
      }
    } catch (err) {
      console.error(`❌ Erreur Sharp sur ${file.name}:`, err);
    }
  }

  console.log(`\n🏁 Fin de l'optimisation.`);
  console.log(`📦 Espace total gagné : ${formatSize(totalSaved)}`);
}

optimizeExistingImages();
