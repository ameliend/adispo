import { useEffect, useState } from 'react'
import { getContentsByPlatform } from '../lib/supabase.js'
import { PLATFORM_LABELS } from '../lib/platforms.js'
import TrustBadge from './TrustBadge.jsx'

export default function PlatformPage({ platform, onBack, onViewDetail }) {
  const [contents, setContents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const platformName = PLATFORM_LABELS[platform] || platform

  useEffect(() => {
    setIsLoading(true)
    getContentsByPlatform(platform).then(({ data }) => {
      setContents(data || [])
      setIsLoading(false)
    })
  }, [platform])

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
          <p
            className="text-sm text-gray-700 dark:text-gray-300 mb-4"
            aria-hidden="true"
          >
            {contents.length} titre{contents.length > 1 ? 's' : ''}
          </p>
          <ul className="space-y-2">
            {contents.map((content) => {
              const adStatus = content.ad_status?.[0]
              return (
                <li key={content.id}>
                  <button
                    onClick={() => onViewDetail(content)}
                    className="w-full text-left p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-black dark:hover:border-white focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                    aria-label={`Voir le détail de ${content.title}${content.year ? ` (${content.year})` : ''}`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        {content.poster_path && (
                          <img
                            src={content.poster_path}
                            alt=""
                            aria-hidden="true"
                            width={30}
                            height={45}
                            className="rounded flex-shrink-0 object-cover"
                            loading="lazy"
                          />
                        )}
                        <div className="min-w-0">
                          <span className="font-semibold">{content.title}</span>
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
                        <TrustBadge validationCount={adStatus.validation_count} />
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
