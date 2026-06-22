import { describe, it, expect, vi } from 'vitest'
vi.mock('./supabase', () => ({ supabase: {} })) // mealGap importe supabase
import { dailyBrief } from './dailyBrief.js'

const profile = {
  current_weight_kg: 72, height_cm: 178, age: 25, gender: 'male',
  activity_level: 'light', goal: 'gain_muscle',
}

describe('dailyBrief', () => {
  it('jour sans sport : cibles du jour = cibles de base', () => {
    const b = dailyBrief(profile, { todaysActivities: [], consumed: {} })
    expect(b.ready).toBe(true)
    expect(b.isTrainingDay).toBe(false)
    expect(b.activeEnergyToday).toBe(0)
    expect(b.dayTargets.calories).toBe(b.baseTargets.calories)
  })

  it('jour de course : énergie active comptée et cibles majorées', () => {
    const b = dailyBrief(profile, { todaysActivities: [{ type: 'Run', distanceKm: 10 }], consumed: {} })
    expect(b.activeEnergyToday).toBeGreaterThan(0)
    expect(b.dayTargets.calories).toBeGreaterThan(b.baseTargets.calories)
    expect(b.isTrainingDay).toBe(true)
  })

  it('calcule le reste à manger + un conseil', () => {
    const b = dailyBrief(profile, { consumed: { calories: 800, protein_g: 40, carbs_g: 80, fat_g: 20 } })
    expect(b.remaining.calories).toBeGreaterThan(0)
    expect(b.tip).toHaveProperty('message')
    expect(typeof b.score === 'number' || b.score === null).toBe(true)
  })

  it('indicateurs manquants → ready false', () => {
    expect(dailyBrief({ age: 25 }).ready).toBe(false)
  })
})
