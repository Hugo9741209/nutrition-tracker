import { Link } from 'react-router-dom'
import { RefreshCw, ArrowRight } from 'lucide-react'

// Rappel de recalibrage (script §6.2) : le BMR/TDEE dérive avec le temps et le
// poids. On invite à recalculer si l'objectif est ancien (> 5 sem) ou si le poids
// a bougé de ±3 kg depuis la config. Affichage seul — aucun calcul "officiel".
const WEEKS_BEFORE_RECAL = 5
const WEIGHT_DRIFT_KG = 3

export default function RecalibrateBanner({ profile, latestWeight }) {
  if (!profile?.target_calories) return null

  const reasons = []

  // 1) Ancienneté de l'objectif (basée sur updated_at du profil).
  const updatedAt = profile.updated_at ? new Date(profile.updated_at) : null
  if (updatedAt) {
    const weeks = Math.floor((Date.now() - updatedAt.getTime()) / (7 * 24 * 3600 * 1000))
    if (weeks >= WEEKS_BEFORE_RECAL) reasons.push(`ton objectif date de ${weeks} semaines`)
  }

  // 2) Dérive de poids depuis la config (BMR baisse ~50 kcal / 5 kg).
  if (latestWeight != null && profile.current_weight_kg != null) {
    const drift = Math.abs(+latestWeight - +profile.current_weight_kg)
    if (drift >= WEIGHT_DRIFT_KG) reasons.push(`ton poids a bougé de ${drift.toFixed(1)} kg`)
  }

  if (reasons.length === 0) return null

  return (
    <div className="flex gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
      <RefreshCw size={18} className="text-green-400 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <p className="text-sm text-slate-200">
          Et si on recalibrait ? <span className="text-slate-400">{reasons.join(' et ')}</span> — ta dépense estimée a sûrement évolué.
        </p>
        <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-green-400 hover:text-green-300 font-medium">
          Recalculer mes objectifs <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
