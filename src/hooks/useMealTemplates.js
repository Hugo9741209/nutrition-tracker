import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// CRUD des repas favoris / templates. RLS garantit l'isolation par user.
export function useMealTemplates(userId) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetchTemplates()
  }, [userId])

  async function fetchTemplates() {
    setLoading(true)
    const { data } = await supabase
      .from('meal_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setTemplates(data ?? [])
    setLoading(false)
  }

  // items : [{ food_name, brand, quantity_g, calories, protein_g, carbs_g, fat_g, fiber_g, source }]
  async function saveTemplate({ name, meal_type = 'lunch', items }) {
    const { data, error } = await supabase
      .from('meal_templates')
      .insert({ user_id: userId, name, meal_type, items })
      .select()
      .single()
    if (!error && data) setTemplates((t) => [data, ...t])
    return { data, error }
  }

  async function deleteTemplate(id) {
    const { error } = await supabase.from('meal_templates').delete().eq('id', id)
    if (!error) setTemplates((t) => t.filter((x) => x.id !== id))
    return { error }
  }

  return { templates, loading, saveTemplate, deleteTemplate, refetch: fetchTemplates }
}
