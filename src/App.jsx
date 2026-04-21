import { useCallback, useRef, useState } from 'react'
import { Routes, Route, Outlet, useNavigate, Link } from 'react-router-dom'
import HomePage from './components/HomePage.jsx'
import SearchPage from './components/SearchPage.jsx'
import AddTitlePage from './components/AddTitlePage.jsx'
import ContentDetailPage from './components/ContentDetailPage.jsx'
import PlatformPage from './components/PlatformPage.jsx'

function Layout() {
  const [announcement, setAnnouncement] = useState('')
  const [toast, setToast] = useState('')
  const mainRef = useRef(null)
  const toastTimerRef = useRef(null)

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
        <div className="max-w-2xl mx-auto px-4 py-4">
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
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        ref={mainRef}
        className="max-w-2xl mx-auto px-4 py-8 focus-visible:outline-none"
      >
        <Outlet context={{ announce, showToast, focusMain }} />
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
      </Route>
    </Routes>
  )
}
