export default function CalorieBar({ consumed, target }) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0
  const remaining = Math.max(target - consumed, 0)
  const over = consumed > target ? consumed - target : 0

  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 85 ? 'bg-orange-400' : 'bg-green-500'

  return (
    <div className="card">
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-slate-400 text-sm">Calories aujourd'hui</p>
          <p className="text-3xl font-bold text-white mt-0.5">
            {Math.round(consumed)}
            <span className="text-slate-500 text-lg font-normal"> / {target} kcal</span>
          </p>
        </div>
        <div className="text-right">
          {over > 0 ? (
            <p className="text-red-400 text-sm font-medium">+{Math.round(over)} kcal dépassé</p>
          ) : (
            <p className="text-slate-400 text-sm">{Math.round(remaining)} kcal restantes</p>
          )}
        </div>
      </div>
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-2">{Math.round(pct)}% de l'objectif</p>
    </div>
  )
}
