import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Script de géocodage pour numindex.org 🌿
 * Utilise l'API Photon (Komoot) pour transformer les adresses en coordonnées lat/lng.
 */

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function geocode(address) {
  if (!address || address.trim() === '') return null;
  
  try {
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`);
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      return { lat, lng };
    }
  } catch (err) {
    console.error(`Error geocoding ${address}:`, err);
  }
  return null;
}

async function run() {
  console.log('--- Geocoding Resources ---');
  
  const { data: resources, error } = await supabase
    .from('resources')
    .select('id, title, metadata');

  if (error) {
    console.error('Error fetching resources:', error);
    process.exit(1);
  }

  let updatedCount = 0;

  for (const resource of resources) {
    const address = resource.metadata?.address;
    const hasCoords = resource.metadata?.lat && resource.metadata?.lng;

    if (address && !hasCoords) {
      console.log(`Geocoding: ${resource.title} (${address})...`);
      const coords = await geocode(address);

      if (coords) {
        const updatedMetadata = { ...resource.metadata, ...coords };
        const { error: updateError } = await supabase
          .from('resources')
          .update({ metadata: updatedMetadata })
          .eq('id', resource.id);

        if (updateError) {
          console.error(`Update error for ${resource.title}:`, updateError);
        } else {
          console.log(`✅ Success: ${coords.lat}, ${coords.lng}`);
          updatedCount++;
        }
      } else {
        console.log(`❌ No coordinates found for ${address}`);
      }
      
      // Petit délai pour ne pas spammer l'API Photon
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`--- Finished. Updated ${updatedCount} resources. ---`);
}

run();
