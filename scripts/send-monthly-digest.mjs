import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const brevoApiKey = process.env.BREVO_API_KEY;
const contactEmail = process.env.CONTACT_EMAIL || 'contact@numindex.org';

if (!supabaseUrl || !supabaseServiceKey || !brevoApiKey) {
  console.error('Erreur: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et BREVO_API_KEY sont requis.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sendMonthlyDigest() {
  console.log('Démarrage du script de résumé mensuel...');

  // 1. Récupérer les ressources créées au cours des 30 derniers jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: newResources, error: resourcesError } = await supabase
    .from('resources')
    .select('id, title, category, link')
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (resourcesError) {
    console.error('Erreur lors de la récupération des ressources:', resourcesError);
    process.exit(1);
  }

  if (!newResources || newResources.length === 0) {
    console.log('Aucune nouvelle ressource ce mois-ci. Fin du script.');
    process.exit(0);
  }

  console.log(`${newResources.length} nouvelle(s) ressource(s) trouvée(s).`);

  // 2. Récupérer les utilisateurs ayant opt-in
  const { data: optedInProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .eq('digest_opt_in', true);

  if (profilesError) {
    console.error('Erreur lors de la récupération des profils:', profilesError);
    process.exit(1);
  }

  if (!optedInProfiles || optedInProfiles.length === 0) {
    console.log('Aucun utilisateur n\\'a souscrit au résumé mensuel. Fin du script.');
    process.exit(0);
  }

  // 3. Récupérer les adresses email de ces utilisateurs
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Erreur lors de la récupération des utilisateurs:', usersError);
    process.exit(1);
  }

  const optedInUserIds = new Set(optedInProfiles.map(p => p.id));
  const bccList = users
    .filter(u => optedInUserIds.has(u.id) && u.email)
    .map(u => ({ email: u.email }));

  if (bccList.length === 0) {
    console.log('Aucune adresse email valide trouvée pour les utilisateurs abonnés.');
    process.exit(0);
  }

  console.log(`Envoi du résumé à ${bccList.length} utilisateur(s)...`);

  // 4. Générer le contenu de l'email
  const resourceListHtml = newResources.map(r => 
    `<li><strong>${r.title}</strong> (${r.category}) - <a href="https://numindex.org/fr/resource/${r.id}">Voir sur numindex</a></li>`
  ).join('');

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669;">Le résumé mensuel numindex.org 🌿</h2>
      <p>Bonjour,</p>
      <p>Voici les <strong>${newResources.length} nouvelles ressources</strong> ajoutées au cours du mois dernier :</p>
      <ul>
        ${resourceListHtml}
      </ul>
      <p>Merci pour votre intérêt et votre contribution à un numérique plus responsable !</p>
      <p>L'équipe numindex.org</p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px; margin-bottom: 20px;">
      <p style="font-size: 12px; color: #666;">
        Vous recevez cet email car vous avez activé l'option dans vos <a href="https://numindex.org/fr/profile?tab=settings">paramètres de profil</a>.
        Pour vous désabonner, décochez simplement l'option "Recevoir le résumé mensuel" dans votre compte.
      </p>
    </div>
  `;

  // 5. Envoyer l'email via Brevo
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey
      },
      body: JSON.stringify({
        sender: { name: 'numindex.org', email: contactEmail },
        to: [{ email: contactEmail }], // On s'envoie l'email à nous-même
        bcc: bccList, // Les abonnés sont en copie cachée
        subject: 'Les nouveautés du mois sur numindex.org 🌿',
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur de l\\'API Brevo:', JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    console.log('Résumé mensuel envoyé avec succès !');
  } catch (err) {
    console.error('Erreur lors de l\\'envoi de l\\'email:', err);
    process.exit(1);
  }
}

sendMonthlyDigest();