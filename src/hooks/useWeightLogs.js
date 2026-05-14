import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { todayStr } from '../lib/nutrition'

export function useWeightLogs(userId, days = 30) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetchLogs()
  }, [userId, days])

  async function fetchLogs() {
    setLoading(true)
    const from = new Date()
    from.setDate(from.getDate() - days)
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_date', from.toISOString().split('T')[0])
      .order('logged_date', { ascending: true })
    setLogs(data ?? [])
    setLoading(false)
  }

  async function addWeight(weight_kg, note = '') {
    const { data, error } = await supabase
      .from('weight_logs')
      .upsert({ user_id: userId, logged_date: todayStr(), weight_kg, note }, { onConflict: 'user_id,logged_date' })
      .select()
      .single()
    if (!error) {
      setLogs(prev => {
        const filtered = prev.filter(l => l.logged_date !== todayStr())
        return [...filtered, data].sort((a, b) => a.logged_date.localeCompare(b.logged_date))
      })
    }
    return { data, error }
  }

  async function deleteWeight(id) {
    const { error } = await supabase.from('weight_logs').delete().eq('id', id)
    if (!error) setLogs(prev => prev.filter(l => l.id !== id))
  }

  const latest = logs.at(-1)
  const oldest = logs.at(0)
  const diff = latest && oldest && latest.logged_date !== oldest.logged_date
    ? +(latest.weight_kg - oldest.weight_kg).toFixed(1)
    : null

  return { logs, loading, addWeight, deleteWeight, latest, diff, refetch: fetchLogs }
}
