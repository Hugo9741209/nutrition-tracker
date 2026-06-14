// ============================================================================
//  NutriTrack — Bilan hebdomadaire (BACKEND : agrégats + tendances)
// ----------------------------------------------------------------------------
//  Logique PURE (testable) : prend les logs alimentaires d'une période + les
//  cibles, renvoie moyennes, jours dans la cible, macros, et tendance poids
//  estimée (Wishnofsky, marquée "approximate"). Le front affiche, il ne calcule pas.
// ============================================================================
import { estimateWeightTrendKg, tdeeRange } from './nutrition'

// Somme des nutriments d'une liste de logs.
function sumLogs(logs) {
  return logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (+l.calories || 0),
      protein_g: acc.protein_g + (+l.protein_g || 0),
      carbs_g: acc.carbs_g + (+l.carbs_g || 0),
      fat_g: acc.fat_g + (+l.fat_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  )
}

// Regroupe les logs par date (logged_date) → { 'YYYY-MM-DD': totaux }.
export function groupByDay(logs) {
  const byDay = {}
  for (const l of logs) {
    const d = l.logged_date
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(l)
  }
  const out = {}
  for (const [d, list] of Object.entries(byDay)) out[d] = sumLogs(list)
  return out
}

// Bilan complet sur une période.
//   logs        : food_logs de la période
//   targets     : { calories, protein_g } (cibles user)
//   tdee        : dépense estimée (pour la tendance poids)
//   tolerancePct: marge "dans la cible" (défaut ±10%)
export function computeWeeklyInsights(logs, { targets, tdee, tolerancePct = 0.1 } = {}) {
  const byDay = groupByDay(logs)
  const days = Object.values(byDay)
  const nDays = days.length

  if (nDays === 0) {
    return { nDays: 0, avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0,
             daysInTarget: 0, weightTrend: null, calorieRange: null }
  }

  const total = days.reduce(
    (a, d) => ({
      calories: a.calories + d.calories, protein_g: a.protein_g + d.protein_g,
      carbs_g: a.carbs_g + d.carbs_g, fat_g: a.fat_g + d.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  )

  const avgCalories = Math.round(total.calories / nDays)

  // Jours dans la cible calorique (±tolerancePct).
  let daysInTarget = 0
  if (targets?.calories) {
    const lo = targets.calories * (1 - tolerancePct)
    const hi = targets.calories * (1 + tolerancePct)
    daysInTarget = days.filter((d) => d.calories >= lo && d.calories <= hi).length
  }

  // Tendance poids : balance calorique totale vs TDEE × nb jours (Wishnofsky).
  let weightTrend = null
  if (tdee) {
    const balance = total.calories - tdee * nDays // <0 = déficit → perte
    weightTrend = estimateWeightTrendKg(balance)  // { kg, model: 'approximate' }
  }

  return {
    nDays,
    avgCalories,
    avgProtein: Math.round(total.protein_g / nDays),
    avgCarbs: Math.round(total.carbs_g / nDays),
    avgFat: Math.round(total.fat_g / nDays),
    daysInTarget,
    weightTrend,
    calorieRange: tdee ? tdeeRange(tdee) : null, // pour rappeler l'incertitude ±10%
  }
}

// Projection d'objectif de poids — APPROXIMATIVE (basée sur la tendance estimée).
//   currentKg, targetKg : poids actuel et cible
//   weeklyKg            : variation hebdo estimée (<0 = perte), ex. depuis weightTrend
// Renvoie { reached, wrongDirection, weeks, targetDate, model } ou null si données manquantes.
export function projectWeightGoal({ currentKg, targetKg, weeklyKg } = {}) {
  if (currentKg == null || targetKg == null) return null
  const delta = targetKg - currentKg            // <0 = il faut perdre
  if (Math.abs(delta) < 0.1) return { reached: true, weeks: 0, model: 'approximate' }
  if (!weeklyKg || weeklyKg === 0) return { reached: false, weeks: null, model: 'approximate' }

  // La tendance va-t-elle dans le bon sens ? (perdre & weeklyKg<0, ou prendre & >0)
  const wrongDirection = Math.sign(delta) !== Math.sign(weeklyKg)
  if (wrongDirection) return { reached: false, wrongDirection: true, weeks: null, model: 'approximate' }

  const weeks = Math.ceil(Math.abs(delta) / Math.abs(weeklyKg))
  const targetDate = new Date(Date.now() + weeks * 7 * 24 * 3600 * 1000)
  return {
    reached: false,
    wrongDirection: false,
    weeks,
    targetDate: targetDate.toISOString().split('T')[0],
    model: 'approximate',
  }
}
