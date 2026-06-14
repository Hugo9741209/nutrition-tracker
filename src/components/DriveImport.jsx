import { useState } from 'react'
import { X, ClipboardPaste, Check, ShoppingCart } from 'lucide-react'
import { parseDriveOrder } from './driveParser'

// Import d'un ticket / confirmation de commande Drive Super U → liste de courses.
// L'utilisateur colle le texte de l'email ; on reconnaît les produits côté front.
export default function DriveImport({ onClose, onConfirm }) {
  const [raw, setRaw] = useState('')
  const [items, setItems] = useState(null)      // null tant qu'on n'a pas parsé
  const [picked, setPicked] = useState({})       // index -> bool

  function handleParse() {
    const parsed = parseDriveOrder(raw)
    setItems(parsed)
    setPicked(Object.fromEntries(parsed.map((_, i) => [i, true])))
  }

  const selected = items ? items.filter((_, i) => picked[i]) : []

  async function handleConfirm() {
    if (!selected.length) return
    await onConfirm(selected.map((it) => ({ label: it.name, qty: it.qty })))
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-semibold flex items-center gap-2"><ShoppingCart size={18} className="text-green-400" /> Importer un ticket Drive</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items === null ? (
            <>
              <p className="text-xs text-slate-400">
                Ouvre l'email <span className="text-slate-300">« Confirmation de commande »</span> de Super U,
                copie tout son contenu et colle-le ici.
              </p>
              <textarea
                className="input h-44 resize-none font-mono text-xs"
                placeholder="Colle ici le contenu de l'email Drive…"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                autoFocus
              />
              <button
                onClick={handleParse}
                disabled={raw.trim().length < 10}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <ClipboardPaste size={16} /> Reconnaître les produits
              </button>
            </>
          ) : items.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8">
              Aucun produit reconnu. Vérifie que tu as collé l'email de confirmation Drive complet.
              <button onClick={() => setItems(null)} className="block mx-auto mt-3 text-green-400 text-sm">← Réessayer</button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400">{selected.length}/{items.length} produit(s) sélectionné(s) — décoche ce que tu ne veux pas.</p>
              <div className="divide-y divide-slate-800">
                {items.map((it, i) => (
                  <button
                    key={i}
                    onClick={() => setPicked((p) => ({ ...p, [i]: !p[i] }))}
                    className="w-full flex items-center gap-3 py-2.5 text-left"
                  >
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${picked[i] ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                      {picked[i] && <Check size={13} className="text-slate-900" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="text-sm block truncate">{it.name}</span>
                      {it.qty && <span className="text-xs text-slate-500">{it.qty}</span>}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {items && items.length > 0 && (
          <div className="p-4 border-t border-slate-800">
            <button onClick={handleConfirm} disabled={!selected.length} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40">
              <ShoppingCart size={16} /> Ajouter {selected.length} article{selected.length > 1 ? 's' : ''} à ma liste
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
