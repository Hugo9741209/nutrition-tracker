import { Download } from 'lucide-react'
import { weightLogsToCSV, toCSV, exportFilename } from '../lib/export'
import { useWeightLogs } from '../hooks/useWeightLogs'
import { useFoodHistory } from '../hooks/useFoodLogs'

function download(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Export CSV des données (mise en forme = lib/export, côté backend).
export default function ExportData({ user }) {
  const { logs: weightLogs } = useWeightLogs(user?.id, 3650)
  const { history } = useFoodHistory(user?.id, 3650)

  function exportFood() {
    const csv = toCSV(
      history.map(d => ({ date: d.date, calories: d.calories, protein_g: d.protein_g, carbs_g: d.carbs_g, fat_g: d.fat_g })),
      [
        { key: 'date', label: 'Date' },
        { key: 'calories', label: 'Calories' },
        { key: 'protein_g', label: 'Protéines (g)' },
        { key: 'carbs_g', label: 'Glucides (g)' },
        { key: 'fat_g', label: 'Lipides (g)' },
      ],
    )
    download(exportFilename('journal'), csv)
  }

  function exportWeight() {
    download(exportFilename('poids'), weightLogsToCSV(weightLogs))
  }

  return (
    <div className="card space-y-3">
      <p className="font-semibold text-sm text-slate-300 uppercase tracking-wider">Exporter mes données</p>
      <div className="flex gap-2">
        <button onClick={exportFood} className="flex-1 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-sm">
          <Download size={15} /> Journal (CSV)
        </button>
        <button onClick={exportWeight} className="flex-1 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-sm">
          <Download size={15} /> Poids (CSV)
        </button>
      </div>
    </div>
  )
}
