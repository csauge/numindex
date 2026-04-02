import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const testEnvPath = path.resolve(process.cwd(), '.env.test');
const envConfig = dotenv.config({ path: testEnvPath, override: true });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.test');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testData = [
  {
    id: '00000000-0000-0000-0000-000000000004', 
    title: 'GreenIT.fr', 
    description: 'La communauté des experts du numérique responsable.', 
    link: 'https://www.greenit.fr', 
    category: 'acteur', 
    tags: ['Expert', 'Blog', 'Communauté'], 
    metadata: { address: "Paris" }
  },
  {
    id: '00000000-0000-0000-0000-000000000005', 
    title: 'Green Tech Forum', 
    description: 'Le rendez-vous professionnel du Numérique Responsable.', 
    link: 'https://www.greentech-forum.com', 
    category: 'evenement', 
    tags: ['Salon', 'Paris', 'Pro'], 
    metadata: { address: "Paris", published_at: "2030-11-05" }
  },
  {
    id: '00000000-0000-0000-0000-000000000006', 
    title: 'Guide de Sobriété Numérique', 
    description: 'Un guide complet pour réduire son empreinte.', 
    link: 'https://example.com/guide', 
    category: 'contenu', 
    tags: ['Guide', 'Sobriété'], 
    metadata: { published_at: "2024-01-01" }
  },
  {
    id: '00000000-0000-0000-0000-000000000007', 
    title: 'EcoMeter', 
    description: 'Outil de mesure de l\'empreinte carbone.', 
    link: 'https://example.com/ecometer', 
    category: 'outil', 
    tags: ['Logiciel', 'Mesure'], 
    metadata: { version_date: "2024-03-01" }
  }
];

async function ensureData() {
  console.log('🌱 Checking test data...');
  
  for (const item of testData) {
    const { data, error } = await supabase
      .from('resources')
      .select('id')
      .eq('id', item.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(`Error checking ${item.title}:`, error);
      continue;
    }

    if (!data) {
      console.log(`Inserting missing data: ${item.title} (${item.category})...`);
      const { error: insertError } = await supabase
        .from('resources')
        .insert(item);
      
      if (insertError) {
        console.error(`❌ Failed to insert ${item.title}:`, insertError);
      } else {
        console.log(`✅ Inserted ${item.title}`);
      }
    } else {
      console.log(`✓ Data already exists: ${item.title}`);
    }
  }
}

ensureData();
