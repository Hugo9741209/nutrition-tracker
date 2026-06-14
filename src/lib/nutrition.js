// Calcul BMR — Mifflin-St Jeor (formule la plus précise)
export function calcBMR({ weight_kg, height_cm, age, gender }) {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age
  return gender === 'female' ? base - 161 : base + 5
}

const ACTIVITY_MULTIPLIERS = {
  sedentary:    1.2,   // bureautique, peu de sport
  light:        1.375, // 1-2 séances/semaine
  moderate:     1.55,  // 3-4 séances/semaine
  very_active:  1.725, // 5-6 séances/semaine (ton cas)
  extra_active: 1.9,   // 2x/jour ou travail physique
}

// TDEE = dépense calorique journalière totale (Mifflin uniquement)
export function calcTDEE({ weight_kg, height_cm, age, gender, activity_level }) {
  return Math.round(calcBMR({ weight_kg, height_cm, age, gender }) * (ACTIVITY_MULTIPLIERS[activity_level] ?? 1.55))
}

// TDEE method-aware : Katch-McArdle si % masse grasse fiable, sinon Mifflin.
// computeBMR (défini plus bas) choisit la méthode ET l'incertitude. À privilégier
// dès qu'on dispose éventuellement de body_fat_pct (ex. garde-fous, rapport TDEE).
export function tdeeFromProfile({ weight_kg, height_cm, age, gender, activity_level, body_fat_pct }) {
  const { value: bmr } = computeBMR({ weight_kg, height_cm, age, gender, body_fat_pct })
  return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activity_level] ?? 1.55))
}

// Honnêteté scientifique : Mifflin-St Jeor est précise à ±10% de la dépense réelle.
// On ne doit JAMAIS présenter le TDEE comme un chiffre exact à l'unité.
// Renvoie la fourchette honnête à afficher autour d'un TDEE.
const TDEE_MARGIN = 0.10 // ±10% (interne : l'affichage g/kg & repères vit dans nutritionDisplay côté front)
export function tdeeRange(tdee) {
  return {
    low:  Math.round(tdee * (1 - TDEE_MARGIN)),
    high: Math.round(tdee * (1 + TDEE_MARGIN)),
  }
}

// Objectifs caloriques selon le goal
export function calcTargetCalories(tdee, goal) {
  if (goal === 'lose_weight')  return Math.round(tdee * 0.8)   // déficit 20%
  if (goal === 'gain_muscle')  return Math.round(tdee * 1.1)   // surplus 10%
  return tdee
}

// Répartition macros recommandée selon objectif
export function calcMacros(targetCalories, goal, weight_kg) {
  let proteinRatio, carbRatio, fatRatio

  if (goal === 'gain_muscle') {
    proteinRatio = 0.30; carbRatio = 0.45; fatRatio = 0.25
  } else if (goal === 'lose_weight') {
    proteinRatio = 0.35; carbRatio = 0.40; fatRatio = 0.25
  } else {
    proteinRatio = 0.25; carbRatio = 0.50; fatRatio = 0.25
  }

  // Minimum recommandé : 1.8g de protéines par kg de poids (sportif actif)
  const minProteinG = Math.round(weight_kg * 1.8)
  const calcProteinG = Math.round((targetCalories * proteinRatio) / 4)

  const protein_g = Math.max(minProteinG, calcProteinG)
  const fat_g     = Math.round((targetCalories * fatRatio) / 9)
  const carbs_g   = Math.round((targetCalories - protein_g * 4 - fat_g * 9) / 4)

  return { protein_g, carbs_g, fat_g }
}

// NB : les repères g/kg endurance (PROTEIN_ENDURANCE_RANGE, CARBS_*, perKg, inRange)
// sont des helpers d'AFFICHAGE → ils vivent côté front dans components/nutritionDisplay.js
// (cf. CONTRAT_AGENTS.md). Le backend n'expose ici que calcul + sécurité.

export const ACTIVITY_LABELS = {
  sedentary:    'Sédentaire (peu ou pas de sport)',
  light:        'Légèrement actif (1-2 séances/semaine)',
  moderate:     'Modérément actif (3-4 séances/semaine)',
  very_active:  'Très actif (5-6 séances/semaine)',
  extra_active: 'Extrêmement actif (athlète / 2x/jour)',
}

export const GOAL_LABELS = {
  lose_weight:  'Perte de poids',
  maintain:     'Maintien',
  gain_muscle:  'Prise de muscle',
}

// ===========================================================================
//  [AGENT BACKEND] Couche sourcée — incertitude, angles morts, garde-fous.
//  Ajouts additifs : n'altère aucune fonction existante.
// ===========================================================================

