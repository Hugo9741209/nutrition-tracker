// ============================================================================
//  NutriTrack — Adaptation nutritionnelle aux jours de course (BACKEND, pur)
// ----------------------------------------------------------------------------
//  PAS du tracking de séance (ça reste sur l'app Coach). Ici : quand tu cours,
//  ta dépense augmente → tes CIBLES du jour augmentent, en priorité sur les
//  GLUCIDES (carburant de l'endurance, AND/DC/ACSM joint position).
//  Objectif prise de muscle : surplus + protéines hautes (géré en amont par
//  recommendTargets) ; ici on ajoute le "manger plus les jours de run".
// ============================================================================

// Énergie dépensée à la course.
//   - par distance : ~1,03 kcal/kg/km (coût énergétique de la course, ~constant).
//   - sinon par durée : MET course modérée ≈ 9,8 (Compendium of Physical Activities).
// Renvoie un nombre de kcal (0 si données insuffisantes).
export function runEnergyKcal({ weightKg, distanceKm, durationMin } = {}) {
  if (!weightKg) return 0
  if (distanceKm) return Math.round(weightKg * distanceKm * 1.03)
  if (durationMin) return Math.round((9.8 * 3.5 * weightKg / 200) * durationMin) // MET → kcal/min
  return 0
}

// Répartition de l'énergie supplémentaire (jour de course) :
// priorité au carburant glucidique (ACSM), un peu de protéines (récup), un peu de lipides.
const EXTRA_SPLIT = { carbs: 0.65, protein: 0.15, fat: 0.20 }

// Ajuste les cibles du jour en "rendant" l'énergie brûlée, surtout en glucides.
//   base : sortie de recommendTargets ({ targetCalories, macros:{protein_g,carbs_g,fat_g} })
//   exerciseKcal : énergie de la course (ex. via runEnergyKcal)
// Renvoie les cibles AJUSTÉES du jour + le détail de l'ajout.
export function adjustTargetsForRun(base, exerciseKcal) {
  const baseCalories = base?.targetCalories ?? 0
  const baseMacros = base?.macros ?? { protein_g: 0, carbs_g: 0, fat_g: 0 }
  const kcal = Math.max(0, Math.round(exerciseKcal || 0))

  if (kcal === 0) {
    return { isTrainingDay: false, exerciseKcal: 0, extraKcal: 0,
             targetCalories: baseCalories, macros: { ...baseMacros }, baseCalories }
  }

  const extraCarbs   = Math.round((kcal * EXTRA_SPLIT.carbs) / 4)
  const extraProtein = Math.round((kcal * EXTRA_SPLIT.protein) / 4)
  const extraFat     = Math.round((kcal * EXTRA_SPLIT.fat) / 9)

  return {
    isTrainingDay: true,
    exerciseKcal: kcal,
    extraKcal: kcal,
    baseCalories,
    targetCalories: baseCalories + kcal,
    macros: {
      protein_g: baseMacros.protein_g + extraProtein,
      carbs_g: baseMacros.carbs_g + extraCarbs,
      fat_g: baseMacros.fat_g + extraFat,
    },
    extra: { carbs_g: extraCarbs, protein_g: extraProtein, fat_g: extraFat },
  }
}
