import { useCallback, useRef, useState } from 'react'
import SearchPage from './components/SearchPage.jsx'
import AddTitlePage from './components/AddTitlePage.jsx'

export default function App() {
  const [page, setPage] = useState('search')
  const [announcement, setAnnouncement] = useState('')

  const mainRef = useRef(null)

  const announce = useCallback((msg) => {
    // Clear first, then set — forces screen readers to announce even repeated strings
    setAnnouncement('')
    requestAnimationFrame(() => setAnnouncement(msg))
  }, [])

  function navigate(newPage) {
    setPage(newPage)
    const label = newPage === 'search' ? 'Rechercher un titre' : 'Ajouter un titre'
    announce(`Navigation vers : ${label}`)
    requestAnimationFrame(() => {
      mainRef.current?.focus()
    })
  }

  return (
    <>
      {/* Skip to main content — must be first focusable element */}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      {/* Global aria-live announcer — survives page changes because it lives here */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="global-announcer"
      >
        {announcement}
      </div>

      <header className="border-b-2 border-black dark:border-white">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">
            ADispo{' '}
            <span className="text-base font-normal text-gray-700 dark:text-gray-300">
              — Audiodescription sur les plateformes de streaming
            </span>
          </h1>

          <nav aria-label="Navigation principale">
            <ul role="list" className="flex gap-2 flex-wrap">
              <li>
                <button
                  onClick={() => navigate('search')}
                  aria-current={page === 'search' ? 'page' : undefined}
                  className={`px-4 py-2 min-h-touch font-medium rounded border-2 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white transition-colors motion-safe:transition-colors ${
                    page === 'search'
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                      : 'border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Rechercher un titre
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('add')}
                  aria-current={page === 'add' ? 'page' : undefined}
                  className={`px-4 py-2 min-h-touch font-medium rounded border-2 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white transition-colors motion-safe:transition-colors ${
                    page === 'add'
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                      : 'border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Ajouter un titre
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        ref={mainRef}
        className="max-w-2xl mx-auto px-4 py-8 focus-visible:outline-none"
      >
        {page === 'search' ? (
          <SearchPage announce={announce} />
        ) : (
          <AddTitlePage announce={announce} />
        )}
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
