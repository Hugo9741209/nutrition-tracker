// Edge Function : échange le "code" OAuth Strava contre des tokens et les stocke.
// Déploiement : supabase functions deploy strava-auth
// Secrets requis : STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { code } = await req.json()
    if (!code) return json({ error: 'code manquant' }, 400)

    // Identité de l'utilisateur via son JWT Supabase.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return json({ error: 'non authentifié' }, 401)

    // Échange code → tokens chez Strava (form-urlencoded, pas JSON).
    const res = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('STRAVA_CLIENT_ID')!,
        client_secret: Deno.env.get('STRAVA_CLIENT_SECRET')!,
        code,
        grant_type: 'authorization_code',
      }),
    })
    const tok = await res.json()
    if (!tok.access_token) return json({ error: 'échange Strava échoué', detail: tok }, 400)

    // Stockage (RLS : l'utilisateur n'écrit que sa ligne).
    const { error } = await supabase.from('strava_tokens').upsert({
      user_id: user.id,
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: tok.expires_at,
      athlete_id: tok.athlete?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    if (error) return json({ error: error.message }, 400)
    return json({ connected: true })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}
