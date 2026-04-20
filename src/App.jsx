import { useCallback, useRef, useState } from 'react'
import HomePage from './components/HomePage.jsx'
import SearchPage from './components/SearchPage.jsx'
import AddTitlePage from './components/AddTitlePage.jsx'
import ContentDetailPage from './components/ContentDetailPage.jsx'
import PlatformPage from './components/PlatformPage.jsx'
import { PLATFORM_LABELS } from './lib/platforms.js'

export default function App() {
  const [page, setPage] = useState('home')
  const [selectedContent, setSelectedContent] = useState(null)
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [addInitialTitle, setAddInitialTitle] = useState(null)
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

  function navigate(newPage, params = {}) {
    if (params.content !== undefined) setSelectedContent(params.content)
    if (params.platform !== undefined) setSelectedPlatform(params.platform)
    if (params.initialTitle !== undefined) setAddInitialTitle(params.initialTitle)
    setPage(newPage)

    const labels = {
      home: 'Accueil',
      search: 'Rechercher un titre',
      add: 'Ajouter un titre',
      content: params.content ? `Détail : ${params.content.title}` : 'Détail du contenu',
      platform: params.platform
        ? `Tous les contenus sur ${PLATFORM_LABELS[params.platform] || params.platform}`
        : 'Contenus de la plateforme',
    }
    announce(`Navigation vers : ${labels[newPage] || newPage}`)
    requestAnimationFrame(() => mainRef.current?.focus())
  }

  function handleAddSuccess() {
    navigate('home')
    showToast('Le titre a été ajouté avec succès. Merci pour votre contribution !')
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      {/* Global aria-live announcer */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="global-announcer"
      >
        {announcement}
      </div>

      {/* Toast announcer */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="toast-announcer"
      >
        {toast}
      </div>

      {/* Visual toast */}
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
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-2xl font-bold">
              <button
                onClick={() => navigate('home')}
                className="hover:underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white rounded"
              >
                ADispo
              </button>
              {' '}
              <span className="text-base font-normal text-gray-700 dark:text-gray-300">
                — Audiodescription sur les plateformes de streaming
              </span>
            </h1>

            {page !== 'home' && (
              <button
                onClick={() => navigate('home')}
                className="flex items-center gap-2 px-4 py-2 min-h-touch text-sm font-medium border-2 border-black dark:border-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
              >
                ← Accueil
              </button>
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
        {page === 'home' && (
          <HomePage
            onNavigateSearch={() => navigate('search')}
            onViewDetail={(content) => navigate('content', { content })}
            onViewPlatform={(platform) => navigate('platform', { platform })}
          />
        )}
        {page === 'search' && (
          <SearchPage
            announce={announce}
            onViewDetail={(content) => navigate('content', { content })}
            onNavigateAdd={(title) => navigate('add', { initialTitle: title || null })}
          />
        )}
        {page === 'add' && (
          <AddTitlePage
            announce={announce}
            onSubmitSuccess={handleAddSuccess}
            initialTitle={addInitialTitle}
          />
        )}
        {page === 'content' && selectedContent && (
          <ContentDetailPage
            content={selectedContent}
            announce={announce}
            onBack={() => navigate('home')}
          />
        )}
        {page === 'platform' && selectedPlatform && (
          <PlatformPage
            platform={selectedPlatform}
            announce={announce}
            onBack={() => navigate('home')}
            onViewDetail={(content) => navigate('content', { content })}
          />
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
