import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { formatSuggestionForEmail } from '../src/lib/notification-utils.js';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const brevoApiKey = process.env.BREVO_API_KEY;
const contactEmail = process.env.CONTACT_EMAIL || 'contact@numindex.org';

if (!supabaseUrl || !supabaseServiceKey || !brevoApiKey) {
  console.error('Erreur: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY et BREVO_API_KEY sont requis.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function sendDailyAdminDigest(supabase, brevoApiKey, contactEmail) {
  console.log('Démarrage du script de résumé quotidien pour les administrateurs...');

  // 1. Récupérer TOUTES les suggestions en attente
  const { data: pendingSuggestions, error: suggestionsError } = await supabase
    .from('suggestions')
    .select('id, title, description, category, tags, action, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (suggestionsError) {
    console.error('Erreur lors de la récupération des suggestions:', suggestionsError);
    return false;
  }

  if (!pendingSuggestions || pendingSuggestions.length === 0) {
    console.log('Aucune suggestion en attente. Fin du script.');
    return true;
  }

  console.log(`${pendingSuggestions.length} suggestion(s) en attente trouvée(s).`);

  // 2. Récupérer les administrateurs
  const { data: adminProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (profilesError) {
    console.error('Erreur lors de la récupération des profils administrateurs:', profilesError);
    return false;
  }

  if (!adminProfiles || adminProfiles.length === 0) {
    console.log('Aucun administrateur trouvé. Fin du script.');
    return true;
  }

  // 3. Récupérer les adresses email des administrateurs
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Erreur lors de la récupération des utilisateurs:', usersError);
    return false;
  }

  const adminIds = new Set(adminProfiles.map(p => p.id));
  const bccList = users
    .filter(u => adminIds.has(u.id) && u.email)
    .map(u => ({ email: u.email }));

  if (bccList.length === 0) {
    console.log('Aucune adresse email valide trouvée pour les administrateurs.');
    return true;
  }

  console.log(`Envoi du résumé à ${bccList.length} administrateur(s)...`);

  // 4. Générer le contenu de l'email
  const suggestionListHtml = pendingSuggestions.map(s => {
    const formatted = formatSuggestionForEmail(s);
    const tagHtml = (s.tags || []).map(t => `<span style="background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-right: 4px; display: inline-block; margin-bottom: 2px;">${t}</span>`).join('');
    const descriptionHtml = s.description ? `<div style="color: #444; font-size: 12px; margin-top: 4px; font-style: italic;">${s.description.length > 120 ? s.description.substring(0, 120) + '...' : s.description}</div>` : '';
    
    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-family: Arial, sans-serif;">
          <div style="font-weight: bold; color: #1c1917; font-size: 14px;">${formatted.title}</div>
          <div style="color: #059669; font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 2px 0;">${formatted.catLabel} • ${formatted.actionLabel}</div>
          ${descriptionHtml}
          <div style="margin-top: 6px;">${tagHtml}</div>
          <div style="color: #a8a29e; font-size: 10px; margin-top: 4px;">Envoyé le ${formatted.dateStr}</div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; vertical-align: middle; min-width: 80px;">
          <a href="https://numindex.org/fr/admin" style="color: #059669; text-decoration: none; font-size: 12px; font-weight: bold; border: 1px solid #059669; padding: 4px 8px; border-radius: 4px;">Modérer</a>
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1c1917; line-height: 1.4;">
      <div style="text-align: center; margin-bottom: 24px; padding-top: 24px;">
        <h1 style="font-size: 20px; font-weight: 900; color: #059669; margin: 0;">Résumé des suggestions en attente</h1>
        <p style="color: #78716c; margin-top: 2px; font-size: 13px;">numindex.org</p>
      </div>
      
      <p style="font-size: 14px;">Bonjour,</p>
      <p style="font-size: 14px; margin-bottom: 20px;">Il y a actuellement <strong>${pendingSuggestions.length} suggestion(s)</strong> en attente de modération sur numindex.org :</p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border-collapse: collapse;">
        ${suggestionListHtml}
      </table>
      
      <div style="text-align: center; margin-top: 30px;">
        <a href="https://numindex.org/fr/admin" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accéder au tableau de bord Admin</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 40px 0 20px;">
      <p style="font-size: 12px; color: #a8a29e; text-align: center;">
        Ceci est une notification automatique quotidienne pour l'équipe d'administration.<br>
        numindex.org
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
        to: [{ email: contactEmail }],
        bcc: bccList,
        subject: `[Admin] ${pendingSuggestions.length} suggestion(s) en attente de modération`,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur de l'API Brevo:", JSON.stringify(errorData, null, 2));
      return false;
    }

    console.log('Résumé quotidien envoyé aux administrateurs avec succès !');
    return true;
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email:", err);
    return false;
  }
}

// Only run if called directly
if (process.argv[1] && process.argv[1].endsWith('send-daily-admin-digest.mjs')) {
  sendDailyAdminDigest(supabase, brevoApiKey, contactEmail).then(success => {
    process.exit(success ? 0 : 1);
  });
}
