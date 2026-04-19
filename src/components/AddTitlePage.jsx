import { useEffect, useRef, useState, useCallback } from 'react'
import { searchTmdb } from '../lib/tmdb.js'
import { submitNewTitle } from '../lib/supabase.js'

const PLATFORMS = [
  { value: 'canal', label: 'Canal+' },
  { value: 'netflix', label: 'Netflix' },
  { value: 'disney', label: 'Disney+' },
  { value: 'prime', label: 'Prime Video' },
  { value: 'apple', label: 'Apple TV+' },
]

export default function AddTitlePage({ announce }) {
  const [step, setStep] = useState(1)
  const [tmdbQuery, setTmdbQuery] = useState('')
  const [tmdbResults, setTmdbResults] = useState([])
  const [tmdbStatusMsg, setTmdbStatusMsg] = useState('')
  const [selectedTitle, setSelectedTitle] = useState(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const step1HeadingRef = useRef(null)
  const step2HeadingRef = useRef(null)
  const step3HeadingRef = useRef(null)
  const tmdbStatusRef = useRef(null)

  const headingRefs = [null, step1HeadingRef, step2HeadingRef, step3HeadingRef]

  // Focus heading when step changes
  useEffect(() => {
    headingRefs[step]?.current?.focus()
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced TMDB search
  useEffect(() => {
    if (!tmdbQuery.trim()) {
      setTmdbResults([])
      setTmdbStatusMsg('')
      return
    }

    const timer = setTimeout(async () => {
      setTmdbStatusMsg('Recherche en cours…')
      const { data, error } = await searchTmdb(tmdbQuery)

      if (error) {
        setTmdbStatusMsg('Erreur lors de la recherche. Veuillez réessayer.')
        return
      }

      const count = (data || []).length
      setTmdbResults(data || [])
      setTmdbStatusMsg(
        count === 0
          ? 'Aucun résultat trouvé.'
          : `${count} résultat${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}.`
      )
    }, 300)

    return () => clearTimeout(timer)
  }, [tmdbQuery])

  function goToStep2() {
    setStep(2)
    announce('Étape 2 sur 3 : sélection des plateformes.')
  }

  function goToStep3() {
    setStep(3)
    announce('Étape 3 sur 3 : confirmation de votre contribution.')
  }

  function goBackToStep1() {
    setStep(1)
    announce("Retour à l'étape 1 : recherche d'un titre.")
  }

  function goBackToStep2() {
    setStep(2)
    announce("Retour à l'étape 2 : sélection des plateformes.")
  }

  function togglePlatform(value) {
    setSelectedPlatforms((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError('')

    const { error } = await submitNewTitle(selectedTitle, selectedPlatforms)

    setIsSubmitting(false)

    if (error) {
      setSubmitError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.")
      return
    }

    announce(
      'Merci. Votre contribution a été envoyée et sera examinée par notre équipe.'
    )

    // Reset form
    setStep(1)
    setTmdbQuery('')
    setTmdbResults([])
    setSelectedTitle(null)
    setSelectedPlatforms([])
    setTmdbStatusMsg('')
  }

  const platformLabel = (val) => PLATFORMS.find((p) => p.value === val)?.label || val

  return (
    <>
      {/* TMDB search live region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="add-search-status"
      >
        {tmdbStatusMsg}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <section aria-label="Étape 1 sur 3 : rechercher un titre">
          <h2
            ref={step1HeadingRef}
            tabIndex={-1}
            className="text-xl font-bold mb-1 focus-visible:outline-none"
          >
            Étape 1 sur 3
          </h2>
          <p className="text-base mb-6 text-gray-700 dark:text-gray-300">
            Rechercher un titre
          </p>

          <div className="mb-6">
            <label htmlFor="add-search" className="block mb-2 font-medium">
              Titre du film ou de la série
            </label>
            <input
              id="add-search"
              type="search"
              value={tmdbQuery}
              onChange={(e) => setTmdbQuery(e.target.value)}
              aria-describedby="add-search-status"
              autoComplete="off"
              spellCheck="false"
              placeholder="Ex. : Lupin, La La Land…"
              className="w-full px-4 py-3 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-base placeholder-gray-500 dark:placeholder-gray-400 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            />
          </div>

          {tmdbResults.length > 0 && (
            <fieldset className="mb-6">
              <legend className="font-medium mb-3">Sélectionnez un titre</legend>
              <div className="space-y-2">
                {tmdbResults.map((r) => (
                  <label
                    key={r.tmdbId}
                    className="flex items-center gap-3 p-3 border-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 has-[:checked]:border-black dark:has-[:checked]:border-white"
                  >
                    <input
                      type="radio"
                      name="tmdb-selection"
                      value={r.tmdbId}
                      checked={selectedTitle?.tmdbId === r.tmdbId}
                      onChange={() => setSelectedTitle(r)}
                      className="flex-shrink-0"
                    />
                    <span className="flex items-center gap-3 min-w-0">
                      {r.posterPath && (
                        <img
                          src={r.posterPath}
                          alt={`Affiche de ${r.title}`}
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
                            ({r.year})
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

          <div className="flex items-center gap-4">
            <button
              onClick={goToStep2}
              disabled={!selectedTitle}
              aria-disabled={!selectedTitle}
              aria-describedby={!selectedTitle ? 'step1-hint' : undefined}
              className="px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
            {!selectedTitle && (
              <span
                id="step1-hint"
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Sélectionnez un titre pour continuer
              </span>
            )}
          </div>
        </section>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <section aria-label="Étape 2 sur 3 : sélectionner les plateformes">
          <h2
            ref={step2HeadingRef}
            tabIndex={-1}
            className="text-xl font-bold mb-1 focus-visible:outline-none"
          >
            Étape 2 sur 3
          </h2>
          <p className="text-base mb-6 text-gray-700 dark:text-gray-300">
            Sur quelles plateformes l'audiodescription est-elle disponible pour{' '}
            <strong>{selectedTitle?.title}</strong>
            {selectedTitle?.year ? ` (${selectedTitle.year})` : ''} ?
          </p>

          <fieldset className="mb-6">
            <legend className="font-medium mb-3 sr-only">
              Sélectionnez les plateformes avec audiodescription
            </legend>
            <div className="space-y-2">
              {PLATFORMS.map((p) => (
                <label
                  key={p.value}
                  className="flex items-center gap-3 p-3 border-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600 has-[:checked]:border-black dark:has-[:checked]:border-white"
                >
                  <input
                    type="checkbox"
                    value={p.value}
                    checked={selectedPlatforms.includes(p.value)}
                    onChange={() => togglePlatform(p.value)}
                    className="flex-shrink-0"
                  />
                  <span className="font-medium">{p.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={goToStep3}
              disabled={selectedPlatforms.length === 0}
              aria-disabled={selectedPlatforms.length === 0}
              aria-describedby={selectedPlatforms.length === 0 ? 'step2-hint' : undefined}
              className="px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
            <button
              onClick={goBackToStep1}
              className="px-6 py-3 min-h-touch border-2 border-black dark:border-white font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              Précédent
            </button>
            {selectedPlatforms.length === 0 && (
              <span
                id="step2-hint"
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Cochez au moins une plateforme pour continuer
              </span>
            )}
          </div>
        </section>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <section aria-label="Étape 3 sur 3 : confirmation">
          <h2
            ref={step3HeadingRef}
            tabIndex={-1}
            className="text-xl font-bold mb-1 focus-visible:outline-none"
          >
            Étape 3 sur 3
          </h2>
          <p className="text-base mb-6 text-gray-700 dark:text-gray-300">
            Confirmez votre contribution
          </p>

          <div
            className="mb-6 p-4 border-2 border-gray-300 dark:border-gray-600 rounded"
            aria-label={`Résumé : audiodescription disponible sur ${selectedPlatforms.map(platformLabel).join(' et ')} pour ${selectedTitle?.title}${selectedTitle?.year ? ` (${selectedTitle.year})` : ''}`}
          >
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">Titre</dt>
                <dd className="text-base font-semibold">
                  {selectedTitle?.title}
                  {selectedTitle?.year ? ` (${selectedTitle.year})` : ''}
                  {selectedTitle?.type && (
                    <span className="ml-2 font-normal text-sm text-gray-600 dark:text-gray-400">
                      — {selectedTitle.type === 'tv' ? 'Série' : 'Film'}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Plateformes avec audiodescription
                </dt>
                <dd className="text-base font-semibold">
                  {selectedPlatforms.map(platformLabel).join(', ')}
                </dd>
              </div>
            </dl>
          </div>

          {submitError && (
            <p
              role="alert"
              className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-700 rounded text-red-900 dark:text-red-100 text-sm"
            >
              {submitError}
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Envoi en cours…' : 'Confirmer et envoyer'}
            </button>
            <button
              onClick={goBackToStep2}
              disabled={isSubmitting}
              className="px-6 py-3 min-h-touch border-2 border-black dark:border-white font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Modifier
            </button>
          </div>
        </section>
      )}
    </>
  )
}
