import { useState, useRef } from 'react'
import { Search, Loader2, Plus, X, ShieldCheck, Info } from 'lucide-react'
// Recherche d'aliments = intégration sources externes → module backend.
// On consomme la forme normalisée, on ne refait ni le fetch ni le scaling.
import { searchFoods, toLogEntry, RELIABILITY_LABELS } from '../../lib/foods'

// Badge de fiabilité de la source (transparence demandée au script §4/§5).
function SourceBadge({ reliability }) {
  const high = reliability === 'high'
  const Icon = high ? ShieldCheck : Info
  return (
    <span
      title={RELIABILITY_LABELS[reliability]}
      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${
        high ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
      }`}
    >
      <Icon size={10} /> {high ? 'CIQUAL' : 'OFF'}
    </span>
  )
}

export default function FoodSearch({ mealType, onAdd, onClose }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState(null)
  const [qty, setQty] = useState(100)
  const [custom, setCustom] = useState({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', quantity_g: 100 })
  const [tab, setTab] = useState('search')
  const timer = useRef(null)

  function handleQuery(val) {
    setQuery(val)
    clearTimeout(timer.current)
    if (val.length < 2) { setResults([]); setSearched(false); return }
    // Debounce 300 ms (script §5) pour ne pas spammer CIQUAL/OFF.
    timer.current = setTimeout(async () => {
      setLoading(true)
      const res = await searchFoods(val)
      setResults(res)
      setSearched(true)
      setLoading(false)
    }, 300)
  }

  function handleSelect(food) {
    setSelected(food)
    setQty(100)
  }

  function handleAdd() {
    if (!selected) return
    // Le scaling /100g → quantité est fait côté backend (toLogEntry).
    onAdd(toLogEntry(selected, qty, mealType))
    onClose()
  }

  function handleCustomAdd() {
    const entry = {
      food_name:  custom.food_name,
      brand:      '',
      quantity_g: +custom.quantity_g,
      calories:   +custom.calories,
      protein_g:  +custom.protein_g,
      carbs_g:    +custom.carbs_g,
      fat_g:      +custom.fat_g,
      fiber_g:    0,
      meal_type:  mealType,
    }
    onAdd(entry)
    onClose()
  }

  const preview = selected ? toLogEntry(selected, qty, mealType) : null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-semibold">Ajouter un aliment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {['search', 'custom'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === t ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-400'}`}
            >
              {t === 'search' ? 'Recherche' : 'Saisie manuelle'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'search' && (
            <>
              {/* Search bar */}
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-9"
                  placeholder="Rechercher un aliment..."
                  value={query}
                  onChange={e => handleQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Results */}
              {loading && <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-green-400" /></div>}

              {!loading && !selected && searched && results.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-6">Aucun aliment trouvé pour « {query} ».</p>
              )}

              {!loading && !selected && results.map((f, i) => (
                <button
                  key={`${f.source}-${f.sourceCode ?? i}`}
                  onClick={() => handleSelect(f)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors mb-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{f.food_name}</p>
                    <SourceBadge reliability={f.reliability} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {f.brand ? `${f.brand} · ` : ''}{f.per100g.calories} kcal/100g
                  </p>
                </button>
              ))}

              {/* Selected product */}
              {selected && (
                <div>
                  <button onClick={() => setSelected(null)} className="text-xs text-slate-400 hover:text-white mb-3 flex items-center gap-1">
                    ← Retour aux résultats
                  </button>
                  <div className="bg-slate-800 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{selected.food_name}</p>
                      <SourceBadge reliability={selected.reliability} />
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{selected.brand || RELIABILITY_LABELS[selected.reliability]}</p>
                    <label className="label">Quantité (g)</label>
                    <input
                      type="number" min="1" className="input mb-3"
                      value={qty} onChange={e => setQty(+e.target.value)}
                    />
                    {preview && (
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { label: 'Calories', val: preview.calories, unit: 'kcal', color: 'text-green-400' },
                          { label: 'Protéines', val: preview.protein_g, unit: 'g', color: 'text-blue-400' },
                          { label: 'Glucides', val: preview.carbs_g, unit: 'g', color: 'text-orange-400' },
                          { label: 'Lipides', val: preview.fat_g, unit: 'g', color: 'text-purple-400' },
                        ].map(({ label, val, unit, color }) => (
                          <div key={label} className="bg-slate-700 rounded-lg p-2">
                            <p className={`text-sm font-bold ${color}`}>{val}</p>
                            <p className="text-xs text-slate-400">{unit}</p>
                            <p className="text-xs text-slate-500">{label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={handleAdd} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Plus size={16} /> Ajouter au repas
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="label">Nom de l'aliment *</label>
                <input className="input" placeholder="ex: Riz basmati cuit" value={custom.food_name} onChange={e => setCustom(p => ({ ...p, food_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quantité (g)</label>
                  <input type="number" className="input" value={custom.quantity_g} onChange={e => setCustom(p => ({ ...p, quantity_g: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Calories (kcal) *</label>
                  <input type="number" className="input" placeholder="0" value={custom.calories} onChange={e => setCustom(p => ({ ...p, calories: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Protéines (g)</label>
                  <input type="number" className="input" placeholder="0" value={custom.protein_g} onChange={e => setCustom(p => ({ ...p, protein_g: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Glucides (g)</label>
                  <input type="number" className="input" placeholder="0" value={custom.carbs_g} onChange={e => setCustom(p => ({ ...p, carbs_g: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Lipides (g)</label>
                  <input type="number" className="input" placeholder="0" value={custom.fat_g} onChange={e => setCustom(p => ({ ...p, fat_g: e.target.value }))} />
                </div>
              </div>
              <button
                onClick={handleCustomAdd}
                disabled={!custom.food_name || !custom.calories}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                <Plus size={16} /> Ajouter au repas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
