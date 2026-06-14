// ============================================================================
//  NutriTrack — Export de données (BACKEND : sérialisation CSV)
// ----------------------------------------------------------------------------
//  Transforme les données utilisateur en CSV (sauvegarde, Excel, partage à un
//  coach / médecin). Logique PURE, testable. Le front déclenche le téléchargement.
// ============================================================================

// Échappe une valeur pour CSV (guillemets, virgules, retours ligne).
function csvCell(v) {
  const s = v == null ? '' : String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Construit un CSV à partir d'un tableau d'objets et d'une liste de colonnes.
//   columns : [{ key, label }]
export function toCSV(rows, columns, { separator = ',' } = {}) {
  const header = columns.map((c) => csvCell(c.label)).join(separator)
  const lines = (rows ?? []).map((r) =>
    columns.map((c) => csvCell(r[c.key])).join(separator),
  )
  return [header, ...lines].join('\n')
}

// CSV du journal alimentaire.
export function foodLogsToCSV(logs) {
  return toCSV(logs, [
    { key: 'logged_date', label: 'Date' },
    { key: 'meal_type', label: 'Repas' },
    { key: 'food_name', label: 'Aliment' },
    { key: 'brand', label: 'Marque' },
    { key: 'quantity_g', label: 'Quantité (g)' },
    { key: 'calories', label: 'Calories' },
    { key: 'protein_g', label: 'Protéines (g)' },
    { key: 'carbs_g', label: 'Glucides (g)' },
    { key: 'fat_g', label: 'Lipides (g)' },
    { key: 'fiber_g', label: 'Fibres (g)' },
  ])
}

// CSV du suivi de poids.
export function weightLogsToCSV(logs) {
  return toCSV(logs, [
    { key: 'logged_date', label: 'Date' },
    { key: 'weight_kg', label: 'Poids (kg)' },
    { key: 'note', label: 'Note' },
  ])
}

// Nom de fichier daté, ex. nutritrack-journal-2026-06-14.csv
export function exportFilename(kind, date = new Date()) {
  return `nutritrack-${kind}-${date.toISOString().split('T')[0]}.csv`
}
