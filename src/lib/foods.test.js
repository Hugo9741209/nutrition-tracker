import { describe, it, expect, vi } from 'vitest'

// Évite l'init d'un vrai client Supabase (pas d'env vars en test).
vi.mock('./supabase', () => ({ supabase: {} }))

import { normalizeOFF, normalizeCiqual, dedupeFoods, toLogEntry } from './foods.js'

describe('normalizeOFF', () => {
  it('mappe un produit OFF exploitable (kcal directe)', () => {
    const r = normalizeOFF({
      code: '123', product_name: 'Biscuits', brands: 'MarqueX',
      nutriments: { 'energy-kcal_100g': 450, proteins_100g: 6, carbohydrates_100g: 60, fat_100g: 20, fiber_100g: 3 },
    })
    expect(r.source).toBe('openfoodfacts')
    expect(r.reliability).toBe('variable')
    expect(r.per100g).toEqual({ calories: 450, protein_g: 6, carbs_g: 60, fat_g: 20, fiber_g: 3 })
  })
  it('convertit l\'énergie en kJ → kcal si pas de kcal directe', () => {
    const r = normalizeOFF({ product_name: 'X', nutriments: { energy_100g: 418.4 } })
    expect(r.per100g.calories).toBe(100) // 418,4 / 4,184
  })
  it('rejette un produit sans nom, sans nutriments ou sans énergie', () => {
    expect(normalizeOFF({ nutriments: { 'energy-kcal_100g': 100 } })).toBeNull()
    expect(normalizeOFF({ product_name: 'X' })).toBeNull()
    expect(normalizeOFF({ product_name: 'X', nutriments: {} })).toBeNull()
  })
})

describe('normalizeCiqual', () => {
  it('mappe une ligne CIQUAL en fiabilité haute', () => {
    const r = normalizeCiqual({ code: 'cq_banane', food_name: 'Banane', calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, fiber_g: 2.6 })
    expect(r.source).toBe('ciqual')
    expect(r.reliability).toBe('high')
    expect(r.sourceCode).toBe('cq_banane')
    expect(r.per100g.calories).toBe(89)
  })
})

describe('dedupeFoods', () => {
  it('garde CIQUAL plutôt qu\'OFF pour un même nom', () => {
    const ciqual = { source: 'ciqual', reliability: 'high', food_name: 'Banane', brand: '', per100g: {} }
    const off = { source: 'openfoodfacts', reliability: 'variable', food_name: 'banane', brand: '', per100g: {} }
    const out = dedupeFoods([off, ciqual])
    expect(out).toHaveLength(1)
    expect(out[0].source).toBe('ciqual')
  })
  it('conserve des aliments de noms différents', () => {
    const a = { source: 'ciqual', reliability: 'high', food_name: 'Banane', brand: '', per100g: {} }
    const b = { source: 'ciqual', reliability: 'high', food_name: 'Pomme', brand: '', per100g: {} }
    expect(dedupeFoods([a, b])).toHaveLength(2)
  })
})

describe('toLogEntry', () => {
  it('scale les nutriments /100g à la quantité réelle', () => {
    const food = { source: 'ciqual', food_name: 'Banane', brand: '', per100g: { calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, fiber_g: 2.6 } }
    const entry = toLogEntry(food, 200, 'snack')
    expect(entry.calories).toBe(178)        // 89 × 2
    expect(entry.quantity_g).toBe(200)
    expect(entry.meal_type).toBe('snack')
    expect(entry.source).toBe('ciqual')
  })
})
