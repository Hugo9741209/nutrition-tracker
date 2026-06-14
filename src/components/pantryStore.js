import { useState, useEffect } from 'react'

// Garde-manger persisté en localStorage (MVP sans backend). Chaque item garde,
// si reconnu, ses valeurs CIQUAL /100g pour permettre un log au journal en 1 tap.
// Item : { id, label, qty, per100g?: {calories,protein_g,carbs_g,fat_g,fiber_g}, ciqualName? }
const LS_KEY = 'nutritrack_pantry'

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

export function useLocalPantry() {
  const [items, setItems] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)) } catch { /* ignore */ }
  }, [items])

  function addMany(newItems) {
    setItems((cur) => {
      const out = [...cur]
      for (const it of newItems) {
        const i = out.findIndex((x) => x.label.toLowerCase() === it.label.toLowerCase())
        if (i >= 0) out[i] = { ...out[i], ...it, id: out[i].id } // maj (garde l'id)
        else out.push({ ...it, id: crypto.randomUUID() })
      }
      return out
    })
  }

  function remove(id) {
    setItems((cur) => cur.filter((x) => x.id !== id))
  }

  return { items, addMany, remove }
}
