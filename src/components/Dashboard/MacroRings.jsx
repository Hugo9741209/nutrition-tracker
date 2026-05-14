function Ring({ value, target, color, label, unit = 'g' }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#1e293b" strokeWidth="7" />
          <circle
            cx="36" cy="36" r={r} fill="none"
            stroke={color} strokeWidth="7"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-white">{Math.round(value)}</span>
          <span className="text-xs text-slate-500">{unit}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium" style={{ color }}>{label}</p>
        <p className="text-xs text-slate-500">/ {target}{unit}</p>
      </div>
    </div>
  )
}

export default function MacroRings({ totals, profile }) {
  return (
    <div className="card">
      <p className="text-slate-400 text-sm mb-4">Macronutriments</p>
      <div className="flex justify-around">
        <Ring value={totals.protein_g} target={profile?.target_protein_g ?? 150} color="#60a5fa" label="Protéines" />
        <Ring value={totals.carbs_g}   target={profile?.target_carbs_g   ?? 250} color="#fb923c" label="Glucides" />
        <Ring value={totals.fat_g}     target={profile?.target_fat_g     ?? 70}  color="#c084fc" label="Lipides" />
      </div>
    </div>
  )
}
