export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function prepareMetadata(category: string, rawData: any) {
  const metadata: any = {};
  
  if (category === 'acteur') {
    metadata.address = rawData.address || '';
    if (rawData.lat && rawData.lng) {
      metadata.lat = rawData.lat;
      metadata.lng = rawData.lng;
    }
  } else if (category === 'evenement') {
    if (rawData.address === 'En ligne / Online') {
      metadata.address = 'En ligne / Online';
    }
    metadata.occurrences = (rawData.occurrences || []).map((occ: any) => ({
      start: occ.start || '',
      end: occ.end || '',
      address: occ.address || ''
    }));
  } else if (category === 'contenu') {
    if (rawData.rss_url) {
      metadata.rss_url = rawData.rss_url;
    } else {
      metadata.published_at = rawData.published_at || '';
    }
    // We keep published_at even for podcasts if it's there (but initially it won't be from the form)
    if (rawData.published_at && !metadata.published_at) {
        metadata.published_at = rawData.published_at;
    }
  } else if (category === 'outil') {
    metadata.version_date = rawData.version_date || '';
  }
  
  return metadata;
}
