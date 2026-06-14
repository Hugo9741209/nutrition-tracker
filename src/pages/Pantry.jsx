import { useState } from 'react'
import { Plus, Trash2, Utensils, ReceiptText, Boxes, X, Check } from 'lucide-react'
import { useFoodLogs } from '../hooks/useFoodLogs'
import { todayStr, scaleNutrients } from '../lib/nutrition'
import { matchFoodByName } from '../lib/foodMatch'
import { useLocalPantry } from '../components/pantryStore'
import DriveImport from '../components/DriveImport'

const MEALS = { breakfast: 'Petit-déj', lunch: 'Déjeuner', dinner: 'Dîner', snack: 'Collation' }

// Modale "j'en ai mangé" : portion + repas → log au journal du jour.
function EatModal({ item, onClose, onConfirm }) {
  const [grams, setGrams] = useState(100)
  const [meal, setMeal] = useState('lunch')
  const preview = scaleNutrients(item.per100g, +grams || 0)
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{item.ciqualName || item.label}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Quantité (g)</label>
            <input type="number" min="1" className="input" value={grams} onChange={e => setGrams(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">Repas</label>
            <select className="input" value={meal} onChange={e => setMeal(e.target.value)}>
              {Object.entries(MEALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs text-slate-400">≈ <span className="text-green-400">{preview.calories} kcal</span> · {preview.protein_g}g P · {preview.carbs_g}g G · {preview.fat_g}g L</p>
        <button onClick={() => onConfirm({ grams: +grams, meal, preview })} className="btn-primary w-full flex items-center justify-center gap-2">
          <Check size={16} /> Logger au journal
        </button>
      </div>
    </div>
  )
}

export default function Pantry({ user }) {
  const { items, addMany, remove } = useLocalPantry()
  const { addLog } = useFoodLogs(user?.id, todayStr())
  const [label, setLabel] = useState('')
  const [importing, setImporting] = useState(false)
  const [eating, setEating] = useState(null)
  const [msg, setMsg] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    const name = label.trim()
    if (!name) return
    const m = await matchFoodByName(name)
    addMany([{ label: name, qty: '', per100g: m?.match?.per100g ?? null, ciqualName: m?.match?.food_name ?? null }])
    setLabel('')
  }

  function handleImport(sel) {
    addMany(sel.map(it => ({
      label: it.name, qty: it.qty,
      per100g: it.match?.match?.per100g ?? null,
      ciqualName: it.match?.match?.food_name ?? null,
    })))
  }

  async function handleEat({ grams, meal, preview }) {
    const it = eating
    setEating(null)
    const { error } = await addLog({
      food_name: it.ciqualName || it.label, brand: '', quantity_g: grams,
      ...preview, fiber_g: preview.fiber_g ?? 0, meal_type: meal,
    })
    setMsg(error ? 'Erreur lors du log' : `✓ ${it.ciqualName || it.label} ajouté au journal`)
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Garde-manger</h1>
        <p className="text-slate-400 text-sm mt-1">Ce que tu as en stock · {items.length} produit{items.length > 1 ? 's' : ''}</p>
      </div>

      <form onSubmit={handleAdd} className="card space-y-3">
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Ajouter un produit en stock…" value={label} onChange={e => setLabel(e.target.value)} />
          <button type="submit" className="btn-primary flex items-center gap-1"><Plus size={16} /></button>
        </div>
        <button type="button" onClick={() => setImporting(true)} className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-sm">
          <ReceiptText size={16} /> Remplir depuis un ticket Drive
        </button>
        {msg && <p className={`text-xs ${msg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{msg}</p>}
      </form>

      {items.length === 0 ? (
        <div className="card text-center text-slate-500 text-sm py-8">
          <Boxes size={28} className="mx-auto mb-3 text-slate-600" />
          Ton garde-manger est vide. Ajoute un produit ou importe un ticket Drive.
        </div>
      ) : (
        <div className="card divide-y divide-slate-800">
          {items.map(it => (
            <div key={it.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{it.label}</p>
                <p className="text-xs text-slate-500">
                  {it.qty && <span>{it.qty} · </span>}
                  {it.per100g
                    ? <span className="text-green-400">{it.per100g.calories} kcal/100g</span>
                    : <span className="text-slate-600">non reconnu</span>}
                </p>
              </div>
              {it.per100g && (
                <button onClick={() => setEating(it)} title="J'en ai mangé" className="text-slate-400 hover:text-green-400 p-1.5 shrink-0">
                  <Utensils size={16} />
                </button>
              )}
              <button onClick={() => remove(it.id)} className="text-slate-600 hover:text-red-400 p-1.5 shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {importing && <DriveImport onClose={() => setImporting(false)} onConfirm={handleImport} confirmLabel="Ajouter au garde-manger" />}
      {eating && <EatModal item={eating} onClose={() => setEating(null)} onConfirm={handleEat} />}
    </div>
  )
}
