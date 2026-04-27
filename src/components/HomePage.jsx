import { useEffect, useState } from 'react'
import { useNavigate, Link, useOutletContext } from 'react-router-dom'
import { getRandomByPlatform, getContentsCount } from '../lib/supabase.js'
import { posterUrl } from '../lib/tmdb.js'


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

export default function HomePage() {
  const { user, playlistItems, playlistLoading } = useOutletContext()
  const [canalContents, setCanalContents] = useState([])
  const [netflixContents, setNetflixContents] = useState([])
  const [appleContents, setAppleContents] = useState([])
  const [contentsCount, setContentsCount] = useState(null)

  useEffect(() => {
    document.title = 'ADispo — Audiodescription sur les plateformes de streaming'
    getRandomByPlatform('canal', 10).then(({ data }) => { if (data) setCanalContents(data) })
    getRandomByPlatform('netflix', 10).then(({ data }) => { if (data) setNetflixContents(data) })
    getRandomByPlatform('apple', 10).then(({ data }) => { if (data) setAppleContents(data) })
    getContentsCount().then(({ count }) => { if (count !== null) setContentsCount(count) })
  }, [])

  return (
    <>
      <div className="mb-10">
        <p className="text-base text-gray-700 dark:text-gray-300 mb-2">
          Vérifiez si l'audiodescription est disponible pour un film ou une série sur
          les grandes plateformes de streaming.
        </p>
        {contentsCount !== null && (
          <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
            Déjà plus de {contentsCount} films et séries accessibles.
          </p>
        )}
        <Link
          to="/recherche"
          className="inline-block px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-semibold rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
        >
          Rechercher un titre
        </Link>
      </div>

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

    </>
  )
}
