import { describe, it, expect } from 'vitest'
import { buildShoppingList, shoppingListToText } from './shopping.js'

describe('buildShoppingList', () => {
  it('additionne les quantités d\'un même aliment (insensible casse/accents)', () => {
    const list = buildShoppingList([
      { food_name: 'Banane', quantity_g: 120 },
      { food_name: 'banane', quantity_g: 100 },
      { food_name: 'Œuf', quantity_g: 60 },
    ])
    expect(list).toHaveLength(2)
    const banane = list.find((i) => i.food_name.toLowerCase() === 'banane')
    expect(banane.quantity_g).toBe(220)
  })
  it('ignore les entrées sans nom et trie alphabétiquement', () => {
    const list = buildShoppingList([
      { food_name: 'Tomate', quantity_g: 50 },
      { quantity_g: 100 },
      { food_name: 'Avocat', quantity_g: 80 },
    ])
    expect(list.map((i) => i.food_name)).toEqual(['Avocat', 'Tomate'])
  })
})

describe('shoppingListToText', () => {
  it('rend une liste lisible', () => {
    const txt = shoppingListToText([{ food_name: 'Banane', quantity_g: 220 }])
    expect(txt).toBe('- Banane : 220 g')
  })
})
