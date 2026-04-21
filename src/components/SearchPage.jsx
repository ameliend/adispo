import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom'
import { searchTitles, getContentByTmdbId } from '../lib/supabase.js'
import { searchTmdb, posterUrl } from '../lib/tmdb.js'
import { PLATFORM_LABELS } from '../lib/platforms.js'
import TrustBadge, { getTrustLevel } from './TrustBadge.jsx'
import ResultCard from './ResultCard.jsx'

const PLATFORMS = [
  { value: '', label: 'Toutes les plateformes' },
  { value: 'canal', label: 'CANAL+' },
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

export default function SearchPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { announce, user } = useOutletContext()
  const initialTitle = location.state?.initialTitle || ''
  useEffect(() => { document.title = 'Rechercher — ADispo' }, [])

  // TMDB autocomplete
  const [tmdbQuery, setTmdbQuery] = useState('')
  const [tmdbResults, setTmdbResults] = useState([])
  const [tmdbStatus, setTmdbStatus] = useState('')
  const [selectedTmdb, setSelectedTmdb] = useState(null)
  const [dbStatus, setDbStatus] = useState('idle') // 'idle' | 'loading' | 'notfound'

  // Browse filters
  const [platform, setPlatform] = useState('')
  const [genre, setGenre] = useState('')
  const [browseResults, setBrowseResults] = useState([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [browseStatus, setBrowseStatus] = useState('')
  const [hasBrowsed, setHasBrowsed] = useState(false)

  const searchInputRef = useRef(null)

  // Debounced TMDB autocomplete
  useEffect(() => {
    if (!tmdbQuery.trim()) {
      setTmdbResults([])
      setTmdbStatus('')
      return
    }

    const timer = setTimeout(async () => {
      setTmdbStatus('Recherche en cours…')
      const { data, error } = await searchTmdb(tmdbQuery)
      if (error) {
        setTmdbStatus('Erreur lors de la recherche. Veuillez réessayer.')
        return
      }
      const count = (data || []).length
      setTmdbResults(data || [])
      setTmdbStatus(
        count === 0
          ? 'Aucun résultat sur TMDB.'
          : `${count} résultat${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}.`
      )
    }, 300)

    return () => clearTimeout(timer)
  }, [tmdbQuery])

  // Debounced browse (platform/genre filters)
  useEffect(() => {
    if (!platform && !genre) {
      setBrowseResults([])
      setHasBrowsed(false)
      setBrowseStatus('')
      return
    }

    const timer = setTimeout(async () => {
      setBrowseLoading(true)
      setBrowseStatus('Chargement…')
      setHasBrowsed(true)

      const { data, error } = await searchTitles('', platform, genre)
      setBrowseLoading(false)

      if (error) {
        setBrowseStatus('Une erreur est survenue. Veuillez réessayer.')
        return
      }

      const count = (data || []).length
      setBrowseResults(data || [])
      setBrowseStatus(
        count === 0
          ? 'Aucun résultat.'
          : `${count} résultat${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}.`
      )
    }, 300)

    return () => clearTimeout(timer)
  }, [platform, genre])

  async function handleTmdbSelect(result) {
    setSelectedTmdb(result)
    setTmdbResults([])
    setTmdbQuery(result.title)
    setDbStatus('loading')

    const { data: content } = await getContentByTmdbId(result.tmdbId)

    if (content && content.ad_status && content.ad_status.length > 0) {
      navigate(`/contenu/${content.id}`, { state: { content } })
    } else {
      setDbStatus('notfound')
    }
  }

  const handleValidated = useCallback((msg) => announce(msg), [announce])

  return (
    <>
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
      >
        ← Retour
      </button>

      {/* TMDB status live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="tmdb-search-status">
        {tmdbStatus}
      </div>
      {/* Browse status live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="browse-status">
        {browseStatus}
      </div>

      {/* TMDB search */}
      <section aria-labelledby="search-section-title" className="mb-8">
        <h2 id="search-section-title" className="text-xl font-bold mb-4">
          Rechercher un titre
        </h2>

        <div className="mb-4">
          <label htmlFor="tmdb-search-input" className="block mb-2 font-medium">
            Titre du film ou de la série
          </label>
          <input
            id="tmdb-search-input"
            ref={searchInputRef}
            type="search"
            value={tmdbQuery}
            onChange={(e) => {
              setTmdbQuery(e.target.value)
              setSelectedTmdb(null)
              setDbStatus('idle')
            }}
            aria-describedby="tmdb-search-status"
            autoComplete="off"
            spellCheck="false"
            placeholder="Ex. : Lupin, La La Land…"
            className="w-full px-4 py-3 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-base placeholder-gray-500 dark:placeholder-gray-400 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
          />
        </div>

        {/* TMDB autocomplete results */}
        {tmdbResults.length > 0 && (
          <fieldset className="mb-4">
            <legend className="font-medium mb-3">Sélectionnez un titre</legend>
            <div className="space-y-2">
              {tmdbResults.map((r) => (
                <label
                  key={r.tmdbId}
                  aria-label={[r.title, r.year, r.type === 'tv' ? 'Série' : 'Film'].filter(Boolean).join(', ')}
                  className="flex items-center gap-3 p-3 border-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 has-[:checked]:border-black dark:has-[:checked]:border-white"
                >
                  <input
                    type="radio"
                    name="tmdb-result"
                    value={r.tmdbId}
                    checked={selectedTmdb?.tmdbId === r.tmdbId}
                    onChange={() => handleTmdbSelect(r)}
                    className="flex-shrink-0"
                  />
                  <span aria-hidden="true" className="flex items-center gap-3 min-w-0">
                    {r.posterPath && (
                      <img
                        src={r.posterPath}
                        alt=""
                        width={30}
                        height={45}
                        className="rounded flex-shrink-0 object-cover"
                        loading="lazy"
                      />
                    )}
                    <span>
                      <span className="font-medium">{r.title}</span>
                      {r.year && (
                        <span className="text-sm text-gray-700 dark:text-gray-300 ml-2">
                          <span aria-hidden="true">(</span>{r.year}<span aria-hidden="true">)</span>
                        </span>
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        — {r.type === 'tv' ? 'Série' : 'Film'}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* Checking DB */}
        {dbStatus === 'loading' && (
          <p className="text-base text-gray-700 dark:text-gray-300">Chargement…</p>
        )}

        {/* Not found in DB */}
        {dbStatus === 'notfound' && selectedTmdb && (
          <div className="p-5 border-2 border-gray-300 dark:border-gray-600 rounded-lg">
            <h3 className="text-lg font-bold mb-2">Aucun contenu</h3>
            <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
              <strong>{selectedTmdb.title}</strong>
              {selectedTmdb.year ? ` (${selectedTmdb.year})` : ''} avec audiodescription
              n'est renseigné sur aucune plateforme.{' '}
              Vous connaissez une plateforme qui le propose ?{' '}
              Ajoutez-la.
            </p>
            {user ? (
              <button
                onClick={() => navigate('/ajouter', { state: { initialTitle: selectedTmdb?.title || null } })}
                className="px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
              >
                Ajouter ce contenu
              </button>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <a
                  href="/connexion"
                  onClick={(e) => { e.preventDefault(); navigate('/connexion', { state: { from: '/ajouter' } }) }}
                  className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                >
                  Connectez-vous
                </a>{' '}
                pour ajouter ce contenu.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Browse by filters */}
      <section aria-labelledby="browse-section-title" className="mb-12">
        <h2 id="browse-section-title" className="text-xl font-bold mb-4">
          Parcourir par plateforme ou genre
        </h2>

        <div
          role="group"
          aria-label="Filtres de recherche"
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="flex-1">
            <label htmlFor="platform-filter" className="block mb-2 font-medium">
              Plateforme
            </label>
            <select
              id="platform-filter"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              aria-describedby="browse-status"
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
              Genre
            </label>
            <select
              id="genre-filter"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              aria-describedby="browse-status"
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

        {browseLoading && (
          <p className="text-base text-gray-700 dark:text-gray-300" aria-hidden="true">
            Chargement…
          </p>
        )}

        {!browseLoading && hasBrowsed && browseResults.length === 0 && (
          <p className="text-base text-gray-700 dark:text-gray-300">
            Aucun résultat pour ces filtres.
          </p>
        )}

        {!browseLoading && browseResults.length > 0 && (
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4" aria-hidden="true">
              {browseResults.length} résultat{browseResults.length > 1 ? 's' : ''}
            </p>
            <ul className="space-y-2">
              {browseResults.map((content) => {
                const adStatus = content.ad_status?.[0]
                const trustLevel = getTrustLevel(adStatus?.validation_count)
                return (
                  <li key={content.id}>
                    <button
                      onClick={() => navigate(`/contenu/${content.id}`, { state: { content } })}
                      className="w-full text-left p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-black dark:hover:border-white focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                      aria-label={[content.title, content.year, content.genre, trustLevel].filter(Boolean).join(', ')}
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
          </div>
        )}
      </section>
    </>
  )
}
