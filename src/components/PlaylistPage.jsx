import { useEffect, useRef } from 'react'
import { useNavigate, useOutletContext, Link } from 'react-router-dom'
import { posterUrl } from '../lib/tmdb.js'
import TrustBadge, { getTrustLevel } from './TrustBadge.jsx'

export default function PlaylistPage() {
  const navigate = useNavigate()
  const { user, authLoading, playlistItems, playlistLoading, togglePlaylist, announce } = useOutletContext()
  const titleRef = useRef(null)

  useEffect(() => {
    document.title = 'Ma playlist — ADispo'
    if (!authLoading && !user) {
      navigate('/connexion', { state: { from: '/playlist' }, replace: true })
    }
  }, [authLoading, user, navigate])

  useEffect(() => {
    if (!playlistLoading && user) titleRef.current?.focus()
  }, [playlistLoading, user])

  if (authLoading || playlistLoading) {
    return <p className="text-base text-gray-700 dark:text-gray-300">Chargement…</p>
  }
  if (!user) return null

  return (
    <section aria-labelledby="playlist-title">
      <h2
        id="playlist-title"
        ref={titleRef}
        tabIndex={-1}
        className="text-2xl font-bold mb-6 focus-visible:outline-none"
      >
        Ma playlist
        {playlistItems.length > 0 && (
          <span className="text-base font-normal text-gray-700 dark:text-gray-300 ml-2">
            ({playlistItems.length} titre{playlistItems.length > 1 ? 's' : ''})
          </span>
        )}
      </h2>

      {playlistItems.length === 0 ? (
        <p className="text-base text-gray-700 dark:text-gray-300">
          Votre playlist est vide.{' '}
          <Link
            to="/recherche"
            className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
          >
            Rechercher un titre
          </Link>{' '}
          pour en ajouter.
        </p>
      ) : (
        <ul
          className="space-y-3"
          aria-label={`Ma playlist, ${playlistItems.length} titre${playlistItems.length > 1 ? 's' : ''}`}
        >
          {playlistItems.map((row) => {
            const content = row.contents
            if (!content) return null
            const adStatus = content.ad_status?.[0]
            const trustLevel = getTrustLevel(adStatus?.validation_count)
            return (
              <li
                key={row.id}
                className="flex items-center gap-4 p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
              >
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
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate(`/contenu/${content.id}`, { state: { content } })}
                    aria-label={[content.title, content.year, content.genre, trustLevel].filter(Boolean).join(', ')}
                    className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white rounded text-left truncate block w-full"
                  >
                    <span aria-hidden="true">
                      {content.title}
                      {content.year && (
                        <span className="font-normal text-sm text-gray-700 dark:text-gray-300 ml-2">
                          <span aria-hidden="true">(</span>{content.year}<span aria-hidden="true">)</span>
                        </span>
                      )}
                    </span>
                  </button>
                  {content.genre && (
                    <span className="block text-sm text-gray-600 dark:text-gray-400">{content.genre}</span>
                  )}
                </div>
                {trustLevel && (
                  <div className="flex-shrink-0">
                    <TrustBadge validationCount={adStatus?.validation_count} />
                  </div>
                )}
                <button
                  onClick={async () => {
                    await togglePlaylist(content.id)
                    announce(`${content.title} retiré de votre playlist.`)
                  }}
                  aria-label={`Retirer ${content.title} de la playlist`}
                  className="flex-shrink-0 px-3 py-2 min-h-touch text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                >
                  Retirer
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
