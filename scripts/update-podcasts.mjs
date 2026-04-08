import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import 'dotenv/config';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erreur: PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const parser = new Parser();

async function updatePodcasts() {
  console.log('🎙️ Démarrage de la mise à jour des podcasts...');

  // 1. Récupérer toutes les ressources ayant un rss_url dans leurs metadata
  const { data: resources, error } = await supabase
    .from('resources')
    .select('id, title, metadata')
    .not('metadata->>rss_url', 'is', null);

  if (error) {
    console.error('Erreur lors de la récupération des podcasts:', error);
    process.exit(1);
  }

  if (!resources || resources.length === 0) {
    console.log('Aucun podcast à mettre à jour.');
    process.exit(0);
  }

  let updatedCount = 0;

  for (const res of resources) {
    const rssUrl = res.metadata.rss_url;
    console.log(`Analyse de: ${res.title} (${rssUrl})...`);

    try {
      const feed = await parser.parseURL(rssUrl);
      
      if (feed.items && feed.items.length > 0) {
        const latestItem = feed.items[0];
        const latestDate = latestItem.isoDate || (latestItem.pubDate ? new Date(latestItem.pubDate).toISOString() : new Date().toISOString());
        
        // Si la date est différente (ou s'il n'y avait pas de titre), on met à jour
        if (res.metadata.published_at !== latestDate || res.metadata.last_episode_title !== latestItem.title) {
          const updatedMetadata = {
            ...res.metadata,
            published_at: latestDate,
            last_episode_title: latestItem.title
          };

          const { error: updateError } = await supabase
            .from('resources')
            .update({ metadata: updatedMetadata })
            .eq('id', res.id);

          if (updateError) {
            console.error(`❌ Erreur MAJ ${res.title}:`, updateError);
          } else {
            console.log(`✅ Mis à jour: ${res.title} (Nouveau: ${latestItem.title})`);
            updatedCount++;
          }
        } else {
          console.log(`➖ Déjà à jour: ${res.title}`);
        }
      }
    } catch (e) {
      console.error(`⚠️ Impossible de lire le flux de ${res.title}:`, e.message);
    }
  }

  console.log(`🏁 Terminé. ${updatedCount} podcast(s) mis à jour.`);
}

updatePodcasts();