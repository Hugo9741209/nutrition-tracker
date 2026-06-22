// ============================================================================
//  NutriTrack — Daily Brief (BACKEND, agrégateur du jour)
// ----------------------------------------------------------------------------
//  Compose en UN objet tout ce qu'il faut pour un dashboard intelligent du jour :
//  cibles, énergie dépensée en sport aujourd'hui (Strava), cibles ajustées si
//  jour chargé, ce qu'il reste à manger, et le conseil prioritaire. Pur/testable.
//  Les suggestions d'aliments (CIQUAL, async) restent dans mealGap.suggestProteinFoods.
// ============================================================================
import { recommendTargets } from './nutrition'
import { adjustTargetsForRun } from './training'
import { activeEnergyForDay } from './health'
import { remainingMacros, macroBalanceTip } from './mealGap'
import { dailyBalanceScore } from './score'

// profile      : indicateurs (poids/taille/âge/sexe/activité/objectif…)
// todaysActivities : activités Strava du jour [{type,distanceKm,durationMin,...}]
// consumed     : cumul du jour { calories, protein_g, carbs_g, fat_g }
export function dailyBrief(profile = {}, { todaysActivities = [], consumed = {} } = {}) {
  const base = recommendTargets(profile)
  if (!base.ready) return { ready: false, missing: base.missing }

  const weightKg = profile.weight_kg ?? profile.current_weight_kg
  const activeEnergyToday = activeEnergyForDay(todaysActivities, { weightKg })

  // Cibles du jour : base + énergie sportive (glucides en priorité) si jour chargé.
  const day = adjustTargetsForRun(base, activeEnergyToday)
  const dayTargets = { calories: day.targetCalories, ...day.macros }

  const remaining = remainingMacros(dayTargets, consumed)
  const tip = macroBalanceTip(remaining, dayTargets)
  const { score, label } = dailyBalanceScore({
    totals: consumed,
    targets: { calories: dayTargets.calories, protein_g: dayTargets.protein_g },
  })

  return {
    ready: true,
    isTrainingDay: day.isTrainingDay,
    activeEnergyToday,           // kcal brûlées en sport aujourd'hui (info honnête)
    baseTargets: { calories: base.targetCalories, ...base.macros },
    dayTargets,                  // cibles du jour (majorées si sport)
    consumed,
    remaining,                   // ce qu'il reste à manger
    tip,                         // conseil prioritaire bienveillant
    score, scoreLabel: label,    // jauge d'équilibre du jour
    method: base.method, marginPct: base.marginPct, // honnêteté incertitude
  }
}
