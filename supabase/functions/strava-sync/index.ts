// Edge Function : récupère les activités Strava récentes et les enregistre.
// Déploiement : supabase functions deploy strava-sync
// Secrets requis : STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const normalizeType = (raw: string) => {
  const t = (raw ?? '').toLowerCase()
  if (t.includes('run') || t.includes('trail')) return 'run'
  if (t.includes('weight') || t.includes('workout') || t.includes('crossfit')) return 'strength'
  if (t.includes('ride') || t.includes('cycl') || t.includes('bike')) return 'ride'
  return t || 'autre'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json({ error: 'non authentifié' }, 401)

    const { data: row } = await supabase.from('strava_tokens').select('*').eq('user_id', user.id).maybeSingle()
    if (!row) return json({ error: 'Strava non connecté' }, 400)

    // Rafraîchit le token si expiré.
    let accessToken = row.access_token
    if (row.expires_at && row.expires_at * 1000 <= Date.now()) {
      const r = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('STRAVA_CLIENT_ID')!,
          client_secret: Deno.env.get('STRAVA_CLIENT_SECRET')!,
          grant_type: 'refresh_token', refresh_token: row.refresh_token,
        }),
      })
      const t = await r.json()
      if (!t.access_token) return json({ error: 'refresh échoué', detail: t }, 400)
      accessToken = t.access_token
      await supabase.from('strava_tokens').update({
        access_token: t.access_token, refresh_token: t.refresh_token,
        expires_at: t.expires_at, updated_at: new Date().toISOString(),
      }).eq('user_id', user.id)
    }

    // Activités des 30 derniers jours.
    const after = Math.floor((Date.now() - 30 * 86400000) / 1000)
    const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const acts = await res.json()
    if (!Array.isArray(acts)) return json({ error: 'réponse Strava invalide', detail: acts }, 400)

    const rows = acts.map((a: any) => ({
      user_id: user.id,
      strava_id: a.id,
      name: a.name ?? '',
      type: normalizeType(a.sport_type ?? a.type),
      distance_km: a.distance ? +(a.distance / 1000).toFixed(2) : null,
      duration_min: a.moving_time ? Math.round(a.moving_time / 60) : null,
      calories: a.calories ?? null,
      activity_date: String(a.start_date_local ?? a.start_date ?? '').split('T')[0] || null,
    }))

    if (rows.length) {
      const { error } = await supabase.from('strava_activities').upsert(rows, { onConflict: 'user_id,strava_id' })
      if (error) return json({ error: error.message }, 400)
    }
    return json({ synced: rows.length })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}
