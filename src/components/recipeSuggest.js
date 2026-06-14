// Suggestions de repas à partir du garde-manger (front pur). Petit jeu de recettes
// simples orientées sportif (protéines maigres + glucides complets). Chaque recette
// = des ingrédients-clés (mots reconnus dans les labels du stock). On suggère les
// recettes dont on a le plus d'ingrédients.
export const RECIPES = [
  { name: 'Poulet · riz · légumes verts', key: ['poulet', 'riz'], plus: ['haricot', 'brocoli', 'petits pois'], tag: 'Protéines + glucides' },
  { name: 'Steak haché · pâtes', key: ['steak', 'pâte'], plus: ['ketchup', 'tomate'], tag: 'Récup post-séance' },
  { name: 'Dinde · pommes de terre · haricots', key: ['dinde', 'pomme de terre'], plus: ['haricot'], tag: 'Assiette complète' },
  { name: 'Bowl lentilles · riz', key: ['lentille', 'riz'], plus: ['oeuf', 'tomate'], tag: 'Veggie protéiné' },
  { name: 'Porridge avoine · lait', key: ['avoine', 'lait'], plus: ['amande', 'chocolat', 'banane'], tag: 'Petit-déj énergie' },
  { name: 'Omelette · patates', key: ['oeuf', 'pomme de terre'], plus: ['fromage'], tag: 'Rapide' },
  { name: 'Poulet · lentilles', key: ['poulet', 'lentille'], plus: ['tomate'], tag: 'Fer + protéines' },
  { name: 'Pâtes · thon · tomate', key: ['pâte', 'thon'], plus: ['tomate'], tag: 'Express' },
]

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// pantryLabels : tableau de strings (labels du stock).
export function suggestRecipes(pantryLabels = []) {
  const stock = pantryLabels.map(norm)
  const has = (kw) => stock.some((l) => l.includes(norm(kw)))

  return RECIPES
    .map((r) => {
      const haveKey = r.key.filter(has)
      const haveplus = (r.plus ?? []).filter(has)
      return { ...r, haveKey, haveplus, ready: haveKey.length === r.key.length }
    })
    .filter((r) => r.haveKey.length > 0)
    .sort((a, b) => (b.ready - a.ready) || (b.haveKey.length + b.haveplus.length) - (a.haveKey.length + a.haveplus.length))
}
