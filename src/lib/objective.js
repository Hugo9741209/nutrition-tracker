// ============================================================================
//  NutriTrack — Analyse d'objectif personnalisée (BACKEND, logique pure)
// ----------------------------------------------------------------------------
//  Le cœur de l'onglet « Objectif » : à partir des indicateurs de l'utilisateur
//  (+ données récentes éventuelles), produit un RAPPORT COMPLET et personnalisé.
//  Tout est dérivé scientifiquement — l'utilisateur ne saisit aucun chiffre cible.
//  Le front affiche ce rapport ; il ne calcule rien.
// ============================================================================
import { recommendTargets, calcBMI, estimateWeightTrendKg } from './nutrition'
import { projectWeightGoal, computeWeeklyInsights } from './insights'
import { generateRecommendations } from './coach'

// Catégorie d'IMC (OMS) + libellé bienveillant.
export function bmiCategory(bmi) {
  if (bmi < 18.5) return { key: 'maigreur', label: 'Corpulence basse' }
  if (bmi < 25)   return { key: 'normal', label: 'Corpulence normale' }
  if (bmi < 30)   return { key: 'surpoids', label: 'Surpoids' }
  return { key: 'obesite', label: 'Obésité' }
}

// Hydratation conseillée (EFSA 2010 ~35 ml/kg/j, hors effort), en ml + verres (250 ml).
export function hydrationTarget(weightKg) {
  const mlPerDay = Math.round(weightKg * 35)
  return { mlPerDay, liters: +(mlPerDay / 1000).toFixed(1), glasses: Math.round(mlPerDay / 250) }
}

// Rapport d'objectif complet.
//   profile : { current_weight_kg|weight_kg, height_cm, age, gender, activity_level, goal,
//               target_weight_kg?, body_fat_pct?, goalUpdatedAt? }
//   data    : { foodLogs?, weightLogs? } (optionnel → enrichit avec l'adhérence réelle)
export function analyzeObjective(profile = {}, { foodLogs = [], weightLogs = [] } = {}) {
  const targets = recommendTargets(profile)
  if (!targets.ready) return { ready: false, missing: targets.missing }

  const weight = profile.weight_kg ?? profile.current_weight_kg
  const bmi = +calcBMI({ weight_kg: weight, height_cm: profile.height_cm }).toFixed(1)

  // Rythme prévu par le plan calorique (signé : <0 = perte), via Wishnofsky.
  const plannedWeeklyKg = estimateWeightTrendKg((targets.targetCalories - targets.tdee) * 7).kg

  // Date estimée d'atteinte de l'objectif de poids (si cible définie).
  const projection = profile.target_weight_kg != null
    ? projectWeightGoal({ currentKg: weight, targetKg: profile.target_weight_kg, weeklyKg: plannedWeeklyKg })
    : null

  // Adhérence réelle (si des repas sont déjà loggés).
  const insights = foodLogs.length
    ? computeWeeklyInsights(foodLogs, {
        targets: { calories: targets.targetCalories, protein_g: targets.macros.protein_g },
        tdee: targets.tdee,
      })
    : null

  const recommendations = generateRecommendations({
    profile: { ...profile, current_weight_kg: weight },
    insights,
  })

  return {
    ready: true,
    targets,                                   // calories + macros + sécurité + méthode + incertitude
    bmi: { value: bmi, ...bmiCategory(bmi) },
    proteinPerKg: +(targets.macros.protein_g / weight).toFixed(2),
    hydration: hydrationTarget(weight),
    plannedWeeklyKg: +plannedWeeklyKg.toFixed(2), // rythme prévu par le plan (kg/sem, signé)
    projection,                                // { weeks, targetDate, ... } ou null
    insights,                                  // adhérence récente ou null
    recommendations,                           // conseils bienveillants
  }
}
