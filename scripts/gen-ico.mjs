// Génère public/favicon.ico (multi-tailles) depuis public/icon.svg.
// Usage : node scripts/gen-ico.mjs
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'public/icon.svg'))
const sizes = [16, 32, 48, 64, 128, 256]

const pngs = await Promise.all(sizes.map((s) => sharp(svg).resize(s, s).png().toBuffer()))
const ico = await pngToIco(pngs)
writeFileSync(join(root, 'public/favicon.ico'), ico)
console.log('✅ public/favicon.ico généré.')
