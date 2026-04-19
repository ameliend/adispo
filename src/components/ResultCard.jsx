import { useRef, useState } from 'react'
import TrustBadge from './TrustBadge.jsx'
import ContributionForm from './ContributionForm.jsx'
import { incrementValidation } from '../lib/supabase.js'

const PLATFORM_LABELS = {
  netflix: 'Netflix',
  prime: 'Prime Video',
  disney: 'Disney+',
  apple: 'Apple TV+',
  canal: 'Canal+',
}

const STATUS_LABELS = {
  available: 'Audiodescription disponible',
  unavailable: 'Audiodescription non disponible',
  unverified: 'Non encore vérifié',
}

export default function ResultCard({ content, adStatuses, onValidated }) {
  const [activeReportId, setActiveReportId] = useState(null)
  const [validatedIds, setValidatedIds] = useState({})
  const [localCounts, setLocalCounts] = useState({})

  const reportButtonRefs = useRef({})

  async function handleValidate(statusId, platform) {
    if (validatedIds[statusId]) return

    const { error } = await incrementValidation(statusId)
    if (!error) {
      setValidatedIds((prev) => ({ ...prev, [statusId]: true }))
      setLocalCounts((prev) => ({
        ...prev,
        [statusId]: (prev[statusId] ?? (adStatuses.find((s) => s.id === statusId)?.validation_count ?? 0)) + 1,
      }))
      onValidated?.(`Merci pour votre validation sur ${PLATFORM_LABELS[platform] || platform}.`)
    }
  }

  function handleReportOpen(statusId) {
    setActiveReportId(statusId)
  }

  function handleReportClose() {
    setActiveReportId(null)
  }

  const platformName = (p) => PLATFORM_LABELS[p] || p

  return (
    <article
      aria-labelledby={`title-${content.id}`}
      className="py-6 border-b-2 border-gray-200 dark:border-gray-700"
    >
      <div className="flex gap-4 items-start">
        {content.posterPath ? (
          <img
            src={content.posterPath}
            alt={`Affiche de ${content.title}`}
            width={46}
            height={69}
            className="rounded flex-shrink-0 object-cover"
            loading="lazy"
          />
        ) : null}

        <div className="flex-1 min-w-0">
          <h2 id={`title-${content.id}`} className="text-xl font-bold mb-1">
            {content.title}
            {content.year ? (
              <span className="font-normal text-base ml-2 text-gray-700 dark:text-gray-300">
                ({content.year})
              </span>
            ) : null}
          </h2>

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            {content.type === 'tv' ? 'Série' : 'Film'}
            {content.genre ? ` — ${content.genre}` : ''}
          </p>

          {(!adStatuses || adStatuses.length === 0) ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aucune information sur l'audiodescription pour ce titre.
            </p>
          ) : (
            <ul
              aria-label={`Statut de l'audiodescription par plateforme pour ${content.title}`}
              className="space-y-4"
            >
              {adStatuses.map((status) => {
                const count = localCounts[status.id] ?? status.validation_count ?? 0
                const validated = validatedIds[status.id]
                const isReportOpen = activeReportId === status.id
                const label = STATUS_LABELS[status.status] || status.status

                return (
                  <li key={status.id} className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold min-w-[8rem]">
                        {platformName(status.platform)}
                      </span>
                      <span className="text-sm">{label}</span>
                      {count > 0 && <TrustBadge validationCount={count} />}
                    </div>

                    {count > 0 && (
                      <div className="flex items-center gap-2">
                        <progress
                          value={Math.min(count, 5)}
                          max={5}
                          aria-label={`Niveau de confiance : ${count} validation${count > 1 ? 's' : ''} sur 5`}
                          className="w-32 h-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300" aria-hidden="true">
                          {count} / 5
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-2">
                      <button
                        aria-label={
                          validated
                            ? `Validation enregistrée pour ${platformName(status.platform)}`
                            : `Valider cette information pour ${platformName(status.platform)}`
                        }
                        disabled={validated}
                        onClick={() => handleValidate(status.id, status.platform)}
                        className="px-4 py-2 min-h-touch text-sm font-medium border-2 border-black dark:border-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {validated ? 'Merci pour votre validation ✓' : 'Valider cette information'}
                      </button>

                      <button
                        ref={(el) => { reportButtonRefs.current[status.id] = el }}
                        aria-label={`Signaler une erreur pour ${content.title} sur ${platformName(status.platform)}`}
                        aria-expanded={isReportOpen}
                        onClick={() =>
                          isReportOpen ? handleReportClose() : handleReportOpen(status.id)
                        }
                        className="px-4 py-2 min-h-touch text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                      >
                        Signaler une erreur
                      </button>
                    </div>

                    {isReportOpen && (
                      <ContributionForm
                        contentId={content.id}
                        contentTitle={content.title}
                        platform={platformName(status.platform)}
                        onClose={handleReportClose}
                        returnFocusRef={{ current: reportButtonRefs.current[status.id] }}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </article>
  )
}
