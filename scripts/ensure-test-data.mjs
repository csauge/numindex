import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const testEnvPath = path.resolve(process.cwd(), '.env.test');
const envConfig = dotenv.config({ path: testEnvPath, override: true });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.test at', testEnvPath);
  process.exit(1);
}

// Vérification de sécurité pour éviter la prod par accident
if (!supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('localhost')) {
  console.error('❌ Sécurité : Tentative de peupler une base qui ne semble pas locale :', supabaseUrl);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testData = [
  {
    id: '00000000-0000-0000-0000-000000000004', 
    title: 'GreenIT.fr', 
    description: 'La communauté des experts du numérique responsable.', 
    link: 'https://www.greenit.fr', 
    category: 'entreprise', 
    tags: ['expert', 'blog', 'community'], 
    metadata: { city: "Paris" }
  },
  {
    id: '00000000-0000-0000-0000-000000000005', 
    title: 'Green Tech Forum', 
    description: 'Le rendez-vous professionnel du Numérique Responsable.', 
    link: 'https://www.greentech-forum.com', 
    category: 'evenement', 
    tags: ['salon', 'paris', 'pro'], 
    metadata: { city: "Paris", next_date: "2030-11-05" }
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

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
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
