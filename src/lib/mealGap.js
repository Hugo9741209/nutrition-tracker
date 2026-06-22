// ============================================================================
//  NutriTrack — Coach « combler le manque » (BACKEND, logique + CIQUAL)
// ----------------------------------------------------------------------------
//  À partir de ce qui reste à atteindre dans la journée (macros), suggère des
//  PORTIONS concrètes d'aliments (CIQUAL) — surtout pour les protéines, le
//  point le plus souvent manquant chez le sportif. Concret et actionnable.
// ============================================================================
import { supabase } from './supabase'
import { normalizeCiqual } from './foods'

// Reste à manger aujourd'hui = cible − consommé (jamais négatif).
export function remainingMacros(targets = {}, consumed = {}) {
  const r = (k) => Math.max(0, Math.round((targets[k] ?? 0) - (consumed[k] ?? 0)))
  return { calories: r('calories'), protein_g: r('protein_g'), carbs_g: r('carbs_g'), fat_g: r('fat_g') }
}

// Grammes d'un aliment pour apporter `gramsNeeded` g d'un nutriment donné.
//   food.per100g[key] = teneur /100g. Renvoie null si l'aliment n'en contient pas.
export function portionForNutrient(food, gramsNeeded, key = 'protein_g') {
  const per100 = food?.per100g?.[key]
  if (!per100 || per100 <= 0 || gramsNeeded <= 0) return null
  const grams = Math.round((gramsNeeded / per100) * 100)
  return {
    grams,
    addsCalories: Math.round(((food.per100g.calories ?? 0) * grams) / 100),
  }
}

// Conseil bienveillant : quel macro est le plus en retard, en % de la cible.
export function macroBalanceTip(remaining = {}, targets = {}) {
  const ratios = ['protein_g', 'carbs_g', 'fat_g']
    .map((k) => ({ k, pct: targets[k] ? remaining[k] / targets[k] : 0 }))
    .sort((a, b) => b.pct - a.pct)
  const top = ratios[0]
  const labels = { protein_g: 'protéines', carbs_g: 'glucides', fat_g: 'lipides' }
  if (!top || top.pct < 0.15) return { focus: null, message: 'Tu es proche de tes cibles, beau travail.' }
  return {
    focus: top.k,
    message: `Il te reste surtout des ${labels[top.k]} à couvrir aujourd'hui (${remaining[top.k]} g).`,
  }
}

// Suggère des aliments riches en protéines (CIQUAL) + la portion pour combler le manque.
export async function suggestProteinFoods(remainingProteinG, { limit = 5, maxKcal = 1000 } = {}) {
  if (!remainingProteinG || remainingProteinG <= 0) return []
  const { data, error } = await supabase
    .from('ciqual_foods')
    .select('*')
    .gte('protein_g', 15)        // sources protéiques denses
    .lte('calories', maxKcal)    // évite huiles/fruits à coque ultra-caloriques
    .order('protein_g', { ascending: false })
    .limit(limit * 3)
  if (error || !data) return []

  return data
    .map(normalizeCiqual)
    .map((f) => {
      const p = portionForNutrient(f, remainingProteinG, 'protein_g')
      return p ? { food_name: f.food_name, per100g: f.per100g, grams: p.grams, addsCalories: p.addsCalories } : null
    })
    .filter(Boolean)
    .sort((a, b) => a.addsCalories - b.addsCalories) // privilégie le plus "léger" en kcal
    .slice(0, limit)
}
