import { getImageUrl } from './supabase/client';
import { getCategoryLabel, getCategoryIcon, ACTION_ICONS } from '../utils/categories';
import type { Suggestion, Resource, Profile } from './supabase/types';

export interface PreviewOptions {
  lang: 'fr' | 'en';
  isModeration?: boolean;
  isOwner?: boolean;
  hideButtons?: boolean;
  diffWith?: Resource | null;
  profiles?: Profile[];
  allResources?: Resource[];
  categoriesData?: any;
}

export function renderResourcePreview(res: Partial<Suggestion & Resource>, options: PreviewOptions) {
  const { lang, isModeration, isOwner, hideButtons, diffWith, profiles = [], allResources = [], categoriesData = {} } = options;
  
  const action = (res as Suggestion).action || 'create';
  const actionClass = getActionClass(action);
  const actionIcon = ACTION_ICONS[action as keyof typeof ACTION_ICONS] || ACTION_ICONS.create;

  const isMod = (field: string) => {
    if (!diffWith || action !== 'update') return false;
    
    if (field === 'address') {
      return res.metadata?.address !== diffWith.metadata?.address;
    }
    if (field === 'published_at') {
      return res.metadata?.published_at !== diffWith.metadata?.published_at;
    }
    if (field === 'version_date') {
      return res.metadata?.version_date !== diffWith.metadata?.version_date;
    }
    if (field === 'occurrences') {
      return JSON.stringify(res.metadata?.occurrences) !== JSON.stringify(diffWith.metadata?.occurrences);
    }
    if (field === 'tags') {
      const t1 = [...(res.tags || [])].sort().join(',');
      const t2 = [...(diffWith.tags || [])].sort().join(',');
      return t1 !== t2;
    }
    if (field === 'related_ids') {
      const r1 = [...(res.related_ids || [])].sort().join(',');
      const r2 = [...(diffWith.related_ids || [])].sort().join(',');
      return r1 !== r2;
    }
    if (field === 'image_url') {
      return res.image_url !== diffWith.image_url;
    }
    
    return (res as any)[field] !== (diffWith as any)[field];
  };

  const diffClass = "ring-2 ring-red-500 ring-offset-2 rounded-sm";
  
  // Proposer info
  const submittedBy = (res as Suggestion).submitted_by;
  const proposer = profiles.find(p => p.id === submittedBy)?.full_name || '...';

  const cat = res.category || 'acteur';
  const catInfo = categoriesData[cat];
  const mandatoryTags = catInfo?.mandatoryTags || [];
  const subCategory = res.tags?.find(t => mandatoryTags.includes(t));
  const qualifiers = res.tags?.filter(t => !mandatoryTags.includes(t)) || [];

  const t = {
    fr: {
      target: 'Aperçu :',
      by: 'Proposé par :',
      byMod: 'Modification par :',
      idTarget: 'ID cible :',
      occurrences: 'Éditions / Dates',
      related: 'Organisations / Personnes liées',
      reason: 'Motif :',
      approve: 'Approuver',
      correct: 'Corriger',
      reject: 'Rejeter',
      cancel: 'Annuler',
      new: 'Nouveau',
      update: 'Modification',
      delete: 'Suppression',
      preview: 'Aperçu'
    },
    en: {
      target: 'Preview:',
      by: 'Submitted by:',
      byMod: 'Update by:',
      idTarget: 'Target ID:',
      occurrences: 'Editions / Dates',
      related: 'Related Organizations / People',
      reason: 'Reason:',
      approve: 'Approve',
      correct: 'Correct',
      reject: 'Reject',
      cancel: 'Cancel',
      new: 'New',
      update: 'Update',
      delete: 'Delete',
      preview: 'Preview'
    }
  }[lang];

  // Render HTML
  return `
    <article class="suggestion-card bg-white border border-stone-200 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start relative overflow-hidden shadow-sm" data-id="${(res as Suggestion).id}">
      <div class="w-full md:w-48 aspect-video rounded-xl overflow-hidden bg-stone-50/50 border border-stone-100 flex-shrink-0 relative flex items-center justify-center text-stone-200 ${isMod('image_url') ? diffClass : ''}">
        ${res.image_url ? `<img src="${getImageUrl(res.image_url)}" alt="Aperçu de la ressource" width="192" height="108" loading="lazy" decoding="async" class="absolute inset-0 w-full h-full object-contain p-2" />` : `
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${getCategoryIcon(cat)}" />
          </svg>
        `}
      </div>
      
      <div class="flex-grow w-full">
        <div class="flex flex-wrap items-center gap-2 mb-3">
          ${isModeration || isOwner ? `
            <span class="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border shadow-sm ${actionClass}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="${actionIcon}"/></svg>
              ${action === 'create' ? t.new : (action === 'update' ? t.update : t.delete)}
            </span>
          ` : `<span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border bg-stone-100 border-stone-200 text-stone-500 shadow-sm">${t.preview}</span>`}
          
          <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border bg-stone-50 border-stone-200 text-stone-500 shadow-sm ${isMod('category') ? diffClass : ''}">
            ${getCategoryLabel(cat, lang)}
          </span>
          ${subCategory ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm ${isMod('tags') ? diffClass : ''}">${subCategory}</span>` : ''}
          
          ${res.metadata?.address ? `
            <span class="flex items-center gap-1 text-[9px] font-black bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded text-stone-500 uppercase tracking-tight ${isMod('address') ? diffClass : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              ${res.metadata.address}
            </span>
          ` : ''}

          ${res.metadata?.published_at ? `
            <span class="flex items-center gap-1 text-[9px] font-black bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded text-stone-500 uppercase tracking-tight ${isMod('published_at') ? diffClass : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              ${res.metadata.published_at.split('-')[0]}
            </span>
          ` : ''}

          ${res.metadata?.version_date ? `
            <span class="flex items-center gap-1 text-[9px] font-black bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded text-stone-500 uppercase tracking-tight ${isMod('version_date') ? diffClass : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              ${res.metadata.version_date.split('-')[0]}
            </span>
          ` : ''}
        </div>

        <h2 class="text-xl font-black text-stone-800 mb-1 inline-block ${isMod('title') ? diffClass : ''}">${res.title || '...'}</h2>

        ${isModeration ? `
          <div class="flex flex-col gap-1 mb-3">
            <p class="text-[9px] font-bold text-stone-400 uppercase">
              ${action === 'create' ? t.by : t.byMod} 
              <span class="text-stone-600 ml-1">${proposer}</span>
            </p>
            ${(res as Suggestion).resource_id ? `<p class="text-[9px] text-stone-400 font-mono tracking-tighter opacity-70">${t.idTarget} <a href="/${lang}/resource/${(res as Suggestion).resource_id}" target="_blank" class="underline hover:text-primary transition-colors ml-1">${(res as Suggestion).resource_id}</a></p>` : ''}
          </div>
        ` : ''}

        <p class="text-stone-600 text-sm mb-4 leading-relaxed whitespace-pre-line ${isMod('description') ? diffClass : ''}">${res.description || ''}</p>
        
        ${res.metadata?.occurrences && res.metadata.occurrences.length > 0 ? `
          <div class="mb-4 space-y-2 ${isMod('occurrences') ? diffClass : ''}">
            <p class="text-[9px] font-black text-stone-400 uppercase tracking-widest">${t.occurrences}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${res.metadata.occurrences.map((occ: any) => `
                <div class="text-[10px] bg-stone-50 border border-stone-100 p-2 rounded-lg flex flex-col">
                  <span class="font-bold text-stone-700">${occ.start ? new Date(occ.start).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' }) : '...'}</span>
                  ${occ.address ? `<span class="text-stone-500 italic">${occ.address}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${qualifiers.length > 0 ? `
          <div class="flex flex-wrap gap-1 mb-4 ${isMod('tags') ? diffClass : ''}">
            ${qualifiers.map(tag => `<span class="text-[9px] font-black bg-stone-50 border border-stone-100 px-1.5 py-0.5 rounded text-stone-400 uppercase tracking-tight">${tag}</span>`).join('')}
          </div>
        ` : ''}

        ${res.related_ids && res.related_ids.length > 0 ? `
          <div class="mb-4 ${isMod('related_ids') ? diffClass : ''}">
            <p class="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">${t.related}</p>
            <div class="flex flex-wrap gap-1">
              ${res.related_ids.map(id => {
                const ent = allResources.find(r => r.id === id);
                return `<span class="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">${ent?.title || id}</span>`;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <a href="${res.link}" target="_blank" class="text-xs text-primary font-bold underline mb-4 inline-block break-all ${isMod('link') ? diffClass : ''}">${res.link || ''}</a>

        ${action === 'delete' && (res as Suggestion).reason ? `
          <div class="mt-4 bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
            <p class="text-xs font-bold text-red-800 uppercase mb-1">${t.reason}</p>
            <p class="text-red-700 italic text-sm">${(res as Suggestion).reason}</p>
          </div>
        ` : ''}
      </div>

      ${(isModeration || (isOwner && (res as Suggestion).status === 'pending')) && !hideButtons ? `
        <div class="flex md:flex-col gap-2 w-full md:w-auto">
          ${isModeration ? `<button id="approve-${(res as Suggestion).id}" class="btn btn-primary btn-sm flex-grow approve-btn" data-id="${(res as Suggestion).id}">${t.approve}</button>` : ''}
          ${action !== 'delete' ? `<a href="/${lang}/propose?sid=${(res as Suggestion).id}${isModeration ? '&moderation=true' : '&redirect=profile'}" class="btn btn-outline btn-sm flex-grow text-center">${t.correct}</a>` : ''}
          <button id="${isModeration ? 'reject' : 'cancel'}-${(res as Suggestion).id}" class="btn btn-ghost btn-sm text-error flex-grow ${isModeration ? 'reject-btn' : 'cancel-btn'}" data-id="${(res as Suggestion).id}">${isModeration ? t.reject : t.cancel}</button>
        </div>
      ` : ''}
    </article>
  `;
}

function getActionClass(action: string) {
  if (action === 'update') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (action === 'delete') return 'bg-red-50 text-red-800 border-red-200';
  return 'bg-emerald-800 text-white border-emerald-900';
}
