import { describe, it, expect, vi } from 'vitest'
vi.mock('./supabase', () => ({ supabase: {} }))
import { cleanProductLabel, scoreMatch, bestMatch } from './foodMatch.js'
import { detectColumns } from '../../scripts/import-ciqual.mjs'

describe('detectColumns (CIQUAL) — ne confond pas "avec fibres (kJ)" et "Fibres alimentaires"', () => {
  it('choisit la vraie colonne fibres', () => {
    const headers = [
      'alim_code', 'alim_nom_fr',
      'Energie, N x facteur Jones, avec fibres (kJ/100 g)',
      'Energie, Règlement UE (kcal/100 g)',
      'Protéines, N x facteur de Jones (g/100 g)',
      'Glucides (g/100 g)', 'Lipides (g/100 g)', 'Fibres alimentaires (g/100 g)',
    ]
    const c = detectColumns(headers)
    expect(c.fiber).toBe('Fibres alimentaires (g/100 g)')
    expect(c.kcal).toContain('kcal')
  })
})

describe('cleanProductLabel', () => {
  it('retire marque, poids et marketing', () => {
    expect(cleanProductLabel('BANANE BIO U 1KG').toLowerCase()).toBe('banane')
  })
  it('retire les quantités x6 / 2x125g', () => {
    expect(cleanProductLabel('YAOURT NATURE 2x125g').toLowerCase()).toContain('yaourt')
    expect(cleanProductLabel('YAOURT NATURE 2x125g')).not.toMatch(/125|2x/i)
  })
  it('retire la ponctuation', () => {
    expect(cleanProductLabel('RIZ BASMATI - 500 g')).toMatch(/riz basmati/i)
  })
})

describe('scoreMatch', () => {
  it('1 quand tous les mots de la requête sont dans le candidat', () => {
    expect(scoreMatch('banane bio U', 'Banane crue')).toBe(1)
  })
  it('partiel quand recouvrement partiel', () => {
    expect(scoreMatch('riz basmati', 'Riz blanc cuit')).toBeCloseTo(0.5, 2)
  })
  it('0 si aucun mot commun', () => {
    expect(scoreMatch('saumon', 'Brocoli cuit')).toBe(0)
  })
})

describe('bestMatch', () => {
  it('choisit le meilleur candidat', () => {
    const candidates = [
      { food_name: 'Brocoli cuit' },
      { food_name: 'Banane crue' },
      { food_name: 'Pomme' },
    ]
    const { candidate, score } = bestMatch('banane', candidates)
    expect(candidate.food_name).toBe('Banane crue')
    expect(score).toBeGreaterThan(0)
  })
  it('aucun candidat → score 0', () => {
    expect(bestMatch('xyz', []).score).toBe(0)
  })
})
