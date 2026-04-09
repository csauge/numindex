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
    .select('id, title, category, tags')
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
  const MANDATORY_TAGS = [
    'Entreprise', 'Association', 'Institution', 'Coopérative', 'Collectif', 'Personne',
    'Conférence', 'Atelier', 'Webinaire', 'Meetup', 'Salon',
    'Article', 'Livre', 'Rapport', 'Podcast', 'Vidéo', 'Infographie',
    'Logiciel', 'Référentiel', 'Guide', 'Jeu', 'Formation', 'Loi', 'Travail'
  ];

  const CATEGORY_LABELS = {
    acteur: 'Acteur',
    evenement: 'Event',
    contenu: 'Contenu',
    outil: 'Outil'
  };

  const resourceListHtml = newResources.map(r => {
    const subCat = r.tags?.find(t => MANDATORY_TAGS.includes(t)) || '';
    const catLabel = CATEGORY_LABELS[r.category] || r.category;
    
    return `
      <tr>
        <td style="padding-bottom: 6px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #a8a29e; width: 60px; vertical-align: top; font-weight: bold; text-transform: uppercase;">${catLabel}</td>
        <td style="padding-bottom: 6px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #78716c; width: 85px; vertical-align: top; padding-right: 10px;">${subCat}</td>
        <td style="padding-bottom: 6px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; vertical-align: top;">
          <a href="https://numindex.org/fr/resource/${r.id}" style="color: #1155cc; text-decoration: underline;">${r.title}</a>
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917; line-height: 1.4;">
      <div style="text-align: center; margin-bottom: 24px; padding-top: 24px;">
        <img src="https://numindex.org/logo.svg" alt="numindex.org" width="80" style="margin-bottom: 12px;">
        <h1 style="font-size: 20px; font-weight: 900; color: #1c1917; margin: 0;">Le résumé mensuel</h1>
        <p style="color: #78716c; margin-top: 2px; font-size: 13px;">numindex.org</p>
      </div>
      
      <p style="font-size: 14px;">Bonjour,</p>
      <p style="font-size: 14px; margin-bottom: 20px;">Voici les <strong>${newResources.length} nouvelles ressources</strong> ajoutées ce mois-ci pour un numérique plus responsable :</p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
        ${resourceListHtml}
      </table>
      
      <p style="font-size: 14px; margin-bottom: 4px;">À bientôt sur numindex.org,</p>
      <p style="font-size: 14px; font-weight: 700; color: #047857;">L'équipe numindex</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e7e5e4; text-align: center;">
        <p style="font-size: 10px; color: #a8a29e;">
          Vous recevez cet email car vous avez activé l'option dans vos <a href="https://numindex.org/fr/profile?tab=settings" style="color: #1155cc; text-decoration: underline;">paramètres</a>.<br>
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