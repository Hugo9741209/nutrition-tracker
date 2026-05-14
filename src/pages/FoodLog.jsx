import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useFoodLogs } from '../hooks/useFoodLogs'
import MealSection from '../components/FoodLog/MealSection'
import CalorieBar from '../components/Dashboard/CalorieBar'

function dateStr(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

function fmtDate(str) {
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function FoodLog({ user, profile }) {
  const [dayOffset, setDayOffset] = useState(0)
  const date = dateStr(dayOffset)
  const { logs, totals, addLog, deleteLog } = useFoodLogs(user?.id, date)

  const targetCal = profile?.target_calories ?? 2500

  return (
    <div className="space-y-4">
      {/* Date picker */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Journal alimentaire</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setDayOffset(o => o - 1)} className="btn-secondary p-2"><ChevronLeft size={16} /></button>
          <div className="text-center min-w-[130px]">
            <p className="text-sm font-medium capitalize">{fmtDate(date)}</p>
            {dayOffset === 0 && <p className="text-xs text-green-400">Aujourd'hui</p>}
          </div>
          <button
            onClick={() => setDayOffset(o => o + 1)}
            disabled={dayOffset >= 0}
            className="btn-secondary p-2 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Résumé calories */}
      <CalorieBar consumed={totals.calories} target={targetCal} />

      {/* Macros rapides */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Protéines', val: totals.protein_g, target: profile?.target_protein_g, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Glucides',  val: totals.carbs_g,   target: profile?.target_carbs_g,   color: 'text-orange-400', bg: 'bg-orange-400/10' },
          { label: 'Lipides',   val: totals.fat_g,     target: profile?.target_fat_g,     color: 'text-purple-400', bg: 'bg-purple-400/10' },
        ].map(({ label, val, target, color, bg }) => (
          <div key={label} className={`card ${bg} border-0 text-center`}>
            <p className={`text-lg font-bold ${color}`}>{Math.round(val)}g</p>
            <p className="text-xs text-slate-400">{label}</p>
            {target && <p className="text-xs text-slate-600">/ {target}g</p>}
          </div>
        ))}
      </div>

      {/* Repas */}
      {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
        <MealSection
          key={meal}
          mealType={meal}
          logs={logs}
          onAdd={entry => addLog(entry)}
          onDelete={id => deleteLog(id)}
        />
      ))}
    </div>
  )
}
