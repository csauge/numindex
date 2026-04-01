/**
 * Utility to interact with Mailpit (Supabase local email testing)
 */
export async function getLatestEmail(recipient: string) {
  const MAILPIT_API = 'http://127.0.0.1:54324/api/v1';
  
  // Wait a bit for the email to be processed
  for (let i = 0; i < 5; i++) {
    const response = await fetch(`${MAILPIT_API}/messages?limit=50`);
    if (!response.ok) throw new Error(`Mailpit API error: ${response.statusText}`);
    
    const data = await response.json();
    const messages = data.messages || [];
    
    // Find messages for this recipient
    const userMessages = messages.filter((m: any) => 
      m.To.some((to: any) => to.Address === recipient)
    );
    
    if (userMessages.length > 0) {
      // Get the full message content
      const detailResponse = await fetch(`${MAILPIT_API}/message/${userMessages[0].ID}`);
      return await detailResponse.json();
    }
    
    // wait 1s before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return null;
}

export function extractConfirmationLink(emailData: any): string | null {
  if (!emailData || !emailData.HTML) return null;
  
  // Regex to find the confirmation link
  // The link usually looks like http://localhost:54321/auth/v1/verify?token=...&type=signup&redirect_to=...
  const linkRegex = /href="(http[^"]+verify[^"]+)"/;
  const match = emailData.HTML.match(linkRegex);
  
  if (match && match[1]) {
    // Unescape HTML entities if any (like &amp;)
    return match[1].replace(/&amp;/g, '&');
  }
  
  return null;
}
