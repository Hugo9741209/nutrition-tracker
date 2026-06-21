// Helpers d'affichage partagés (frontend). Centralise ce qui était dupliqué
// dans plusieurs pages (dates, libellés de repas, couleurs de reco).

// Date ISO 'YYYY-MM-DD' → format français lisible.
export function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Libellés des repas (clé DB → affichage).
export const MEAL_LABELS = {
  breakfast: 'Petit-déjeuner',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
}

// Version courte (sélecteurs, chips).
export const MEAL_LABELS_SHORT = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
  snack: 'Collation',
}

// Couleur d'une recommandation du coach selon son niveau.
export const RECO_COLOR = {
  success: 'text-green-400',
  warn: 'text-amber-400',
  warning: 'text-amber-400',
  info: 'text-slate-300',
}
