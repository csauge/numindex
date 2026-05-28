/**
 * @typedef {import('./supabase/types').Suggestion} Suggestion
 */

export const CATEGORY_LABELS = {
  acteur: 'Acteur',
  evenement: 'Événement',
  contenu: 'Contenu',
  outil: 'Outil'
};

export const ACTION_LABELS = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression'
};

/**
 * Detailed action labels for grammatical integration in sentences (e.g. "votre suggestion de création")
 */
export const ACTION_LABELS_DETAILED = {
  create: 'de création',
  update: 'de modification',
  delete: 'de suppression'
};

/**
 * Success messages for approved suggestions
 * @param {string} action 
 * @returns {string}
 */
export function getSuccessMessage(action) {
  if (action === 'create') return 'Elle est désormais visible sur le site !';
  if (action === 'update') return 'Les modifications sont désormais visibles sur le site !';
  if (action === 'delete') return 'La ressource a bien été retirée du site.';
  return '';
}

/**
 * Formats a suggestion for email display
 * @param {Partial<Suggestion>} s
 */
export function formatSuggestionForEmail(s) {
  const catLabel = CATEGORY_LABELS[s.category || ''] || s.category || 'Inconnu';
  const actionLabel = ACTION_LABELS[s.action || ''] || s.action || 'Inconnu';
  const actionLabelDetailed = ACTION_LABELS_DETAILED[s.action || ''] || actionLabel;
  const dateStr = s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : 'Inconnue';
  const successMessage = getSuccessMessage(s.action || '');

  return {
    title: s.title || 'Sans titre',
    catLabel,
    actionLabel,
    actionLabelDetailed,
    dateStr,
    successMessage,
    summary: `${catLabel} • ${actionLabel} • Envoyé le ${dateStr}`
  };
}
