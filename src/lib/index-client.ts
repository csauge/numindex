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
  
  const els = {
    grid: document.getElementById('resources-grid')!,
    search: document.getElementById('search-input') as HTMLInputElement,
    clear: document.getElementById('clear-search')!,
    cat: document.getElementById('filter-category') as HTMLSelectElement,
    sort: document.getElementById('filter-sort') as HTMLSelectElement,
    count: document.getElementById('results-count')!,
    noRes: document.getElementById('no-results')!,
    view: document.getElementById('view-toggle') as HTMLInputElement,
    loadMoreBtn: document.getElementById('btn-load-more')!,
    loadMoreCont: document.getElementById('load-more-container')!,
    optNext: document.getElementById('opt-next-date')!,
    optPub: document.getElementById('opt-pub-date')!,
    subFilters: document.getElementById('sub-filters-container')!
  };

  const t = translations;

  function init() {
    // Sync UI with URL on load
    const params = new URLSearchParams(window.location.search);
    if (params.has('q')) els.search.value = params.get('q')!;
    if (params.has('cat')) els.cat.value = params.get('cat')!;
    if (params.has('sort')) els.sort.value = params.get('sort')!;
    if (params.has('type')) currentSubCat = params.get('type')!;
    
    if (els.search.value) {
      els.clear.classList.remove('opacity-0', 'pointer-events-none');
    }
    
    // View mode persistence
    const savedView = localStorage.getItem('numindex_view');
    if (savedView === 'list') {
      els.view.checked = true;
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
    els.view.onchange = () => {
      localStorage.setItem('numindex_view', els.view.checked ? 'list' : 'grid');
      render();
    };
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
    const today = new Date().toISOString().split('T')[0];

    filteredData = allData.filter(d => 
      (c === 'all' || d.cat === c) && 
      (!sub || d.tags.includes(sub)) &&
      (!q || d.kw.includes(q))
    );

    filteredData.sort((a, b) => {
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
    const qs = p.toString();
    const newURL = window.location.pathname + (qs ? '?' + qs : '');
    if (window.location.search !== (qs ? '?' + qs : '')) {
      window.history.replaceState({}, '', newURL);
    }
  }

  function render() {
    const isList = els.view.checked;
    els.grid.className = isList ? 'flex flex-col gap-1 list-mode' : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
    
    const toShow = filteredData.slice(0, visibleCount);
    let html = '';
    let lastGroup = '';
    const s = els.sort.value;
    const today = new Date().toISOString().split('T')[0];

    toShow.forEach(d => {
      let group = '';
      if (s === 'updated_at' || s === 'published_at') {
        const dateStr = s === 'published_at' ? d.pub : d.up;
        if (!dateStr) {
          group = t.noDate;
        } else {
          const diff = (new Date().getTime() - new Date(dateStr).getTime()) / 86400000;
          group = diff < 7 ? t.thisWeek : diff < 30 ? t.thisMonth : diff < 365 ? t.thisYear : t.older;
        }
      } else if (s === 'title') {
        group = d.title[0].toUpperCase();
      } else if (s === 'next_date') {
        group = !d.next ? t.noDate : d.next < today ? t.pastDate : new Date(d.next).toLocaleDateString(currentLang, {month:'long', year:'numeric'});
      }

      if (group && group !== lastGroup) {
        lastGroup = group;
        html += '<div class="col-span-full pt-6 pb-2 border-b border-stone-50 flex items-center gap-4 alphabet-divider"><span>' + group + '</span><div class="h-px bg-stone-100 flex-grow"></div></div>';
      }

      html += '<a href="/' + currentLang + '/resource/' + d.id + '" class="resource-card group bg-white border border-stone-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all ' + (isList ? 'flex items-center p-3 h-14 gap-4' : 'flex flex-col') + '">';
      if (!isList) {
        html += '<div class="relative w-full aspect-video bg-stone-50 flex items-center justify-center overflow-hidden">';
        if (d.imgUrl) {
          html += '<img src="' + d.imgUrl + '" class="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-110 transition-transform" loading="lazy"/>';
        } else {
          html += '<svg class="w-10 h-10 text-stone-200"><use href="#cat-' + d.cat + '"/></svg>';
        }
        
        if (d.cat === 'evenement' && d.next) {
          const isNextToday = d.next.split('T')[0] === today;
          html += '<div class="absolute bottom-2 right-2 px-2 py-1 rounded-lg text-[8px] font-black uppercase ' + (isNextToday ? 'bg-emerald-500 text-white' : 'bg-white/90 text-stone-800') + '">📅 ' + new Date(d.next).toLocaleDateString(currentLang, {day: 'numeric', month: 'short'}) + '</div>';
        }

        html += '</div>';
      } else {
        html += '<div class="card-list-icon-box flex-shrink-0"><svg class="w-6 h-6 text-stone-300"><use href="#cat-' + d.cat + '"/></svg></div>';
      }
      html += '<div class="p-4 flex-grow min-w-0">';
      html += '<span class="card-category-label text-[7px] font-black uppercase tracking-tighter text-stone-400 block">' + d.catLabel + '</span>';
      html += '<h2 class="text-[12px] font-bold text-stone-800 truncate">' + d.title + '</h2>';
      html += '<p class="card-desc text-[10px] text-stone-500 mt-1 ' + (isList ? 'truncate' : 'line-clamp-2') + '">' + (d.desc || '') + '</p>';
      html += '</div></a>';
    });

    els.grid.innerHTML = html;
    els.loadMoreCont.classList.toggle('hidden', filteredData.length <= visibleCount);
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
