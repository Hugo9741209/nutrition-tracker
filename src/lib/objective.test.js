import { describe, it, expect } from 'vitest'
import { analyzeObjective, bmiCategory, hydrationTarget } from './objective.js'

describe('bmiCategory', () => {
  it('paliers OMS', () => {
    expect(bmiCategory(17).key).toBe('maigreur')
    expect(bmiCategory(22).key).toBe('normal')
    expect(bmiCategory(27).key).toBe('surpoids')
    expect(bmiCategory(33).key).toBe('obesite')
  })
})

describe('hydrationTarget (EFSA ~35 ml/kg)', () => {
  it('80 kg → 2800 ml ≈ 11 verres', () => {
    const h = hydrationTarget(80)
    expect(h.mlPerDay).toBe(2800)
    expect(h.liters).toBe(2.8)
    expect(h.glasses).toBe(11)
  })
})

describe('analyzeObjective', () => {
  const profile = {
    current_weight_kg: 80, height_cm: 180, age: 20, gender: 'male',
    activity_level: 'very_active', goal: 'lose_weight', target_weight_kg: 75,
  }
  it('produit un rapport complet et personnalisé', () => {
    const r = analyzeObjective(profile)
    expect(r.ready).toBe(true)
    expect(r.targets.targetCalories).toBeGreaterThan(0)
    expect(r.bmi.value).toBeCloseTo(24.7, 1)
    expect(r.bmi.key).toBe('normal')
    expect(r.hydration.glasses).toBeGreaterThan(0)
    expect(r.proteinPerKg).toBeGreaterThan(1)
  })
  it('perte → rythme hebdo négatif + projection de date', () => {
    const r = analyzeObjective(profile)
    expect(r.plannedWeeklyKg).toBeLessThan(0)
    expect(r.projection.weeks).toBeGreaterThan(0)
    expect(r.projection.targetDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('indicateurs manquants → ready false', () => {
    expect(analyzeObjective({ age: 20 }).ready).toBe(false)
  })
})
