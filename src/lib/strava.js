// ============================================================================
//  NutriTrack — Pont Strava (BACKEND) : helpers purs + mapping vers notre format
// ----------------------------------------------------------------------------
//  L'OAuth et la récupération réelle des activités se font côté serveur
//  (Edge Functions Supabase, voir supabase/functions/strava-*). Ici : l'URL
//  d'autorisation et la NORMALISATION d'une activité Strava vers la forme
//  consommée par health.js / training.js. Pur, testable.
// ============================================================================

// Scope minimal pour lire les activités (course/muscu).
export const STRAVA_SCOPE = 'activity:read_all'

// URL d'autorisation Strava (le front y redirige l'utilisateur).
export function stravaAuthorizeUrl({ clientId, redirectUri, scope = STRAVA_SCOPE, state = '' }) {
  const p = new URLSearchParams({
    client_id: String(clientId),
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope,
  })
  if (state) p.set('state', state)
  return `https://www.strava.com/oauth/authorize?${p.toString()}`
}

// Normalise le type Strava (sport_type/type) vers nos catégories.
export function normalizeStravaType(raw) {
  const t = String(raw ?? '').toLowerCase()
  if (t.includes('run') || t.includes('trail')) return 'run'
  if (t.includes('weight') || t.includes('workout') || t.includes('crossfit')) return 'strength'
  if (t.includes('ride') || t.includes('cycl') || t.includes('bike')) return 'ride'
  return t || 'autre'
}

// Mappe une activité Strava brute → forme interne (compatible health.js).
//   { stravaId, name, type, distanceKm, durationMin, calories, date }
export function mapStravaActivity(raw = {}) {
  const start = raw.start_date_local ?? raw.start_date ?? ''
  return {
    stravaId: raw.id ?? null,
    name: raw.name ?? '',
    type: normalizeStravaType(raw.sport_type ?? raw.type),
    distanceKm: raw.distance ? +(raw.distance / 1000).toFixed(2) : null,
    durationMin: raw.moving_time ? Math.round(raw.moving_time / 60) : null,
    calories: raw.calories != null ? Math.round(raw.calories) : null,
    date: String(start).split('T')[0] || null,
  }
}
