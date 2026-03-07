import type { APIRoute } from 'astro';
import { fetchUpcomingEvents } from '../../lib/services';

export const GET: APIRoute = async ({ request }) => {
  const events = await fetchUpcomingEvents();
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const url = new URL(request.url);
  
  // Robust origin detection
  const host = request.headers.get('x-forwarded-host') || url.host;
  const protocol = request.headers.get('x-forwarded-proto') || (url.protocol.replace(':', ''));
  const origin = `${protocol}://${host}`;

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Salvia//NONSGML Events//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Salvia - Événements responsables',
    'X-WR-TIMEZONE:UTC',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H'
  ];

  events.forEach(event => {
    const dateStr = event.metadata?.next_date; // Expected YYYY-MM-DD
    if (!dateStr) return;

    // ICS dates for all-day events are YYYYMMDD
    const date = dateStr.replace(/-/g, '');
    
    // DTEND is exclusive (next day)
    const endDateObj = new Date(dateStr);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endDate = endDateObj.toISOString().split('T')[0].replace(/-/g, '');

    const uid = `${event.id}@${host}`;
    const summary = escapeText(event.title);
    
    // Location can be a city or full address from metadata
    const location = escapeText(event.metadata?.city || '');
    
    const resourceUrl = `${origin}/resource/${event.id}`;
    const eventUrl = event.link || resourceUrl;
    
    // Build description with original description + link
    let desc = event.description || '';
    if (eventUrl) desc += `\\n\\nLien : ${eventUrl}`;
    const description = escapeText(desc);

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${uid}`);
    ics.push(`DTSTAMP:${now}`);
    ics.push(`DTSTART;VALUE=DATE:${date}`);
    ics.push(`DTEND;VALUE=DATE:${endDate}`);
    ics.push(`SUMMARY:${summary}`);
    ics.push(`DESCRIPTION:${description}`);
    ics.push(`LOCATION:${location}`);
    ics.push(`URL:${eventUrl}`);
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');

  return new Response(ics.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="events.ics"',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
};

function escapeText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}
