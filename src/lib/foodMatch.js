// ============================================================================
//  NutriTrack — Matching libellé produit → aliment (BACKEND)
// ----------------------------------------------------------------------------
//  Prend un libellé brut de ticket/commande Super U (ex. "BANANE BIO U 1KG")
//  et le relie à un aliment CIQUAL/OFF pour en déduire les nutriments.
//  Le parsing de l'email (extraction des libellés) reste côté front ;
//  ici on NETTOIE le nom, on SCORE la correspondance, on renvoie le match.
// ============================================================================
import { supabase } from './supabase'
import { normalizeCiqual } from './foods'

// Normalise pour comparaison : minuscules, sans accents, espaces simples.
function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Mots marketing/marque à retirer du libellé (liste volontairement courte).
const STOP = new Set([
  'bio', 'u', 'les', 'le', 'la', 'de', 'du', 'des', 'au', 'aux', 'en',
  'promo', 'lot', 'pack', 'x', 'frais', 'fraiche', 'frais', 'nature',
  'qualite', 'superieure', 'premium', 'bon', 'mariniere', 'eco', 'extra',
])

// Nettoie un libellé produit : retire poids/quantités, ponctuation, marketing.
// Renvoie une chaîne lisible (accents conservés pour l'affichage).
export function cleanProductLabel(raw) {
  let s = String(raw ?? '')
  // Retire quantités/poids : 500g, 1,5 kg, 75cl, x6, 2x125g, 6 pièces...
  s = s.replace(/\b\d+([.,]\d+)?\s?(g|kg|mg|ml|cl|l)\b/gi, ' ')
  s = s.replace(/\b\d+\s?(x|pieces?|pcs?|tranches?|sachets?)\b/gi, ' ')
  s = s.replace(/\bx\s?\d+\b/gi, ' ')
  s = s.replace(/[®™*+()/\-_.,;:]/g, ' ')
  // Retire les mots de la stoplist (sur version normalisée, mais on garde l'original).
  const kept = s
    .split(/\s+/)
    .filter((w) => w && !STOP.has(norm(w)) && !/\d/.test(w)) // retire tout token chiffré (quantités)
  return kept.join(' ').replace(/\s+/g, ' ').trim()
}

// Score de correspondance 0..1 entre un libellé requête et un nom candidat.
// Basé sur le recouvrement de tokens (insensible casse/accents).
export function scoreMatch(query, name) {
  const q = new Set(norm(cleanProductLabel(query)).split(' ').filter(Boolean))
  const n = new Set(norm(name).split(' ').filter(Boolean))
  if (q.size === 0 || n.size === 0) return 0
  let shared = 0
  for (const t of q) if (n.has(t)) shared++
  // Recouvrement relatif à la requête, bonus si le candidat est concis.
  return shared / q.size
}

// Meilleur candidat parmi une liste { food_name, ... }. Renvoie { candidate, score }.
export function bestMatch(query, candidates) {
  let best = null
  let bestScore = 0
  for (const c of candidates ?? []) {
    const s = scoreMatch(query, c.food_name)
    if (s > bestScore) { bestScore = s; best = c }
  }
  return { candidate: best, score: bestScore }
}

// Token le plus significatif (le plus long) pour pré-filtrer en base.
function mainToken(query) {
  return norm(cleanProductLabel(query))
    .split(' ')
    .filter((w) => w.length >= 3)
    .sort((a, b) => b.length - a.length)[0] ?? ''
}

// Matche un libellé brut → aliment CIQUAL. Renvoie
//   { match: <aliment normalisé>, confidence, suggestedPortionG } ou null.
//   minScore : seuil sous lequel on considère qu'il n'y a pas de match fiable.
export async function matchFoodByName(rawLabel, { minScore = 0.5, suggestedPortionG = 100 } = {}) {
  const token = mainToken(rawLabel)
  if (!token) return null
  const { data, error } = await supabase
    .from('ciqual_foods')
    .select('*')
    .ilike('food_name', `%${token}%`)
    .limit(25)
  if (error || !data?.length) return null

  const { candidate, score } = bestMatch(rawLabel, data)
  if (!candidate || score < minScore) return null
  return {
    match: normalizeCiqual(candidate),
    confidence: +score.toFixed(2),
    suggestedPortionG,
  }
}
