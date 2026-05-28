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
 * Formats a suggestion for email display
 * @param {Partial<Suggestion>} s
 */
export function formatSuggestionForEmail(s) {
  const catLabel = CATEGORY_LABELS[s.category || ''] || s.category || 'Inconnu';
  const actionLabel = ACTION_LABELS[s.action || ''] || s.action || 'Inconnu';
  const dateStr = s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : 'Inconnue';

  return {
    title: s.title || 'Sans titre',
    catLabel,
    actionLabel,
    dateStr,
    summary: `${catLabel} • ${actionLabel} • Envoyé le ${dateStr}`
  };
}
