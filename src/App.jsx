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
import AccountPage from './components/AccountPage.jsx'

function Layout() {
  const navigate = useNavigate()
  const [announcement, setAnnouncement] = useState('')
  const [toast, setToast] = useState('')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const mainRef = useRef(null)
  const toastTimerRef = useRef(null)
  const menuRef = useRef(null)
  const menuBtnRef = useRef(null)

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

  useEffect(() => {
    if (!menuOpen) return
    function onKey(e) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        menuBtnRef.current?.focus()
      }
    }
    function onClickOutside(e) {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [menuOpen])

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
    setMenuOpen(false)
    await signOut()
    showToast('Vous êtes déconnecté(e).')
    navigate('/')
  }, [showToast, navigate])

  function closeMenu() {
    setMenuOpen(false)
    menuBtnRef.current?.focus()
  }

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
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <h1 className="font-bold min-w-0 leading-none">
            <Link
              to="/"
              aria-label="Accueil ADispo"
              className="focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white rounded inline-flex items-center gap-2"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 760 400"
                className="fill-current h-7 w-auto flex-shrink-0"
              >
                <path d="M 40 340 L 126 60 L 210 60 L 296 340 L 228 340 L 210 280 L 126 280 L 108 340 Z M 142 228 L 194 228 L 168 128 Z"/>
                <path d="M 312 60 L 404 60 C 478 60 526 116 526 200 C 526 284 478 340 404 340 L 312 340 Z M 372 118 L 372 282 L 402 282 C 440 282 466 250 466 200 C 466 150 440 118 402 118 Z"/>
                <path d="M 536 140 C 564 170 564 230 536 260 L 558 260 C 584 230 584 170 558 140 Z"/>
                <path d="M 596 108 C 634 148 634 252 596 292 L 618 292 C 654 252 654 148 618 108 Z"/>
                <path d="M 656 76 C 704 128 704 272 656 324 L 678 324 C 724 272 724 128 678 76 Z"/>
              </svg>
              <span
                aria-hidden="true"
                style={{ fontFamily: "'Archivo', sans-serif", letterSpacing: '-0.1em', lineHeight: 1 }}
                className="text-2xl"
              >
                <span style={{ fontWeight: 900 }}>AD</span><span style={{ fontWeight: 600 }}>ispo</span>
              </span>
            </Link>
            {' '}
            <span className="text-base font-normal text-gray-700 dark:text-gray-300 hidden sm:inline">
              — Audiodescription sur les plateformes de streaming
            </span>
          </h1>

          <div className="relative flex-shrink-0" ref={menuRef}>
            {!authLoading && !user ? (
              <Link
                to="/connexion"
                className="px-4 py-2 min-h-touch text-sm font-medium border-2 border-black dark:border-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white inline-flex items-center"
              >
                Se connecter
              </Link>
            ) : user && (
              <>
                <button
                  ref={menuBtnRef}
                  onClick={() => setMenuOpen((p) => !p)}
                  aria-expanded={menuOpen}
                  aria-controls="header-menu"
                  aria-haspopup="menu"
                  className="px-4 py-2 min-h-touch text-sm font-medium border-2 border-black dark:border-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white inline-flex items-center gap-1"
                >
                  Menu
                  <span aria-hidden="true">{menuOpen ? '▲' : '▼'}</span>
                </button>

                {menuOpen && (
                  <div
                    id="header-menu"
                    role="menu"
                    aria-label="Menu principal"
                    className="absolute right-0 top-full mt-1 min-w-44 bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg shadow-lg py-1 z-50"
                  >
                    <Link
                      role="menuitem"
                      to="/compte"
                      onClick={closeMenu}
                      className="block px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white"
                    >
                      Mon compte
                    </Link>
                    <button
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-inset focus-visible:ring-black dark:focus-visible:ring-white"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
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
        <Route path="/compte" element={<AccountPage />} />
      </Route>
    </Routes>
  )
}
