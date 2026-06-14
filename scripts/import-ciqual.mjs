// ============================================================================
//  Import CIQUAL complet → SQL pour la table ciqual_foods.
//  Usage : node scripts/import-ciqual.mjs "chemin/vers/Table Ciqual 2020.xls"
//  Lit le fichier officiel ANSES (.xls/.xlsx/.csv), mappe les colonnes utiles,
//  et écrit supabase/ciqual_full.sql (à coller dans Supabase → SQL Editor).
//  Le fichier officiel : https://ciqual.anses.fr → "Télécharger la table".
// ============================================================================
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

// --- Helpers PURS (testés) -------------------------------------------------

// Normalise un en-tête : minuscules, sans accents ni espaces superflus.
export function normHeader(h) {
  return String(h ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Parse un nombre "à la française" : "1,5" → 1.5, "traces"/"-"/"" → 0,
// "< 0,5" → 0.5, " 1 234,5 " → 1234.5. NaN → 0.
export function frNumber(v) {
  if (v == null) return 0
  if (typeof v === 'number') return v
  let s = String(v).trim().toLowerCase()
  if (s === '' || s === '-' || s.includes('traces')) return 0
  s = s.replace('<', '').replace(/\s/g, '').replace(',', '.')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

// Échappe une chaîne pour SQL (quotes doublées).
export function sqlStr(v) {
  return `'${String(v ?? '').replace(/'/g, "''")}'`
}

// Trouve la 1re clé d'en-tête qui valide le prédicat (sur en-tête normalisé).
export function findCol(headers, predicate) {
  return headers.find((h) => predicate(normHeader(h))) ?? null
}

// Détecte les colonnes utiles dans la liste d'en-têtes du fichier CIQUAL.
export function detectColumns(headers) {
  return {
    code:    findCol(headers, (h) => h === 'alim_code' || h.includes('alim_code')),
    name:    findCol(headers, (h) => h.includes('alim_nom_fr')),
    kcal:    findCol(headers, (h) => h.includes('energie') && h.includes('kcal')),
    protein: findCol(headers, (h) => h.startsWith('proteines')),
    carbs:   findCol(headers, (h) => h.startsWith('glucides')),
    fat:     findCol(headers, (h) => h.startsWith('lipides')),
    // startsWith pour éviter la colonne "Energie … avec fibres (kJ)" qui contient aussi "fibres".
    fiber:   findCol(headers, (h) => h.startsWith('fibres')),
  }
}

// Construit le SQL d'insertion par lots (ON CONFLICT pour ré-exécution sûre).
export function buildSql(rows, batchSize = 200) {
  const head =
    '-- CIQUAL complet (généré par scripts/import-ciqual.mjs)\n' +
    '-- À coller dans Supabase → SQL Editor. La table ciqual_foods doit exister.\n'
  const chunks = []
  for (let i = 0; i < rows.length; i += batchSize) {
    const values = rows
      .slice(i, i + batchSize)
      .map(
        (r) =>
          `  (${sqlStr(r.code)}, ${sqlStr(r.food_name)}, ${r.calories}, ${r.protein_g}, ${r.carbs_g}, ${r.fat_g}, ${r.fiber_g})`,
      )
      .join(',\n')
    chunks.push(
      'INSERT INTO public.ciqual_foods (code, food_name, calories, protein_g, carbs_g, fat_g, fiber_g) VALUES\n' +
        values +
        '\nON CONFLICT (code) DO NOTHING;',
    )
  }
  return head + chunks.join('\n\n') + '\n'
}

// Mappe une ligne brute (objet keyé par en-tête) → ligne ciqual_foods.
export function mapRow(raw, cols) {
  const name = raw[cols.name]
  const code = raw[cols.code]
  if (!name || !code) return null
  return {
    code: `ciqual_${String(code).trim()}`,
    food_name: String(name).trim(),
    calories: Math.round(frNumber(raw[cols.kcal])),
    protein_g: frNumber(raw[cols.protein]),
    carbs_g: frNumber(raw[cols.carbs]),
    fat_g: frNumber(raw[cols.fat]),
    fiber_g: frNumber(raw[cols.fiber]),
  }
}

// --- Exécution (uniquement si lancé directement) ---------------------------
async function main() {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage : node scripts/import-ciqual.mjs "<fichier CIQUAL .xls/.xlsx/.csv>"')
    process.exit(1)
  }
  const XLSX = await import('xlsx')
  const wb = XLSX.read(readFileSync(input), { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  if (!json.length) { console.error('Fichier vide ou illisible.'); process.exit(1) }

  const headers = Object.keys(json[0])
  const cols = detectColumns(headers)
  const missing = Object.entries(cols).filter(([, v]) => !v).map(([k]) => k)
  if (missing.length) {
    console.error('Colonnes introuvables :', missing.join(', '))
    console.error('En-têtes détectés :', headers.join(' | '))
    process.exit(1)
  }

  const rows = json.map((r) => mapRow(r, cols)).filter(Boolean)
  const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'ciqual_full.sql')
  writeFileSync(outPath, buildSql(rows), 'utf8')
  console.log(`✅ ${rows.length} aliments → ${outPath}`)
  console.log('Étape suivante : colle le contenu de ce fichier dans Supabase → SQL Editor → Run.')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
