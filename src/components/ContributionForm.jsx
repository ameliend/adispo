import { useEffect, useRef, useState } from 'react'
import { submitContribution } from '../lib/supabase.js'

const STATUS_OPTIONS = [
  { value: 'unavailable', label: 'Audiodescription non disponible' },
  { value: 'unsure', label: 'Je ne suis pas sûr(e)' },
]

export default function ContributionForm({
  contentId,
  contentTitle,
  platform,
  onClose,
  returnFocusRef,
}) {
  const [claimedStatus, setClaimedStatus] = useState('unavailable')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const firstFieldRef = useRef(null)
  const statusRef = useRef(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  function handleClose() {
    onClose()
    requestAnimationFrame(() => {
      returnFocusRef?.current?.focus()
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')

    const { error } = await submitContribution({
      content_id: contentId,
      platform,
      claimed_status: claimedStatus,
      contributor_email: email.trim() || null,
    })

    setIsSubmitting(false)

    if (error) {
      setErrorMsg('Une erreur est survenue. Veuillez réessayer.')
      statusRef.current?.focus()
      return
    }

    setSubmitted(true)
    requestAnimationFrame(() => {
      statusRef.current?.focus()
    })
  }

  if (submitted) {
    return (
      <div className="mt-4 p-4 border-2 border-green-700 rounded bg-green-50 dark:bg-green-950">
        <p
          ref={statusRef}
          role="status"
          tabIndex={-1}
          className="text-green-900 dark:text-green-100 font-medium"
        >
          Votre signalement a été envoyé. Merci pour votre contribution.
        </p>
        <button
          onClick={handleClose}
          className="mt-3 px-4 py-2 min-h-touch text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
        >
          Fermer
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 border-2 border-gray-300 dark:border-gray-600 rounded">
      <h3 className="text-lg font-semibold mb-4">
        Signaler une erreur pour {contentTitle} sur {platform}
      </h3>

      {errorMsg && (
        <p
          ref={statusRef}
          role="alert"
          tabIndex={-1}
          className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-700 rounded text-red-900 dark:text-red-100 text-sm"
        >
          {errorMsg}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label
            htmlFor="contribution-status"
            className="block mb-2 font-medium"
          >
            Que souhaitez-vous signaler ?
          </label>
          <select
            id="contribution-status"
            ref={firstFieldRef}
            value={claimedStatus}
            onChange={(e) => setClaimedStatus(e.target.value)}
            className="w-full px-3 py-2 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-base focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="contribution-email" className="block mb-2 font-medium">
            Votre adresse e-mail{' '}
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
              (optionnelle)
            </span>
          </label>
          <input
            id="contribution-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full px-3 py-2 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-base focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            placeholder="exemple@domaine.fr"
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 min-h-touch bg-black dark:bg-white text-white dark:text-black font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Envoi en cours…' : 'Envoyer le signalement'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 min-h-touch border-2 border-black dark:border-white font-medium rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}
