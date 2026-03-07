import type { APIRoute } from 'astro';
import { fetchAllEvents } from '../../lib/services';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const events = await fetchAllEvents();
  const now = formatTimestamp(new Date().toISOString());
  const url = new URL(request.url);
  
  // Robust origin detection
  const host = request.headers.get('x-forwarded-host') || url.host;
  const protocol = request.headers.get('x-forwarded-proto') || (url.protocol.replace(':', ''));
  const origin = `${protocol}://${host}`;

  let lines = [
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
    const nextDate = event.metadata?.next_date; // Expected YYYY-MM-DD
    if (!nextDate || !/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) return;

    const dateStart = nextDate.replace(/-/g, '');
    const endDateObj = new Date(nextDate);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const dateEnd = endDateObj.toISOString().split('T')[0].replace(/-/g, '');

    const uid = `${event.id}@${host}`;
    const summary = escapeText(event.title);
    const location = escapeText(event.metadata?.city || '');
    const resourceUrl = `${origin}/resource/${event.id}`;
    const eventUrl = event.link || resourceUrl;
    
    let desc = event.description || '';
    if (eventUrl) desc += `\\n\\nLien : ${eventUrl}`;
    const description = escapeText(desc);

    const created = event.created_at ? formatTimestamp(event.created_at) : now;
    const modified = event.updated_at ? formatTimestamp(event.updated_at) : now;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${modified}`);
    lines.push(`CREATED:${created}`);
    lines.push(`LAST-MODIFIED:${modified}`);
    lines.push(`SEQUENCE:0`);
    lines.push(`STATUS:CONFIRMED`);
    lines.push(`TRANSP:TRANSPARENT`); // "Free" availability for all-day events
    lines.push(`DTSTART;VALUE=DATE:${dateStart}`);
    lines.push(`DTEND;VALUE=DATE:${dateEnd}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push(`LOCATION:${location}`);
    lines.push(`URL:${eventUrl}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  // iCalendar lines MUST be folded at 75 octets
  const icsContent = lines.map(line => foldLine(line)).join('\r\n');

  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="events.ics"',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

/**
 * Folds a line to 75 characters as per RFC 5545
 */
function foldLine(line: string): string {
  const maxLength = 75;
  if (line.length <= maxLength) return line;

  let result = '';
  let currentPos = 0;

  while (currentPos < line.length) {
    if (currentPos === 0) {
      result += line.substring(0, maxLength);
      currentPos += maxLength;
    } else {
      result += '\r\n ' + line.substring(currentPos, currentPos + maxLength - 1);
      currentPos += maxLength - 1;
    }
  }
  return result;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}

function escapeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}
