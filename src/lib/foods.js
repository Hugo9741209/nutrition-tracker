// ============================================================================
//  NutriTrack — Recherche d'aliments (BACKEND : intégration sources externes)
// ----------------------------------------------------------------------------
//  Fusionne CIQUAL (ANSES, fiabilité élevée) + Open Food Facts (fiabilité
//  variable). Chaque résultat porte sa `source` et sa `reliability` pour que
//  l'UI puisse l'indiquer (cf. script §4/§9). CIQUAL est prioritaire.
//  Forme normalisée /100g → le scaling à la quantité réelle passe par
//  scaleNutrients (nutrition.js), côté "serveur" logique.
// ============================================================================
import { supabase } from './supabase'
import { scaleNutrients } from './nutrition'

// --- Normalisation Open Food Facts → forme unifiée -------------------------
// OFF renvoie des produits bruts ; on ne garde que ceux exploitables.
export function normalizeOFF(product) {
  const n = product?.nutriments
  if (!product?.product_name || !n) return null
  const kcal = n['energy-kcal_100g'] ?? (n.energy_100g != null ? n.energy_100g / 4.184 : null)
  if (kcal == null) return null
  return {
    source: 'openfoodfacts',
    sourceCode: product.code ?? null,
    reliability: 'variable',           // produits packagés, qualité hétérogène
    food_name: product.product_name,
    brand: product.brands ?? '',
    per100g: {
      calories: Math.round(kcal),
      protein_g: +(n.proteins_100g ?? 0),
      carbs_g: +(n.carbohydrates_100g ?? 0),
      fat_g: +(n.fat_100g ?? 0),
      fiber_g: +(n.fiber_100g ?? 0),
    },
  }
}

// --- Normalisation ligne CIQUAL → forme unifiée ----------------------------
export function normalizeCiqual(row) {
  return {
    source: 'ciqual',
    sourceCode: row.code,
    reliability: 'high',               // base FR officielle ANSES
    food_name: row.food_name,
    brand: '',
    per100g: {
      calories: Math.round(row.calories ?? 0),
      protein_g: +(row.protein_g ?? 0),
      carbs_g: +(row.carbs_g ?? 0),
      fat_g: +(row.fat_g ?? 0),
      fiber_g: +(row.fiber_g ?? 0),
    },
  }
}

// Clé de déduplication : nom normalisé (+ marque). Insensible casse/accents.
function dedupeKey(food) {
  return `${food.food_name}|${food.brand}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// Déduplique en gardant la source la plus fiable (CIQUAL > OFF).
export function dedupeFoods(foods) {
  const byKey = new Map()
  for (const f of foods) {
    const k = dedupeKey(f)
    const existing = byKey.get(k)
    if (!existing) { byKey.set(k, f); continue }
    if (existing.reliability !== 'high' && f.reliability === 'high') byKey.set(k, f)
  }
  return [...byKey.values()]
}

// Convertit un aliment unifié + quantité en entrée prête pour food_logs.
// Le scaling /100g → quantité réelle est centralisé ici (jamais côté UI brute).
export function toLogEntry(food, quantityG, mealType) {
  const scaled = scaleNutrients(food.per100g, quantityG)
  return {
    food_name: food.food_name,
    brand: food.brand ?? '',
    quantity_g: quantityG,
    ...scaled,
    meal_type: mealType,
    source: food.source,        // traçabilité de la source en base
  }
}

// --- Recherche CIQUAL (Supabase) -------------------------------------------
async function searchCiqual(query, limit) {
  const { data, error } = await supabase
    .from('ciqual_foods')
    .select('*')
    .ilike('food_name', `%${query}%`)
    .limit(limit)
  if (error || !data) return []
  return data.map(normalizeCiqual)
}

// --- Recherche Open Food Facts ---------------------------------------------
async function searchOFF(query, limit) {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&json=1&page_size=${limit}&fields=code,product_name,brands,nutriments`
  try {
    const res = await fetch(url)
    const json = await res.json()
    return (json.products ?? []).map(normalizeOFF).filter(Boolean)
  } catch {
    return [] // réseau OFF indispo → on dégrade proprement (CIQUAL seul)
  }
}

// Recherche publique : CIQUAL d'abord, complétée par OFF, dédupliquée.
export async function searchFoods(query, { limit = 8 } = {}) {
  if (!query || query.trim().length < 2) return []
  const [ciqual, off] = await Promise.all([
    searchCiqual(query, limit),
    searchOFF(query, limit),
  ])
  return dedupeFoods([...ciqual, ...off]).slice(0, limit * 2)
}

// --- Recherche par code-barres (scan) --------------------------------------
// Valide un code-barres (EAN/UPC : 8 à 14 chiffres). Renvoie null si invalide.
export function sanitizeBarcode(raw) {
  const code = String(raw ?? '').trim()
  return /^\d{8,14}$/.test(code) ? code : null
}

// Lookup OFF par code-barres → aliment normalisé (ou null si non trouvé).
export async function getFoodByBarcode(raw) {
  const code = sanitizeBarcode(raw)
  if (!code) return null
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`)
    const json = await res.json()
    if (json.status !== 1 || !json.product) return null
    return normalizeOFF({ ...json.product, code })
  } catch {
    return null
  }
}

// Libellés de fiabilité pour l'UI (le front choisit le rendu).
export const RELIABILITY_LABELS = {
  high: 'CIQUAL · base officielle ANSES',
  variable: 'Open Food Facts · fiabilité variable',
}
