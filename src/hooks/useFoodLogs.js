import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { todayStr } from '../lib/nutrition'

export function useFoodLogs(userId, date = todayStr()) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetchLogs()
  }, [userId, date])

  async function fetchLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('logged_date', date)
      .order('created_at', { ascending: true })
    setLogs(data ?? [])
    setLoading(false)
  }

  async function addLog(entry) {
    const { data, error } = await supabase
      .from('food_logs')
      .insert({ user_id: userId, logged_date: date, ...entry })
      .select()
      .single()
    if (!error) setLogs(prev => [...prev, data])
    return { data, error }
  }

  async function deleteLog(id) {
    const { error } = await supabase.from('food_logs').delete().eq('id', id)
    if (!error) setLogs(prev => prev.filter(l => l.id !== id))
    return { error }
  }

  // Totaux du jour
  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories ?? 0),
      protein_g: acc.protein_g + (l.protein_g ?? 0),
      carbs_g: acc.carbs_g + (l.carbs_g ?? 0),
      fat_g: acc.fat_g + (l.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )

  return { logs, loading, totals, addLog, deleteLog, refetch: fetchLogs }
}

// Historique sur N jours pour les graphiques
export function useFoodHistory(userId, days = 14) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    if (!userId) return
    fetchHistory()
  }, [userId, days])

  async function fetchHistory() {
    const from = new Date()
    from.setDate(from.getDate() - days)
    const { data } = await supabase
      .from('food_logs')
      .select('logged_date, calories, protein_g, carbs_g, fat_g')
      .eq('user_id', userId)
      .gte('logged_date', from.toISOString().split('T')[0])
      .order('logged_date', { ascending: true })

    // Agréger par jour
    const byDay = {}
    for (const row of data ?? []) {
      if (!byDay[row.logged_date]) byDay[row.logged_date] = { date: row.logged_date, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
      byDay[row.logged_date].calories  += row.calories  ?? 0
      byDay[row.logged_date].protein_g += row.protein_g ?? 0
      byDay[row.logged_date].carbs_g   += row.carbs_g   ?? 0
      byDay[row.logged_date].fat_g     += row.fat_g     ?? 0
    }
    setHistory(Object.values(byDay))
  }

  return { history }
}
