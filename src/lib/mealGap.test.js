import { describe, it, expect, vi } from 'vitest'
vi.mock('./supabase', () => ({ supabase: {} }))
import { remainingMacros, portionForNutrient, macroBalanceTip } from './mealGap.js'

describe('remainingMacros', () => {
  it('cible − consommé, jamais négatif', () => {
    const r = remainingMacros(
      { calories: 2500, protein_g: 160, carbs_g: 300, fat_g: 80 },
      { calories: 1800, protein_g: 120, carbs_g: 350, fat_g: 50 },
    )
    expect(r).toEqual({ calories: 700, protein_g: 40, carbs_g: 0, fat_g: 30 }) // carbs dépassés → 0
  })
})

describe('portionForNutrient', () => {
  it('calcule les grammes pour atteindre le manque protéique', () => {
    // poulet 31 g/100g, manque 40 g → ~129 g, ~213 kcal (165/100*129)
    const p = portionForNutrient({ per100g: { protein_g: 31, calories: 165 } }, 40, 'protein_g')
    expect(p.grams).toBe(129)
    expect(p.addsCalories).toBe(213)
  })
  it('null si l\'aliment ne contient pas le nutriment', () => {
    expect(portionForNutrient({ per100g: { protein_g: 0, calories: 50 } }, 40)).toBeNull()
  })
})

describe('macroBalanceTip', () => {
  it('pointe le macro le plus en retard', () => {
    const tip = macroBalanceTip(
      { protein_g: 60, carbs_g: 10, fat_g: 5 },
      { protein_g: 160, carbs_g: 300, fat_g: 80 },
    )
    expect(tip.focus).toBe('protein_g') // 60/160=0.375 > carbs 0.03 > fat 0.06
    expect(tip.message).toMatch(/protéines/)
  })
  it('message rassurant si proche des cibles', () => {
    const tip = macroBalanceTip({ protein_g: 5, carbs_g: 5, fat_g: 2 }, { protein_g: 160, carbs_g: 300, fat_g: 80 })
    expect(tip.focus).toBeNull()
  })
})
