import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verifyOtp } from '../lib/supabase.js'

export default function ActivationPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('pending')
  const [errorMsg, setErrorMsg] = useState('')
  const statusRef = useRef(null)

  useEffect(() => {
    document.title = 'Activation du compte — ADispo'
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (!tokenHash || !type) {
      setStatus('error')
      setErrorMsg("Ce lien d'activation est invalide.")
      return
    }

    verifyOtp(tokenHash, type).then(({ error }) => {
      if (error) {
        setStatus('error')
        setErrorMsg('Ce lien est invalide ou a expiré. Veuillez recréer un compte.')
      } else {
        setStatus('success')
      }
      requestAnimationFrame(() => statusRef.current?.focus())
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const linkClass = 'font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white'

  return (
    <section aria-labelledby="activation-title">
      <h2 id="activation-title" className="text-2xl font-bold mb-6">
        Activation du compte
      </h2>

      {status === 'pending' && (
        <p className="text-base text-gray-700 dark:text-gray-300">
          Vérification en cours…
        </p>
      )}

      {status === 'success' && (
        <p
          ref={statusRef}
          role="status"
          tabIndex={-1}
          className="text-base focus-visible:outline-none"
        >
          Votre compte est activé.{' '}
          <Link to="/connexion" className={linkClass}>
            Se connecter
          </Link>
        </p>
      )}

      {status === 'error' && (
        <p
          ref={statusRef}
          role="alert"
          tabIndex={-1}
          className="text-base text-red-700 dark:text-red-400 focus-visible:outline-none"
        >
          {errorMsg}
        </p>
      )}
    </section>
  )
}
