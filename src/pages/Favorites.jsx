import { useState } from 'react'
import { Star, Trash2, Plus, Check } from 'lucide-react'
import { useMealTemplates } from '../hooks/useMealTemplates'
import { todayStr } from '../lib/nutrition'

const MEALS = { breakfast: 'Petit-déj', lunch: 'Déjeuner', dinner: 'Dîner', snack: 'Collation' }

function templateKcal(t) {
  return Math.round((t.items ?? []).reduce((s, it) => s + (it.calories ?? 0), 0))
}

export default function Favorites({ user }) {
  const { templates, loading, applyTemplate, deleteTemplate } = useMealTemplates(user?.id)
  const [added, setAdded] = useState(null)
  const [mealById, setMealById] = useState({})

  async function handleApply(t) {
    const meal_type = mealById[t.id] ?? t.meal_type ?? 'lunch'
    const { error } = await applyTemplate(t, { logged_date: todayStr(), meal_type })
    if (!error) {
      setAdded(t.id)
      setTimeout(() => setAdded(null), 2000)
    }
  }

  if (loading) return <div className="flex justify-center pt-20"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Repas favoris</h1>
        <p className="text-slate-400 text-sm mt-1">Ré-ajoute un repas récurrent en un clic</p>
      </div>

      {templates.length === 0 ? (
        <div className="card text-center text-slate-500 text-sm py-8">
          <Star size={28} className="mx-auto mb-3 text-slate-600" />
          Aucun favori pour l'instant.<br />
          Tu pourras enregistrer un repas du journal comme favori pour le réutiliser ici.
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold flex items-center gap-2"><Star size={15} className="text-green-400" /> {t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{(t.items ?? []).length} aliment{(t.items ?? []).length > 1 ? 's' : ''} · {templateKcal(t)} kcal</p>
                </div>
                <button onClick={() => deleteTemplate(t.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  className="input flex-1 py-2"
                  value={mealById[t.id] ?? t.meal_type ?? 'lunch'}
                  onChange={e => setMealById(m => ({ ...m, [t.id]: e.target.value }))}
                >
                  {Object.entries(MEALS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button
                  onClick={() => handleApply(t)}
                  className={`btn-primary text-sm flex items-center gap-1 whitespace-nowrap ${added === t.id ? 'opacity-80' : ''}`}
                >
                  {added === t.id ? <><Check size={14} /> Ajouté</> : <><Plus size={14} /> Aujourd'hui</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
