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

  // Ré-injecte les aliments d'un template dans food_logs à une date / repas donnés.
  async function applyTemplate(template, { logged_date, meal_type } = {}) {
    const rows = (template.items ?? []).map((it) => ({
      user_id: userId,
      food_name: it.food_name,
      brand: it.brand ?? '',
      quantity_g: it.quantity_g ?? 100,
      calories: it.calories ?? 0,
      protein_g: it.protein_g ?? 0,
      carbs_g: it.carbs_g ?? 0,
      fat_g: it.fat_g ?? 0,
      fiber_g: it.fiber_g ?? 0,
      meal_type: meal_type ?? template.meal_type ?? 'lunch',
      logged_date,
    }))
    if (!rows.length) return { data: [], error: null }
    return supabase.from('food_logs').insert(rows).select()
  }

  return { templates, loading, saveTemplate, deleteTemplate, applyTemplate, refetch: fetchTemplates }
}
