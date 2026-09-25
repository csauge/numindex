export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function attachTimezoneOffset(datetimeStr: string, timeZone: string = 'Europe/Paris'): string {
  if (!datetimeStr) return '';
  if (/[+-]\d{2}:\d{2}$/.test(datetimeStr) || datetimeStr.endsWith('Z')) {
    return datetimeStr;
  }
  try {
    const cleanStr = datetimeStr.trim();
    const [datePart, timePart = '00:00'] = cleanStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const timeComponents = timePart.split(':').map(Number);
    const hour = timeComponents[0] || 0;
    const minute = timeComponents[1] || 0;
    const second = timeComponents[2] || 0;

    if (!year || !month || !day) return datetimeStr;

    const referenceUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    
    const parts = dtf.formatToParts(referenceUtc);
    const getPart = (type: string) => Number(parts.find(p => p.type === type)?.value || 0);
    
    const tzYear = getPart('year');
    const tzMonth = getPart('month');
    const tzDay = getPart('day');
    let tzHour = getPart('hour');
    if (tzHour === 24) tzHour = 0;
    const tzMinute = getPart('minute');
    
    const tzAsUtc = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, second);
    const diffMinutes = Math.round((tzAsUtc - referenceUtc.getTime()) / 60000);
    
    const sign = diffMinutes >= 0 ? '+' : '-';
    const absDiff = Math.abs(diffMinutes);
    const offsetH = String(Math.floor(absDiff / 60)).padStart(2, '0');
    const offsetM = String(absDiff % 60).padStart(2, '0');

    const formattedTime = [
      String(hour).padStart(2, '0'),
      String(minute).padStart(2, '0'),
      String(second).padStart(2, '0')
    ].join(':');

    return `${datePart}T${formattedTime}${sign}${offsetH}:${offsetM}`;
  } catch {
    return datetimeStr;
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
    metadata.occurrences = (rawData.occurrences || []).map((occ: any) => {
      const tz = occ.timezone || 'Europe/Paris';
      return {
        start: attachTimezoneOffset(occ.start || '', tz),
        end: attachTimezoneOffset(occ.end || '', tz),
        timezone: tz,
        address: occ.address || '',
        lat: occ.lat,
        lng: occ.lng
      };
    });
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
    if (rawData.repository_url) {
      metadata.repository_url = rawData.repository_url;
    }
    if (rawData.alternative_to) {
      metadata.alternative_to = rawData.alternative_to;
    }
  }
  
  return metadata;
}
