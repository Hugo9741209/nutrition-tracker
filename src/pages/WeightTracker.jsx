import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts'
import { Scale, TrendingDown, TrendingUp, Trash2 } from 'lucide-react'
import { useWeightLogs } from '../hooks/useWeightLogs'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0]?.value} kg</p>
    </div>
  )
}

export default function WeightTracker({ user, profile }) {
  const [period, setPeriod] = useState(30)
  const { logs, addWeight, deleteWeight, latest, diff } = useWeightLogs(user?.id, period)
  const [inputWeight, setInputWeight] = useState('')
  const [inputNote, setInputNote]     = useState('')
  const [saving, setSaving]           = useState(false)
  const [msg, setMsg]                 = useState('')

  const targetWeight = profile?.target_weight_kg

  async function handleAdd(e) {
    e.preventDefault()
    if (!inputWeight) return
    setSaving(true)
    const { error } = await addWeight(+inputWeight, inputNote)
    if (error) setMsg('Erreur : ' + error.message)
    else { setMsg('✓ Poids enregistré !'); setInputWeight(''); setInputNote('') }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const chartData = logs.map(l => ({
    date: l.logged_date.slice(5),
    weight: +l.weight_kg,
    id: l.id,
  }))

  const yMin = logs.length > 0 ? Math.floor(Math.min(...logs.map(l => l.weight_kg)) - 1) : 60
  const yMax = logs.length > 0 ? Math.ceil(Math.max(...logs.map(l => l.weight_kg)) + 1) : 100

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Suivi du poids</h1>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold">{latest?.weight_kg ?? '—'}</p>
          <p className="text-xs text-slate-400">kg actuel</p>
        </div>
        <div className="card text-center">
          <p className={`text-2xl font-bold ${diff === null ? 'text-slate-400' : diff > 0 ? 'text-orange-400' : 'text-green-400'}`}>
            {diff === null ? '—' : `${diff > 0 ? '+' : ''}${diff}`}
          </p>
          <p className="text-xs text-slate-400">kg ({period}j)</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-400">{targetWeight ?? '—'}</p>
          <p className="text-xs text-slate-400">kg objectif</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Scale size={16} className="text-green-400" />
          <p className="font-semibold">Peser aujourd'hui</p>
        </div>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Poids (kg)</label>
              <input
                type="number" step="0.1" min="30" max="300"
                className="input" placeholder="ex: 75.5"
                value={inputWeight} onChange={e => setInputWeight(e.target.value)}
                required
              />
            </div>
            <div className="flex-1">
              <label className="label">Note (optionnel)</label>
              <input className="input" placeholder="ex: matin à jeun" value={inputNote} onChange={e => setInputNote(e.target.value)} />
            </div>
          </div>
          {msg && <p className="text-green-400 text-sm">{msg}</p>}
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>

      {/* Graphique */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-slate-400 text-sm">Évolution du poids</p>
          <div className="flex gap-1">
            {[14, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${period === d ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                {d}j
              </button>
            ))}
          </div>
        </div>
        {chartData.length < 2 ? (
          <p className="text-slate-600 text-sm text-center py-10">Enregistre au moins 2 pesées pour voir la courbe</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[yMin, yMax]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              {targetWeight && <ReferenceLine y={targetWeight} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Objectif', fill: '#22c55e', fontSize: 10 }} />}
              <Line
                type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2.5}
                dot={{ fill: '#22c55e', r: 3 }} activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Historique */}
      <div className="card">
        <p className="font-semibold mb-3">Historique</p>
        {logs.length === 0 && <p className="text-slate-600 text-sm">Aucune donnée</p>}
        <div className="space-y-1">
          {[...logs].reverse().map(log => (
            <div key={log.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-800 group transition-colors">
              <div>
                <p className="text-sm font-medium">{log.weight_kg} kg</p>
                {log.note && <p className="text-xs text-slate-500">{log.note}</p>}
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-500">{log.logged_date}</p>
                <button
                  onClick={() => deleteWeight(log.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
