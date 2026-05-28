import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { formatSuggestionForEmail } from '../../../lib/notification-utils';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const runtime = (locals as any).runtime;
  const env = runtime?.env || process.env;

  const supabaseUrl = env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  const brevoApiKey = env.BREVO_API_KEY || import.meta.env.BREVO_API_KEY;
  const contactEmail = env.CONTACT_EMAIL || import.meta.env.CONTACT_EMAIL || 'contact@numindex.org';
  const webhookSecret = env.WEBHOOK_SECRET || import.meta.env.WEBHOOK_SECRET;

  if (!supabaseUrl || !supabaseServiceKey || !brevoApiKey) {
    console.error('Webhook Error: Missing configuration');
    return new Response(JSON.stringify({ error: 'Server configuration missing' }), { status: 500 });
  }

  // 1. Verify Webhook Secret
  const authHeader = request.headers.get('X-Webhook-Secret');
  if (webhookSecret && authHeader !== webhookSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const payload = await request.json();
    console.log('Webhook received:', payload);
    const { record, old_record } = payload;

    // 2. Check if status changed from pending to approved/rejected
    if (!record || !old_record) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }

    if (old_record.status !== 'pending' || (record.status !== 'approved' && record.status !== 'rejected')) {
      return new Response(JSON.stringify({ message: 'No notification needed for this change' }), { status: 200 });
    }

    // 3. Get Submitter's email
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(record.submitted_by);

    if (userError || !user || !user.email) {
      console.error('Webhook Error: Could not find user email', userError);
      return new Response(JSON.stringify({ error: 'User email not found' }), { status: 404 });
    }

    // 4. Send email via Brevo
    const formatted = formatSuggestionForEmail(record);
    const statusLabel = record.status === 'approved' ? 'approuvée' : 'refusée';
    const subject = `[numindex.org] Votre suggestion ${formatted.actionLabelDetailed} a été ${statusLabel}`;
    
    const showButton = record.status === 'approved' && record.action !== 'delete';

    const htmlContent = `
      <div style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px; padding: 20px 0; border-bottom: 1px solid #eee;">
          <h1 style="color: #059669; margin: 0;">numindex.org</h1>
        </div>
        <p>Bonjour,</p>
        <p>Nous vous informons que votre suggestion ${formatted.actionLabelDetailed} pour la ressource <strong>"${record.title}"</strong> a été <strong>${statusLabel}</strong> par notre équipe de modération.</p>
        
        ${record.status === 'approved' 
          ? `<p>${formatted.successMessage} Merci pour votre contribution à un numérique plus responsable.</p>
             ${showButton ? `
             <div style="margin: 30px 0; text-align: center;">
               <a href="https://numindex.org/fr/resource/${record.resource_id || ''}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Voir la ressource</a>
             </div>` : ''}`
          : `<p>Votre suggestion n'a pas été retenue pour le moment. Nous vous remercions tout de même pour votre intérêt pour numindex.org.</p>`
        }

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          Ceci est un message automatique, merci de ne pas y répondre directement.<br>
          L'équipe numindex.org
        </p>
      </div>
    `;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'numindex.org', email: contactEmail },
        to: [{ email: user.email }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      console.error('Brevo API error:', result);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook Internal Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
