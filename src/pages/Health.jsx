import { Activity, RefreshCw, Link2, Footprints, Dumbbell, Zap } from 'lucide-react'
import { useStrava } from '../hooks/useStrava'
import { weeklyExpenditure, activityEnergyKcal } from '../lib/health'

const STRAVA_REDIRECT = 'https://nutritrack-pro-app.vercel.app/strava/callback'

const TYPE_ICON = { course: Footprints, musculation: Dumbbell, autre: Activity }
const RELIABILITY = {
  high: { label: 'fiable', c: 'text-green-400' },
  medium: { label: 'moyenne', c: 'text-slate-400' },
  low: { label: 'estimation', c: 'text-amber-400' },
}

// Mappe une ligne strava_activities (snake_case) vers la forme attendue par health.js.
function toActivity(a) {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    distanceKm: a.distance_km != null ? +a.distance_km : undefined,
    durationMin: a.duration_min != null ? +a.duration_min : undefined,
    calories: a.calories != null ? +a.calories : undefined,
    date: a.activity_date,
  }
}

export default function Health({ user, profile }) {
  const { activities, connected, loading, syncing, connectUrl, sync } = useStrava(user?.id)
  const weightKg = profile?.current_weight_kg ? +profile.current_weight_kg : null

  if (loading) return <div className="flex justify-center pt-20"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>

  const mapped = activities.map(toActivity)
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
  const cutoffISO = cutoff.toISOString().split('T')[0]
  const recent = mapped.filter(a => a.date && a.date >= cutoffISO)
  const week = weeklyExpenditure(recent, { weightKg, days: 7 })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Santé & activité</h1>
        <p className="text-slate-400 text-sm mt-1">Ta dépense énergétique, synchronisée depuis Strava</p>
      </div>

      {!connected ? (
        <div className="card text-center py-8 space-y-4">
          <Activity size={32} className="mx-auto text-[#FC4C02]" />
          <div>
            <p className="font-semibold">Connecte ton Strava</p>
            <p className="text-sm text-slate-400 mt-1">Pour importer tes courses et séances, et ajuster ta nutrition les jours chargés.</p>
          </div>
          <button
            onClick={() => { window.location.href = connectUrl(STRAVA_REDIRECT) }}
            className="inline-flex items-center gap-2 bg-[#FC4C02] hover:bg-[#e34402] text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            <Link2 size={16} /> Connecter Strava
          </button>
        </div>
      ) : (
        <>
          {/* Dépense de la semaine */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Zap size={15} className="text-green-400" /><p className="text-sm text-slate-300 font-medium">Dépense (7 jours)</p></div>
              <button onClick={sync} disabled={syncing} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 disabled:opacity-50">
                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Sync…' : 'Synchroniser'}
              </button>
            </div>
            <p className="text-3xl font-bold text-green-400">{week.totalKcal} <span className="text-lg text-slate-500 font-normal">kcal</span></p>
            <p className="text-xs text-slate-500 mt-1">{week.count} activité{week.count > 1 ? 's' : ''} · ~{week.dailyAvgKcal} kcal/jour</p>
            <div className="flex gap-4 mt-3 text-xs">
              {Object.entries(week.byType).map(([t, k]) => (
                <span key={t} className="text-slate-400 capitalize">{t} : <span className="text-white">{k} kcal</span></span>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-3">{week.reliabilityNote}</p>
          </div>

          {/* Liste des activités */}
          <div className="card">
            <p className="text-sm text-slate-300 font-medium mb-3">Activités récentes</p>
            {mapped.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">Aucune activité. Clique sur « Synchroniser » pour récupérer tes 30 derniers jours.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {mapped.slice(0, 20).map(a => {
                  const e = activityEnergyKcal(a, { weightKg })
                  const Icon = TYPE_ICON[e.type] ?? Activity
                  const rel = RELIABILITY[e.reliability] ?? RELIABILITY.low
                  return (
                    <div key={a.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <Icon size={16} className="text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{a.name || e.type}</p>
                        <p className="text-xs text-slate-500">
                          {a.date}{a.distanceKm ? ` · ${a.distanceKm} km` : ''}{a.durationMin ? ` · ${a.durationMin} min` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-white">{e.kcal} kcal</p>
                        <p className={`text-[10px] ${rel.c}`}>{rel.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <p className="text-[11px] text-center text-slate-600">
            Course = dépense fiable (distance × poids). Calories de musculation = estimation prudente, à ne pas surinterpréter.
          </p>
        </>
      )}
    </div>
  )
}
