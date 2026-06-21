import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { stravaAuthorizeUrl } from '../lib/strava'

// Connexion + activités Strava. L'OAuth/sync passe par les Edge Functions
// (strava-auth / strava-sync) ; ici on lit les activités stockées et on déclenche.
export function useStrava(userId) {
  const [activities, setActivities] = useState([])
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    refresh()
  }, [userId])

  async function refresh() {
    setLoading(true)
    const [{ data: tok }, { data: acts }] = await Promise.all([
      supabase.from('strava_tokens').select('user_id').eq('user_id', userId).maybeSingle(),
      supabase.from('strava_activities').select('*').eq('user_id', userId).order('activity_date', { ascending: false }),
    ])
    setConnected(!!tok)
    setActivities(acts ?? [])
    setLoading(false)
  }

  // URL vers laquelle rediriger pour autoriser Strava (client_id public via env).
  function connectUrl(redirectUri) {
    return stravaAuthorizeUrl({ clientId: import.meta.env.VITE_STRAVA_CLIENT_ID, redirectUri })
  }

  // Au retour du callback OAuth : échange le code contre des tokens.
  async function connect(code) {
    const { data, error } = await supabase.functions.invoke('strava-auth', { body: { code } })
    if (!error) { setConnected(true); await refresh() }
    return { data, error }
  }

  // Récupère les activités récentes depuis Strava.
  async function sync() {
    setSyncing(true)
    const { data, error } = await supabase.functions.invoke('strava-sync', { body: {} })
    if (!error) await refresh()
    setSyncing(false)
    return { data, error }
  }

  return { activities, connected, loading, syncing, connect, connectUrl, sync, refresh }
}
