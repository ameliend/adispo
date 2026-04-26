import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, useParams, useOutletContext, Link } from 'react-router-dom'
import ContributionForm from './ContributionForm.jsx'
import { getContentById, updateAdStatusLink, addPlatformToContent } from '../lib/supabase.js'
import { PLATFORMS, PLATFORM_LABELS } from '../lib/platforms.js'
import { posterUrl } from '../lib/tmdb.js'
import AdminEditContent from './AdminEditContent.jsx'

const ADMIN_EMAIL = 'amelien.delahaie@gmail.com'

export default function ContentDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { announce, showToast, user, playlistIds, togglePlaylist } = useOutletContext()
  const isAdmin = user?.email === ADMIN_EMAIL
  const [content, setContent] = useState(location.state?.content || null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeReportId, setActiveReportId] = useState(null)
  const [reportedIds, setReportedIds] = useState(new Set())
  const [editingLinkId, setEditingLinkId] = useState(null)
  const [linkDraft, setLinkDraft] = useState({})
  const [linkSaving, setLinkSaving] = useState({})
  const [addingPlatform, setAddingPlatform] = useState(false)
  const [newPlatform, setNewPlatform] = useState('')
  const [newPlatformLink, setNewPlatformLink] = useState('')
  const [addingPlatformSaving, setAddingPlatformSaving] = useState(false)
  const [addPlatformError, setAddPlatformError] = useState('')

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

  async function handleAddPlatform() {
    if (!newPlatform) return
    setAddingPlatformSaving(true)
    setAddPlatformError('')
    const { data, error } = await addPlatformToContent(content.id, newPlatform, newPlatformLink.trim() || null)
    setAddingPlatformSaving(false)
    if (error) {
      setAddPlatformError('Une erreur est survenue. Veuillez réessayer.')
      return
    }
    setContent((c) => ({ ...c, ad_status: [...(c.ad_status || []), data] }))
    setAddingPlatform(false)
    setNewPlatform('')
    setNewPlatformLink('')
    announce(`${PLATFORM_LABELS[newPlatform] || newPlatform} ajouté.`)
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
          <h2 id="content-detail-title" className="text-2xl font-bold mb-2">
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
              const isReported = reportedIds.has(status.id)
              const isReportOpen = activeReportId === status.id
              const isEditingLink = editingLinkId === status.id
              const platformName = PLATFORM_LABELS[status.platform] || status.platform

              return (
                <li
                  key={status.id}
                  className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  {/* Platform name + badge */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="text-base font-semibold">{platformName}</span>
                    {isReported && (
                      <span
                        aria-label="Signalé : l'audiodescription serait potentiellement indisponible"
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-600 text-white"
                      >
                        Signalé
                      </span>
                    )}
                  </div>

                  {/* Actions row: Voir sur → lien → ••• */}
                  <div className="flex flex-wrap items-center gap-3">
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

                    {user && !status.lien && (
                      <button
                        aria-label={`Ajouter le lien vers le contenu sur ${platformName}`}
                        aria-expanded={isEditingLink}
                        onClick={() => {
                          if (isEditingLink) {
                            setEditingLinkId(null)
                          } else {
                            setLinkDraft((prev) => ({ ...prev, [status.id]: '' }))
                            setEditingLinkId(status.id)
                          }
                        }}
                        className="px-4 py-2 min-h-touch text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                      >
                        Ajouter le lien vers le contenu sur {platformName}
                      </button>
                    )}

                    {isAdmin && status.lien && (
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
                        Modifier l'URL
                      </button>
                    )}

                    {user && (
                      <button
                        ref={(el) => { reportButtonRefs.current[status.id] = el }}
                        aria-label="Signaler l'absence d'audiodescription"
                        aria-expanded={isReportOpen}
                        onClick={() =>
                          isReportOpen ? setActiveReportId(null) : setActiveReportId(status.id)
                        }
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white text-gray-500 dark:text-gray-400 text-lg leading-none"
                      >
                        <span aria-hidden="true">•••</span>
                      </button>
                    )}
                  </div>

                  {/* Link edit form */}
                  {isEditingLink && (user || isAdmin) && (
                    <div className="mt-4 flex flex-col gap-2">
                      <label htmlFor={`link-input-${status.id}`} className="text-sm font-medium">
                        Lien vers {platformName}
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

                  {/* Report form */}
                  {isReportOpen && (
                    <ContributionForm
                      contentId={content.id}
                      contentTitle={content.title}
                      platform={platformName}
                      onClose={() => setActiveReportId(null)}
                      onReport={() => setReportedIds((prev) => new Set([...prev, status.id]))}
                      returnFocusRef={{ current: reportButtonRefs.current[status.id] }}
                    />
                  )}
                </li>
              )
            })}
          </ul>

          {/* Add platform */}
          {user && (() => {
            const existingPlatforms = new Set(adStatuses.map((s) => s.platform))
            const availablePlatforms = PLATFORMS.filter((p) => !existingPlatforms.has(p.value))
            if (availablePlatforms.length === 0) return null
            return (
              <div className="mt-4">
                {!addingPlatform ? (
                  <button
                    onClick={() => {
                      setNewPlatform(availablePlatforms[0].value)
                      setAddingPlatform(true)
                    }}
                    className="text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                  >
                    + Ajouter une plateforme
                  </button>
                ) : (
                  <div className="flex flex-col gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <label htmlFor="new-platform-select" className="block text-sm font-medium mb-2">
                        Plateforme
                      </label>
                      <select
                        id="new-platform-select"
                        value={newPlatform}
                        onChange={(e) => setNewPlatform(e.target.value)}
                        className="w-full max-w-xs px-3 py-2 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring focus:ring-offset-2 focus:ring-black dark:focus:ring-white"
                      >
                        {availablePlatforms.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="new-platform-link" className="block text-sm font-medium mb-2">
                        Ajouter le lien vers le contenu sur {PLATFORM_LABELS[newPlatform] || newPlatform}
                      </label>
                      <input
                        id="new-platform-link"
                        type="url"
                        value={newPlatformLink}
                        onChange={(e) => setNewPlatformLink(e.target.value)}
                        placeholder="https://…"
                        className="w-full px-3 py-2 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-sm focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                      />
                    </div>
                    {addPlatformError && (
                      <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                        {addPlatformError}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <button
                        disabled={addingPlatformSaving}
                        onClick={handleAddPlatform}
                        className="px-4 py-2 min-h-touch text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-60"
                      >
                        {addingPlatformSaving ? 'Envoi…' : 'Confirmer'}
                      </button>
                      <button
                        onClick={() => { setAddingPlatform(false); setAddPlatformError(''); setNewPlatformLink('') }}
                        className="px-4 py-2 min-h-touch text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {!user && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <Link
                to="/connexion"
                state={{ from: location.pathname }}
                className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
              >
                Connectez-vous
              </Link>{' '}
              pour signaler l'audiodescription.
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
