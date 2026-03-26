import type { APIRoute } from 'astro';
import { fetchAllResources } from '../../lib/services';
import type { Resource } from '../../lib/supabase/types';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const allResources = await fetchAllResources();
  const events = allResources.filter(r => r.category === 'evenement' && r.metadata?.occurrences);
  
  const now = formatTimestamp(new Date().toISOString());
  const url = new URL(request.url);
  
  // Robust origin detection
  const host = request.headers.get('x-forwarded-host') || url.host;
  const protocol = request.headers.get('x-forwarded-proto') || (url.protocol.replace(':', ''));
  const origin = `${protocol}://${host}`;

  let lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//numindex.org//NONSGML Events//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:numindex.org - Événements responsables',
    'X-WR-TIMEZONE:UTC',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H'
  ];

  events.forEach(event => {
    const occurrences = event.metadata.occurrences || [];
    
    occurrences.forEach((occ: any, index: number) => {
      const start = occ.start; // ISO
      if (!start) return;

      const dateStart = formatTimestamp(start);
      const dateEnd = occ.end ? formatTimestamp(occ.end) : formatTimestamp(new Date(new Date(start).getTime() + 3600000).toISOString()); // Default 1h

      const uid = `${event.id}-${index}@${host}`;
      const summary = escapeText(event.title);
      const location = escapeText(occ.address || event.metadata?.address || '');
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
      lines.push(`TRANSP:OPAQUE`);
      lines.push(`DTSTART:${dateStart}`);
      lines.push(`DTEND:${dateEnd}`);
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${description}`);
      lines.push(`LOCATION:${location}`);
      lines.push(`URL:${eventUrl}`);
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');

  const icsContent = lines.map(line => foldLine(line)).join('\r\n');

  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="events.ics"',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

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
