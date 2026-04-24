import { useEffect, useRef, useState } from 'react'
import { searchTmdb, getTmdbDetails } from '../lib/tmdb.js'
import { updateContent } from '../lib/supabase.js'
import { posterUrl } from '../lib/tmdb.js'

export default function AdminEditContent({ contentId, onUpdate, showToast }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const sectionRef = useRef(null)

  // Debounced TMDB search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      const { data } = await searchTmdb(query)
      setResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  async function handleSelect(result) {
    setSelected(result)
    setResults([])
    setQuery(result.title)
    setLoadingPreview(true)
    const { data } = await getTmdbDetails(result.tmdbId, result.type)
    setPreview(data)
    setLoadingPreview(false)
  }

  async function handleConfirm() {
    if (!preview) return
    setSubmitting(true)
    const { data, error } = await updateContent(contentId, preview)
    setSubmitting(false)
    if (error) {
      showToast('Erreur lors de la mise à jour.')
      return
    }
    showToast(`"${preview.title}" mis à jour.`)
    setOpen(false)
    setQuery('')
    setSelected(null)
    setPreview(null)
    onUpdate(data)
  }

  function handleCancel() {
    setOpen(false)
    setQuery('')
    setSelected(null)
    setPreview(null)
    setResults([])
  }

  const inputClass = 'w-full px-4 py-3 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-base focus:outline-none focus:ring focus:ring-offset-2 focus:ring-black dark:focus:ring-white'
  const btnPrimary = 'px-5 py-2 min-h-touch bg-black dark:bg-white text-white dark:text-black text-sm font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed'
  const btnSecondary = 'px-5 py-2 min-h-touch border-2 border-black dark:border-white text-sm font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white'

  return (
    <div
      ref={sectionRef}
      className="mt-8 border-2 border-dashed border-gray-400 dark:border-gray-500 rounded-lg p-4"
    >
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full text-left flex items-center justify-between gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
      >
        <span>⚙ Admin — Modifier ce contenu via TMDB</span>
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="admin-tmdb-search" className="block mb-2 text-sm font-medium">
              Rechercher le bon titre sur TMDB
            </label>
            <input
              id="admin-tmdb-search"
              type="search"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); setPreview(null) }}
              placeholder="Ex. : Jurassic World, Lupin…"
              autoComplete="off"
              className={inputClass}
            />
          </div>

          {searching && (
            <p className="text-sm text-gray-600 dark:text-gray-400">Recherche…</p>
          )}

          {results.length > 0 && (
            <fieldset>
              <legend className="text-sm font-medium mb-2">Sélectionnez le bon titre</legend>
              <div className="space-y-2">
                {results.map(r => (
                  <label
                    key={r.tmdbId}
                    aria-label={[r.title, r.year, r.type === 'tv' ? 'Série' : 'Film'].filter(Boolean).join(', ')}
                    className="flex items-center gap-3 p-3 border-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 has-[:checked]:border-black dark:has-[:checked]:border-white"
                  >
                    <input
                      type="radio"
                      name="admin-tmdb-result"
                      value={r.tmdbId}
                      checked={selected?.tmdbId === r.tmdbId}
                      onChange={() => handleSelect(r)}
                      className="flex-shrink-0"
                    />
                    <span aria-hidden="true" className="flex items-center gap-3 min-w-0">
                      {r.posterPath && (
                        <img src={r.posterPath} alt="" width={30} height={45}
                          className="rounded flex-shrink-0 object-cover" loading="lazy" />
                      )}
                      <span>
                        <span className="font-medium">{r.title}</span>
                        {r.year && <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({r.year})</span>}
                        <span className="text-sm text-gray-500 ml-2">— {r.type === 'tv' ? 'Série' : 'Film'}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {loadingPreview && (
            <p className="text-sm text-gray-600 dark:text-gray-400">Chargement des détails…</p>
          )}

          {preview && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 text-sm space-y-1">
              <p className="font-semibold text-base">{preview.title} {preview.year ? `(${preview.year})` : ''}</p>
              <p><span className="text-gray-500">TMDB ID :</span> {preview.tmdbId}</p>
              <p><span className="text-gray-500">Type :</span> {preview.type === 'tv' ? 'Série' : 'Film'}</p>
              {preview.genre && <p><span className="text-gray-500">Genre :</span> {preview.genre}</p>}
              {preview.synopsis && (
                <p className="text-gray-600 dark:text-gray-400 line-clamp-3">{preview.synopsis}</p>
              )}
              {posterUrl(preview.posterPath) && (
                <img src={posterUrl(preview.posterPath)} alt="" width={60} height={90}
                  className="rounded mt-2 object-cover" />
              )}
            </div>
          )}

          {preview && (
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleConfirm} disabled={submitting} className={btnPrimary}>
                {submitting ? 'Mise à jour…' : 'Confirmer la mise à jour'}
              </button>
              <button onClick={handleCancel} className={btnSecondary}>
                Annuler
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
