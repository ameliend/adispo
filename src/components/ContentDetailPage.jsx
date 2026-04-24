import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, useParams, useOutletContext, Link } from 'react-router-dom'
import TrustBadge from './TrustBadge.jsx'
import ContributionForm from './ContributionForm.jsx'
import { incrementValidation, getContentById, updateAdStatusLink } from '../lib/supabase.js'
import { PLATFORM_LABELS } from '../lib/platforms.js'
import { posterUrl } from '../lib/tmdb.js'
import AdminEditContent from './AdminEditContent.jsx'

const ADMIN_EMAIL = 'amelien.delahaie@gmail.com'

const STATUS_LABELS = {
  available: 'Audiodescription disponible',
  unavailable: 'Audiodescription non disponible',
  unverified: 'Non encore vérifié',
}

export default function ContentDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { announce, showToast, user, playlistIds, togglePlaylist } = useOutletContext()
  const isAdmin = user?.email === ADMIN_EMAIL
  const [content, setContent] = useState(location.state?.content || null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeReportId, setActiveReportId] = useState(null)
  const [validatedIds, setValidatedIds] = useState({})
  const [localCounts, setLocalCounts] = useState({})
  const [editingLinkId, setEditingLinkId] = useState(null)
  const [linkDraft, setLinkDraft] = useState({})
  const [linkSaving, setLinkSaving] = useState({})

  const reportButtonRefs = useRef({})
  const backBtnRef = useRef(null)

  useEffect(() => {
    getContentById(id).then(({ data }) => {
      if (data) setContent(data)
      setIsLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!isLoading && content) {
      requestAnimationFrame(() => backBtnRef.current?.focus())
    }
  }, [isLoading, content])

  if (isLoading) return <p className="text-base text-gray-700 dark:text-gray-300">Chargement…</p>
  if (!content) return <p className="text-base">Contenu introuvable.</p>

  const adStatuses = content.ad_status || []
  const inPlaylist = playlistIds.has(content.id)

  async function handleValidate(statusId, platform) {
    if (validatedIds[statusId]) return
    const { error } = await incrementValidation(statusId)
    if (!error) {
      setValidatedIds((prev) => ({ ...prev, [statusId]: true }))
      setLocalCounts((prev) => ({
        ...prev,
        [statusId]:
          (prev[statusId] ??
            (adStatuses.find((s) => s.id === statusId)?.validation_count ?? 0)) + 1,
      }))
      announce(`Merci pour votre validation sur ${PLATFORM_LABELS[platform] || platform}.`)
    }
  }

  async function handleSaveLink(statusId) {
    setLinkSaving((prev) => ({ ...prev, [statusId]: true }))
    const url = linkDraft[statusId] ?? ''
    const { error } = await updateAdStatusLink(statusId, url.trim() || null)
    setLinkSaving((prev) => ({ ...prev, [statusId]: false }))
    if (!error) {
      setContent((c) => ({
        ...c,
        ad_status: c.ad_status.map((s) =>
          s.id === statusId ? { ...s, lien: url.trim() || null } : s
        ),
      }))
      setEditingLinkId(null)
      showToast('Lien mis à jour.')
    }
  }

  const typeLabel =
    content.type === 'tv' ? 'Série' : content.type === 'movie' ? 'Film' : null

  return (
    <section aria-labelledby="content-detail-title">
      <button
        ref={backBtnRef}
        onClick={() => navigate(-1)}
        className="mb-6 text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
      >
        ← Retour à la recherche
      </button>

      <div className="flex gap-6 items-start mb-6">
        {posterUrl(content.poster_path || content.posterPath) && (
          <img
            src={posterUrl(content.poster_path || content.posterPath)}
            alt=""
            width={90}
            height={135}
            className="rounded flex-shrink-0 object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h2
            id="content-detail-title"
            className="text-2xl font-bold mb-2"
          >
            {content.title}
            {content.year && (
              <span className="font-normal text-lg ml-2 text-gray-700 dark:text-gray-300">
                <span aria-hidden="true">(</span>{content.year}<span aria-hidden="true">)</span>
              </span>
            )}
          </h2>

          {(typeLabel || content.genre) && (
            <p className="text-base text-gray-700 dark:text-gray-300 mb-3">
              {[typeLabel, content.genre].filter(Boolean).join(' — ')}
            </p>
          )}

          {content.synopsis && (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {content.synopsis}
            </p>
          )}
        </div>
      </div>

      {user && (
        <div className="mb-8">
          <button
            onClick={() => {
              togglePlaylist(content.id)
              announce(inPlaylist ? `${content.title} retiré de votre playlist.` : `${content.title} ajouté à votre playlist.`)
            }}
            aria-pressed={inPlaylist}
            className="px-4 py-2 min-h-touch text-sm font-medium border-2 border-black dark:border-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
          >
            {inPlaylist ? '✓ Dans ma playlist' : '+ Ajouter à ma playlist'}
          </button>
        </div>
      )}

      <h3 className="text-lg font-bold mb-4">Audiodescription par plateforme</h3>

      {adStatuses.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Aucune information sur l'audiodescription pour ce titre.
        </p>
      ) : (
        <>
          <ul
            aria-label={`Statut de l'audiodescription par plateforme pour ${content.title}`}
            className="space-y-4"
          >
            {adStatuses.map((status) => {
              const count = localCounts[status.id] ?? status.validation_count ?? 0
              const validated = validatedIds[status.id]
              const isReportOpen = activeReportId === status.id
              const isEditingLink = editingLinkId === status.id
              const platformName = PLATFORM_LABELS[status.platform] || status.platform

              return (
                <li
                  key={status.id}
                  className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-base font-semibold">{platformName}</span>
                    {count > 0 && <TrustBadge validationCount={count} />}
                  </div>

                  {count > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <progress
                        value={Math.min(count, 5)}
                        max={5}
                        aria-label={`Niveau de confiance : ${count} validation${count > 1 ? 's' : ''} sur 5`}
                        className="w-32 h-2"
                      />
                      <span
                        className="text-sm text-gray-700 dark:text-gray-300"
                        aria-hidden="true"
                      >
                        {count} / 5
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {status.lien && (
                      <a
                        href={status.lien}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Voir ${content.title} sur ${platformName} (nouvel onglet)`}
                        className="px-4 py-2 min-h-touch text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white inline-flex items-center"
                      >
                        Voir sur {platformName} ↗
                      </a>
                    )}

                    {user && (
                      <>
                        <button
                          aria-label={
                            validated
                              ? `Validation enregistrée pour ${platformName}`
                              : `Confirmer que l'audiodescription est disponible sur ${platformName}`
                          }
                          disabled={validated}
                          onClick={() => handleValidate(status.id, status.platform)}
                          className="px-4 py-2 min-h-touch text-sm font-medium border-2 border-black dark:border-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {validated ? "L'AD est confirmée ✓" : "L'AD est toujours disponible"}
                        </button>

                        <button
                          ref={(el) => { reportButtonRefs.current[status.id] = el }}
                          aria-label={`Signaler que l'audiodescription n'est plus disponible sur ${platformName} pour ${content.title}`}
                          aria-expanded={isReportOpen}
                          onClick={() =>
                            isReportOpen ? setActiveReportId(null) : setActiveReportId(status.id)
                          }
                          className="px-4 py-2 min-h-touch text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                        >
                          {"L'AD n'est plus disponible"}
                        </button>
                      </>
                    )}

                    {isAdmin && (
                      <button
                        aria-label={`Modifier l'URL pour ${platformName}`}
                        aria-expanded={isEditingLink}
                        onClick={() => {
                          if (isEditingLink) {
                            setEditingLinkId(null)
                          } else {
                            setLinkDraft((prev) => ({ ...prev, [status.id]: status.lien || '' }))
                            setEditingLinkId(status.id)
                          }
                        }}
                        className="px-4 py-2 min-h-touch text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                      >
                        {status.lien ? "Modifier l'URL" : "Ajouter une URL"}
                      </button>
                    )}
                  </div>

                  {isAdmin && isEditingLink && (
                    <div className="mt-4 flex flex-col gap-2">
                      <label
                        htmlFor={`link-input-${status.id}`}
                        className="text-sm font-medium"
                      >
                        URL pour {platformName}
                      </label>
                      <input
                        id={`link-input-${status.id}`}
                        type="url"
                        value={linkDraft[status.id] ?? ''}
                        onChange={(e) =>
                          setLinkDraft((prev) => ({ ...prev, [status.id]: e.target.value }))
                        }
                        placeholder="https://…"
                        className="w-full px-3 py-2 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-sm focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                      />
                      <div className="flex gap-3">
                        <button
                          disabled={linkSaving[status.id]}
                          onClick={() => handleSaveLink(status.id)}
                          className="px-4 py-2 min-h-touch text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-60"
                        >
                          {linkSaving[status.id] ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                        <button
                          onClick={() => setEditingLinkId(null)}
                          className="px-4 py-2 min-h-touch text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {isReportOpen && (
                    <ContributionForm
                      contentId={content.id}
                      contentTitle={content.title}
                      platform={platformName}
                      onClose={() => setActiveReportId(null)}
                      returnFocusRef={{ current: reportButtonRefs.current[status.id] }}
                    />
                  )}
                </li>
              )
            })}
          </ul>

          {!user && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <Link
                to="/connexion"
                state={{ from: location.pathname }}
                className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
              >
                Connectez-vous
              </Link>{' '}
              pour valider ou signaler l'audiodescription.
            </p>
          )}
        </>
      )}
      {isAdmin && (
        <AdminEditContent
          contentId={content.id}
          onUpdate={(updated) => setContent(c => ({ ...c, ...updated }))}
          showToast={showToast}
        />
      )}
    </section>
  )
}
