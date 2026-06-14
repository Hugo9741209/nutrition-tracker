// ============================================================================
//  NutriTrack — Moteur de recommandations (BACKEND : conseils sourcés)
// ----------------------------------------------------------------------------
//  Transforme les données (profil + bilan hebdo) en conseils ACTIONNABLES,
//  sourcés et BIENVEILLANTS (jamais culpabilisants — cf. script front §6.5).
//  Logique PURE, testable. Le front affiche les cartes, il ne les génère pas.
//
//  Chaque reco : { id, level, title, message }
//    level : 'good' (positif) | 'info' (neutre/astuce) | 'warn' (vigilance douce)
// ============================================================================

const RECALIBRATE_WEEKS = 6           // recalibrer toutes les 4-6 sem (BMR baisse)
const PROTEIN_TARGET_GPERKG = 1.6     // ISSN 2017 : 1,4-2,0 g/kg (cible basse sportif)
const SAFE_WEEKLY_LOSS_KG = 0.5       // perte saine ~0,5 kg/sem

// goalUpdatedAt : ISO string ou Date. Renvoie true si l'objectif date de > 6 sem.
export function shouldRecalibrate(goalUpdatedAt, weeks = RECALIBRATE_WEEKS) {
  if (!goalUpdatedAt) return false
  const w = (Date.now() - new Date(goalUpdatedAt).getTime()) / (1000 * 60 * 60 * 24 * 7)
  return w > weeks
}

// Inputs :
//   profile  : { current_weight_kg, goal, target_calories, target_protein_g, goalUpdatedAt }
//   insights : sortie de computeWeeklyInsights { nDays, avgCalories, avgProtein, daysInTarget, weightTrend }
//   water    : { glasses, target } (optionnel)
export function generateRecommendations({ profile = {}, insights = null, water = null } = {}) {
  const recos = []
  const weight = profile.current_weight_kg

  // Pas encore assez de données → message d'amorçage neutre.
  if (!insights || insights.nDays === 0) {
    recos.push({
      id: 'getting_started',
      level: 'info',
      title: 'Commence à suivre tes repas',
      message: 'Note tes repas quelques jours : les conseils personnalisés arrivent dès que j’ai de la donnée.',
    })
    return recos
  }

  // 1. Protéines (g/kg) — ISSN 2017.
  if (weight && insights.avgProtein != null) {
    const gPerKg = insights.avgProtein / weight
    if (gPerKg < PROTEIN_TARGET_GPERKG) {
      const cible = Math.round(PROTEIN_TARGET_GPERKG * weight)
      recos.push({
        id: 'protein_low',
        level: 'warn',
        title: 'Protéines un peu justes',
        message: `Tu es à ~${gPerKg.toFixed(1)} g/kg. Pour préserver le muscle, vise ~${cible} g/j (1,6 g/kg, réf. ISSN 2017).`,
      })
    } else {
      recos.push({
        id: 'protein_ok',
        level: 'good',
        title: 'Protéines au top',
        message: `~${gPerKg.toFixed(1)} g/kg : c’est dans la zone idéale pour un sportif. Continue comme ça.`,
      })
    }
  }

  // 2. Régularité (jours dans la cible) — renforcement positif non toxique.
  if (insights.daysInTarget != null && insights.nDays > 0) {
    const ratio = insights.daysInTarget / insights.nDays
    if (ratio >= 0.7) {
      recos.push({
        id: 'consistency_good',
        level: 'good',
        title: 'Belle régularité',
        message: `${insights.daysInTarget}/${insights.nDays} jours dans ta cible. La constance compte plus que la perfection.`,
      })
    } else {
      recos.push({
        id: 'consistency_info',
        level: 'info',
        title: 'Vise la régularité, pas la perfection',
        message: 'Quelques jours hors cible, c’est normal. L’objectif : une tendance stable sur la semaine, sans te culpabiliser.',
      })
    }
  }

  // 3. Vitesse de perte — garde-fou doux (perte saine ~0,5 kg/sem).
  if (profile.goal === 'lose_weight' && insights.weightTrend?.kg != null && insights.nDays >= 3) {
    const weeklyKg = (insights.weightTrend.kg / insights.nDays) * 7 // <0 = perte
    if (weeklyKg < -SAFE_WEEKLY_LOSS_KG) {
      recos.push({
        id: 'deficit_steep',
        level: 'warn',
        title: 'Déficit peut-être trop rapide',
        message: `Tendance estimée ~${weeklyKg.toFixed(1)} kg/sem (modèle approximatif). Au-delà de 0,5 kg/sem, on perd plus de muscle. Pense à remonter un peu les calories.`,
      })
    }
  }

  // 4. Recalibrage périodique — le BMR baisse avec la perte de poids.
  if (shouldRecalibrate(profile.goalUpdatedAt)) {
    recos.push({
      id: 'recalibrate',
      level: 'info',
      title: 'Recalcule ton objectif',
      message: 'Ton objectif date de plus de 6 semaines. Comme le métabolisme s’adapte, un recalcul (bouton « Calculer auto ») garde tes cibles justes.',
    })
  }

  // 5. Hydratation — rappel doux.
  if (water && water.target && water.glasses < water.target) {
    recos.push({
      id: 'hydration',
      level: 'info',
      title: 'Pense à boire',
      message: `${water.glasses}/${water.target} verres aujourd’hui. L’hydratation soutient la performance et la récupération.`,
    })
  }

  return recos
}
