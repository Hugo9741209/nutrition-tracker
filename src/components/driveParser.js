// Parsing d'un email de confirmation de commande Drive Super U (coursesU.com).
// FRONT (affichage) : on n'extrait que les NOMS + quantités pour pré-remplir la
// liste de courses. La correspondance nutritionnelle (CIQUAL/OFF) pour logger les
// calories = phase 2 backend. Aucune donnée nutritionnelle calculée ici.
//
// Structure réelle d'un bloc produit dans l'email :
//   <nom du produit (marque + poids)>
//   Quantité : N
//   <prix total> €
//   Prix unitaire : <pu> €
//   <prix>/kg|/l|/pce
// → ancre fiable = la ligne "Quantité : N" ; le nom est la ligne juste au-dessus.
// (Les en-têtes de rayon "Fruits et Légumes (2)" ne sont pas suivis de "Quantité".)

const QTY = /^quantit[ée]\s*:\s*(\d+)/i

// Extrait une quantité lisible depuis le nom (ex. "260g", "50cl").
function extractWeight(name) {
  const m = name.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|cl|l|ml)\b/i)
  if (m) return `${m[1].replace(',', '.')} ${m[2].toLowerCase()}`
  return ''
}

export function parseDriveOrder(raw) {
  if (!raw) return []
  const lines = raw.replace(/\r/g, '').split('\n').map((s) => s.trim()).filter(Boolean)

  const items = []
  const seen = new Set()
  for (let i = 1; i < lines.length; i++) {
    const m = lines[i].match(QTY)
    if (!m) continue
    const name = lines[i - 1]
    if (!name || name.length < 3 || /^quantit|^prix|€/i.test(name)) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const count = parseInt(m[1], 10)
    const weight = extractWeight(name)
    const qty = count > 1 ? `x${count}${weight ? ` · ${weight}` : ''}` : weight
    items.push({ name, qty, count })
  }
  return items
}
