import { describe, it, expect } from 'vitest'
import { groupByDay, computeWeeklyInsights, projectWeightGoal, computePeriodSummary } from './insights.js'

const logs = [
  { logged_date: '2026-06-10', calories: 600, protein_g: 40, carbs_g: 60, fat_g: 20 },
  { logged_date: '2026-06-10', calories: 900, protein_g: 50, carbs_g: 90, fat_g: 30 },
  { logged_date: '2026-06-11', calories: 1500, protein_g: 90, carbs_g: 150, fat_g: 50 },
]

describe('groupByDay', () => {
  it('regroupe et somme par date', () => {
    const g = groupByDay(logs)
    expect(Object.keys(g)).toHaveLength(2)
    expect(g['2026-06-10'].calories).toBe(1500)
    expect(g['2026-06-11'].calories).toBe(1500)
  })
})

describe('computeWeeklyInsights', () => {
  it('moyennes journalières correctes', () => {
    const r = computeWeeklyInsights(logs, {})
    expect(r.nDays).toBe(2)
    expect(r.avgCalories).toBe(1500) // (1500 + 1500) / 2
  })
  it('compte les jours dans la cible ±10%', () => {
    // cible 1500 → fourchette [1350, 1650]. Les 2 jours sont à 1500 → 2 jours.
    const r = computeWeeklyInsights(logs, { targets: { calories: 1500 } })
    expect(r.daysInTarget).toBe(2)
  })
  it('tendance poids = déficit/surplus / 7700, marquée approximate', () => {
    // 2 jours à 1500 = 3000 kcal ; tdee 2000 × 2 = 4000 → balance -1000 → -0,13 kg
    const r = computeWeeklyInsights(logs, { tdee: 2000 })
    expect(r.weightTrend.model).toBe('approximate')
    expect(r.weightTrend.kg).toBeCloseTo(-0.13, 2)
  })
  it('gère une période vide', () => {
    const r = computeWeeklyInsights([], {})
    expect(r.nDays).toBe(0)
    expect(r.weightTrend).toBeNull()
  })
})

describe('projectWeightGoal', () => {
  it('estime le nombre de semaines (perte)', () => {
    const r = projectWeightGoal({ currentKg: 80, targetKg: 75, weeklyKg: -0.5 })
    expect(r.weeks).toBe(10)
    expect(r.model).toBe('approximate')
  })
  it('détecte une tendance dans le mauvais sens', () => {
    const r = projectWeightGoal({ currentKg: 80, targetKg: 75, weeklyKg: 0.3 })
    expect(r.wrongDirection).toBe(true)
    expect(r.weeks).toBeNull()
  })
  it('objectif déjà atteint', () => {
    expect(projectWeightGoal({ currentKg: 75, targetKg: 75, weeklyKg: -0.5 }).reached).toBe(true)
  })
  it('données manquantes → null', () => {
    expect(projectWeightGoal({ currentKg: 80 })).toBeNull()
  })
})

describe('computePeriodSummary (mensuel)', () => {
  const food = [
    { logged_date: '2026-06-01', calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 60 },
    { logged_date: '2026-06-02', calories: 2000, protein_g: 150, carbs_g: 200, fat_g: 60 },
  ]
  const weights = [
    { logged_date: '2026-06-01', weight_kg: 80 },
    { logged_date: '2026-06-15', weight_kg: 79 },
  ]
  it('compte les jours suivis et le score moyen', () => {
    const r = computePeriodSummary(food, weights, { targets: { calories: 2000, protein_g: 150 } })
    expect(r.daysLogged).toBe(2)
    expect(r.avgScore).toBe(100)
  })
  it('calcule la variation de poids réelle', () => {
    const r = computePeriodSummary(food, weights, {})
    expect(r.weightDelta).toEqual({ from: 80, to: 79, deltaKg: -1 })
  })
  it('weightDelta null si moins de 2 relevés', () => {
    expect(computePeriodSummary(food, [{ logged_date: '2026-06-01', weight_kg: 80 }], {}).weightDelta).toBeNull()
  })
})
