import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { calcTDEE, checkGoalSafety } from '../lib/nutrition'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetchProfile()
  }, [userId])

  async function fetchProfile() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }

  async function saveProfile(updates) {
    // GARDE-FOU (script §8) : le backend ne persiste JAMAIS un objectif rejeté.
    // Si on enregistre une cible calorique, on revalide la sécurité côté données,
    // peu importe ce que prétend le front. Non contournable par payload.
    const rec = { ...(profile || {}), ...updates }
    if (updates.target_calories != null) {
      const weight_kg = rec.current_weight_kg
      const hasBase = weight_kg && rec.height_cm && rec.age != null && rec.gender
      if (hasBase) {
        const tdee = calcTDEE({
          weight_kg,
          height_cm: rec.height_cm,
          age: rec.age,
          gender: rec.gender,
          activity_level: rec.activity_level,
        })
        const { ok, violations } = checkGoalSafety({
          tdee,
          targetCalories: rec.target_calories,
          gender: rec.gender,
          weight_kg,
          protein_g: rec.target_protein_g,
        })
        if (!ok) {
          return {
            data: null,
            error: {
              code: 'UNSAFE_GOAL',
              message: violations.map((v) => v.message).join(' '),
              violations,
            },
          }
        }
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (!error) setProfile(data)
    return { data, error }
  }

  return { profile, loading, saveProfile, refetch: fetchProfile }
}
