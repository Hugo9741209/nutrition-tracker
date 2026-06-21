import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Star, Check } from 'lucide-react'
import FoodSearch from './FoodSearch'
import { MEAL_LABELS } from '../format'

const MEAL_COLORS = {
  breakfast: 'text-yellow-400',
  lunch:     'text-green-400',
  dinner:    'text-blue-400',
  snack:     'text-purple-400',
}

export default function MealSection({ mealType, logs, onAdd, onDelete, onSaveFavorite }) {
  const [open, setOpen] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [saved, setSaved] = useState(false)

  const mealLogs = logs.filter(l => l.meal_type === mealType)
  const totalCal = mealLogs.reduce((s, l) => s + (l.calories ?? 0), 0)

  async function handleSaveFavorite(e) {
    e.stopPropagation()
    if (!mealLogs.length || !onSaveFavorite) return
    const name = window.prompt('Nom du favori :', MEAL_LABELS[mealType])
    if (!name) return
    const items = mealLogs.map(l => ({
      food_name: l.food_name, brand: l.brand ?? '', quantity_g: l.quantity_g,
      calories: l.calories, protein_g: l.protein_g, carbs_g: l.carbs_g,
      fat_g: l.fat_g, fiber_g: l.fiber_g ?? 0, source: l.source ?? null,
    }))
    const { error } = await onSaveFavorite({ name, meal_type: mealType, items })
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold ${MEAL_COLORS[mealType]}`}>{MEAL_LABELS[mealType]}</h3>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            {Math.round(totalCal)} kcal
          </span>
        </div>
        <div className="flex items-center gap-2">
          {mealLogs.length > 0 && onSaveFavorite && (
            <button
              onClick={handleSaveFavorite}
              aria-label={`Enregistrer ${MEAL_LABELS[mealType]} comme favori`}
              title="Enregistrer ce repas comme favori"
              className={`transition-colors p-1 ${saved ? 'text-green-400' : 'text-slate-400 hover:text-yellow-400'}`}
            >
              {saved ? <Check size={17} /> : <Star size={17} />}
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); setShowSearch(true) }}
            aria-label={`Ajouter un aliment au ${MEAL_LABELS[mealType]}`}
            className="text-slate-400 hover:text-green-400 transition-colors p-1"
          >
            <Plus size={18} />
          </button>
          {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-1">
          {mealLogs.length === 0 && (
            <p className="text-slate-600 text-sm text-center py-2">Aucun aliment — clique sur + pour ajouter</p>
          )}
          {mealLogs.map(log => (
            <div key={log.id} className="flex items-center justify-between group py-2 px-2 rounded-lg hover:bg-slate-800 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{log.food_name}</p>
                <p className="text-xs text-slate-500">
                  {log.quantity_g}g
                  {log.brand ? ` · ${log.brand}` : ''}
                  <span className="ml-2 text-blue-400">{log.protein_g}g P</span>
                  <span className="ml-1 text-orange-400">{log.carbs_g}g G</span>
                  <span className="ml-1 text-purple-400">{log.fat_g}g L</span>
                </p>
              </div>
              <div className="flex items-center gap-3 ml-2 shrink-0">
                <span className="text-sm font-semibold text-white">{Math.round(log.calories)} kcal</span>
                <button
                  onClick={() => onDelete(log.id)}
                  aria-label={`Supprimer ${log.food_name}`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSearch && (
        <FoodSearch
          mealType={mealType}
          onAdd={onAdd}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  )
}
