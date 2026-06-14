import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useProfile } from '../hooks/useProfile'
// Calculs = source de vérité backend (cf. CONTRAT_AGENTS.md). On importe, on n'invente pas.
import { calcTDEE, calcTargetCalories, calcMacros, tdeeRange, checkGoalSafety, detectBlindSpot, BLIND_SPOT_LABELS, ACTIVITY_LABELS, GOAL_LABELS } from '../lib/nutrition'
// Helpers d'affichage = domaine frontend.
import { perKg, inRange, PROTEIN_ENDURANCE_RANGE, CARBS_TRAIN_RANGE } from '../components/nutritionDisplay'
import SafetyBanner from '../components/SafetyBanner'
import { LogOut, Zap, Target, Calculator } from 'lucide-react'

export default function Profile({ user, onProfileSaved }) {
  const { profile, loading, saveProfile } = useProfile(user?.id)
  const [form, setForm] = useState({
    name: '', age: 20, gender: 'male', height_cm: 175,
    current_weight_kg: '', target_weight_kg: '',
    activity_level: 'very_active', goal: 'maintain',
    target_calories: '', target_protein_g: '', target_carbs_g: '', target_fat_g: '',
  })
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  // Violations renvoyées par le backend si l'objectif est rejeté (UNSAFE_GOAL).
  const [serverViolations, setServerViolations] = useState(null)

  useEffect(() => {
    if (profile) setForm(f => ({ ...f, ...profile }))
  }, [profile])

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function autoCalc() {
    const { age, gender, height_cm, current_weight_kg, activity_level, goal } = form
    if (!current_weight_kg || !height_cm) return
    const tdee = calcTDEE({ weight_kg: +current_weight_kg, height_cm: +height_cm, age: +age, gender, activity_level })
    const targetCal = calcTargetCalories(tdee, goal)
    const macros = calcMacros(targetCal, goal, +current_weight_kg)
    setForm(f => ({ ...f, target_calories: targetCal, ...macros }))
    setMsg('✓ Objectifs calculés automatiquement !')
    setTimeout(() => setMsg(''), 3000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setServerViolations(null)
    const { error } = await saveProfile(form)
    if (error?.code === 'UNSAFE_GOAL') {
      // Le backend refuse de persister : objectif NON sauvegardé, on garde l'alerte.
      setServerViolations(error.violations)
      setMsg('⚠️ Objectif non enregistré : trop risqué. Ajuste-le avant de sauvegarder.')
    } else if (error) {
      setMsg('Erreur : ' + error.message)
    } else {
      setMsg('✓ Profil sauvegardé !')
      onProfileSaved?.()
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 4000)
  }

  if (loading) return <div className="flex justify-center pt-20"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mon profil</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={15} /> Déconnexion
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Infos personnelles */}
        <div className="card space-y-4">
          <p className="font-semibold text-sm text-slate-300 uppercase tracking-wider">Informations</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prénom</label>
              <input className="input" value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Hugo" />
            </div>
            <div>
              <label className="label">Genre</label>
              <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="male">Homme</option>
                <option value="female">Femme</option>
              </select>
            </div>
            <div>
              <label className="label">Âge</label>
              <input type="number" className="input" value={form.age ?? ''} onChange={e => set('age', e.target.value)} />
            </div>
            <div>
              <label className="label">Taille (cm)</label>
              <input type="number" className="input" value={form.height_cm ?? ''} onChange={e => set('height_cm', e.target.value)} />
            </div>
            <div>
              <label className="label">Poids actuel (kg)</label>
              <input type="number" step="0.1" className="input" value={form.current_weight_kg ?? ''} onChange={e => set('current_weight_kg', e.target.value)} />
            </div>
            <div>
              <label className="label">Poids cible (kg)</label>
              <input type="number" step="0.1" className="input" value={form.target_weight_kg ?? ''} onChange={e => set('target_weight_kg', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Activité & objectif */}
        <div className="card space-y-4">
          <p className="font-semibold text-sm text-slate-300 uppercase tracking-wider">Activité & Objectif</p>
          <div>
            <label className="label">Niveau d'activité physique</label>
            <select className="input" value={form.activity_level} onChange={e => set('activity_level', e.target.value)}>
              {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Objectif</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(GOAL_LABELS).map(([k, v]) => (
                <button
                  key={k} type="button"
                  onClick={() => set('goal', k)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-colors border ${
                    form.goal === k
                      ? 'bg-green-500/15 border-green-500 text-green-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button" onClick={autoCalc}
            className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            <Calculator size={15} /> Calculer mes objectifs automatiquement (BMR/TDEE)
          </button>
        </div>

        {/* Objectifs numériques */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-green-400" />
            <p className="font-semibold text-sm text-slate-300 uppercase tracking-wider">Objectifs journaliers</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1"><Zap size={12} className="text-green-400" /> Calories (kcal)</label>
              <input type="number" className="input" value={form.target_calories ?? ''} onChange={e => set('target_calories', e.target.value)} />
            </div>
            <div>
              <label className="label text-blue-400">Protéines (g)</label>
              <input type="number" className="input" value={form.target_protein_g ?? ''} onChange={e => set('target_protein_g', e.target.value)} />
            </div>
            <div>
              <label className="label text-orange-400">Glucides (g)</label>
              <input type="number" className="input" value={form.target_carbs_g ?? ''} onChange={e => set('target_carbs_g', e.target.value)} />
            </div>
            <div>
              <label className="label text-purple-400">Lipides (g)</label>
              <input type="number" className="input" value={form.target_fat_g ?? ''} onChange={e => set('target_fat_g', e.target.value)} />
            </div>
          </div>

          {form.target_calories && form.current_weight_kg && (() => {
            const w = +form.current_weight_kg
            const tdee = calcTDEE({ weight_kg: w, height_cm: +form.height_cm, age: +form.age, gender: form.gender, activity_level: form.activity_level })
            const { low, high } = tdeeRange(tdee)
            const protKg = form.target_protein_g ? perKg(+form.target_protein_g, w) : null
            const carbKg = form.target_carbs_g ? perKg(+form.target_carbs_g, w) : null
            const protOk = protKg != null && inRange(protKg, PROTEIN_ENDURANCE_RANGE)
            const carbOk = carbKg != null && inRange(carbKg, CARBS_TRAIN_RANGE)
            // Garde-fous + angle mort = calculés par le backend, on ne fait qu'afficher.
            const safety = checkGoalSafety({
              tdee, targetCalories: +form.target_calories, gender: form.gender,
              weight_kg: w, protein_g: form.target_protein_g ? +form.target_protein_g : null,
            })
            const blindSpot = detectBlindSpot({ age: +form.age, weight_kg: w, height_cm: +form.height_cm })
            return (
              <div className="space-y-2">
                <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-400 space-y-1.5">
                  <p className="text-slate-300 font-medium mb-2">Résumé nutritionnel</p>
                  <p>⚡ Dépense estimée (TDEE) : <span className="text-white">≈ {tdee} kcal/jour</span> <span className="text-slate-500">(fourchette {low}–{high}, marge ±10 %)</span></p>
                  <p className="text-[11px] text-slate-500 -mt-1">La formule Mifflin-St Jeor est précise à ±10 %. Le multiplicateur d'activité (NEAT) est l'estimation la plus incertaine : ajuste selon tes résultats réels après 2–3 semaines.</p>
                  <p>🎯 Objectif calorique : <span className="text-green-400">{form.target_calories} kcal</span></p>
                  {protKg != null && (
                    <p>💪 Protéines : <span className="text-blue-400">{form.target_protein_g} g</span> · <span className={protOk ? 'text-green-400' : 'text-amber-400'}>{protKg} g/kg</span> <span className="text-slate-500">(zone endurance 1,5–1,7 g/kg)</span></p>
                  )}
                  {carbKg != null && (
                    <p>🔋 Glucides (carburant) : <span className="text-orange-400">{form.target_carbs_g} g</span> · <span className={carbOk ? 'text-green-400' : 'text-amber-400'}>{carbKg} g/kg</span> <span className="text-slate-500">(jour run 6–10 g/kg)</span></p>
                  )}
                </div>
                <SafetyBanner safety={safety} blindSpotLabel={blindSpot ? BLIND_SPOT_LABELS[blindSpot] : null} />
              </div>
            )
          })()}
        </div>

        {serverViolations && <SafetyBanner safety={{ ok: false, violations: serverViolations }} />}

        {msg && <p className={`text-sm ${msg.startsWith('✓') ? 'text-green-400' : msg.startsWith('⚠️') ? 'text-amber-400' : 'text-red-400'}`}>{msg}</p>}

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Sauvegarde...' : 'Sauvegarder le profil'}
        </button>
      </form>
    </div>
  )
}
