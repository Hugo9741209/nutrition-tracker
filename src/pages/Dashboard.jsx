import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, TrendingUp, TrendingDown, Minus, ArrowRight, Footprints, Moon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useFoodLogs, useFoodHistory } from '../hooks/useFoodLogs'
import { useWeightLogs } from '../hooks/useWeightLogs'
import CalorieBar from '../components/Dashboard/CalorieBar'
import MacroRings from '../components/Dashboard/MacroRings'
import RecalibrateBanner from '../components/Dashboard/RecalibrateBanner'
import ScoreGauge from '../components/Dashboard/ScoreGauge'
import { dailyBalanceScore } from '../lib/score'
import { todayStr, GOAL_LABELS } from '../lib/nutrition'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-green-400 font-semibold">{Math.round(payload[0]?.value)} kcal</p>
    </div>
  )
}

export default function Dashboard({ user, profile }) {
  const { totals } = useFoodLogs(user?.id, todayStr())
  const { history } = useFoodHistory(user?.id, 14)
  const { logs: weightLogs, latest, diff } = useWeightLogs(user?.id, 30)

  // Affichage seulement : type de jour → bande de référence glucides (§7). Aucun tracking de séance.
  const [dayType, setDayType] = useState('rest')

  const targetCal = profile?.target_calories ?? 2500
  const name = profile?.name ?? user?.email?.split('@')[0] ?? 'Toi'

  const DiffIcon = diff === null ? Minus : diff > 0 ? TrendingUp : TrendingDown
  const diffColor = diff === null ? 'text-slate-400' : profile?.goal === 'lose_weight'
    ? (diff < 0 ? 'text-green-400' : 'text-red-400')
    : (diff > 0 ? 'text-green-400' : 'text-red-400')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{greeting()}, {name} 👋</h1>
        <p className="text-slate-400 text-sm mt-1">
          {profile?.goal ? GOAL_LABELS[profile.goal] : 'Configure ton profil pour commencer'}
          {profile?.target_weight_kg && ` · Objectif : ${profile.target_weight_kg} kg`}
        </p>
      </div>

      {!profile?.target_calories && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-green-400">Configure ton profil</p>
            <p className="text-sm text-slate-400">Pour calculer tes objectifs automatiquement</p>
          </div>
          <Link to="/profile" className="btn-primary text-sm flex items-center gap-1">
            Configurer <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Score d'équilibre du jour */}
      {(() => {
        const { score, label } = dailyBalanceScore({
          totals,
          targets: { calories: profile?.target_calories, protein_g: profile?.target_protein_g },
        })
        return <ScoreGauge score={score} label={label} />
      })()}

      {/* Calories */}
      <CalorieBar consumed={totals.calories} target={targetCal} />

      {/* Rappel de recalibrage si l'objectif est ancien ou le poids a dérivé */}
      <RecalibrateBanner profile={profile} latestWeight={latest?.weight_kg} />

      {/* Type de jour — change la cible glucides de référence (affichage uniquement) */}
      <div className="flex items-center gap-2">
        <button
          type="button" onClick={() => setDayType('rest')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium border transition-colors ${
            dayType === 'rest' ? 'bg-green-500/15 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Moon size={15} /> Jour repos
        </button>
        <button
          type="button" onClick={() => setDayType('run')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium border transition-colors ${
            dayType === 'run' ? 'bg-green-500/15 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          <Footprints size={15} /> Jour run
        </button>
      </div>

      {/* Conseil péri-effort — seulement en jour run (script §7, nutrition péri-effort) */}
      {dayType === 'run' && (
        <div className="flex gap-3 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-3">
          <Footprints size={16} className="text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300">
            <span className="text-orange-300 font-medium">Sortie longue (&gt; 1 h) ?</span> Vise 30–60 g de glucides par heure d'effort (boisson, gel, fruits secs) pour tenir l'allure et retarder la fatigue.
          </p>
        </div>
      )}

      {/* Macros */}
      <MacroRings totals={totals} profile={profile} dayType={dayType} />

      {/* Graphique 14 jours */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={16} className="text-green-400" />
          <p className="text-slate-400 text-sm">Calories — 14 derniers jours</p>
        </div>
        {history.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-6">Commence à logger tes repas pour voir les données</p>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={history} barSize={16}>
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
              <ReferenceLine y={targetCal} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Bar dataKey="calories" fill="#22c55e" opacity={0.8} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Poids */}
      <div className="card">
        <div className="flex items-center justify-between mb-1">
          <p className="text-slate-400 text-sm">Poids actuel</p>
          <Link to="/weight" className="text-xs text-green-400 hover:underline flex items-center gap-1">
            Historique <ArrowRight size={12} />
          </Link>
        </div>
        {latest ? (
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold">{latest.weight_kg} <span className="text-slate-500 text-lg font-normal">kg</span></p>
            {diff !== null && (
              <div className={`flex items-center gap-1 text-sm font-medium mb-1 ${diffColor}`}>
                <DiffIcon size={14} />
                {diff > 0 ? '+' : ''}{diff} kg ce mois
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-slate-500 text-sm">Aucune donnée</p>
            <Link to="/weight" className="btn-primary text-sm">Peser aujourd'hui</Link>
          </div>
        )}
        {profile?.target_weight_kg && latest && (
          <p className="text-xs text-slate-500 mt-1">
            Objectif : {profile.target_weight_kg} kg · Écart : {(+latest.weight_kg - profile.target_weight_kg).toFixed(1)} kg
          </p>
        )}
      </div>
    </div>
  )
}
