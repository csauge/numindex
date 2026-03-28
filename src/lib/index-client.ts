import { fetchUserFavoriteIds, fetchTotalFavoriteCounts, toggleFavorite } from './favorites-client';

export interface Resource {
  id: string;
  title: string;
  desc: string;
  cat: string;
  catLabel: string;
  imgUrl: string | null;
  link: string;
  up: string;
  pub: string;
  next: string;
  tags: string[];
  kw: string;
}

export function initIndex(allData: Resource[], taxonomy: Record<string, string[]>, currentLang: string, translations: any) {
  let filteredData: Resource[] = [];
  let currentSubCat: string | null = null;
  let visibleCount = 20;
  let userFavoriteIds: string[] = [];
  let totalFavoriteCounts: Record<string, number> = {};
  
  const els = {
    grid: document.getElementById('resources-grid')!,
    search: document.getElementById('search-input') as HTMLInputElement,
    clear: document.getElementById('clear-search')!,
    cat: document.getElementById('filter-category') as HTMLSelectElement,
    sort: document.getElementById('filter-sort') as HTMLSelectElement,
    favToggle: document.getElementById('filter-favorites') as HTMLInputElement,
    count: document.getElementById('results-count')!,
    noRes: document.getElementById('no-results')!,
    loadMoreBtn: document.getElementById('btn-load-more')!,
    loadMoreCont: document.getElementById('load-more-container')!,
    optNext: document.getElementById('opt-next-date')!,
    optPub: document.getElementById('opt-pub-date')!,
    subFilters: document.getElementById('sub-filters-container')!
  };

  const t = translations;

  async function init() {
    // Fetch favorites
    try {
      [userFavoriteIds, totalFavoriteCounts] = await Promise.all([
        fetchUserFavoriteIds(),
        fetchTotalFavoriteCounts()
      ]);
    } catch (e) {
      console.error("Failed to load favorites", e);
    }

    // Sync UI with URL on load
    const params = new URLSearchParams(window.location.search);
    if (params.has('q')) els.search.value = params.get('q')!;
    if (params.has('cat')) els.cat.value = params.get('cat')!;
    if (params.has('sort')) els.sort.value = params.get('sort')!;
    if (params.has('type')) currentSubCat = params.get('type')!;
    if (params.has('fav')) els.favToggle.checked = params.get('fav') === 'true';
    
    if (els.search.value) {
      els.clear.classList.remove('opacity-0', 'pointer-events-none');
    }

    els.search.oninput = () => {
      els.clear.classList.toggle('opacity-0', !els.search.value);
      els.clear.classList.toggle('pointer-events-none', !els.search.value);
      update(true);
    };
    
    els.clear.onclick = () => { 
      els.search.value = ''; 
      els.clear.classList.add('opacity-0', 'pointer-events-none');
      els.search.focus();
      update(true); 
    };

    els.cat.onchange = () => {
      const isEvent = els.cat.value === 'evenement';
      const isContenu = els.cat.value === 'contenu';
      const isOutil = els.cat.value === 'outil';
      const isActeur = els.cat.value === 'acteur';
      
      els.optNext.classList.toggle('hidden', !isEvent);
      els.optPub.classList.toggle('hidden', !isContenu);

      if (isEvent) {
        els.sort.value = 'next_date';
      } else if (isContenu) {
        els.sort.value = 'published_at';
      } else if (isOutil || isActeur) {
        els.sort.value = 'title';
      } else {
        els.sort.value = 'updated_at';
      }
      
      currentSubCat = null;
      renderSubFilters();
      update(true);
    };
    
    els.sort.onchange = () => update(true);
    els.favToggle.onchange = () => update(true);
    els.loadMoreBtn.onclick = () => { visibleCount += 20; render(); };

    document.getElementById('btn-export-bookmarks')!.onclick = exportBookmarks;
    document.getElementById('btn-export-calendar')!.onclick = copyCalendarLink;

    // Trigger initial visibility of sort options
    els.cat.dispatchEvent(new Event('change'));
    if (currentSubCat) {
      renderSubFilters();
    }
    update();
  }

  function renderSubFilters() {
    const cat = els.cat.value;
    const subCats = taxonomy[cat] || [];
    
    if (subCats.length === 0) {
      els.subFilters.classList.add('hidden');
      return;
    }
    
    els.subFilters.classList.remove('hidden');
    let html = `<button class="pill ${!currentSubCat ? 'active' : ''}" data-sub="all">${t.filterSub}</button>`;
    subCats.forEach(s => {
      html += `<button class="pill ${currentSubCat === s ? 'active' : ''}" data-sub="${s}">${s}</button>`;
    });
    els.subFilters.innerHTML = html;
    
    els.subFilters.querySelectorAll('.pill').forEach(btn => {
      (btn as HTMLElement).onclick = () => {
        const sub = btn.getAttribute('data-sub');
        currentSubCat = sub === 'all' ? null : sub;
        
        els.subFilters.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        update(true);
      };
    });
  }

  function copyCalendarLink() {
    const url = 'webcal://' + window.location.host + '/api/events.ics';
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.getElementById('btn-export-calendar')!;
      const old = btn.textContent;
      btn.textContent = currentLang === 'fr' ? 'Lien copié !' : 'Link copied!';
      btn.classList.add('text-success');
      setTimeout(() => { 
        btn.textContent = old; 
        btn.classList.remove('text-success');
      }, 2000);
    });
  }

  function update(reset = false) {
    if (reset) visibleCount = 20;
    const q = els.search.value.toLowerCase().trim();
    const c = els.cat.value;
    const s = els.sort.value;
    const sub = currentSubCat;
    const showFavOnly = els.favToggle.checked;
    const today = new Date().toISOString().split('T')[0];

    filteredData = allData.filter(d => 
      (c === 'all' || d.cat === c) && 
      (!sub || d.tags.includes(sub)) &&
      (!q || d.kw.includes(q)) &&
      (!showFavOnly || (totalFavoriteCounts[d.id] || 0) > 0)
    );

    filteredData.sort((a, b) => {
      if (s === 'favorites') {
        const countA = totalFavoriteCounts[a.id] || 0;
        const countB = totalFavoriteCounts[b.id] || 0;
        return countB - countA || a.title.localeCompare(b.title);
      }
      if (s === 'next_date') {
        const dA = a.next || '', dB = b.next || '';
        if (!dA && !dB) return 0; if (!dA) return 1; if (!dB) return -1;
        return (dA < today === dB < today) ? dA.localeCompare(dB) : (dA < today ? 1 : -1);
      }
      if (s === 'published_at') {
        const dA = a.pub || '', dB = b.pub || '';
        if (!dA && !dB) return 0; if (!dA) return 1; if (!dB) return -1;
        return dB.localeCompare(dA);
      }
      if (s === 'title') return a.title.localeCompare(b.title);
      if (s === 'cat') return a.cat.localeCompare(b.cat) || a.title.localeCompare(b.title);
      return b.up.localeCompare(a.up);
    });

    els.count.textContent = filteredData.length.toString();
    els.noRes.classList.toggle('hidden', filteredData.length > 0);
    render();
    
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (c !== 'all') p.set('cat', c);
    if (sub) p.set('type', sub);
    if (s !== 'updated_at') p.set('sort', s);
    if (showFavOnly) p.set('fav', 'true');
    const qs = p.toString();
    const newURL = window.location.pathname + (qs ? '?' + qs : '');
    if (window.location.search !== (qs ? '?' + qs : '')) {
      window.history.replaceState({}, '', newURL);
    }
  }

  function render() {
    els.grid.className = 'grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4';
    
    const toShow = filteredData.slice(0, visibleCount);
    let html = '';
    let lastGroup = '';
    const s = els.sort.value;
    const today = new Date().toISOString().split('T')[0];

    toShow.forEach(d => {
      const isFav = userFavoriteIds.includes(d.id);
      const favCount = totalFavoriteCounts[d.id] || 0;
      let group = '';
      if (s === 'favorites') {
        group = favCount > 0 ? t.popular : t.others;
      } else if (s === 'updated_at' || s === 'published_at') {
        const dateStr = s === 'published_at' ? d.pub : d.up;
        if (!dateStr) {
          group = t.noDate;
        } else {
          const diff = (new Date().getTime() - new Date(dateStr).getTime()) / 86400000;
          group = diff < 7 ? t.thisWeek : diff < 30 ? t.thisMonth : diff < 365 ? t.thisYear : t.older;
        }
      } else if (s === 'title') {
        group = d.title[0].toUpperCase();
      } else if (s === 'cat') {
        group = d.catLabel;
      } else if (s === 'next_date') {
        group = !d.next ? t.noDate : d.next < today ? t.pastDate : new Date(d.next).toLocaleDateString(currentLang, {month:'long', year:'numeric'});
      }

      if (group && group !== lastGroup) {
        lastGroup = group;
        html += '<div class="col-span-full pt-3 pb-0 alphabet-divider"><span>' + group + '</span></div>';
      }

      html += '<a href="/' + currentLang + '/resource/' + d.id + '" class="resource-card group relative bg-white border border-stone-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all flex flex-col sm:flex-row gap-0 sm:gap-3 items-stretch shadow-sm">';
      
      // Favorite Button (Star)
      html += '<button type="button" class="btn-favorite absolute top-2 right-2 z-20 h-7 px-2 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-stone-200 shadow-sm transition-all hover:scale-105 active:scale-95" data-id="' + d.id + '" aria-label="Favorite">';
      html += '<svg class="w-3.5 h-3.5 ' + (isFav ? 'text-amber-500 fill-amber-500' : 'text-stone-300 fill-none') + '" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>';
      html += '<span class="fav-count text-[10px] font-black ml-1 ' + (isFav ? 'text-amber-600' : 'text-stone-500') + '">' + (favCount > 0 ? favCount : '0') + '</span>';
      html += '</button>';

      // Image / Icon
      html += '<div class="relative w-full sm:w-36 sm:h-auto aspect-video sm:aspect-square bg-stone-50 flex-shrink-0 flex items-center justify-center overflow-hidden border-b sm:border-b-0 sm:border-r border-stone-50">';
      if (d.imgUrl) {
        html += '<img src="' + d.imgUrl + '" class="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-110 transition-transform" loading="lazy"/>';
      } else {
        html += '<svg class="w-10 h-10 text-stone-300"><use href="#cat-' + d.cat + '"/></svg>';
      }
      
      if (d.cat === 'evenement' && d.next) {
        const isNextToday = d.next.split('T')[0] === today;
        html += '<div class="absolute bottom-2 left-2 px-2 py-1 rounded-md text-[8px] font-black uppercase ' + (isNextToday ? 'bg-emerald-600 text-white' : 'bg-white/90 text-stone-800 shadow-sm border border-stone-100') + '">📅 ' + new Date(d.next).toLocaleDateString(currentLang, {day: 'numeric', month: 'short'}) + '</div>';
      }
      html += '</div>';

      // Text Content & Badges
      html += '<div class="p-4 flex flex-col flex-grow min-w-0">';
      html += '<div class="flex flex-wrap gap-1 mb-2 pr-8">';
      html += '<span class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 text-[9px] font-black uppercase tracking-tight border border-stone-200">' + d.catLabel + '</span>';

      const mandatoryTags = taxonomy[d.cat] || [];
      const subCat = d.tags.find(t => mandatoryTags.includes(t));
      if (subCat) {
        html += '<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-tight border border-emerald-200 shadow-sm">' + subCat + '</span>';
      }
      html += '</div>';
      
      html += '<h2 class="text-sm sm:text-base font-black text-stone-800 line-clamp-2 leading-tight mb-1 pr-6 group-hover:text-primary transition-colors">' + d.title + '</h2>';
      html += '<p class="text-xs sm:text-sm text-stone-600 line-clamp-2 leading-relaxed">' + (d.desc || '') + '</p>';
      html += '</div></a>';
    });

    els.grid.innerHTML = html;
    els.loadMoreCont.classList.toggle('hidden', filteredData.length <= visibleCount);

    // Attach favorite events
    els.grid.querySelectorAll('.btn-favorite').forEach(btn => {
      (btn as HTMLElement).onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = (btn as HTMLElement).dataset.id!;
        
        try {
          const res = await toggleFavorite(id);
          
          if (res === null) {
            // Redirect to login
            window.location.href = `/${currentLang}/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            return;
          }

          if (res) {
            userFavoriteIds.push(id);
            totalFavoriteCounts[id] = (totalFavoriteCounts[id] || 0) + 1;
          } else {
            userFavoriteIds = userFavoriteIds.filter(fid => fid !== id);
            totalFavoriteCounts[id] = Math.max(0, (totalFavoriteCounts[id] || 1) - 1);
          }
          render();
        } catch (err) {
          console.error("Error toggling favorite", err);
        }
      };
    });
  }

  function exportBookmarks() {
    const esc = (s: string) => !s ? '' : s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const categoriesGrouped = filteredData.reduce((acc: any, d) => {
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

    const fileNameDate = new Date().toISOString().replace(/[:.]/g, '-');
    download(html + '</DL><p>\n', 'numindex_bookmarks_' + fileNameDate + '.html', 'text/html');
  }

  function download(content: string, name: string, type: string) {
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = name;
    link.click();
  }

  init();
}