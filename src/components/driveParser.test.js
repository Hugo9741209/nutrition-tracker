import { describe, it, expect } from 'vitest'
import { parseDriveOrder } from './driveParser'

// Extrait représentatif d'un email de confirmation Drive Super U.
const SAMPLE = `Détails de la commande
Fruits et Légumes (2)
Orange à dessert Barberina, calibre 5/6, catégorie 1, 2kg
Quantité : 1
4,99 €
Prix unitaire : 4,99 €
2,50 €/kg
Kiwi Hayward - Lande - La pièce
Quantité : 7
7,70 €
Prix unitaire : 1,10 €
1,10 €/pce
Viandes, poissons (1)
Steak haché pur boeuf 5%MG CHARAL - 2x130g - 260g
Quantité : 2
14,48 €
Prix unitaire : 7,24 €
27,85 €/kg`

describe('parseDriveOrder', () => {
  it('reconnaît chaque produit (ancre "Quantité : N")', () => {
    const items = parseDriveOrder(SAMPLE)
    expect(items).toHaveLength(3)
    expect(items[0].name).toMatch(/^Orange à dessert/)
  })

  it('ignore les en-têtes de rayon', () => {
    const names = parseDriveOrder(SAMPLE).map(i => i.name)
    expect(names).not.toContain('Fruits et Légumes (2)')
    expect(names).not.toContain('Viandes, poissons (1)')
  })

  it('extrait la quantité et le prix', () => {
    const kiwi = parseDriveOrder(SAMPLE).find(i => i.name.includes('Kiwi'))
    expect(kiwi.count).toBe(7)
    expect(kiwi.qty).toBe('x7')
    expect(kiwi.price).toBe(7.70)
  })

  it('combine multiplicateur et poids dans qty', () => {
    const steak = parseDriveOrder(SAMPLE).find(i => i.name.includes('Steak'))
    expect(steak.count).toBe(2)
    expect(steak.qty).toContain('x2')
    expect(steak.qty).toContain('130 g') // 1er poids rencontré dans le nom
  })

  it('renvoie [] sur une entrée vide ou non reconnue', () => {
    expect(parseDriveOrder('')).toEqual([])
    expect(parseDriveOrder('texte sans produit')).toEqual([])
  })
})
