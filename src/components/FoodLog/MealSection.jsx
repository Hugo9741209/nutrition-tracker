import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import FoodSearch from './FoodSearch'

const MEAL_COLORS = {
  breakfast: 'text-yellow-400',
  lunch:     'text-green-400',
  dinner:    'text-blue-400',
  snack:     'text-purple-400',
}

const MEAL_LABELS = {
  breakfast: 'Petit-déjeuner',
  lunch:     'Déjeuner',
  dinner:    'Dîner',
  snack:     'Collation',
}

export default function MealSection({ mealType, logs, onAdd, onDelete }) {
  const [open, setOpen] = useState(true)
  const [showSearch, setShowSearch] = useState(false)

  const mealLogs = logs.filter(l => l.meal_type === mealType)
  const totalCal = mealLogs.reduce((s, l) => s + (l.calories ?? 0), 0)

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
          <button
            onClick={e => { e.stopPropagation(); setShowSearch(true) }}
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
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
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
