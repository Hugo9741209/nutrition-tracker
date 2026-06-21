import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X } from 'lucide-react'
import { useEscape, backdropClose } from './modal'

// Scanner code-barres (caméra) — front pur. Renvoie le code détecté via onDetected.
// Le lookup produit se fait ensuite via searchByBarcode (lib/foods, backend).
export default function BarcodeScanner({ onDetected, onClose }) {
  const [error, setError] = useState('')
  const scannerRef = useRef(null)
  const handledRef = useRef(false)
  useEscape(onClose)

  useEffect(() => {
    const scanner = new Html5Qrcode('barcode-reader')
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        (decoded) => {
          if (handledRef.current) return
          handledRef.current = true
          onDetected(decoded)
        },
        () => {} // erreurs de frame ignorées
      )
      .catch(() => setError("Impossible d'accéder à la caméra. Autorise-la ou saisis le code à la main."))

    return () => {
      scanner.stop().then(() => scanner.clear()).catch(() => {})
    }
  }, [onDetected])

  return (
    <div onClick={backdropClose(onClose)} className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-label="Scanner un code-barres" className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="font-semibold">Scanner un code-barres</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-4">
          <div id="barcode-reader" className="rounded-xl overflow-hidden bg-black min-h-[240px]" />
          {error
            ? <p className="text-amber-400 text-sm mt-3">{error}</p>
            : <p className="text-slate-500 text-xs mt-3 text-center">Vise le code-barres du produit.</p>}
        </div>
      </div>
    </div>
  )
}
