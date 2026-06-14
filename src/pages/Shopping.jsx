import { useState } from 'react'
import { Plus, Trash2, ScanLine, Eraser, ShoppingCart, ReceiptText } from 'lucide-react'
import { useShoppingList } from '../hooks/useShoppingList'
import { searchByBarcode } from '../lib/foods'
import BarcodeScanner from '../components/BarcodeScanner'
import DriveImport from '../components/DriveImport'
import StaplePanel from '../components/StaplePanel'

export default function Shopping({ user }) {
  const { items, loading, addItem, addMany, toggleItem, deleteItem, clearChecked } = useShoppingList(user?.id)
  const [label, setLabel] = useState('')
  const [qty, setQty] = useState('')
  const [scanning, setScanning] = useState(false)
  const [importing, setImporting] = useState(false)
  const [scanMsg, setScanMsg] = useState('')

  async function handleAdd(e) {
    e?.preventDefault()
    if (!label.trim()) return
    await addItem(label, qty)
    setLabel(''); setQty('')
  }

  async function handleDetected(code) {
    setScanning(false)
    setScanMsg('Recherche du produit…')
    const food = await searchByBarcode(code)
    if (food) {
      await addItem(food.food_name, food.brand || '')
      setScanMsg(`✓ « ${food.food_name} » ajouté à la liste`)
    } else {
      setScanMsg(`Produit introuvable (code ${code}). Ajoute-le à la main.`)
    }
    setTimeout(() => setScanMsg(''), 3000)
  }

  const checkedCount = items.filter(i => i.checked).length

  if (loading) return <div className="flex justify-center pt-20"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Liste de courses</h1>
        <p className="text-slate-400 text-sm mt-1">{items.length} article{items.length > 1 ? 's' : ''}{checkedCount ? ` · ${checkedCount} coché${checkedCount > 1 ? 's' : ''}` : ''}</p>
      </div>

      {/* Ajout */}
      <form onSubmit={handleAdd} className="card space-y-3">
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Article (ex: Flocons d'avoine)" value={label} onChange={e => setLabel(e.target.value)} />
          <input className="input w-24" placeholder="Qté" value={qty} onChange={e => setQty(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-1"><Plus size={16} /> Ajouter</button>
          <button type="button" onClick={() => setScanning(true)} className="px-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 text-sm">
            <ScanLine size={16} /> Scanner
          </button>
        </div>
        <button type="button" onClick={() => setImporting(true)} className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center gap-2 text-sm">
          <ReceiptText size={16} /> Importer un ticket Drive Super U
        </button>
        {scanMsg && <p className="text-xs text-slate-400">{scanMsg}</p>}
      </form>

      {/* Produits phares — ajout rapide + éditable (déduits de l'historique Drive) */}
      <StaplePanel items={items} onAdd={(label, qty) => addItem(label, qty)} />

      {/* Liste */}
      {items.length === 0 ? (
        <div className="card text-center text-slate-500 text-sm py-8">
          <ShoppingCart size={28} className="mx-auto mb-3 text-slate-600" />
          Ta liste est vide. Ajoute un article ou scanne un produit.
        </div>
      ) : (
        <>
          <div className="card divide-y divide-slate-800">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <button
                  onClick={() => toggleItem(item.id)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${item.checked ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}
                >
                  {item.checked && <span className="text-slate-900 text-xs font-bold">✓</span>}
                </button>
                <div className={`flex-1 min-w-0 ${item.checked ? 'line-through text-slate-500' : ''}`}>
                  <span className="text-sm">{item.label}</span>
                  {item.qty && <span className="text-xs text-slate-500 ml-2">{item.qty}</span>}
                </div>
                <button onClick={() => deleteItem(item.id)} className="text-slate-600 hover:text-red-400 transition-colors p-1 shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {checkedCount > 0 && (
            <button onClick={clearChecked} className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white py-2">
              <Eraser size={15} /> Retirer les {checkedCount} article{checkedCount > 1 ? 's' : ''} coché{checkedCount > 1 ? 's' : ''}
            </button>
          )}
        </>
      )}

      {scanning && <BarcodeScanner onDetected={handleDetected} onClose={() => setScanning(false)} />}
      {importing && <DriveImport onClose={() => setImporting(false)} onConfirm={(entries) => addMany(entries)} />}
    </div>
  )
}
