import type { APIRoute } from 'astro';
import Parser from 'rss-parser';

const parser = new Parser();

export const POST: APIRoute = async ({ request }) => {
  try {
    const { rss_url } = await request.json();
    
    if (!rss_url) {
      return new Response(JSON.stringify({ error: 'rss_url is required' }), { status: 400 });
    }

    const feed = await parser.parseURL(rss_url);
    
    if (feed.items && feed.items.length > 0) {
      const latestItem = feed.items[0];
      
      return new Response(JSON.stringify({
        title: latestItem.title,
        published_at: latestItem.isoDate || (latestItem.pubDate ? new Date(latestItem.pubDate).toISOString() : new Date().toISOString()),
        link: latestItem.link
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({ error: 'No items found in RSS feed' }), { status: 404 });
  } catch (error) {
    console.error('Error parsing RSS:', error);
    return new Response(JSON.stringify({ error: 'Failed to parse RSS feed' }), { status: 500 });
  }
};