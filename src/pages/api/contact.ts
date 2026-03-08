import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // Sur Cloudflare Pages avec Astro 5, les variables peuvent se trouver dans locals.runtime.env
  // ou injectées via process.env selon la configuration du projet
  const runtime = (locals as any).runtime;
  const env = runtime?.env || process.env;
  
  const apiKey = env.BREVO_API_KEY || import.meta.env.BREVO_API_KEY;
  const toEmail = env.CONTACT_EMAIL || import.meta.env.CONTACT_EMAIL;

  if (!apiKey || !toEmail) {
    console.error('Contact API Error: Missing BREVO_API_KEY or CONTACT_EMAIL in environment');
    return new Response(JSON.stringify({ 
      error: 'Server configuration missing',
      debug: { 
        hasApiKey: !!apiKey, 
        hasToEmail: !!toEmail,
        isRuntimeEnv: !!runtime?.env 
      }
    }), { status: 500 });
  }

  try {
    const data = await request.json();
    const { name, email, message } = data;

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        // L'expéditeur DOIT être une adresse validée dans votre compte Brevo
        sender: { name: 'numindex.org', email: toEmail }, 
        to: [{ email: toEmail }],
        replyTo: { email, name },
        subject: `[numindex.org] Nouveau message de ${name}`,
        htmlContent: `
          <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
            <h2 style="color: #059669;">Nouveau message de contact - numindex.org</h2>
            <p><strong>Nom :</strong> ${name}</p>
            <p><strong>Email :</strong> ${email}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p><strong>Message :</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        `,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Brevo API error:', result);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: result }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Contact API Internal Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
