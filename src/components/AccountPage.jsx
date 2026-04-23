import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { updateEmail, updatePassword } from '../lib/supabase.js'

const PASSWORD_RULES = [
  { id: 'len',     test: (p) => p.length >= 8,          label: '8 caractères minimum' },
  { id: 'upper',   test: (p) => /[A-Z]/.test(p),        label: 'Une lettre majuscule' },
  { id: 'lower',   test: (p) => /[a-z]/.test(p),        label: 'Une lettre minuscule' },
  { id: 'digit',   test: (p) => /[0-9]/.test(p),        label: 'Un chiffre' },
  { id: 'special', test: (p) => /[^A-Za-z0-9]/.test(p), label: 'Un caractère spécial' },
]

const inputClass = 'w-full px-4 py-3 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-base focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white'
const btnPrimaryClass = 'px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed'
const btnSecondaryClass = 'px-3 py-2 min-h-touch text-sm border-2 border-black dark:border-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white whitespace-nowrap'

function Alert({ type, message, refProp }) {
  if (!message) return null
  const isError = type === 'error'
  return (
    <p
      ref={refProp}
      role={isError ? 'alert' : 'status'}
      tabIndex={-1}
      className={`mb-4 p-3 rounded text-sm border focus-visible:outline-none ${
        isError
          ? 'bg-red-50 dark:bg-red-950 border-red-700 text-red-900 dark:text-red-100'
          : 'bg-green-50 dark:bg-green-950 border-green-700 text-green-900 dark:text-green-100'
      }`}
    >
      {message}
    </p>
  )
}

export default function AccountPage() {
  const navigate = useNavigate()
  const { user, authLoading, announce } = useOutletContext()

  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  const emailErrorRef = useRef(null)
  const emailSuccessRef = useRef(null)
  const passwordErrorRef = useRef(null)
  const passwordSuccessRef = useRef(null)

  useEffect(() => { document.title = 'Mon compte — ADispo' }, [])

  useEffect(() => {
    if (!authLoading && !user) navigate('/connexion', { replace: true, state: { from: '/compte' } })
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (emailError) requestAnimationFrame(() => emailErrorRef.current?.focus())
  }, [emailError])

  useEffect(() => {
    if (emailSuccess) requestAnimationFrame(() => emailSuccessRef.current?.focus())
  }, [emailSuccess])

  useEffect(() => {
    if (passwordError) requestAnimationFrame(() => passwordErrorRef.current?.focus())
  }, [passwordError])

  useEffect(() => {
    if (passwordSuccess) requestAnimationFrame(() => passwordSuccessRef.current?.focus())
  }, [passwordSuccess])

  const rules = PASSWORD_RULES.map((r) => ({ ...r, valid: r.test(newPassword) }))

  async function handleEmailChange(e) {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')
    if (!newEmail.trim()) {
      setEmailError('Veuillez saisir une adresse e-mail.')
      return
    }
    setEmailSubmitting(true)
    const { error } = await updateEmail(newEmail.trim())
    setEmailSubmitting(false)
    if (error) {
      setEmailError('Une erreur est survenue. Veuillez réessayer.')
      return
    }
    setEmailSuccess(`Un email de confirmation a été envoyé à ${newEmail.trim()}.`)
    announce('Email de confirmation envoyé.')
    setNewEmail('')
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.')
      return
    }
    if (rules.some((r) => !r.valid)) {
      setPasswordError('Le mot de passe ne respecte pas toutes les exigences.')
      return
    }
    setPasswordSubmitting(true)
    const { error } = await updatePassword(newPassword)
    setPasswordSubmitting(false)
    if (error) {
      setPasswordError('Une erreur est survenue. Veuillez réessayer.')
      return
    }
    setPasswordSuccess('Votre mot de passe a été modifié.')
    announce('Mot de passe modifié.')
    setNewPassword('')
    setConfirmPassword('')
  }

  if (authLoading) {
    return <p className="text-base text-gray-700 dark:text-gray-300">Chargement…</p>
  }

  if (!user) return null

  return (
    <>
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
      >
        ← Retour
      </button>

      <h2 className="text-2xl font-bold mb-8">Mon compte</h2>

      <p className="text-sm text-gray-700 dark:text-gray-300 mb-8">
        Connecté en tant que <strong>{user.email}</strong>
      </p>

      {/* Change email */}
      <section aria-labelledby="email-section-title" className="mb-12">
        <h3 id="email-section-title" className="text-xl font-bold mb-4">
          Modifier mon adresse e-mail
        </h3>

        <Alert type="error" message={emailError} refProp={emailErrorRef} />
        <Alert type="success" message={emailSuccess} refProp={emailSuccessRef} />

        <form onSubmit={handleEmailChange} noValidate>
          <div className="mb-4">
            <label htmlFor="new-email" className="block mb-2 font-medium">
              Nouvelle adresse e-mail
            </label>
            <input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              autoComplete="email"
              required
              className={inputClass}
            />
          </div>
          <button type="submit" disabled={emailSubmitting} className={btnPrimaryClass}>
            {emailSubmitting ? 'Envoi…' : 'Modifier l\'adresse e-mail'}
          </button>
        </form>
      </section>

      {/* Change password */}
      <section aria-labelledby="password-section-title" className="mb-12">
        <h3 id="password-section-title" className="text-xl font-bold mb-4">
          Modifier mon mot de passe
        </h3>

        <Alert type="error" message={passwordError} refProp={passwordErrorRef} />
        <Alert type="success" message={passwordSuccess} refProp={passwordSuccessRef} />

        <form onSubmit={handlePasswordChange} noValidate>
          <div className="mb-2">
            <label htmlFor="new-password" className="block mb-2 font-medium">
              Nouveau mot de passe
            </label>
            <div className="flex gap-2 items-start">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                aria-describedby="new-password-requirements"
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-pressed={showPassword}
                className={btnSecondaryClass}
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </button>
            </div>
          </div>

          <ul
            id="new-password-requirements"
            aria-label="Exigences du mot de passe"
            className="mb-4 space-y-1 text-sm"
          >
            {rules.map((r) => (
              <li
                key={r.id}
                className={r.valid ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}
              >
                <span aria-hidden="true">{r.valid ? '✓' : '○'} </span>
                <span className="sr-only">{r.valid ? 'Validé : ' : 'Requis : '}</span>
                {r.label}
              </li>
            ))}
          </ul>

          <div className="mb-6">
            <label htmlFor="confirm-new-password" className="block mb-2 font-medium">
              Confirmer le nouveau mot de passe
            </label>
            <input
              id="confirm-new-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              className={inputClass}
            />
          </div>

          <button type="submit" disabled={passwordSubmitting} className={btnPrimaryClass}>
            {passwordSubmitting ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
        </form>
      </section>
    </>
  )
}
