import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link, useOutletContext } from 'react-router-dom'
import { getRandomByPlatform, getContentsCount, getRecentContents } from '../lib/supabase.js'
import { posterUrl } from '../lib/tmdb.js'
import VoiceSearch from './VoiceSearch.jsx'


function PlatformMiniCard({ content }) {
  const navigate = useNavigate()
  return (
    <li>
      <button
        onClick={() => navigate(`/contenu/${content.id}`, { state: { content } })}
        className="w-full text-left p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-black dark:hover:border-white focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
        aria-label={[content.title, content.year, content.genre].filter(Boolean).join(', ')}
      >
        <div className="flex items-center justify-between gap-4 flex-nowrap">
          <div className="flex items-center gap-3 min-w-0">
            {posterUrl(content.poster_path) && (
              <img
                src={posterUrl(content.poster_path)}
                alt=""
                aria-hidden="true"
                width={30}
                height={45}
                className="rounded flex-shrink-0 object-cover"
                loading="lazy"
              />
            )}
            <div className="min-w-0">
              <span className="font-medium truncate block">{content.title}</span>
              {content.year && (
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <span aria-hidden="true">(</span>{content.year}<span aria-hidden="true">)</span>
                </span>
              )}
              {content.genre && (
                <span className="block text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {content.genre}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </li>
  )
}

const ADMIN_EMAIL = 'amelien.delahaie@gmail.com'

export default function HomePage() {
  const { user, playlistItems, playlistLoading, announce } = useOutletContext()
  const navigate = useNavigate()
  const isAdmin = user?.email === ADMIN_EMAIL
  const [canalContents, setCanalContents] = useState([])
  const [netflixContents, setNetflixContents] = useState([])
  const [appleContents, setAppleContents] = useState([])
  const [disneyContents, setDisneyContents] = useState([])
  const [recentContents, setRecentContents] = useState([])
  const [contentsCount, setContentsCount] = useState(null)
  const [showVoiceSearch, setShowVoiceSearch] = useState(false)
  const [aiResults, setAiResults] = useState([])
  const [aiQuery, setAiQuery] = useState('')
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const tooltipRef = useRef(null)

  function handleAiResults(results, query) {
    setAiResults(results)
    setAiQuery(query)
    announce(`${results.length} recommandation${results.length > 1 ? 's' : ''} trouvée${results.length > 1 ? 's' : ''} pour : ${query}`)
  }

  useEffect(() => {
    document.title = 'ADispo — Audiodescription sur les plateformes de streaming'
    getRandomByPlatform('canal', 10).then(({ data }) => { if (data) setCanalContents(data) })
    getRandomByPlatform('netflix', 10).then(({ data }) => { if (data) setNetflixContents(data) })
    getRandomByPlatform('apple', 10).then(({ data }) => { if (data) setAppleContents(data) })
    getRandomByPlatform('disney', 10).then(({ data }) => { if (data) setDisneyContents(data) })
    getRecentContents(10).then(({ data }) => { if (data) setRecentContents(data) })
    getContentsCount().then(({ count }) => { if (count !== null) setContentsCount(count) })
  }, [])

  return (
    <>
      {showVoiceSearch && (
        <VoiceSearch
          onResults={handleAiResults}
          onClose={() => setShowVoiceSearch(false)}
        />
      )}

      <div className="mb-10">
        <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
          Vérifiez si l'audiodescription est disponible pour un film ou une série sur
          les grandes plateformes de streaming.
        </p>
        <Link
          to="/recherche"
          className="inline-block px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-semibold rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
        >
          Rechercher un titre
        </Link>
      </div>

      <section aria-labelledby="catalog-section-title" className="mb-12">
        <h2 id="catalog-section-title" className="text-xl font-bold mb-2">
          Tout le catalogue disponible
        </h2>
        {contentsCount !== null && (
          <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
            Déjà plus de {contentsCount} films et séries accessibles.
          </p>
        )}
        {/* Tooltip wrapper — mouse stays within the container when moving from
            button to tooltip, so onMouseLeave never fires mid-hover (WCAG SC 1.4.13). */}
        <div
          className="relative inline-block"
          onMouseEnter={() => !isAdmin && setTooltipVisible(true)}
          onMouseLeave={() => setTooltipVisible(false)}
        >
          <button
            type="button"
            onClick={() => isAdmin && setShowVoiceSearch(true)}
            aria-label="Recherche vocale avec IA"
            aria-describedby={!isAdmin ? 'ai-voice-tooltip' : 'ai-search-hint'}
            onFocus={() => !isAdmin && setTooltipVisible(true)}
            onBlur={() => setTooltipVisible(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setTooltipVisible(false) }}
            className="inline-flex items-center gap-3 px-6 py-3 min-h-touch border-2 border-black dark:border-white font-semibold rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
          >
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 3 C 25 16, 32 23, 45 24 C 32 25, 25 32, 24 45 C 23 32, 16 25, 3 24 C 16 23, 23 16, 24 3 Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
            Recherche vocale avec IA
          </button>

          {!isAdmin && tooltipVisible && (
            <div
              id="ai-voice-tooltip"
              role="tooltip"
              ref={tooltipRef}
              className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg shadow-lg z-10"
            >
              Cette fonctionnalité est en cours de développement. Pour la tester, contactez-moi.
              {/* Arrow */}
              <span
                aria-hidden="true"
                className="absolute top-full left-6 border-8 border-transparent border-t-gray-900 dark:border-t-gray-100"
              />
            </div>
          )}
        </div>

        <p id="ai-search-hint" className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Par exemple : « Je recherche un film de cow-boy » ou « une série coréenne thriller ».
        </p>

        {aiResults.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">« {aiQuery} »</p>
            <ul className="space-y-4">
              {aiResults.map(({ content, reason }) => (
                <li key={content.id}>
                  <Link
                    to={`/contenu/${content.id}`}
                    aria-label={[content.title, content.year, content.genre].filter(Boolean).join(', ')}
                    className="block p-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-black dark:hover:border-white transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                  >
                    <p className="font-semibold text-base mb-1">
                      {content.title}
                      {content.year && (
                        <span className="ml-2 font-normal text-sm text-gray-600 dark:text-gray-400">
                          ({content.year})
                        </span>
                      )}
                    </p>
                    {content.genre && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{content.genre}</p>
                    )}
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">{reason}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <button
              onClick={() => { setAiResults([]); setAiQuery('') }}
              className="mt-4 text-sm text-gray-600 dark:text-gray-400 underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              Effacer les recommandations
            </button>
          </div>
        )}
      </section>

      {user && !playlistLoading && playlistItems.length > 0 && (
        <section aria-labelledby="playlist-section-title" className="mb-12">
          <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
            <h2 id="playlist-section-title" className="text-xl font-bold">Ma playlist</h2>
            <Link
              to="/playlist"
              aria-label="Voir toute ma playlist"
              className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              Voir toute ma playlist →
            </Link>
          </div>
          <ul className="space-y-2">
            {playlistItems.slice(0, 5).map((row) => (
              <PlatformMiniCard key={row.id} content={row.contents} />
            ))}
          </ul>
        </section>
      )}

      {canalContents.length > 0 && (
        <section aria-labelledby="canal-section-title" className="mb-12">
          <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
            <h2 id="canal-section-title" className="text-xl font-bold">CANAL+</h2>
            <Link
              to="/plateforme/canal"
              aria-label="Voir tous les contenus sur CANAL+"
              className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              Voir tous les contenus →
            </Link>
          </div>
          <ul className="space-y-2">
            {canalContents.map((content) => (
              <PlatformMiniCard key={content.id} content={content} />
            ))}
          </ul>
        </section>
      )}

      {netflixContents.length > 0 && (
        <section aria-labelledby="netflix-section-title" className="mb-12">
          <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
            <h2 id="netflix-section-title" className="text-xl font-bold">Netflix</h2>
            <Link
              to="/plateforme/netflix"
              aria-label="Voir tous les contenus sur Netflix"
              className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              Voir tous les contenus →
            </Link>
          </div>
          <ul className="space-y-2">
            {netflixContents.map((content) => (
              <PlatformMiniCard key={content.id} content={content} />
            ))}
          </ul>
        </section>
      )}

      {appleContents.length > 0 && (
        <section aria-labelledby="apple-section-title" className="mb-12">
          <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
            <h2 id="apple-section-title" className="text-xl font-bold">Apple TV+</h2>
            <Link
              to="/plateforme/apple"
              aria-label="Voir tous les contenus sur Apple TV+"
              className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              Voir tous les contenus →
            </Link>
          </div>
          <ul className="space-y-2">
            {appleContents.map((content) => (
              <PlatformMiniCard key={content.id} content={content} />
            ))}
          </ul>
        </section>
      )}

      {disneyContents.length > 0 && (
        <section aria-labelledby="disney-section-title" className="mb-12">
          <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
            <h2 id="disney-section-title" className="text-xl font-bold">Disney+</h2>
            <Link
              to="/plateforme/disney"
              aria-label="Voir tous les contenus sur Disney+"
              className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              Voir tous les contenus →
            </Link>
          </div>
          <ul className="space-y-2">
            {disneyContents.map((content) => (
              <PlatformMiniCard key={content.id} content={content} />
            ))}
          </ul>
        </section>
      )}

      {recentContents.length > 0 && (
        <section aria-labelledby="recent-section-title" className="mb-12">
          <h2 id="recent-section-title" className="text-xl font-bold mb-4">Les ajouts récents</h2>
          <ul className="space-y-2">
            {recentContents.map((content) => (
              <PlatformMiniCard key={content.id} content={content} />
            ))}
          </ul>
        </section>
      )}

    </>
  )
}
