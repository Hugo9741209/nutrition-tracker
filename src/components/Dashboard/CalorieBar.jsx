export default function CalorieBar({ consumed, target }) {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0
  const remaining = Math.max(target - consumed, 0)
  const over = consumed > target ? consumed - target : 0

  // Cadrage non-culpabilisant (cf. script §6.5) : dépassement en ambre, jamais
  // rouge agressif. En dessous/proche de l'objectif = vert.
  const barColor = pct >= 100 ? 'bg-amber-400' : 'bg-green-500'

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
            <p className="text-amber-400 text-sm font-medium">+{Math.round(over)} kcal au-dessus</p>
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
