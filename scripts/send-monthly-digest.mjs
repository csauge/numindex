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
    console.log("Aucun utilisateur n'a souscrit au résumé mensuel. Fin du script.");
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
  const resourceListHtml = newResources.map(r => `
    <div style="margin-bottom: 16px; padding: 16px; background-color: #fdfcfb; border-radius: 16px; border: 1px solid #e7e5e4;">
      <a href="https://numindex.org/fr/resource/${r.id}" style="text-decoration: none; display: block;">
        <span style="display: block; font-size: 16px; font-weight: 800; color: #047857; margin-bottom: 6px;">${r.title}</span>
        <span style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #78716c; background-color: #ffffff; padding: 2px 6px; border-radius: 6px; border: 1px solid #e7e5e4; display: inline-block;">${r.category}</span>
      </a>
    </div>
  `).join('');

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917; line-height: 1.5;">
      <div style="text-align: center; margin-bottom: 32px; padding-top: 24px;">
        <img src="https://numindex.org/logo.svg" alt="numindex.org" width="120" style="margin-bottom: 16px;">
        <h1 style="font-size: 24px; font-weight: 900; color: #1c1917; margin: 0;">Le résumé mensuel</h1>
        <p style="color: #78716c; margin-top: 4px;">numindex.org</p>
      </div>
      
      <p style="font-size: 16px;">Bonjour,</p>
      <p style="font-size: 16px; margin-bottom: 24px;">Voici les <strong>${newResources.length} nouvelles ressources</strong> ajoutées ce mois-ci pour un numérique plus responsable :</p>
      
      <div style="margin-bottom: 32px;">
        ${resourceListHtml}
      </div>
      
      <p style="font-size: 16px; margin-bottom: 8px;">À bientôt sur numindex.org,</p>
      <p style="font-size: 16px; font-weight: 700; color: #047857;">L'équipe numindex</p>
      
      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e7e5e4; text-align: center;">
        <p style="font-size: 12px; color: #a8a29e;">
          Vous recevez cet email car vous avez activé l'option dans vos <a href="https://numindex.org/fr/profile?tab=settings" style="color: #047857; text-decoration: underline;">paramètres</a>.<br>
          Pour vous désabonner, décochez l'option "Recevoir le résumé mensuel" dans votre compte.
        </p>
      </div>
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
        subject: 'Les nouveautés du mois sur numindex.org',
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur de l'API Brevo:", JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    console.log('Résumé mensuel envoyé avec succès !');
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email:", err);
    process.exit(1);
  }
}

sendMonthlyDigest();