import { describe, it, expect } from 'vitest'
import { toCSV, foodLogsToCSV, weightLogsToCSV, exportFilename } from './export.js'

describe('toCSV', () => {
  it('génère en-tête + lignes', () => {
    const csv = toCSV(
      [{ a: 1, b: 'x' }, { a: 2, b: 'y' }],
      [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
    )
    expect(csv).toBe('A,B\n1,x\n2,y')
  })
  it('échappe virgules, guillemets et retours ligne', () => {
    const csv = toCSV([{ x: 'a,b' }, { x: 'dit "ok"' }], [{ key: 'x', label: 'X' }])
    expect(csv).toBe('X\n"a,b"\n"dit ""ok"""')
  })
  it('gère une liste vide (en-tête seul)', () => {
    expect(toCSV([], [{ key: 'a', label: 'A' }])).toBe('A')
  })
})

describe('foodLogsToCSV', () => {
  it('contient les colonnes attendues et les valeurs', () => {
    const csv = foodLogsToCSV([
      { logged_date: '2026-06-14', meal_type: 'lunch', food_name: 'Banane', brand: '', quantity_g: 120, calories: 107, protein_g: 1.3, carbs_g: 27.6, fat_g: 0.4, fiber_g: 3.1 },
    ])
    expect(csv.split('\n')[0]).toContain('Date')
    expect(csv).toContain('Banane')
    expect(csv).toContain('107')
  })
})

describe('weightLogsToCSV', () => {
  it('sérialise le poids', () => {
    const csv = weightLogsToCSV([{ logged_date: '2026-06-14', weight_kg: 75.2, note: '' }])
    expect(csv).toContain('75.2')
  })
})

describe('exportFilename', () => {
  it('nom de fichier daté', () => {
    expect(exportFilename('journal', new Date('2026-06-14T10:00:00Z'))).toBe('nutritrack-journal-2026-06-14.csv')
  })
})
