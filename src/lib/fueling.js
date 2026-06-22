// ============================================================================
//  NutriTrack — Plan de carburant course (BACKEND, endurance, pur)
// ----------------------------------------------------------------------------
//  Recommandations péri-effort sourcées (AND/DC/ACSM + ISSN) : combien de
//  glucides PENDANT une sortie longue, et quoi prendre en RÉCUPÉRATION.
//  Honnête : ce sont des repères populationnels, à individualiser.
// ============================================================================

export const FUELING_SOURCES = {
  during:   'ACSM — 30-60 g glucides/h pour un effort > 1 h (jusqu\'à ~90 g/h sur très longue distance)',
  recovery: 'ISSN/ACSM — récup. 1,0-1,2 g/kg glucides + 0,25-0,3 g/kg protéines dans les 1-4 h',
}

// Plan pour une sortie donnée.
//   weightKg, durationMin (durée prévue), [intensity: 'modere'|'eleve']
export function runFuelingPlan({ weightKg, durationMin = 0 } = {}) {
  const hours = durationMin / 60

  // Pendant l'effort : seulement utile au-delà d'~1 h.
  let during = null
  if (hours > 1) {
    const gPerHour = hours > 2 ? 60 : 40
    during = {
      gCarbsPerHour: gPerHour,
      totalCarbsG: Math.round(gPerHour * hours),
      tip: 'Boisson glucidique / gels toutes les 20-30 min après la 1re heure.',
    }
  }

  // Récupération : pertinente dès qu'il y a eu une vraie séance.
  let recovery = null
  if (weightKg && durationMin >= 20) {
    recovery = {
      carbs_g: Math.round(1.1 * weightKg),
      protein_g: Math.round(0.275 * weightKg),
      window: '1 à 4 h après l\'effort',
      tip: 'Ex. repas/collation glucides + protéines (riz + poulet, lait + flocons…).',
    }
  }

  return { during, recovery, sources: FUELING_SOURCES }
}
