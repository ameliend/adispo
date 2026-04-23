import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom'
import { signIn, signUp } from '../lib/supabase.js'

const PASSWORD_RULES = [
  { id: 'len',     test: (p) => p.length >= 8,          label: '8 caractères minimum' },
  { id: 'upper',   test: (p) => /[A-Z]/.test(p),        label: 'Une lettre majuscule' },
  { id: 'lower',   test: (p) => /[a-z]/.test(p),        label: 'Une lettre minuscule' },
  { id: 'digit',   test: (p) => /[0-9]/.test(p),        label: 'Un chiffre' },
  { id: 'special', test: (p) => /[^A-Za-z0-9]/.test(p), label: 'Un caractère spécial' },
]

const ERROR_MAP = {
  'Invalid login credentials':  'Email ou mot de passe incorrect.',
  'Email not confirmed':        'Veuillez confirmer votre email avant de vous connecter.',
  'User already registered':    'Un compte existe déjà avec cet email.',
}

function friendlyError(msg) {
  return ERROR_MAP[msg] || 'Une erreur est survenue. Veuillez réessayer.'
}

const inputClass = 'w-full px-4 py-3 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-base focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white'
const btnPrimaryClass = 'px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-medium rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed'
const btnSecondaryClass = 'px-3 py-2 min-h-touch text-sm border-2 border-black dark:border-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white whitespace-nowrap'

export default function AuthPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, announce } = useOutletContext()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const errorRef = useRef(null)
  const successRef = useRef(null)
  const titleRef = useRef(null)

  const from = location.state?.from ?? '/'

  useEffect(() => {
    document.title = mode === 'login' ? 'Connexion — ADispo' : 'Créer un compte — ADispo'
  }, [mode])

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (errorMsg) requestAnimationFrame(() => errorRef.current?.focus())
  }, [errorMsg])

  useEffect(() => {
    if (successMsg) requestAnimationFrame(() => successRef.current?.focus())
  }, [successMsg])

  function switchMode(newMode) {
    setMode(newMode)
    setErrorMsg('')
    setSuccessMsg('')
    setPassword('')
    setConfirmPassword('')
    requestAnimationFrame(() => titleRef.current?.focus())
  }

  const rules = PASSWORD_RULES.map((r) => ({ ...r, valid: r.test(password) }))

  async function handleLogin(e) {
    e.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)
    const { error } = await signIn(email, password)
    setIsSubmitting(false)
    if (error) setErrorMsg(friendlyError(error.message))
  }

  async function handleSignup(e) {
    e.preventDefault()
    setErrorMsg('')
    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.')
      return
    }
    if (rules.some((r) => !r.valid)) {
      setErrorMsg('Le mot de passe ne respecte pas toutes les exigences.')
      return
    }
    setIsSubmitting(true)
    const { error } = await signUp(email, password)
    setIsSubmitting(false)
    if (error) {
      setErrorMsg(friendlyError(error.message))
      return
    }
    setSuccessMsg(`Un email de confirmation a été envoyé à ${email}. Vérifiez votre boîte de réception.`)
    announce('Email de confirmation envoyé.')
  }

  if (mode === 'signup') {
    return (
      <section aria-labelledby="auth-title">
        <button
          onClick={() => switchMode('login')}
          className="mb-6 text-sm font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
        >
          ← Retour à la connexion
        </button>

        <h2
          id="auth-title"
          ref={titleRef}
          tabIndex={-1}
          className="text-2xl font-bold mb-6 focus-visible:outline-none"
        >
          Créer un compte
        </h2>

        {successMsg ? (
          <p
            ref={successRef}
            role="status"
            tabIndex={-1}
            className="p-4 bg-green-50 dark:bg-green-950 border border-green-700 rounded text-green-900 dark:text-green-100 focus-visible:outline-none"
          >
            {successMsg}
          </p>
        ) : (
          <>
            {errorMsg && (
              <p
                ref={errorRef}
                role="alert"
                tabIndex={-1}
                className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-700 rounded text-red-900 dark:text-red-100 text-sm focus-visible:outline-none"
              >
                {errorMsg}
              </p>
            )}
            <form onSubmit={handleSignup} noValidate>
              <div className="mb-4">
                <label htmlFor="signup-email" className="block mb-2 font-medium">
                  Adresse e-mail
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className={inputClass}
                />
              </div>
              <div className="mb-2">
                <label htmlFor="signup-password" className="block mb-2 font-medium">
                  Mot de passe
                </label>
                <div className="flex gap-2 items-start">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    aria-describedby="password-requirements"
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
                id="password-requirements"
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
                <label htmlFor="signup-confirm" className="block mb-2 font-medium">
                  Confirmer le mot de passe
                </label>
                <input
                  id="signup-confirm"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className={inputClass}
                />
              </div>

              <button type="submit" disabled={isSubmitting} className={btnPrimaryClass}>
                {isSubmitting ? 'Création en cours…' : 'Créer un compte'}
              </button>
            </form>
          </>
        )}
      </section>
    )
  }

  return (
    <section aria-labelledby="auth-title">
      <h2
        id="auth-title"
        ref={titleRef}
        tabIndex={-1}
        className="text-2xl font-bold mb-4 focus-visible:outline-none"
      >
        Se connecter
      </h2>

      <p className="text-base text-gray-700 dark:text-gray-300 mb-6">
        Connectez-vous avec votre identifiant et votre mot de passe.{' '}
        Vous n'avez pas encore de compte ?{' '}
        <button
          onClick={() => switchMode('signup')}
          className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
        >
          Créer mon compte
        </button>
      </p>

      {errorMsg && (
        <p
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-700 rounded text-red-900 dark:text-red-100 text-sm focus-visible:outline-none"
        >
          {errorMsg}
        </p>
      )}

      <form onSubmit={handleLogin} noValidate>
        <div className="mb-4">
          <label htmlFor="login-email" className="block mb-2 font-medium">
            Adresse e-mail
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className={inputClass}
          />
        </div>
        <div className="mb-6">
          <label htmlFor="login-password" className="block mb-2 font-medium">
            Mot de passe
          </label>
          <div className="flex gap-2 items-start">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
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
        <button type="submit" disabled={isSubmitting} className={btnPrimaryClass}>
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </section>
  )
}
