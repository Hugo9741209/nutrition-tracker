import { describe, it, expect } from 'vitest'
import { dailyBalanceScore, scoreLabel } from './score.js'

describe('dailyBalanceScore', () => {
  it('journée pile dans les cibles → 100', () => {
    const r = dailyBalanceScore({ totals: { calories: 2000, protein_g: 150 }, targets: { calories: 2000, protein_g: 150 } })
    expect(r.score).toBe(100)
    expect(r.label).toBe('Excellent équilibre')
  })
  it('protéines au-delà de la cible ne pénalisent pas (cap 100)', () => {
    const r = dailyBalanceScore({ totals: { calories: 2000, protein_g: 200 }, targets: { calories: 2000, protein_g: 150 } })
    expect(r.proteinScore).toBe(100)
    expect(r.score).toBe(100)
  })
  it('écart calorique réduit le score', () => {
    // calories 50% sous la cible → calorieScore 0 ; protéines OK 100 → score 0*0.6+100*0.4=40
    const r = dailyBalanceScore({ totals: { calories: 1000, protein_g: 150 }, targets: { calories: 2000, protein_g: 150 } })
    expect(r.calorieScore).toBe(0)
    expect(r.score).toBe(40)
  })
  it('sans cibles → score null', () => {
    expect(dailyBalanceScore({ totals: { calories: 1000 }, targets: {} }).score).toBeNull()
  })
})

describe('scoreLabel', () => {
  it('libellés bienveillants par paliers', () => {
    expect(scoreLabel(90)).toBe('Excellent équilibre')
    expect(scoreLabel(75)).toBe('Bonne journée')
    expect(scoreLabel(55)).toBe('Sur la bonne voie')
    expect(scoreLabel(30)).toBe('À ajuster en douceur')
  })
})
