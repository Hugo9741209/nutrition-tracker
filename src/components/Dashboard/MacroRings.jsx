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

import { perKg, inRange, PROTEIN_ENDURANCE_RANGE, CARBS_REST_RANGE, CARBS_TRAIN_RANGE } from '../nutritionDisplay'

// dayType : 'rest' (jour repos, 5–7 g/kg) ou 'run' (jour d'entraînement, 6–10 g/kg).
export default function MacroRings({ totals, profile, dayType = 'rest' }) {
  const w = profile?.current_weight_kg ? +profile.current_weight_kg : null
  // g/kg de la cible protéique = métrique que le sportif d'endurance comprend (§7).
  const protKg = w && profile?.target_protein_g ? perKg(+profile.target_protein_g, w) : null
  const protOk = protKg != null && inRange(protKg, PROTEIN_ENDURANCE_RANGE)

  // Glucides = carburant. La bande de référence dépend du type de jour.
  const carbKg = w && profile?.target_carbs_g ? perKg(+profile.target_carbs_g, w) : null
  const carbBand = dayType === 'run' ? CARBS_TRAIN_RANGE : CARBS_REST_RANGE
  const carbOk = carbKg != null && inRange(carbKg, carbBand)

  return (
    <div className="card">
      <p className="text-slate-400 text-sm mb-4">Macronutriments</p>
      <div className="flex justify-around">
        <Ring value={totals.protein_g} target={profile?.target_protein_g ?? 150} color="#60a5fa" label="Protéines" />
        <Ring value={totals.carbs_g}   target={profile?.target_carbs_g   ?? 250} color="#fb923c" label="Glucides" />
        <Ring value={totals.fat_g}     target={profile?.target_fat_g     ?? 70}  color="#c084fc" label="Lipides" />
      </div>
      {(protKg != null || carbKg != null) && (
        <div className="text-xs text-center text-slate-500 mt-4 space-y-1">
          {protKg != null && (
            <p>
              Protéines : <span className={protOk ? 'text-green-400' : 'text-amber-400'}>{protKg} g/kg</span>
              <span className="text-slate-600"> · zone endurance 1,5–1,7 g/kg</span>
            </p>
          )}
          {carbKg != null && (
            <p>
              Glucides (carburant) : <span className={carbOk ? 'text-green-400' : 'text-amber-400'}>{carbKg} g/kg</span>
              <span className="text-slate-600"> · {dayType === 'run' ? 'jour run 6–10' : 'jour repos 5–7'} g/kg</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
