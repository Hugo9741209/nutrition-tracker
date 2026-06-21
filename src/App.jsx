import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useProfile } from './hooks/useProfile'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Objective from './pages/Objective'
import FoodLog from './pages/FoodLog'
import Favorites from './pages/Favorites'
import Shopping from './pages/Shopping'
import Pantry from './pages/Pantry'
import Hydration from './pages/Hydration'
import Insights from './pages/Insights'
import WeightTracker from './pages/WeightTracker'
import Profile from './pages/Profile'

function AppRoutes({ user }) {
  const { profile, refetch } = useProfile(user?.id)

  return (
    <Layout>
      <Routes>
        <Route path="/"          element={<Dashboard    user={user} profile={profile} />} />
        <Route path="/objective" element={<Objective    user={user} profile={profile} onValidated={refetch} />} />
        <Route path="/log"       element={<FoodLog      user={user} profile={profile} />} />
        <Route path="/favorites" element={<Favorites    user={user} profile={profile} />} />
        <Route path="/shopping"  element={<Shopping     user={user} profile={profile} />} />
        <Route path="/pantry"    element={<Pantry       user={user} profile={profile} />} />
        <Route path="/hydration" element={<Hydration    user={user} profile={profile} />} />
        <Route path="/insights"  element={<Insights     user={user} profile={profile} />} />
        <Route path="/weight"   element={<WeightTracker user={user} profile={profile} />} />
        <Route path="/profile" element={<Profile      user={user} onProfileSaved={refetch} />} />
        <Route path="*"        element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      {user ? <AppRoutes user={user} /> : <Auth />}
    </BrowserRouter>
  )
}
