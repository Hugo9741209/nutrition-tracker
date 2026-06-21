import { useEffect } from 'react'

// Ferme une modale sur la touche Échap (a11y + UX attendue).
export function useEscape(onClose) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
}

// Handler de clic sur le fond : ne ferme que si on clique HORS du contenu.
export function backdropClose(onClose) {
  return (e) => { if (e.target === e.currentTarget) onClose?.() }
}
