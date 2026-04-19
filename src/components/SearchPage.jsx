import { useEffect, useRef, useState, useCallback } from 'react'
import { searchTitles, getRecentContributions } from '../lib/supabase.js'
import ResultCard from './ResultCard.jsx'

const PLATFORMS = [
  { value: '', label: 'Toutes les plateformes' },
  { value: 'canal', label: 'Canal+' },
  { value: 'netflix', label: 'Netflix' },
  { value: 'disney', label: 'Disney+' },
  { value: 'prime', label: 'Prime Video' },
  { value: 'apple', label: 'Apple TV+' },
]

const GENRES = [
  { value: '', label: 'Tous les genres' },
  { value: 'Drame', label: 'Drame' },
  { value: 'Animation', label: 'Animation' },
  { value: 'Documentaire', label: 'Documentaire' },
  { value: 'Action', label: 'Action' },
  { value: 'Comédie', label: 'Comédie' },
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "il y a moins d'une heure"
  if (hours === 1) return "il y a 1 heure"
  if (hours < 24) return `il y a ${hours} heures`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'il y a 1 jour'
  return `il y a ${days} jours`
}

export default function SearchPage({ announce }) {
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState('')
  const [genre, setGenre] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [recentAdditions, setRecentAdditions] = useState([])
  const [hasSearched, setHasSearched] = useState(false)

  const searchInputRef = useRef(null)

  // Load recent contributions on mount
  useEffect(() => {
    getRecentContributions().then(({ data }) => {
      if (data) setRecentAdditions(data)
    })
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query.trim() && !platform && !genre) {
      setResults([])
      setHasSearched(false)
      setStatusMessage('')
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      setStatusMessage('Recherche en cours…')
      setHasSearched(true)

      const { data, error } = await searchTitles(query, platform, genre)

      setIsLoading(false)

      if (error) {
        setStatusMessage('Une erreur est survenue. Veuillez réessayer.')
        return
      }

      const count = (data || []).length
      setResults(data || [])
      setStatusMessage(
        count === 0
          ? 'Aucun résultat trouvé.'
          : `${count} résultat${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}.`
      )
    }, 300)

    return () => clearTimeout(timer)
  }, [query, platform, genre])

  const handleValidated = useCallback(
    (msg) => {
      announce(msg)
    },
    [announce]
  )

  return (
    <>
      {/* Search status live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="search-status"
      >
        {statusMessage}
      </div>

      <search aria-label="Rechercher un titre" className="mb-8">
        <div className="mb-4">
          <label
            htmlFor="search-input"
            className="block mb-2 text-lg font-semibold"
          >
            Rechercher un titre
          </label>
          <input
            id="search-input"
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher un titre"
            aria-describedby="search-status"
            autoComplete="off"
            spellCheck="false"
            placeholder="Titre d'un film ou d'une série…"
            className="w-full px-4 py-3 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-base placeholder-gray-500 dark:placeholder-gray-400 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
          />
        </div>

        <div
          role="group"
          aria-label="Filtres de recherche"
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1">
            <label htmlFor="platform-filter" className="block mb-2 font-medium">
              Filtrer par plateforme
            </label>
            <select
              id="platform-filter"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-base focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="genre-filter" className="block mb-2 font-medium">
              Filtrer par genre
            </label>
            <select
              id="genre-filter"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full px-3 py-2 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-base focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              {GENRES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </search>

      <section aria-label="Résultats de recherche" className="mb-12">
        {isLoading && (
          <p className="text-base text-gray-700 dark:text-gray-300" aria-hidden="true">
            Chargement…
          </p>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <p className="text-base">
            Aucun résultat trouvé.{' '}
            <span className="text-gray-700 dark:text-gray-300">
              Essayez un autre titre ou{' '}
              <span className="font-medium">ajoutez ce titre</span> à la communauté.
            </span>
          </p>
        )}

        {!isLoading && results.length > 0 && (
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4" aria-hidden="true">
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </p>
            {results.map((content) => (
              <ResultCard
                key={content.id}
                content={content}
                adStatuses={content.ad_status || []}
                onValidated={handleValidated}
              />
            ))}
          </div>
        )}
      </section>

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
                <span className="font-medium">{contrib.platform}</span>{' '}
                — {timeAgo(contrib.submitted_at)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
