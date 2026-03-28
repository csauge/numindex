import { supabase, getImageUrl } from './supabase/client';
import { ACTION_ICONS } from '../utils/categories';
import { searchAddresses, uploadCompressedImage, fetchEntities, fetchResourceById, fetchSuggestionById } from './services';
import type { Resource, Suggestion } from './supabase/types';

export function initSuggestionForm(form: HTMLFormElement) {
  const t = JSON.parse(form.dataset.t!);
  const lang = form.dataset.lang as 'fr' | 'en';
  const isModeration = form.dataset.moderation === 'true';
  const CATEGORIES = JSON.parse(form.dataset.categories!);
  let existingData = JSON.parse(form.dataset.existing || 'null') as Resource | Suggestion | null;
  const toastContainer = document.getElementById('toast-container');
  const toastMessage = document.getElementById('toast-message');
  const toastText = document.getElementById('toast-text');

  const elements = {
    title: form.querySelector('[name="title"]') as HTMLInputElement,
    desc: form.querySelector('[name="description"]') as HTMLTextAreaElement,
    cat: form.querySelector('[name="category"]') as HTMLSelectElement,
    mandatoryTag: form.querySelector('[name="mandatory-tag"]') as HTMLSelectElement,
    optionalTagsList: document.getElementById('optional-tags-list'),
    link: form.querySelector('[name="link"]') as HTMLInputElement,
    img: form.querySelector('[name="image"]') as HTMLInputElement,
    addressVal: form.querySelector('[name="address-value"]') as HTMLInputElement,
    addressSearch: document.getElementById('address-search') as HTMLInputElement,
    addressResults: document.getElementById('address-results'),
    onlineToggle: document.getElementById('online-toggle') as HTMLInputElement,
    pubDateInput: form.querySelector('[name="published_at"]') as HTMLInputElement,
    versionDateInput: form.querySelector('[name="version_date"]') as HTMLInputElement,
    occurrencesList: document.getElementById('occurrences-list'),
    addOccurrenceBtn: document.getElementById('add-occurrence'),
    reason: form.querySelector('[name="reason"]') as HTMLTextAreaElement,
    relatedSearch: document.getElementById('related-search') as HTMLInputElement,
    relatedResults: document.getElementById('related-results'),
    selectedRelated: document.getElementById('selected-related'),
    submitBtn: document.getElementById('submit-btn') as HTMLButtonElement,
    preview: {
      title: document.getElementById('preview-title'),
      cat: document.getElementById('badge-cat'),
      img: document.getElementById('preview-img'),
      badges: document.getElementById('preview-badges')
    }
  };

  let entities: Resource[] = [];
  let selectedRelatedIds: string[] = [];
  let selectedOptionalTags: string[] = [];
  let occurrences: any[] = [];
  let currentCoords: { lat: number; lng: number } | null = null;

  async function showToast(message: string, type: 'success' | 'error') {
    if (!toastContainer || !toastMessage || !toastText) return;
    toastText.innerText = message;
    toastMessage.className = `alert shadow-2xl border-none text-white font-black px-12 py-8 rounded-3xl scale-110 transition-all duration-300 ${type === 'success' ? 'bg-primary' : 'bg-error'}`;
    toastContainer.classList.remove('hidden');
    if (type === 'success') {
      setTimeout(() => window.location.href = isModeration ? `/${lang}/admin` : `/${lang}`, 2500);
    } else {
      setTimeout(() => toastContainer.classList.add('hidden'), 5000);
    }
  }

  function updateMandatoryTags() {
    const cat = elements.cat.value;
    const tags = CATEGORIES[cat].mandatoryTags;
    elements.mandatoryTag.innerHTML = tags.map((tag: string) => `<option value="${tag}">${tag}</option>`).join('');
    
    if (existingData?.tags) {
      const match = tags.find((t: string) => existingData?.tags.includes(t));
      if (match) elements.mandatoryTag.value = match;
    }
  }

  function updateOptionalTags() {
    const cat = elements.cat.value;
    const tags = CATEGORIES[cat].optionalTags;
    elements.optionalTagsList!.innerHTML = tags.map((tag: string) => {
      const isChecked = selectedOptionalTags.includes(tag);
      return `<button type="button" data-tag="${tag}" class="btn btn-xs ${isChecked ? 'btn-primary' : 'btn-outline'}">${tag}</button>`;
    }).join('');

    elements.optionalTagsList!.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = (btn as HTMLElement).dataset.tag!;
        if (selectedOptionalTags.includes(tag)) {
          selectedOptionalTags = selectedOptionalTags.filter(t => t !== tag);
        } else {
          selectedOptionalTags.push(tag);
        }
        updateOptionalTags();
        updateUI();
      });
    });
  }

  function renderOccurrences() {
    elements.occurrencesList!.innerHTML = occurrences.map((occ, index) => `
      <div class="bg-stone-50 p-4 rounded-xl border border-stone-200 relative space-y-3">
        <button type="button" class="btn btn-xs btn-circle btn-ghost absolute top-2 right-2 remove-occ" data-index="${index}">✕</button>
        <div class="grid grid-cols-2 gap-2">
          <div class="form-control">
            <label class="label p-1"><span class="label-text text-[10px] uppercase font-bold text-stone-400">${t.start}</span></label>
            <input type="datetime-local" class="input input-sm input-bordered occ-start" value="${occ.start || ''}" data-index="${index}" />
          </div>
          <div class="form-control">
            <label class="label p-1"><span class="label-text text-[10px] uppercase font-bold text-stone-400">${t.end}</span></label>
            <input type="datetime-local" class="input input-sm input-bordered occ-end" value="${occ.end || ''}" data-index="${index}" />
          </div>
        </div>
        <div class="form-control">
          <label class="label p-1"><span class="label-text text-[10px] uppercase font-bold text-stone-400">${t.address}</span></label>
          <input type="text" class="input input-sm input-bordered occ-addr" value="${occ.address || ''}" data-index="${index}" placeholder="${t.addressPlaceholder}" />
        </div>
      </div>
    `).join('');

    elements.occurrencesList!.querySelectorAll('.remove-occ').forEach(btn => {
      btn.addEventListener('click', () => {
        occurrences.splice(parseInt((btn as HTMLElement).dataset.index!), 1);
        renderOccurrences();
        updateUI();
      });
    });

    elements.occurrencesList!.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', (e) => {
        const idx = parseInt((e.target as HTMLInputElement).dataset.index!);
        const field = (e.target as HTMLInputElement).classList.contains('occ-start') ? 'start' : 
                      ((e.target as HTMLInputElement).classList.contains('occ-end') ? 'end' : 'address');
        occurrences[idx][field] = (e.target as HTMLInputElement).value;
        updateUI();
      });
    });
  }

  function updateUI() {
    const cat = elements.cat.value;
    const isActeur = cat === 'acteur';
    const isEvenement = cat === 'evenement';
    const isContenu = cat === 'contenu';
    const isOutil = cat === 'outil';
    const isDelete = (elements.reason.closest('#delete-fields') as HTMLElement)?.classList.contains('hidden') === false;

    elements.preview.title!.innerText = elements.title.value || '...';
    elements.preview.cat!.innerText = CATEGORIES[cat][lang];
    
    elements.preview.badges!.innerHTML = `<span id="badge-cat" class="text-[9px] font-black uppercase text-stone-600 px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">${CATEGORIES[cat][lang]}</span>`;
    if (elements.mandatoryTag.value) {
      elements.preview.badges!.innerHTML += `<span class="text-[9px] font-black uppercase text-emerald-800 px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-200 ml-1">${elements.mandatoryTag.value}</span>`;
    }
    if (elements.addressVal.value && isActeur) {
      elements.preview.badges!.innerHTML += `<span class="text-[9px] font-bold uppercase text-stone-500 border-l border-stone-200 pl-2 ml-1">${elements.addressVal.value}</span>`;
    }
    if (elements.pubDateInput.value) {
      const year = elements.pubDateInput.value.split('-')[0];
      elements.preview.badges!.innerHTML += `<span class="text-[9px] font-bold uppercase text-stone-500 border-l border-stone-200 pl-2 ml-1">${year}</span>`;
    }
    if (elements.versionDateInput.value) {
      const year = elements.versionDateInput.value.split('-')[0];
      elements.preview.badges!.innerHTML += `<span class="text-[9px] font-bold uppercase text-stone-500 border-l border-stone-200 pl-2 ml-1">v.${year}</span>`;
    }
    selectedOptionalTags.forEach(tag => {
      elements.preview.badges!.innerHTML += `<span class="text-[9px] font-bold uppercase text-stone-500 border border-stone-200 px-1 rounded ml-1 bg-white shadow-sm">#${tag}</span>`;
    });

    if (!elements.img.files?.[0]) {
      const url = getImageUrl(existingData?.image_url);
      elements.preview.img!.innerHTML = url ? `<img src="${url}" class="w-full h-full object-contain" />` : 
        `<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-stone-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="${CATEGORIES[cat].icon}" stroke-width="2"/></svg>`;
    }

    document.getElementById('address-container')?.classList.toggle('hidden', !isActeur || isDelete);
    document.getElementById('online-toggle-container')?.classList.toggle('hidden', !isEvenement);
    document.getElementById('occurrences-container')?.classList.toggle('hidden', !isEvenement || isDelete);
    document.getElementById('pub-date-container')?.classList.toggle('hidden', !isContenu || isDelete);
    document.getElementById('version-date-container')?.classList.toggle('hidden', !isOutil || isDelete);
    document.getElementById('related-container')?.classList.toggle('hidden', isActeur || isDelete);
  }

  let addressTimer: any;
  elements.addressSearch.addEventListener('input', (e) => {
    clearTimeout(addressTimer);
    const val = (e.target as HTMLInputElement).value;
    if (val.length < 2) return elements.addressResults!.classList.add('hidden');
    addressTimer = setTimeout(async () => {
      const findRes = await searchAddresses(val, lang);
      elements.addressResults!.innerHTML = findRes.map(c => `
        <button type="button" class="w-full text-left px-4 py-2 hover:bg-stone-50 border-b last:border-none" data-label="${c.label}" data-lat="${c.lat}" data-lng="${c.lng}">
          <p class="font-bold text-sm">${c.name}</p><p class="text-[10px] text-stone-400">${c.sub}</p>
        </button>`).join('');
      elements.addressResults!.classList.remove('hidden');
      elements.addressResults!.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        elements.addressSearch.value = (b as HTMLElement).dataset.label!;
        elements.addressVal.value = (b as HTMLElement).dataset.label!;
        currentCoords = { 
          lat: parseFloat((b as HTMLElement).dataset.lat!), 
          lng: parseFloat((b as HTMLElement).dataset.lng!) 
        };
        elements.addressResults!.classList.add('hidden');
        updateUI();
      }));
    }, 300);
  });

  elements.onlineToggle.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).checked) {
      elements.addressSearch.value = t.online;
      elements.addressVal.value = t.online;
      currentCoords = null;
    } else {
      elements.addressSearch.value = '';
      elements.addressVal.value = '';
    }
    updateUI();
  });

  elements.addOccurrenceBtn!.addEventListener('click', () => {
    occurrences.push({ start: '', end: '', address: elements.addressVal.value || '' });
    renderOccurrences();
  });

  elements.cat.addEventListener('change', () => {
    updateMandatoryTags();
    selectedOptionalTags = [];
    updateOptionalTags();
    updateUI();
  });

  elements.mandatoryTag.addEventListener('change', updateUI);

  async function init() {
    entities = await fetchEntities();
    
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('sid');
    const rid = urlParams.get('id');

    if (!existingData) {
      if (sid) existingData = await fetchSuggestionById(sid);
      else if (rid) existingData = await fetchResourceById(rid);
    }

    if (existingData) {
      elements.title.value = existingData.title || '';
      elements.desc.value = existingData.description || '';
      elements.cat.value = existingData.category || 'acteur';
      elements.link.value = existingData.link || '';
      
      const metadata = existingData.metadata || {};
      elements.addressVal.value = metadata.address || '';
      elements.addressSearch.value = metadata.address || '';
      elements.pubDateInput.value = metadata.published_at || '';
      elements.versionDateInput.value = metadata.version_date || '';
      
      if (metadata.lat && metadata.lng) {
        currentCoords = { lat: metadata.lat, lng: metadata.lng };
      }

      occurrences = metadata.occurrences || [];
      selectedRelatedIds = existingData.related_ids || [];
      
      if (existingData.tags) {
        const currentMandatory = CATEGORIES[elements.cat.value].mandatoryTags;
        selectedOptionalTags = existingData.tags.filter(t => !currentMandatory.includes(t));
      }
    }

    updateMandatoryTags();
    updateOptionalTags();
    renderOccurrences();
    renderRelated();
    updateUI();
    form.addEventListener('input', updateUI);

    elements.img.addEventListener('change', () => {
      if (elements.img.files?.[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          elements.preview.img!.innerHTML = `<img src="${e.target?.result}" class="w-full h-full object-contain" />`;
        };
        reader.readAsDataURL(elements.img.files[0]);
      }
    });

    elements.relatedSearch.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value.toLowerCase();
      if (val.length < 1) return elements.relatedResults!.classList.add('hidden');
      const filtered = entities.filter(ent => ent.title.toLowerCase().includes(val) && !selectedRelatedIds.includes(ent.id));
      elements.relatedResults!.innerHTML = filtered.map(ent => `<button type="button" class="w-full text-left px-4 py-2 hover:bg-stone-50" data-id="${ent.id}">${ent.title}</button>`).join('');
      elements.relatedResults!.classList.toggle('hidden', filtered.length === 0);
      elements.relatedResults!.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
        selectedRelatedIds.push((btn as HTMLElement).dataset.id!);
        elements.relatedSearch.value = '';
        elements.relatedResults!.classList.add('hidden');
        renderRelated();
      }));
    });
  }

  function renderRelated() {
    elements.selectedRelated!.innerHTML = selectedRelatedIds.map(id => {
      const ent = entities.find(e => e.id === id);
      return `<div class="badge badge-primary gap-2 font-bold py-3">${ent?.title || id} <button type="button" data-id="${id}" class="remove-rel">×</button></div>`;
    }).join('');
    elements.selectedRelated!.querySelectorAll('.remove-rel').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedRelatedIds = selectedRelatedIds.filter(i => i !== (btn as HTMLElement).dataset.id);
        renderRelated();
      });
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = elements.submitBtn;
    const urlParams = new URLSearchParams(window.location.search);
    const sid = urlParams.get('sid');
    const currentAction = sid ? (existingData as Suggestion)?.action : (urlParams.get('action') || 'create');
    const isDeleteSubmit = currentAction === 'delete';
    
    btn.disabled = true; btn.innerText = t.loading;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let imageUrl = (existingData as any)?.image_url || null;
      if (elements.img.files?.[0]) imageUrl = await uploadCompressedImage(elements.img.files[0]);

      const tags = [elements.mandatoryTag.value, ...selectedOptionalTags].filter(Boolean);
      const metadata = { ...existingData?.metadata };
      
      const cat = elements.cat.value;
      if (cat === 'acteur') {
        metadata.address = elements.addressVal.value;
        if (currentCoords) {
          metadata.lat = currentCoords.lat;
          metadata.lng = currentCoords.lng;
        } else if (metadata.address !== existingData?.metadata?.address) {
          delete metadata.lat;
          delete metadata.lng;
        }
      } else if (cat === 'evenement') {
        // Pour les événements, on ne garde l'adresse que si c'est "En ligne / Online"
        // Le reste est dans occurrences
        if (elements.addressVal.value === t.online) {
          metadata.address = t.online;
        } else {
          delete metadata.address;
          delete metadata.lat;
          delete metadata.lng;
        }
        metadata.occurrences = occurrences;
      } else if (cat === 'contenu') metadata.published_at = elements.pubDateInput.value;
      else if (cat === 'outil') metadata.version_date = elements.versionDateInput.value;

      const payload: any = {
        title: isDeleteSubmit ? existingData?.title : elements.title.value,
        description: isDeleteSubmit ? existingData?.description : elements.desc.value,
        category: cat,
        link: isDeleteSubmit ? existingData?.link : elements.link.value,
        tags,
        related_ids: selectedRelatedIds,
        metadata,
        image_url: imageUrl,
        action: currentAction,
        status: 'pending',
        resource_id: (existingData && 'id' in existingData && !('action' in existingData)) ? existingData.id : (existingData as Suggestion)?.resource_id || null,
        reason: elements.reason.value || null,
        submitted_by: (existingData as Suggestion)?.submitted_by || session?.user.id || null
      };

      if (sid) {
        const { error } = await supabase.from('suggestions').update(payload).eq('id', sid);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('suggestions').insert([payload]);
        if (error) throw error;
      }
      
      showToast(t.success, 'success');
    } catch (err) {
      console.error(err);
      showToast(t.error, 'error');
      btn.disabled = false; 
      btn.innerText = isDeleteSubmit ? t.submitDelete : t.submitCreate;
    }
  });

  init();
}
