import { useState, useEffect } from 'react'
import { Sparkles, Plus, X, Pencil, Check } from 'lucide-react'
import { STAPLE_PRODUCTS } from './stapleProducts'

const LS_KEY = 'nutritrack_staples'

// Panneau « Mes produits phares » — éditable par l'utilisateur, persisté en
// localStorage (pas de backend requis). Seedé avec l'analyse des commandes Drive.
function loadStaples() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return STAPLE_PRODUCTS
}

export default function StaplePanel({ items, onAdd }) {
  const [staples, setStaples] = useState(loadStaples)
  const [editing, setEditing] = useState(false)
  const [newLabel, setNewLabel] = useState('')

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(staples)) } catch { /* ignore */ }
  }, [staples])

  function remove(label) {
    setStaples(s => s.filter(p => p.label !== label))
  }
  function addStaple(e) {
    e.preventDefault()
    const label = newLabel.trim()
    if (!label || staples.some(p => p.label.toLowerCase() === label.toLowerCase())) { setNewLabel(''); return }
    setStaples(s => [...s, { label, qty: '' }])
    setNewLabel('')
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-green-400" />
          <p className="text-sm text-slate-300 font-medium">Mes produits phares</p>
        </div>
        <button onClick={() => setEditing(e => !e)} className="text-slate-400 hover:text-white p-1">
          {editing ? <Check size={15} /> : <Pencil size={14} />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {staples.map(p => {
          const already = items.some(i => i.label.toLowerCase() === p.label.toLowerCase())
          return (
            <span
              key={p.label}
              className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1 ${
                already && !editing
                  ? 'bg-slate-800 border-slate-700 text-slate-600'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {editing ? (
                <button onClick={() => remove(p.label)} className="flex items-center gap-1 text-red-400">
                  <X size={12} /> {p.label}
                </button>
              ) : (
                <button
                  onClick={() => !already && onAdd(p.label, p.qty)}
                  disabled={already}
                  className="flex items-center gap-1 hover:text-green-400 disabled:cursor-default"
                >
                  {!already && <Plus size={12} />} {p.label}
                </button>
              )}
            </span>
          )
        })}
      </div>

      {editing && (
        <form onSubmit={addStaple} className="flex gap-2 mt-3">
          <input className="input flex-1 py-1.5 text-sm" placeholder="Ajouter un produit phare…" value={newLabel} onChange={e => setNewLabel(e.target.value)} />
          <button type="submit" className="btn-primary text-sm px-3"><Plus size={15} /></button>
        </form>
      )}
    </div>
  )
}
