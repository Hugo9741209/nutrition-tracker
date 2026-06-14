// ============================================================================
//  NutriTrack — Liste de courses (BACKEND : génération, logique pure)
// ----------------------------------------------------------------------------
//  Agrège une liste d'aliments (logs, repas, templates) en une liste de courses
//  consolidée : un même aliment voit ses quantités additionnées. Réaliste vs
//  "connexion Super U" (pas d'API publique) : on produit une liste exportable.
//  Le front affiche / coche / exporte ; il ne consolide pas.
// ============================================================================

// Clé d'agrégation : nom normalisé (insensible casse/accents).
function key(name) {
  return (name ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// entries : [{ food_name, quantity_g, brand? }] → liste consolidée triée.
export function buildShoppingList(entries) {
  const byKey = new Map()
  for (const e of entries) {
    if (!e?.food_name) continue
    const k = key(e.food_name)
    const existing = byKey.get(k)
    const qty = +e.quantity_g || 0
    if (existing) {
      existing.quantity_g += qty
    } else {
      byKey.set(k, { food_name: e.food_name, brand: e.brand ?? '', quantity_g: qty })
    }
  }
  return [...byKey.values()].sort((a, b) => a.food_name.localeCompare(b.food_name, 'fr'))
}

// Rendu texte simple, pour export / copier-coller.
export function shoppingListToText(list) {
  return list.map((i) => `- ${i.food_name} : ${i.quantity_g} g`).join('\n')
}
