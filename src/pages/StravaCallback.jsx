import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStrava } from '../hooks/useStrava'

// Retour d'OAuth Strava : /strava/callback?code=... → échange le code puis redirige.
export default function StravaCallback({ user }) {
  const { connect } = useStrava(user?.id)
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) { navigate('/health', { replace: true }); return }
    connect(code).then(({ error }) => {
      if (error) setError('La connexion Strava a échoué. Réessaie depuis l\'onglet Santé.')
      else navigate('/health', { replace: true })
    })
  }, [])

  return (
    <div className="flex flex-col items-center justify-center pt-24 gap-4 text-center">
      <div className="w-8 h-8 border-2 border-[#FC4C02] border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">{error || 'Connexion à Strava en cours…'}</p>
      {error && <button onClick={() => navigate('/health')} className="text-green-400 text-sm">← Retour</button>}
    </div>
  )
}
