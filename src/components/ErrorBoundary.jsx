import { Component } from 'react'

// Capture les erreurs de rendu pour éviter l'écran blanc : un souci sur un
// écran n'abat plus toute l'app, on affiche un message + bouton recharger.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Erreur UI :', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-lg font-semibold">Oups, un souci d'affichage</p>
          <p className="text-sm text-slate-400 max-w-xs">Une erreur est survenue sur cet écran. Tes données sont en sécurité.</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Recharger l'app</button>
        </div>
      )
    }
    return this.props.children
  }
}
