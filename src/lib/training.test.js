import { describe, it, expect } from 'vitest'
import { runEnergyKcal, adjustTargetsForRun } from './training.js'

describe('runEnergyKcal', () => {
  it('par distance : ~1,03 kcal/kg/km', () => {
    expect(runEnergyKcal({ weightKg: 80, distanceKm: 10 })).toBe(824) // 80*10*1,03
  })
  it('par durée si pas de distance (MET course)', () => {
    // 9,8*3,5*80/200 = 13,72 kcal/min × 30 = 412
    expect(runEnergyKcal({ weightKg: 80, durationMin: 30 })).toBe(412)
  })
  it('0 si données insuffisantes', () => {
    expect(runEnergyKcal({ weightKg: 80 })).toBe(0)
    expect(runEnergyKcal({})).toBe(0)
  })
})

describe('adjustTargetsForRun', () => {
  const base = { targetCalories: 3000, macros: { protein_g: 160, carbs_g: 350, fat_g: 80 } }

  it('jour de course : ajoute l\'énergie, surtout en glucides', () => {
    const r = adjustTargetsForRun(base, 800)
    expect(r.isTrainingDay).toBe(true)
    expect(r.targetCalories).toBe(3800)              // 3000 + 800
    expect(r.extra.carbs_g).toBe(130)                // 800*0,65/4
    expect(r.extra.protein_g).toBe(30)               // 800*0,15/4
    expect(r.extra.fat_g).toBe(18)                   // 800*0,20/9
    expect(r.macros.carbs_g).toBe(480)               // 350 + 130
  })

  it('jour sans course : cibles inchangées', () => {
    const r = adjustTargetsForRun(base, 0)
    expect(r.isTrainingDay).toBe(false)
    expect(r.targetCalories).toBe(3000)
    expect(r.macros).toEqual(base.macros)
  })
})
