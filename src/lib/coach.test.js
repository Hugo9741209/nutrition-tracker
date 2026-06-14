import { describe, it, expect } from 'vitest'
import { shouldRecalibrate, generateRecommendations } from './coach.js'

const ids = (recos) => recos.map((r) => r.id)

describe('shouldRecalibrate', () => {
  it('vrai si > 6 semaines', () => {
    const old = new Date(Date.now() - 50 * 24 * 3600 * 1000).toISOString()
    expect(shouldRecalibrate(old)).toBe(true)
  })
  it('faux si récent ou absent', () => {
    expect(shouldRecalibrate(new Date().toISOString())).toBe(false)
    expect(shouldRecalibrate(null)).toBe(false)
  })
})

describe('generateRecommendations', () => {
  it('amorçage si pas de données', () => {
    expect(ids(generateRecommendations({ insights: { nDays: 0 } }))).toContain('getting_started')
  })

  it('protéines basses → warn avec cible', () => {
    const r = generateRecommendations({
      profile: { current_weight_kg: 80 },
      insights: { nDays: 7, avgProtein: 96, daysInTarget: 5 }, // 1,2 g/kg
    })
    expect(ids(r)).toContain('protein_low')
  })

  it('protéines suffisantes → good', () => {
    const r = generateRecommendations({
      profile: { current_weight_kg: 80 },
      insights: { nDays: 7, avgProtein: 144, daysInTarget: 5 }, // 1,8 g/kg
    })
    expect(ids(r)).toContain('protein_ok')
  })

  it('déficit trop rapide → warn', () => {
    const r = generateRecommendations({
      profile: { current_weight_kg: 80, goal: 'lose_weight' },
      insights: { nDays: 7, avgProtein: 144, daysInTarget: 5, weightTrend: { kg: -1.0, model: 'approximate' } },
    })
    expect(ids(r)).toContain('deficit_steep')
  })

  it('recalibrage si objectif ancien', () => {
    const old = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString()
    const r = generateRecommendations({
      profile: { current_weight_kg: 80, goalUpdatedAt: old },
      insights: { nDays: 7, avgProtein: 144, daysInTarget: 6 },
    })
    expect(ids(r)).toContain('recalibrate')
  })

  it('hydratation insuffisante → info', () => {
    const r = generateRecommendations({
      profile: { current_weight_kg: 80 },
      insights: { nDays: 7, avgProtein: 144, daysInTarget: 6 },
      water: { glasses: 3, target: 8 },
    })
    expect(ids(r)).toContain('hydration')
  })
})
