import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { computeWeeklyInsights } from '../lib/insights'
import { formatDate } from '../lib/nutrition'

// Bilan sur les `days` derniers jours (défaut 7). Le calcul est dans insights.js,
// ce hook ne fait que charger les logs et déléguer (front = affichage).
export function useInsights(userId, { tdee, targets, days = 7 } = {}) {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    load()
  }, [userId, tdee, targets?.calories, days])

  async function load() {
    setLoading(true)
    const since = new Date()
    since.setDate(since.getDate() - (days - 1))
    const { data } = await supabase
      .from('food_logs')
      .select('logged_date, calories, protein_g, carbs_g, fat_g')
      .eq('user_id', userId)
      .gte('logged_date', formatDate(since))
    setInsights(computeWeeklyInsights(data ?? [], { tdee, targets }))
    setLoading(false)
  }

  return { insights, loading, refetch: load }
}
