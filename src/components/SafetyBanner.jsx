import { AlertTriangle, ShieldCheck, Info } from 'lucide-react'

// Bandeau de sécurité — affiche les garde-fous calculés par le BACKEND.
// Le front N'INVENTE aucun seuil : il rend le résultat de checkGoalSafety()
// ({ ok, violations:[{ code, message }] }) de src/lib/nutrition.js.
//
// Cadrage volontairement bienveillant (cf. script §6.5) : on alerte clairement
// sur un objectif dangereux, sans culpabiliser ni présenter un chiffre famine
// comme « ton plan ».
export default function SafetyBanner({ safety, blindSpotLabel }) {
  // Rien à afficher tant qu'on n'a pas de verdict de sécurité.
  if (!safety && !blindSpotLabel) return null

  return (
    <div className="space-y-2">
      {safety && !safety.ok && (
        <div className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-amber-300">Objectif à revoir pour rester sain</p>
            <ul className="space-y-1 text-amber-200/90 text-xs list-disc list-inside">
              {safety.violations.map(v => (
                <li key={v.code}>{v.message}</li>
              ))}
            </ul>
            <p className="text-[11px] text-amber-200/60">
              Ces seuils suivent les repères ANSES / RDA. Vise une progression
              régulière plutôt qu'un déficit agressif.
            </p>
          </div>
        </div>
      )}

      {safety && safety.ok && (
        <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-2.5 text-sm text-green-300">
          <ShieldCheck size={16} className="shrink-0" />
          Objectif dans les bornes saines.
        </div>
      )}

      {blindSpotLabel && (
        <div className="flex gap-3 rounded-xl border border-slate-600 bg-slate-800 p-3">
          <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300">
            {blindSpotLabel}{' '}
            <span className="text-slate-500">
              L'estimation reste indicative — recoupe-la avec tes résultats réels.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
