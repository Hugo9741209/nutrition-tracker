// ============================================================================
//  NutriTrack — Analyse de dépense énergétique (BACKEND, pur) — onglet Santé
// ----------------------------------------------------------------------------
//  Transforme une liste d'activités (Strava, Coros via Strava, ou saisie) en
//  dépense énergétique, avec un niveau de FIABILITÉ honnête :
//   - Course : fiable (coût énergétique distance × poids).
//   - Musculation : calories de montre PEU FIABLES → estimation prudente, flaggée.
//  Sert à alimenter la nutrition (jours chargés = manger plus) sans surinterpréter.
// ============================================================================
import { runEnergyKcal } from './training'

const STRENGTH_MET = 5.0 // musculation, effort modéré (Compendium of Physical Activities)

// Énergie d'une activité.
//   activity : { type, distanceKm?, durationMin?, calories? }
//   type reconnu : 'run'/'course', 'strength'/'muscu'/'weight', sinon 'autre'
// Renvoie { kcal, type, reliability, source }.
export function activityEnergyKcal(activity = {}, { weightKg } = {}) {
  const t = String(activity.type ?? '').toLowerCase()

  if (t.includes('run') || t.includes('cours')) {
    return {
      kcal: runEnergyKcal({ weightKg, distanceKm: activity.distanceKm, durationMin: activity.durationMin }),
      type: 'course', reliability: 'high', source: 'coût énergétique course (fiable)',
    }
  }

  if (t.includes('strength') || t.includes('muscu') || t.includes('weight')) {
    // On préfère une estimation MET prudente ; les calories de montre sont peu fiables.
    const kcal = activity.durationMin
      ? Math.round((STRENGTH_MET * 3.5 * (weightKg ?? 0) / 200) * activity.durationMin)
      : Math.round(activity.calories ?? 0)
    return { kcal, type: 'musculation', reliability: 'low', source: 'estimation muscu (peu fiable)' }
  }

  return {
    kcal: Math.round(activity.calories ?? 0),
    type: 'autre',
    reliability: activity.calories ? 'medium' : 'low',
    source: 'valeur fournie',
  }
}

// Énergie "active" d'une journée, pondérée par la FIABILITÉ : on compte 100% de
// la course (fiable) mais seulement une fraction de la muscu (estimation peu
// fiable) pour ne pas surévaluer ce qu'on peut "manger en plus" un jour chargé.
export function activeEnergyForDay(activities = [], { weightKg, strengthFactor = 0.5 } = {}) {
  let kcal = 0
  for (const a of activities) {
    const e = activityEnergyKcal(a, { weightKg })
    kcal += e.type === 'course' ? e.kcal : Math.round(e.kcal * strengthFactor)
  }
  return kcal
}

// Dépense hebdomadaire agrégée par type, avec moyenne/jour et avertissement fiabilité.
//   activities : tableau d'activités de la période (ex. 7 jours)
export function weeklyExpenditure(activities = [], { weightKg, days = 7 } = {}) {
  const byType = {}
  let totalKcal = 0
  let hasStrength = false

  for (const a of activities) {
    const e = activityEnergyKcal(a, { weightKg })
    totalKcal += e.kcal
    byType[e.type] = (byType[e.type] ?? 0) + e.kcal
    if (e.type === 'musculation') hasStrength = true
  }

  return {
    totalKcal,
    byType,                                  // { course, musculation, autre }
    count: activities.length,
    dailyAvgKcal: Math.round(totalKcal / days),
    reliabilityNote: hasStrength
      ? 'Course fiable ; calories de musculation = estimation prudente, à ne pas surinterpréter.'
      : 'Dépense de course fiable (distance × poids).',
  }
}
