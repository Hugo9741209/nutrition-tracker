import { Droplet, Minus, Plus } from 'lucide-react'
import { useWaterLog } from '../hooks/useWaterLog'

// 1 verre ≈ 250 ml.
const ML_PER_GLASS = 250

export default function Hydration({ user }) {
  const { glasses, target, loading, increment } = useWaterLog(user?.id)
  const pct = target > 0 ? Math.min((glasses / target) * 100, 100) : 0

  if (loading) return <div className="flex justify-center pt-20"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Hydratation</h1>
        <p className="text-slate-400 text-sm mt-1">Objectif : {target} verres (~{(target * ML_PER_GLASS / 1000).toFixed(1)} L)</p>
      </div>

      <div className="card flex flex-col items-center py-8 gap-5">
        <div className="text-center">
          <p className="text-5xl font-bold text-cyan-400">{glasses}<span className="text-slate-500 text-2xl font-normal"> / {target}</span></p>
          <p className="text-slate-400 text-sm mt-1">{(glasses * ML_PER_GLASS / 1000).toFixed(2)} L bus aujourd'hui</p>
        </div>

        <div className="w-full max-w-xs h-3 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex items-center gap-5">
          <button
            onClick={() => increment(-1)} disabled={glasses === 0}
            className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white disabled:opacity-40 hover:bg-slate-700 transition-colors"
          >
            <Minus size={20} />
          </button>
          <button
            onClick={() => increment(1)}
            className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center text-cyan-300 hover:bg-cyan-500/30 transition-colors"
          >
            <Plus size={26} />
          </button>
        </div>
      </div>

      {/* Rangée de verres */}
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: target }).map((_, i) => (
          <Droplet key={i} size={26} className={i < glasses ? 'text-cyan-400 fill-cyan-400/30' : 'text-slate-700'} />
        ))}
      </div>

      {glasses >= target && (
        <p className="text-center text-green-400 text-sm">Objectif atteint 💧 Bien joué !</p>
      )}
    </div>
  )
}
