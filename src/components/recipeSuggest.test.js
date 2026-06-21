import { describe, it, expect } from 'vitest'
import { suggestRecipes } from './recipeSuggest'

describe('suggestRecipes', () => {
  it('marque une recette comme prête quand tous les ingrédients-clés sont là', () => {
    const out = suggestRecipes(['Filet de poulet Le Gaulois', "Riz complet Ben's"])
    const poulet = out.find(r => r.name.includes('Poulet · riz'))
    expect(poulet).toBeTruthy()
    expect(poulet.ready).toBe(true)
  })

  it('insensible à la casse et aux accents', () => {
    const out = suggestRecipes(['PÂTES coquillettes', 'steak haché'])
    expect(out.some(r => r.name.includes('Steak'))).toBe(true)
  })

  it('ne suggère pas une recette sans aucun ingrédient-clé', () => {
    const out = suggestRecipes(['eau gazeuse'])
    expect(out).toHaveLength(0)
  })

  it('trie les recettes prêtes en premier', () => {
    const out = suggestRecipes(['avoine', 'lait', 'poulet'])
    if (out.length > 1) {
      const firstReadyIdx = out.findIndex(r => r.ready)
      const firstNotReadyIdx = out.findIndex(r => !r.ready)
      if (firstReadyIdx !== -1 && firstNotReadyIdx !== -1) {
        expect(firstReadyIdx).toBeLessThan(firstNotReadyIdx)
      }
    }
    expect(Array.isArray(out)).toBe(true)
  })
})
