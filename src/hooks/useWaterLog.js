import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { todayStr } from '../lib/nutrition'

// Cible par défaut : ~8 verres/j (≈ 2 L, baseline EFSA ~35 ml/kg ajustable plus tard).
const DEFAULT_TARGET = 8

// Suivi hydratation d'un jour (1 ligne par user+date). RLS isole par user.
export function useWaterLog(userId, date = todayStr(), target = DEFAULT_TARGET) {
  const [glasses, setGlassesState] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetchDay()
  }, [userId, date])

  async function fetchDay() {
    setLoading(true)
    const { data } = await supabase
      .from('water_logs')
      .select('glasses')
      .eq('user_id', userId)
      .eq('logged_date', date)
      .maybeSingle()
    setGlassesState(data?.glasses ?? 0)
    setLoading(false)
  }

  // Upsert sur (user_id, logged_date) — jamais de valeur négative.
  async function setGlasses(n) {
    const value = Math.max(0, Math.round(n))
    setGlassesState(value) // optimiste
    await supabase
      .from('water_logs')
      .upsert(
        { user_id: userId, logged_date: date, glasses: value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,logged_date' },
      )
  }

  const increment = (delta = 1) => setGlasses(glasses + delta)

  return { glasses, target, loading, setGlasses, increment, refetch: fetchDay }
}