// Table des sources scientifiques (citée par les constantes ci-dessous).
export const SOURCES = {
  bmrMifflin: 'Mifflin-St Jeor (1990) — J Am Diet Assoc 1990;90(3):375-81 (±10%)',
  bmrKatch:   'Katch-McArdle — uniquement si % masse grasse fiable (±12%)',
  ansesFloor: 'ANSES — plancher 1500 kcal H / 1200 kcal F',
  proteinRDA: 'RDA OMS 2007 — plancher protéines 0,83 g/kg/j',
  deficit:    'Bornes saines — ~0,5 kg/sem max (déficit 500 kcal/j)',
}

// BMR Katch-McArdle (masse maigre) — si % masse grasse fiable. Source: bmrKatch.
export function calcBMRKatch({ weight_kg, body_fat_pct }) {
  const leanKg = weight_kg * (1 - body_fat_pct / 100)
  return 370 + 21.6 * leanKg
}

// Choix méthode + incertitude. Katch si body_fat_pct fourni, sinon Mifflin.
export function computeBMR(profile) {
  if (profile.body_fat_pct != null && profile.body_fat_pct > 0) {
    return { value: calcBMRKatch(profile), method: 'katch_mcardle', marginPct: 12 }
  }
  return { value: calcBMR(profile), method: 'mifflin_st_jeor', marginPct: 10 }
}

export function calcBMI({ weight_kg, height_cm }) {
  const m = height_cm / 100
  return weight_kg / (m * m)
}

// Angles morts de Mifflin-St Jeor (cas où la formule sur/sous-estime).
export function detectBlindSpot({ age, weight_kg, height_cm, body_fat_pct }) {
  if (calcBMI({ weight_kg, height_cm }) > 35) return 'high_bmi'
  if (age > 65) return 'over_65'
  if (body_fat_pct != null && body_fat_pct < 10) return 'very_muscular'
  return null
}

export const BLIND_SPOT_LABELS = {
  high_bmi:      'IMC > 35 : Mifflin-St Jeor surestime souvent (masse grasse vs maigre).',
  over_65:       "Plus de 65 ans : estimation possiblement trop élevée (perte musculaire).",
  very_muscular: 'Masse grasse très basse : estimation à recouper, profil très musclé.',
}

// GARDE-FOUS — refuse un objectif dangereux. JAMAIS contournable par payload.
export const SAFETY = {
  minKcalMale: 1500, minKcalFemale: 1200,  // ANSES
  minProteinGPerKg: 0.83,                   // RDA OMS 2007
  maxDeficitKcal: 500, maxSurplusKcal: 300, // bornes saines
}

// Retourne { ok, violations:[{code,message}] } pour que l'UI affiche un bandeau.
export function checkGoalSafety({ tdee, targetCalories, gender, weight_kg, protein_g }) {
  const violations = []
  const floor = gender === 'female' ? SAFETY.minKcalFemale : SAFETY.minKcalMale
  if (targetCalories < floor)
    violations.push({ code: 'BELOW_ANSES_FLOOR', message: `Objectif (${targetCalories} kcal/j) sous le plancher ANSES de ${floor} kcal/j.` })
  if (tdee - targetCalories > SAFETY.maxDeficitKcal)
    violations.push({ code: 'DEFICIT_TOO_STEEP', message: `Déficit de ${tdee - targetCalories} kcal/j : > 500 kcal/j déconseillé.` })
  if (targetCalories - tdee > SAFETY.maxSurplusKcal)
    violations.push({ code: 'SURPLUS_TOO_LARGE', message: `Surplus de ${targetCalories - tdee} kcal/j : > 300 kcal/j = prise de gras.` })
  if (protein_g != null && weight_kg) {
    const minP = Math.round(SAFETY.minProteinGPerKg * weight_kg)
    if (protein_g < minP)
      violations.push({ code: 'PROTEIN_BELOW_RDA', message: `Protéines (${protein_g} g/j) sous le plancher RDA de ${minP} g/j.` })
  }
  return { ok: violations.length === 0, violations }
}

// Scaling des nutriments : les bases (CIQUAL/OFF) donnent des valeurs /100g.
// On scale toujours à la quantité réelle ici (logique, pas dans l'UI brute).
export function scaleNutrients(per100g, quantityG) {
  const r = quantityG / 100
  return {
    calories:  Math.round((per100g.calories ?? 0) * r),
    protein_g: +((per100g.protein_g ?? 0) * r).toFixed(1),
    carbs_g:   +((per100g.carbs_g ?? 0) * r).toFixed(1),
    fat_g:     +((per100g.fat_g ?? 0) * r).toFixed(1),
    fiber_g:   +((per100g.fiber_g ?? 0) * r).toFixed(1),
  }
}

export function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0]
}

export function todayStr() {
  return formatDate(new Date())
}
