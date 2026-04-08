import { supabase, getImageUrl } from './supabase/client';
import { ACTION_ICONS } from '../utils/categories';
import { searchAddresses, uploadCompressedImage, fetchEntities, fetchResourceById, fetchSuggestionById } from './services';
import { renderResourcePreview } from './preview-utils';
import { prepareMetadata } from './validation-utils';
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
    clearImg: document.getElementById('clear-image') as HTMLButtonElement,
    addressVal: form.querySelector('[name="address-value"]') as HTMLInputElement,
    addressSearch: document.getElementById('address-search') as HTMLInputElement,
    addressResults: document.getElementById('address-results'),
    onlineToggle: document.getElementById('online-toggle') as HTMLInputElement,
    pubDateInput: form.querySelector('[name="published_at"]') as HTMLInputElement,
    rssUrlInput: form.querySelector('[name="rss_url"]') as HTMLInputElement,
    versionDateInput: form.querySelector('[name="version_date"]') as HTMLInputElement,
    occurrencesList: document.getElementById('occurrences-list'),
    addOccurrenceBtn: document.getElementById('add-occurrence'),
    reason: form.querySelector('[name="reason"]') as HTMLTextAreaElement,
    relatedSearch: document.getElementById('related-search') as HTMLInputElement,
    relatedResults: document.getElementById('related-results'),
    selectedRelated: document.getElementById('selected-related'),
    submitBtn: document.getElementById('submit-btn') as HTMLButtonElement,
    previewContainer: document.getElementById('resource-preview-container')
  };

  let entities: Resource[] = [];
  let selectedRelatedIds: string[] = [];
  let selectedOptionalTags: string[] = [];
  let occurrences: any[] = [];
  let currentCoords: { lat: number; lng: number } | null = null;
  let currentImageUrl: string | null = null;
  let originalData: Resource | null = null;

  async function showToast(message: string, type: 'success' | 'error') {
    if (!toastContainer || !toastMessage || !toastText) return;
    toastText.innerText = message;
    toastMessage.className = `alert shadow-2xl border-none text-white font-black px-12 py-8 rounded-3xl scale-110 transition-all duration-300 ${type === 'success' ? 'bg-primary' : 'bg-error'}`;
    toastContainer.classList.remove('hidden');
    if (type === 'success') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      let targetUrl = isModeration ? `/${lang}/admin` : `/${lang}`;
      if (redirect === 'profile') targetUrl = `/${lang}/profile?tab=contributions`;
      
      setTimeout(() => window.location.href = targetUrl, 2500);
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
        <div class="form-control relative">
          <label class="label p-1"><span class="label-text text-[10px] uppercase font-bold text-stone-400">${t.address}</span></label>
          <input type="text" class="input input-sm input-bordered occ-addr" value="${occ.address || ''}" data-index="${index}" placeholder="${t.addressPlaceholder}" maxlength="255" autocomplete="off" />
          <div class="occ-addr-results absolute left-0 right-0 top-full mt-1 bg-white border rounded-lg shadow-xl z-50 hidden max-h-48 overflow-y-auto" data-index="${index}"></div>
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

    let occTimer: any;
    elements.occurrencesList!.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt((e.target as HTMLInputElement).dataset.index!);
        const isAddr = (e.target as HTMLInputElement).classList.contains('occ-addr');
        
        if (isAddr) {
          clearTimeout(occTimer);
          const val = (e.target as HTMLInputElement).value;
          const results = (e.target as HTMLElement).nextElementSibling as HTMLElement;
          
          if (val.length < 2) return results.classList.add('hidden');
          
          occTimer = setTimeout(async () => {
            const findRes = await searchAddresses(val, lang);
            results.innerHTML = findRes.map(c => `
              <button type="button" class="w-full text-left px-4 py-2 hover:bg-stone-50 border-b last:border-none" data-label="${c.label}">
                <p class="font-bold text-xs">${c.name}</p><p class="text-[9px] text-stone-400">${c.sub}</p>
              </button>`).join('');
            results.classList.remove('hidden');
            results.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
              const label = (b as HTMLElement).dataset.label!;
              (e.target as HTMLInputElement).value = label;
              occurrences[idx].address = label;
              results.classList.add('hidden');
              updateUI();
            }));
          }, 300);
        } else {
          const field = (e.target as HTMLInputElement).classList.contains('occ-start') ? 'start' : 'end';
          occurrences[idx][field] = (e.target as HTMLInputElement).value;
          updateUI();
        }
      });
    });
  }

  function updateUI() {
    const cat = elements.cat.value;
    const isActeur = cat === 'acteur';
    const isEvenement = cat === 'evenement';
    const isContenu = cat === 'contenu';
    const isOutil = cat === 'outil';
    const isPodcast = elements.mandatoryTag.value === 'Podcast';
    const isDelete = (elements.reason.closest('#delete-fields') as HTMLElement)?.classList.contains('hidden') === false;

    // Build the data object for preview
    const tags = [elements.mandatoryTag.value, ...selectedOptionalTags].filter(Boolean);
    const metadata = prepareMetadata(cat, {
      address: elements.addressVal.value,
      lat: currentCoords?.lat,
      lng: currentCoords?.lng,
      occurrences,
      published_at: elements.pubDateInput.value,
      rss_url: elements.rssUrlInput.value,
      version_date: elements.versionDateInput.value
    });

    if (existingData?.metadata?.last_episode_title) {
      metadata.last_episode_title = existingData.metadata.last_episode_title;
    }

    const previewData: any = {
      title: elements.title.value,
      description: elements.desc.value,
      category: cat,
      link: elements.link.value,
      tags,
      related_ids: selectedRelatedIds,
      metadata,
      image_url: currentImageUrl || (existingData as Resource)?.image_url,
      action: (existingData as Suggestion)?.action || 'create',
      resource_id: (existingData && 'id' in existingData && !('action' in existingData)) ? existingData.id : (existingData as Suggestion)?.resource_id || null,
      reason: elements.reason.value,
      submitted_by: (existingData as Suggestion)?.submitted_by || null
    };

    if (elements.previewContainer) {
      elements.previewContainer.innerHTML = renderResourcePreview(previewData, {
        lang,
        categoriesData: CATEGORIES,
        allResources: entities,
        isModeration, 
        diffWith: originalData,
        hideButtons: true
      });
    }

    document.getElementById('address-container')?.classList.toggle('hidden', !isActeur || isDelete);
    document.getElementById('online-toggle-container')?.classList.toggle('hidden', !isEvenement);
    document.getElementById('occurrences-container')?.classList.toggle('hidden', !isEvenement || isDelete);
    document.getElementById('pub-date-container')?.classList.toggle('hidden', !isContenu || isPodcast || isDelete);
    document.getElementById('rss-url-container')?.classList.toggle('hidden', !isPodcast || isDelete);
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
      // If it's a suggestion that updates an existing resource, fetch the original for diffing
      if ('action' in existingData && (existingData as Suggestion).action === 'update' && (existingData as Suggestion).resource_id) {
        originalData = await fetchResourceById((existingData as Suggestion).resource_id!);
      } else if (!('action' in existingData)) {
        // If it's a resource (action=update or action=delete from resource page), it IS the original
        originalData = existingData as Resource;
      }

      elements.title.value = existingData.title || '';
      elements.desc.value = existingData.description || '';
      elements.cat.value = existingData.category || 'acteur';
      elements.link.value = existingData.link || '';
      
      const metadata = existingData.metadata || {};
      elements.addressVal.value = metadata.address || '';
      elements.addressSearch.value = metadata.address || '';
      elements.pubDateInput.value = metadata.published_at || '';
      elements.rssUrlInput.value = metadata.rss_url || '';
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
          currentImageUrl = e.target?.result as string;
          elements.clearImg.classList.remove('hidden');
          updateUI();
        };
        reader.readAsDataURL(elements.img.files[0]);
      }
    });

    elements.clearImg.addEventListener('click', () => {
      elements.img.value = '';
      currentImageUrl = null;
      // If we are editing, we might want to keep the "existing" image or clear it?
      // For now, "Clear" means "I don't want to upload this new file"
      // If we want to clear the EXISTING image, it's a bit more complex (needs a flag)
      // but usually users just want to undo their selection.
      elements.clearImg.classList.add('hidden');
      updateUI();
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
    updateUI();
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
      const cat = elements.cat.value;
      const isPodcast = elements.mandatoryTag.value === 'Podcast';
      let fetchedRssPublishedAt = elements.pubDateInput.value;
      let fetchedRssTitle = undefined;
      
      if (isPodcast && elements.rssUrlInput.value && !isDeleteSubmit) {
        try {
          const rssRes = await fetch('/api/parse-rss', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rss_url: elements.rssUrlInput.value })
          });
          if (rssRes.ok) {
            const rssData = await rssRes.json();
            fetchedRssPublishedAt = rssData.published_at;
            fetchedRssTitle = rssData.title;
          }
        } catch (e) {
          console.error("Failed to parse RSS before submit", e);
        }
      }

      const metadata = prepareMetadata(cat, {
        address: elements.addressVal.value,
        lat: currentCoords?.lat,
        lng: currentCoords?.lng,
        occurrences,
        published_at: fetchedRssPublishedAt,
        rss_url: elements.rssUrlInput.value,
        version_date: elements.versionDateInput.value
      });
      
      if (fetchedRssTitle) {
        metadata.last_episode_title = fetchedRssTitle;
      } else if (existingData?.metadata?.last_episode_title) {
        metadata.last_episode_title = existingData.metadata.last_episode_title;
      }

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
