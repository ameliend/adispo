import { useEffect, useState } from 'react'
import { getRecentContributions, getRandomByPlatform } from '../lib/supabase.js'
import { PLATFORM_LABELS } from '../lib/platforms.js'
import TrustBadge from './TrustBadge.jsx'
import { posterUrl } from '../lib/tmdb.js'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "il y a moins d'une heure"
  if (hours === 1) return 'il y a 1 heure'
  if (hours < 24) return `il y a ${hours} heures`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'il y a 1 jour'
  return `il y a ${days} jours`
}

function PlatformMiniCard({ content, onViewDetail }) {
  const adStatus = content.ad_status?.[0]
  return (
    <li>
      <button
        onClick={() => onViewDetail(content)}
        className="w-full text-left p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-black dark:hover:border-white focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
        aria-label={`Voir ${content.title}${content.year ? ` (${content.year})` : ''}`}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
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
              <span className="font-medium">{content.title}</span>
              {content.year && (
                <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">
                  ({content.year})
                </span>
              )}
              {content.genre && (
                <span className="block text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {content.genre}
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
}

export default function HomePage({ onNavigateSearch, onViewDetail, onViewPlatform }) {
  const [recentAdditions, setRecentAdditions] = useState([])
  const [canalContents, setCanalContents] = useState([])
  const [netflixContents, setNetflixContents] = useState([])

  useEffect(() => {
    getRecentContributions().then(({ data }) => {
      if (data) setRecentAdditions(data)
    })
    getRandomByPlatform('canal', 10).then(({ data }) => {
      if (data) setCanalContents(data)
    })
    getRandomByPlatform('netflix', 10).then(({ data }) => {
      if (data) setNetflixContents(data)
    })
  }, [])

  return (
    <>
      {/* CTA recherche */}
      <div className="mb-10">
        <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
          Vérifiez si l'audiodescription est disponible pour un film ou une série sur
          les grandes plateformes de streaming.
        </p>
        <button
          onClick={onNavigateSearch}
          className="px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-semibold rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
        >
          Rechercher un titre
        </button>
      </div>

      {/* Strate Canal+ */}
      {canalContents.length > 0 && (
        <section aria-labelledby="canal-section-title" className="mb-12">
          <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
            <h2 id="canal-section-title" className="text-xl font-bold">
              CANAL+
            </h2>
            <button
              onClick={() => onViewPlatform('canal')}
              className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              Voir tous les contenus →
            </button>
          </div>
          <ul className="space-y-2">
            {canalContents.map((content) => (
              <PlatformMiniCard
                key={content.id}
                content={content}
                onViewDetail={onViewDetail}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Strate Netflix */}
      {netflixContents.length > 0 && (
        <section aria-labelledby="netflix-section-title" className="mb-12">
          <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
            <h2 id="netflix-section-title" className="text-xl font-bold">
              Netflix
            </h2>
            <button
              onClick={() => onViewPlatform('netflix')}
              className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              Voir tous les contenus →
            </button>
          </div>
          <ul className="space-y-2">
            {netflixContents.map((content) => (
              <PlatformMiniCard
                key={content.id}
                content={content}
                onViewDetail={onViewDetail}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Ajouts récents */}
      <section aria-label="Ajouts récents de la communauté">
        <h2 className="text-xl font-bold mb-4">Ajouts récents de la communauté</h2>
        {recentAdditions.length === 0 ? (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Aucun ajout récent pour l'instant.
          </p>
        ) : (
          <ul className="space-y-3">
            {recentAdditions.map((contrib) => (
              <li
                key={contrib.id}
                className="text-sm py-2 border-b border-gray-200 dark:border-gray-700"
              >
                <span className="font-medium">
                  {contrib.contents?.title}
                  {contrib.contents?.year ? ` (${contrib.contents.year})` : ''}
                </span>{' '}
                — Audiodescription signalée sur{' '}
                <span className="font-medium">
                  {PLATFORM_LABELS[contrib.platform] || contrib.platform}
                </span>{' '}
                — {timeAgo(contrib.submitted_at)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
