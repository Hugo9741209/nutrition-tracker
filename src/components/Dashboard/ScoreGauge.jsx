// Jauge circulaire du score d'équilibre du jour. Couleurs DOUCES, jamais de
// rouge agressif (cadrage bienveillant, script §6.5). Le score vient du backend.
function color(score) {
  if (score >= 80) return '#34d399' // vert doux
  if (score >= 60) return '#a3e635' // vert-lime
  if (score >= 40) return '#fbbf24' // ambre
  return '#94a3b8'                   // slate (neutre, pas de rouge)
}

export default function ScoreGauge({ score, label }) {
  if (score == null) return null
  const r = 34
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const c = color(score)

  return (
    <div className="card flex items-center gap-4">
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
          <circle cx="42" cy="42" r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="42" cy="42" r={r} fill="none"
            stroke={c} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: c }}>{score}</span>
          <span className="text-[10px] text-slate-500">/ 100</span>
        </div>
      </div>
      <div>
        <p className="text-sm text-slate-400">Équilibre du jour</p>
        <p className="text-lg font-semibold" style={{ color: c }}>{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">Basé sur tes calories et protéines du jour.</p>
      </div>
    </div>
  )
}
