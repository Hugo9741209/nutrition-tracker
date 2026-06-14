// ============================================================================
//  NutriTrack — Score d'équilibre quotidien (BACKEND, logique pure)
// ----------------------------------------------------------------------------
//  Résume en un chiffre 0-100 à quel point la journée colle aux cibles.
//  Cadrage BIENVEILLANT (cf. script front §6.5) : informatif, jamais punitif.
//  Calories proches de la cible + protéines atteintes = bon équilibre.
// ============================================================================

// Score calorique : 100 si à la cible, décroît avec l'écart (0 à ±50%).
function calorieScore(calories, target) {
  if (!target) return null
  const dev = Math.abs(calories - target) / target
  return Math.max(0, Math.round(100 * (1 - dev / 0.5)))
}

// Score protéines : atteindre la cible = 100 (pas de pénalité si on dépasse).
function proteinScore(protein, target) {
  if (!target) return null
  return Math.min(100, Math.round((protein / target) * 100))
}

// Libellé bienveillant selon le score (aucun terme négatif/culpabilisant).
export function scoreLabel(score) {
  if (score >= 85) return 'Excellent équilibre'
  if (score >= 70) return 'Bonne journée'
  if (score >= 50) return 'Sur la bonne voie'
  return 'À ajuster en douceur'
}

// totals  : { calories, protein_g }  (cumul du jour)
// targets : { calories, protein_g }  (cibles du profil)
// Pondération : calories 60%, protéines 40%. Renvoie { score, calorieScore, proteinScore, label }.
export function dailyBalanceScore({ totals = {}, targets = {} } = {}) {
  const cal = calorieScore(totals.calories ?? 0, targets.calories)
  const prot = proteinScore(totals.protein_g ?? 0, targets.protein_g)

  const parts = []
  if (cal != null) parts.push({ v: cal, w: 0.6 })
  if (prot != null) parts.push({ v: prot, w: 0.4 })
  if (parts.length === 0) return { score: null, calorieScore: cal, proteinScore: prot, label: null }

  const wSum = parts.reduce((a, p) => a + p.w, 0)
  const score = Math.round(parts.reduce((a, p) => a + p.v * p.w, 0) / wSum)
  return { score, calorieScore: cal, proteinScore: prot, label: scoreLabel(score) }
}
