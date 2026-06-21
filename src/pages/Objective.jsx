import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Target, Flame, Droplet, TrendingDown, TrendingUp, Activity, Check, ArrowRight, Info } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useFoodHistory } from '../hooks/useFoodLogs'
import { analyzeObjective } from '../lib/objective'
import { GOAL_LABELS } from '../lib/nutrition'
import { inRange, PROTEIN_ENDURANCE_RANGE } from '../components/nutritionDisplay'
import SafetyBanner from '../components/SafetyBanner'

const METHOD_LABELS = { katch_mcardle: 'Katch-McArdle (masse maigre)', mifflin_st_jeor: 'Mifflin-St Jeor' }

function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const RECO_COLOR = { success: 'text-green-400', warn: 'text-amber-400', warning: 'text-amber-400', info: 'text-slate-300' }

export default function Objective({ user, profile, onValidated }) {
  const { saveProfile } = useProfile(user?.id)
  const { history } = useFoodHistory(user?.id, 7)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  if (!profile) return <div className="flex justify-center pt-20"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>

  const foodLogs = history.map(d => ({ logged_date: d.date, calories: d.calories, protein_g: d.protein_g, carbs_g: d.carbs_g, fat_g: d.fat_g }))
  const report = analyzeObjective(profile, { foodLogs })

  if (!report.ready) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Mon objectif</h1>
        <div className="card text-center text-slate-400 text-sm py-8 space-y-3">
          <Info size={28} className="mx-auto text-slate-600" />
          <p>Complète ton profil pour générer ton analyse personnalisée.</p>
          <p className="text-xs text-slate-500">Manquant : {report.missing?.join(', ')}</p>
          <Link to="/profile" className="btn-primary inline-flex items-center gap-1 text-sm">Compléter mon profil <ArrowRight size={14} /></Link>
        </div>
      </div>
    )
  }

  const { targets, bmi, proteinPerKg, hydration, plannedWeeklyKg, projection, insights, recommendations } = report
  const m = targets.macros
  const weight = profile.current_weight_kg ?? profile.weight_kg
  const protOk = inRange(proteinPerKg, PROTEIN_ENDURANCE_RANGE)
  const PaceIcon = plannedWeeklyKg < 0 ? TrendingDown : plannedWeeklyKg > 0 ? TrendingUp : Activity

  async function validate() {
    setSaving(true)
    const { error } = await saveProfile({
      target_calories: targets.targetCalories,
      target_protein_g: m.protein_g, target_carbs_g: m.carbs_g, target_fat_g: m.fat_g,
    })
    setMsg(error ? (error.code === 'UNSAFE_GOAL' ? '⚠️ ' + error.message : 'Erreur : ' + error.message) : '✓ Objectifs validés et enregistrés !')
    if (!error) onValidated?.()
    setSaving(false)
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Mon objectif</h1>
        <p className="text-slate-400 text-sm mt-1">
          {GOAL_LABELS[profile.goal] ?? '—'} · analyse personnalisée, 100 % calculée sur ta situation
        </p>
      </div>

      {/* Cible calorique */}
      <div className="card">
        <div className="flex items-center gap-2 mb-1"><Flame size={15} className="text-green-400" /><p className="text-sm text-slate-300 font-medium">Cible énergétique</p></div>
        <p className="text-3xl font-bold text-green-400">{targets.targetCalories} <span className="text-lg text-slate-500 font-normal">kcal/jour</span></p>
        <p className="text-xs text-slate-500 mt-1">
          Dépense estimée ≈ {targets.tdee} kcal (fourchette {targets.range.low}–{targets.range.high}, marge ±{targets.marginPct} %) ·
          méthode {METHOD_LABELS[targets.method] ?? targets.method}
        </p>
      </div>

      {/* Macros */}
      <div className="card">
        <p className="text-sm text-slate-300 font-medium mb-3">Répartition des macros</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-xl font-bold text-blue-400">{m.protein_g}g</p><p className="text-xs text-slate-500">Protéines</p><p className={`text-[11px] ${protOk ? 'text-green-400' : 'text-amber-400'}`}>{proteinPerKg} g/kg</p></div>
          <div><p className="text-xl font-bold text-orange-400">{m.carbs_g}g</p><p className="text-xs text-slate-500">Glucides</p></div>
          <div><p className="text-xl font-bold text-purple-400">{m.fat_g}g</p><p className="text-xs text-slate-500">Lipides</p></div>
        </div>
        <p className="text-[11px] text-center text-slate-500 mt-3">Protéines visées dans la zone endurance 1,5–1,7 g/kg pour soutenir la masse musculaire.</p>
      </div>

      {/* IMC + Hydratation */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <div className="flex items-center gap-2 mb-1"><Activity size={14} className="text-green-400" /><p className="text-xs text-slate-400">IMC</p></div>
          <p className="text-2xl font-bold">{bmi.value}</p>
          <p className="text-xs text-slate-500">{bmi.label}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1"><Droplet size={14} className="text-cyan-400" /><p className="text-xs text-slate-400">Hydratation</p></div>
          <p className="text-2xl font-bold text-cyan-400">{hydration.liters} L</p>
          <p className="text-xs text-slate-500">≈ {hydration.glasses} verres/jour</p>
        </div>
      </div>

      {/* Rythme + projection */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2"><PaceIcon size={15} className="text-green-400" /><p className="text-sm text-slate-300 font-medium">Rythme prévu</p></div>
        <p className="text-sm">
          {plannedWeeklyKg === 0 ? 'Maintien du poids' : `${plannedWeeklyKg > 0 ? '+' : ''}${plannedWeeklyKg} kg/semaine`}
          <span className="text-slate-500"> au plan calorique actuel</span>
        </p>
        {projection && (
          projection.reached ? <p className="text-sm text-green-400 mt-1">🎯 Objectif de poids déjà atteint</p>
          : projection.wrongDirection ? <p className="text-xs text-amber-400 mt-1">Le plan ne va pas vers ta cible de poids — vérifie ton objectif.</p>
          : projection.weeks ? <p className="text-sm text-slate-300 mt-1">Objectif estimé vers le <span className="text-green-400 font-medium">{fmtDate(projection.targetDate)}</span> <span className="text-slate-500">(~{projection.weeks} sem, estimation)</span></p>
          : null
        )}
      </div>

      {/* Adhérence récente */}
      {insights && insights.nDays > 0 && (
        <div className="card">
          <p className="text-sm text-slate-300 font-medium mb-2">Ton adhérence (7 derniers jours)</p>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div><p className="font-bold text-white">{insights.avgCalories}</p><p className="text-xs text-slate-500">kcal/j moy.</p></div>
            <div><p className="font-bold text-blue-400">{insights.avgProtein}g</p><p className="text-xs text-slate-500">protéines/j</p></div>
            <div><p className="font-bold text-green-400">{insights.daysInTarget}/{insights.nDays}</p><p className="text-xs text-slate-500">jours dans la cible</p></div>
          </div>
        </div>
      )}

      {/* Recommandations */}
      {recommendations?.length > 0 && (
        <div className="card space-y-2">
          <p className="text-sm text-slate-300 font-medium">Conseils personnalisés</p>
          {recommendations.map(r => (
            <div key={r.id} className="text-xs">
              <p className={`font-medium ${RECO_COLOR[r.level] ?? 'text-slate-300'}`}>{r.title}</p>
              <p className="text-slate-500">{r.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sécurité + validation */}
      <SafetyBanner safety={targets.safety} />

      {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-green-400' : 'text-amber-400'}`}>{msg}</p>}
      <button onClick={validate} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
        <Check size={16} /> {saving ? 'Enregistrement…' : 'Valider ces objectifs'}
      </button>
      <p className="text-[11px] text-center text-slate-600">Ces cibles sont calculées scientifiquement à partir de ton profil — tu ne saisis aucun chiffre.</p>
    </div>
  )
}
