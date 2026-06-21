import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useProfile } from './hooks/useProfile'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import Auth from './pages/Auth'

// Code-splitting : chaque page est chargée à la demande (bundle initial allégé).
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const Objective      = lazy(() => import('./pages/Objective'))
const FoodLog        = lazy(() => import('./pages/FoodLog'))
const Favorites      = lazy(() => import('./pages/Favorites'))
const Shopping       = lazy(() => import('./pages/Shopping'))
const Pantry         = lazy(() => import('./pages/Pantry'))
const Hydration      = lazy(() => import('./pages/Hydration'))
const Health         = lazy(() => import('./pages/Health'))
const StravaCallback = lazy(() => import('./pages/StravaCallback'))
const Insights       = lazy(() => import('./pages/Insights'))
const WeightTracker  = lazy(() => import('./pages/WeightTracker'))
const Profile        = lazy(() => import('./pages/Profile'))

function PageLoader() {
  return (
    <div className="flex justify-center pt-24" role="status" aria-label="Chargement">
      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppRoutes({ user }) {
  const { profile, refetch } = useProfile(user?.id)

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/"          element={<Dashboard    user={user} profile={profile} />} />
        <Route path="/objective" element={<Objective    user={user} profile={profile} onValidated={refetch} />} />
        <Route path="/log"       element={<FoodLog      user={user} profile={profile} />} />
        <Route path="/favorites" element={<Favorites    user={user} profile={profile} />} />
        <Route path="/shopping"  element={<Shopping     user={user} profile={profile} />} />
        <Route path="/pantry"    element={<Pantry       user={user} profile={profile} />} />
        <Route path="/hydration" element={<Hydration    user={user} profile={profile} />} />
        <Route path="/health"    element={<Health       user={user} profile={profile} />} />
        <Route path="/strava/callback" element={<StravaCallback user={user} />} />
        <Route path="/insights"  element={<Insights     user={user} profile={profile} />} />
        <Route path="/weight"   element={<WeightTracker user={user} profile={profile} />} />
        <Route path="/profile" element={<Profile      user={user} onProfileSaved={refetch} />} />
        <Route path="*"        element={<Navigate to="/" />} />
      </Routes>
      </Suspense>
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
      <ErrorBoundary>
        {user ? <AppRoutes user={user} /> : <Auth />}
      </ErrorBoundary>
    </BrowserRouter>
  )
}
