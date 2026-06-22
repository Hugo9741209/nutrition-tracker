import { describe, it, expect } from 'vitest'
import { runFuelingPlan } from './fueling.js'

describe('runFuelingPlan', () => {
  it('sortie courte (<1h) : pas de carburant pendant, mais récup', () => {
    const p = runFuelingPlan({ weightKg: 70, durationMin: 40 })
    expect(p.during).toBeNull()
    expect(p.recovery.carbs_g).toBe(77)    // 1,1 × 70
    expect(p.recovery.protein_g).toBe(19)  // 0,275 × 70 ≈ 19
  })
  it('sortie 1-2h : 40 g glucides/h pendant', () => {
    const p = runFuelingPlan({ weightKg: 70, durationMin: 90 })
    expect(p.during.gCarbsPerHour).toBe(40)
    expect(p.during.totalCarbsG).toBe(60)  // 40 × 1,5h
  })
  it('sortie > 2h : 60 g glucides/h', () => {
    expect(runFuelingPlan({ weightKg: 70, durationMin: 180 }).during.gCarbsPerHour).toBe(60)
  })
  it('séance < 20 min : pas de plan de récup', () => {
    expect(runFuelingPlan({ weightKg: 70, durationMin: 10 }).recovery).toBeNull()
  })
})
