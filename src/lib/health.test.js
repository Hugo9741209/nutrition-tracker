import { describe, it, expect } from 'vitest'
import { activityEnergyKcal, weeklyExpenditure } from './health.js'

describe('activityEnergyKcal', () => {
  it('course → fiable, via distance', () => {
    const e = activityEnergyKcal({ type: 'Run', distanceKm: 10 }, { weightKg: 80 })
    expect(e.kcal).toBe(824)
    expect(e.type).toBe('course')
    expect(e.reliability).toBe('high')
  })
  it('musculation → estimation peu fiable (flag low)', () => {
    const e = activityEnergyKcal({ type: 'WeightTraining', durationMin: 60 }, { weightKg: 80 })
    expect(e.type).toBe('musculation')
    expect(e.reliability).toBe('low')
    expect(e.kcal).toBeGreaterThan(0)
  })
  it('autre activité → utilise les calories fournies', () => {
    const e = activityEnergyKcal({ type: 'Yoga', calories: 150 }, { weightKg: 80 })
    expect(e.kcal).toBe(150)
    expect(e.type).toBe('autre')
  })
})

describe('weeklyExpenditure', () => {
  it('agrège par type + moyenne/jour + note de fiabilité', () => {
    const acts = [
      { type: 'Run', distanceKm: 10 },          // 824
      { type: 'Run', distanceKm: 5 },           // 412
      { type: 'WeightTraining', durationMin: 60 },
    ]
    const r = weeklyExpenditure(acts, { weightKg: 80 })
    expect(r.byType.course).toBe(1236)
    expect(r.count).toBe(3)
    expect(r.dailyAvgKcal).toBe(Math.round(r.totalKcal / 7))
    expect(r.reliabilityNote).toMatch(/muscu/i)
  })
})
