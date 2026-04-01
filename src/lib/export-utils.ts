import type { Resource } from './index-client';

export function generateBookmarksHTML(resources: Resource[], taxonomy: Record<string, string[]>) {
  const esc = (s: string) => !s ? '' : s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  
  const categoriesGrouped = resources.reduce((acc: any, d) => {
    const cat = d.catLabel;
    if (!acc[cat]) acc[cat] = {};
    
    const subCats = taxonomy[d.cat] || [];
    const sub = d.tags.find(t => subCats.includes(t)) || "Autre";
    
    if (!acc[cat][sub]) acc[cat][sub] = [];
    acc[cat][sub].push(d);
    return acc;
  }, {});

  const now = Math.floor(Date.now() / 1000);
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;
  
  Object.entries(categoriesGrouped).forEach(([cat, subs]: [string, any]) => {
    html += `    <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">${esc(cat)}</H3>\n    <DL><p>\n`;
    Object.entries(subs).forEach(([sub, items]: [string, any]) => {
      html += `        <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">${esc(sub)}</H3>\n        <DL><p>\n`;
      items.forEach((d: Resource) => {
        html += `            <DT><A HREF="${esc(d.link || '#')}" ADD_DATE="${now}">${esc(d.title)}</A>\n`;
        if (d.desc) html += `            <DD>${esc(d.desc)}\n`;
      });
      html += `        </DL><p>\n`;
    });
    html += `    </DL><p>\n`;
  });

  return html + '</DL><p>\n';
}
