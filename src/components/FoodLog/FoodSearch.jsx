import { useState, useRef } from 'react'
import { Search, Loader2, Plus, X } from 'lucide-react'

async function searchOpenFoodFacts(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=8&fields=product_name,brands,nutriments,serving_size`
  const res = await fetch(url)
  const json = await res.json()
  return (json.products ?? []).filter(p => p.product_name && p.nutriments?.energy_100g !== undefined)
}

function getNutriments(p, qty = 100) {
  const n = p.nutriments
  const factor = qty / 100
  return {
    food_name: p.product_name,
    brand: p.brands ?? '',
    quantity_g: qty,
    calories: Math.round((n['energy-kcal_100g'] ?? n.energy_100g / 4.184 ?? 0) * factor),
    protein_g: +((n.proteins_100g ?? 0) * factor).toFixed(1),
    carbs_g:   +((n.carbohydrates_100g ?? 0) * factor).toFixed(1),
    fat_g:     +((n.fat_100g ?? 0) * factor).toFixed(1),
    fiber_g:   +((n.fiber_100g ?? 0) * factor).toFixed(1),
  }
}

export default function FoodSearch({ mealType, onAdd, onClose }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [qty, setQty] = useState(100)
  const [custom, setCustom] = useState({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', quantity_g: 100 })
  const [tab, setTab] = useState('search')
  const timer = useRef(null)

  function handleQuery(val) {
    setQuery(val)
    clearTimeout(timer.current)
    if (val.length < 2) { setResults([]); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      const res = await searchOpenFoodFacts(val)
      setResults(res)
      setLoading(false)
    }, 500)
  }

  function handleSelect(product) {
    setSelected(product)
    setQty(100)
  }

  function handleAdd() {
    if (!selected) return
    onAdd({ ...getNutriments(selected, qty), meal_type: mealType })
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

  const nutriments = selected ? getNutriments(selected, qty) : null

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
              {t === 'search' ? 'Recherche OpenFoodFacts' : 'Saisie manuelle'}
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
              {!loading && !selected && results.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(p)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors mb-1"
                >
                  <p className="font-medium text-sm">{p.product_name}</p>
                  <p className="text-xs text-slate-500">{p.brands} · {Math.round(p.nutriments['energy-kcal_100g'] ?? 0)} kcal/100g</p>
                </button>
              ))}

              {/* Selected product */}
              {selected && (
                <div>
                  <button onClick={() => setSelected(null)} className="text-xs text-slate-400 hover:text-white mb-3 flex items-center gap-1">
                    ← Retour aux résultats
                  </button>
                  <div className="bg-slate-800 rounded-xl p-4 mb-4">
                    <p className="font-semibold">{selected.product_name}</p>
                    <p className="text-xs text-slate-400 mb-3">{selected.brands}</p>
                    <label className="label">Quantité (g)</label>
                    <input
                      type="number" min="1" className="input mb-3"
                      value={qty} onChange={e => setQty(+e.target.value)}
                    />
                    {nutriments && (
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { label: 'Calories', val: nutriments.calories, unit: 'kcal', color: 'text-green-400' },
                          { label: 'Protéines', val: nutriments.protein_g, unit: 'g', color: 'text-blue-400' },
                          { label: 'Glucides', val: nutriments.carbs_g, unit: 'g', color: 'text-orange-400' },
                          { label: 'Lipides', val: nutriments.fat_g, unit: 'g', color: 'text-purple-400' },
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
