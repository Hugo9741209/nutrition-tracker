// Génère les PNG d'icônes PWA depuis public/icon.svg.
// Usage : node scripts/gen-icons.mjs   (nécessite sharp en devDependency)
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'public/icon.svg'))
const out = (f) => join(root, 'public', f)
const green = '#16a34a'

await sharp(svg).resize(192, 192).png().toFile(out('icon-192.png'))
await sharp(svg).resize(512, 512).png().toFile(out('icon-512.png'))
// Maskable : marge de sécurité (zone safe ~80%) sur fond plein.
await sharp(svg).resize(410, 410).flatten({ background: green })
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: green })
  .png().toFile(out('icon-512-maskable.png'))
// Apple touch icon (iOS) : 180px, fond plein (pas de transparence).
await sharp(svg).resize(180, 180).flatten({ background: green }).png().toFile(out('apple-touch-icon.png'))

console.log('Icônes PNG générées dans public/.')
