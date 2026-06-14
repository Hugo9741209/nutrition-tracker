import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { TrendingUp, TrendingDown, Minus, Target, Flame } from 'lucide-react'
import { useFoodHistory } from '../hooks/useFoodLogs'
import { useWeightLogs } from '../hooks/useWeightLogs'
import { projectWeightGoal } from '../lib/insights'
import { perKg, inRange, PROTEIN_ENDURANCE_RANGE, CARBS_REST_RANGE } from '../components/nutritionDisplay'

function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const TolPct = 0.10 // ±10% = "dans la cible"

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="card">
      <p className="text-slate-400 text-xs">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function Insights({ user, profile }) {
  const { history } = useFoodHistory(user?.id, 7)
  const { diff, latest } = useWeightLogs(user?.id, 7)

  const days = history.length
  const target = profile?.target_calories ?? null
  const w = profile?.current_weight_kg ? +profile.current_weight_kg : null

  // Moyennes sur les jours réellement loggés.
  const sum = history.reduce(
    (a, d) => ({
      calories: a.calories + d.calories,
      protein_g: a.protein_g + d.protein_g,
      carbs_g: a.carbs_g + d.carbs_g,
      fat_g: a.fat_g + d.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )
  const avg = days
    ? {
        calories: Math.round(sum.calories / days),
        protein_g: Math.round(sum.protein_g / days),
        carbs_g: Math.round(sum.carbs_g / days),
        fat_g: Math.round(sum.fat_g / days),
      }
    : null

  // Jours dans la cible calorique (±10%).
  const daysInTarget = target
    ? history.filter(d => Math.abs(d.calories - target) <= target * TolPct).length
    : 0

  const protKg = avg && w ? perKg(avg.protein_g, w) : null
  const carbKg = avg && w ? perKg(avg.carbs_g, w) : null
  const protOk = protKg != null && inRange(protKg, PROTEIN_ENDURANCE_RANGE)
  const carbOk = carbKg != null && inRange(carbKg, CARBS_REST_RANGE)

  const DiffIcon = diff == null ? Minus : diff > 0 ? TrendingUp : TrendingDown
  const diffColor = diff == null ? 'text-slate-400' : profile?.goal === 'lose_weight'
    ? (diff < 0 ? 'text-green-400' : 'text-amber-400')
    : (diff > 0 ? 'text-green-400' : 'text-amber-400')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Bilan de la semaine</h1>
        <p className="text-slate-400 text-sm mt-1">
          {days ? `Sur ${days} jour${days > 1 ? 's' : ''} avec des repas enregistrés` : 'Aucune donnée cette semaine'}
        </p>
      </div>

      {!days && (
        <div className="card text-center text-slate-500 text-sm py-8">
          Logge tes repas pendant quelques jours pour débloquer ton bilan hebdomadaire 📊
        </div>
      )}

      {avg && (
        <>
          {/* Cartes synthèse */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Moyenne calories / jour"
              value={`${avg.calories}`}
              sub={target ? `Objectif ${target} kcal` : 'kcal'}
              color="text-green-400"
            />
            <StatCard
              label="Jours dans la cible"
              value={target ? `${daysInTarget}/${days}` : '—'}
              sub={target ? '±10% de l\'objectif' : 'Définis un objectif'}
            />
          </div>

          {/* Macros moyennes */}
          <div className="card space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Target size={15} className="text-green-400" />
              <p className="text-sm text-slate-300 font-medium">Macros moyennes / jour</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-blue-400">{avg.protein_g} g</p>
                <p className="text-xs text-slate-500">Protéines</p>
                {protKg != null && <p className={`text-[11px] ${protOk ? 'text-green-400' : 'text-amber-400'}`}>{protKg} g/kg</p>}
              </div>
              <div>
                <p className="text-lg font-bold text-orange-400">{avg.carbs_g} g</p>
                <p className="text-xs text-slate-500">Glucides</p>
                {carbKg != null && <p className={`text-[11px] ${carbOk ? 'text-green-400' : 'text-amber-400'}`}>{carbKg} g/kg</p>}
              </div>
              <div>
                <p className="text-lg font-bold text-purple-400">{avg.fat_g} g</p>
                <p className="text-xs text-slate-500">Lipides</p>
              </div>
            </div>
            {protKg != null && (
              <p className="text-[11px] text-center text-slate-500 pt-1">
                Repères endurance : protéines 1,5–1,7 g/kg · glucides 5–7 g/kg (jour repos)
              </p>
            )}
          </div>

          {/* Tendance poids + projection objectif */}
          <div className="card space-y-2">
            <p className="text-slate-400 text-sm">Tendance poids (7 jours)</p>
            <div className={`flex items-center gap-2 text-xl font-bold ${diffColor}`}>
              <DiffIcon size={18} />
              {diff == null ? 'Pas assez de données' : `${diff > 0 ? '+' : ''}${diff} kg`}
            </div>
            {(() => {
              if (!latest || !profile?.target_weight_kg) return null
              const proj = projectWeightGoal({ currentKg: +latest.weight_kg, targetKg: +profile.target_weight_kg, weeklyKg: diff })
              if (!proj) return null
              if (proj.reached) return <p className="text-sm text-green-400">🎯 Objectif de poids atteint !</p>
              if (proj.wrongDirection) return <p className="text-xs text-amber-400">Ta tendance s'éloigne de l'objectif pour l'instant — rien d'alarmant, ajuste si besoin.</p>
              if (proj.weeks) return (
                <p className="text-sm text-slate-300">
                  Objectif estimé vers le <span className="text-green-400 font-medium">{fmtDate(proj.targetDate)}</span>
                  <span className="text-slate-500"> (~{proj.weeks} sem · estimation au rythme actuel, pas une promesse)</span>
                </p>
              )
              return null
            })()}
          </div>

          {/* Graphique kcal/jour */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={16} className="text-green-400" />
              <p className="text-slate-400 text-sm">Calories — 7 derniers jours</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={history} barSize={20}>
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                  formatter={v => [`${Math.round(v)} kcal`, 'Calories']}
                />
                {target && <ReferenceLine y={target} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />}
                <Bar dataKey="calories" fill="#22c55e" opacity={0.8} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
