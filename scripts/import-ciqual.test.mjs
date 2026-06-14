import { describe, it, expect } from 'vitest'
import { normHeader, frNumber, sqlStr, detectColumns, mapRow, buildSql } from './import-ciqual.mjs'

describe('frNumber (format français)', () => {
  it('virgule décimale', () => expect(frNumber('1,5')).toBe(1.5))
  it('traces / tiret / vide → 0', () => {
    expect(frNumber('traces')).toBe(0)
    expect(frNumber('-')).toBe(0)
    expect(frNumber('')).toBe(0)
  })
  it('"< 0,5" → 0.5', () => expect(frNumber('< 0,5')).toBe(0.5))
  it('espaces milliers', () => expect(frNumber(' 1 234,5 ')).toBe(1234.5))
  it('nombre déjà numérique', () => expect(frNumber(42)).toBe(42))
})

describe('sqlStr', () => {
  it('double les apostrophes', () => expect(sqlStr("Huile d'olive")).toBe("'Huile d''olive'"))
})

describe('normHeader / detectColumns', () => {
  it('repère les colonnes CIQUAL malgré accents/casse', () => {
    const headers = [
      'alim_code', 'alim_nom_fr',
      'Energie, Règlement UE N° 1169/2011 (kcal/100 g)',
      'Protéines, N x facteur de Jones (g/100 g)',
      'Glucides (g/100 g)', 'Lipides (g/100 g)', 'Fibres alimentaires (g/100 g)',
    ]
    const c = detectColumns(headers)
    expect(c.code).toBe('alim_code')
    expect(c.name).toBe('alim_nom_fr')
    expect(c.kcal).toContain('Energie')
    expect(c.protein).toContain('Protéines')
    expect(c.carbs).toBe('Glucides (g/100 g)')
    expect(c.fat).toBe('Lipides (g/100 g)')
    expect(c.fiber).toContain('Fibres')
  })
})

describe('mapRow + buildSql', () => {
  const cols = { code: 'alim_code', name: 'alim_nom_fr', kcal: 'kcal', protein: 'p', carbs: 'g', fat: 'l', fiber: 'f' }
  it('mappe une ligne en entrée ciqual_foods', () => {
    const row = mapRow({ alim_code: '13000', alim_nom_fr: 'Banane crue', kcal: '89,0', p: '1,1', g: '23', l: '0,3', f: '2,6' }, cols)
    expect(row).toEqual({ code: 'ciqual_13000', food_name: 'Banane crue', calories: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3, fiber_g: 2.6 })
  })
  it('ignore une ligne sans nom ou sans code', () => {
    expect(mapRow({ alim_code: '', alim_nom_fr: 'X', kcal: '1' }, cols)).toBeNull()
  })
  it('génère du SQL avec ON CONFLICT', () => {
    const sql = buildSql([{ code: 'ciqual_1', food_name: 'Riz', calories: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.6 }])
    expect(sql).toContain('INSERT INTO public.ciqual_foods')
    expect(sql).toContain('ON CONFLICT (code) DO NOTHING')
    expect(sql).toContain("'Riz'")
  })
})
