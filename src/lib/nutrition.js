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

// TDEE = dépense calorique journalière totale
export function calcTDEE({ weight_kg, height_cm, age, gender, activity_level }) {
  return Math.round(calcBMR({ weight_kg, height_cm, age, gender }) * (ACTIVITY_MULTIPLIERS[activity_level] ?? 1.55))
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

export function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0]
}

export function todayStr() {
  return formatDate(new Date())
}
