import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Liste de courses persistée (items cochables). RLS isole par user.
export function useShoppingList(userId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetchItems()
  }, [userId])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('user_id', userId)
      .order('checked', { ascending: true })
      .order('created_at', { ascending: true })
    setItems(data ?? [])
    setLoading(false)
  }

  async function addItem(label, qty = '') {
    if (!label?.trim()) return { error: 'label requis' }
    const { data, error } = await supabase
      .from('shopping_items')
      .insert({ user_id: userId, label: label.trim(), qty })
      .select()
      .single()
    if (!error && data) setItems((l) => [...l, data])
    return { data, error }
  }

  // Ajoute plusieurs items d'un coup (ex. depuis buildShoppingList).
  async function addMany(entries) {
    const rows = entries
      .filter((e) => e.food_name || e.label)
      .map((e) => ({ user_id: userId, label: e.label ?? e.food_name, qty: e.qty ?? (e.quantity_g ? `${e.quantity_g} g` : '') }))
    if (!rows.length) return { data: [] }
    const { data, error } = await supabase.from('shopping_items').insert(rows).select()
    if (!error && data) setItems((l) => [...l, ...data])
    return { data, error }
  }

  async function toggleItem(id) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const { data } = await supabase
      .from('shopping_items')
      .update({ checked: !item.checked })
      .eq('id', id)
      .select()
      .single()
    if (data) setItems((l) => l.map((i) => (i.id === id ? data : i)))
  }

  async function deleteItem(id) {
    const { error } = await supabase.from('shopping_items').delete().eq('id', id)
    if (!error) setItems((l) => l.filter((i) => i.id !== id))
  }

  async function clearChecked() {
    const { error } = await supabase.from('shopping_items').delete().eq('user_id', userId).eq('checked', true)
    if (!error) setItems((l) => l.filter((i) => !i.checked))
  }

  return { items, loading, addItem, addMany, toggleItem, deleteItem, clearChecked, refetch: fetchItems }
}
