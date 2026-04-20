import { useEffect, useMemo, useState } from 'react'
import { getContentsByPlatform } from '../lib/supabase.js'
import { PLATFORM_LABELS } from '../lib/platforms.js'
import TrustBadge from './TrustBadge.jsx'
import { posterUrl } from '../lib/tmdb.js'

export default function PlatformPage({ platform, onBack, onViewDetail }) {
  const [contents, setContents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [genre, setGenre] = useState('')

  const platformName = PLATFORM_LABELS[platform] || platform

  useEffect(() => {
    setIsLoading(true)
    getContentsByPlatform(platform).then(({ data }) => {
      setContents(data || [])
      setIsLoading(false)
    })
  }, [platform])

  const genres = useMemo(() => {
    const set = new Set(contents.map(c => c.genre).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [contents])

  const filtered = genre ? contents.filter(c => c.genre === genre) : contents

  return (
    <section aria-labelledby="platform-page-title">
      <button
        onClick={onBack}
        className="mb-6 text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
      >
        ← Retour
      </button>

      <h2
        id="platform-page-title"
        tabIndex={-1}
        className="text-2xl font-bold mb-2 focus-visible:outline-none"
      >
        {platformName}
      </h2>
      <p className="text-base text-gray-700 dark:text-gray-300 mb-6">
        Contenus avec audiodescription disponible
      </p>

      {isLoading ? (
        <p className="text-base text-gray-700 dark:text-gray-300">Chargement…</p>
      ) : contents.length === 0 ? (
        <p className="text-base">Aucun contenu disponible pour cette plateforme.</p>
      ) : (
        <>
          {genres.length > 0 && (
            <div className="mb-4">
              <label htmlFor="genre-filter" className="text-sm font-medium mr-2">
                Filtrer par genre
              </label>
              <select
                id="genre-filter"
                value={genre}
                onChange={e => setGenre(e.target.value)}
                className="text-sm border-2 border-black dark:border-white rounded px-2 py-1 bg-white dark:bg-black focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
              >
                <option value="">Tous les genres</option>
                {genres.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          )}

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4" aria-hidden="true">
            {filtered.length} titre{filtered.length > 1 ? 's' : ''}
          </p>

          <ul className="space-y-2">
            {filtered.map((content) => {
              const adStatus = content.ad_status?.[0]
              return (
                <li key={content.id}>
                  <button
                    onClick={() => onViewDetail(content)}
                    className="w-full text-left p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-black dark:hover:border-white focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                    aria-label={`Voir le détail de ${content.title}${content.year ? ` (${content.year})` : ''}`}
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
                          <span className="font-semibold truncate block">{content.title}</span>
                          {content.year && (
                            <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">
                              ({content.year})
                            </span>
                          )}
                          {content.genre && (
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                              — {content.genre}
                            </span>
                          )}
                        </div>
                      </div>
                      {adStatus && adStatus.validation_count > 0 && (
                        <div className="flex-shrink-0">
                          <TrustBadge validationCount={adStatus.validation_count} />
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
