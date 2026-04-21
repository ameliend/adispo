import { useCallback, useEffect, useRef, useState } from 'react'
import { Routes, Route, Outlet, Link, useNavigate } from 'react-router-dom'
import { supabase, signOut } from './lib/supabase.js'
import { usePlaylist } from './hooks/usePlaylist.js'
import HomePage from './components/HomePage.jsx'
import SearchPage from './components/SearchPage.jsx'
import AddTitlePage from './components/AddTitlePage.jsx'
import ContentDetailPage from './components/ContentDetailPage.jsx'
import PlatformPage from './components/PlatformPage.jsx'
import AuthPage from './components/AuthPage.jsx'
import ActivationPage from './components/ActivationPage.jsx'
import PlaylistPage from './components/PlaylistPage.jsx'

function Layout() {
  const navigate = useNavigate()
  const [announcement, setAnnouncement] = useState('')
  const [toast, setToast] = useState('')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const mainRef = useRef(null)
  const toastTimerRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const { playlistIds, playlistItems, playlistLoading, togglePlaylist } = usePlaylist(user)

  const announce = useCallback((msg) => {
    setAnnouncement('')
    requestAnimationFrame(() => setAnnouncement(msg))
  }, [])

  const showToast = useCallback((msg) => {
    setToast('')
    requestAnimationFrame(() => {
      setToast(msg)
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => setToast(''), 5000)
    })
  }, [])

  const focusMain = useCallback(() => {
    requestAnimationFrame(() => mainRef.current?.focus())
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut()
    showToast('Vous êtes déconnecté(e).')
    navigate('/')
  }, [showToast, navigate])

  return (
    <>
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {toast}
      </div>

      {toast && (
        <div
          aria-hidden="true"
          className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 sm:max-w-md px-6 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl shadow-xl text-sm font-medium text-center"
        >
          {toast}
        </div>
      )}

      <header className="border-b-2 border-black dark:border-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">
            <Link
              to="/"
              className="hover:underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white rounded"
            >
              ADispo
            </Link>
            {' '}
            <span className="text-base font-normal text-gray-700 dark:text-gray-300">
              — Audiodescription sur les plateformes de streaming
            </span>
          </h1>

          {!authLoading && (
            <nav aria-label="Compte utilisateur">
              {user ? (
                <div className="flex items-center gap-4 flex-wrap">
                  <Link
                    to="/playlist"
                    className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                  >
                    Ma playlist
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <Link
                  to="/connexion"
                  className="text-sm font-medium px-4 py-2 min-h-touch border-2 border-black dark:border-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white inline-flex items-center"
                >
                  Connexion
                </Link>
              )}
            </nav>
          )}
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        ref={mainRef}
        className="max-w-2xl mx-auto px-4 py-8 focus-visible:outline-none"
      >
        <Outlet context={{ announce, showToast, focusMain, user, authLoading, playlistIds, playlistItems, playlistLoading, togglePlaylist }} />
      </main>

      <footer className="border-t-2 border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ADispo — Une ressource communautaire pour l'accessibilité audiovisuelle.
          </p>
        </div>
      </footer>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/recherche" element={<SearchPage />} />
        <Route path="/ajouter" element={<AddTitlePage />} />
        <Route path="/contenu/:id" element={<ContentDetailPage />} />
        <Route path="/plateforme/:platform" element={<PlatformPage />} />
        <Route path="/connexion" element={<AuthPage />} />
        <Route path="/activation" element={<ActivationPage />} />
        <Route path="/playlist" element={<PlaylistPage />} />
      </Route>
    </Routes>
  )
}
