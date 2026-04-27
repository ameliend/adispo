import { useEffect, useRef, useState, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { supabase } from '../lib/supabase.js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

const PRESETS = [
  { label: '2 €', cents: 200 },
  { label: '5 €', cents: 500 },
  { label: '15 €', cents: 1500 },
]

function CheckoutForm({ amountCents, onSuccess, onCancel }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsSubmitting(true)
    setErrorMsg('')

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMsg(error.message ?? 'Une erreur est survenue.')
      setIsSubmitting(false)
    } else {
      onSuccess()
    }
  }, [stripe, elements, onSuccess])

  const euros = (amountCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Formulaire de paiement">
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-semibold mb-4 focus-visible:outline-none"
      >
        Soutenir avec {euros}
      </h3>

      <div className="mb-6">
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: { billingDetails: { name: 'auto' } },
          }}
        />
      </div>

      {errorMsg && (
        <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-400">
          {errorMsg}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={!stripe || isSubmitting}
          aria-disabled={!stripe || isSubmitting}
          className="flex-1 px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-semibold rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Traitement…' : `Confirmer ${euros}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 min-h-touch border-2 border-black dark:border-white font-semibold rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

export default function SupportPage() {
  const titleRef = useRef(null)
  const [selectedCents, setSelectedCents] = useState(null)
  const [customEuros, setCustomEuros] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [loadingIntent, setLoadingIntent] = useState(false)
  const [intentError, setIntentError] = useState('')
  const [success, setSuccess] = useState(false)
  const customInputRef = useRef(null)

  useEffect(() => {
    document.title = 'Soutenir le projet — ADispo'
    titleRef.current?.focus()
  }, [])

  const activeCents = selectedCents !== null
    ? selectedCents
    : customEuros
      ? Math.round(parseFloat(customEuros.replace(',', '.')) * 100)
      : null

  async function handleProceed() {
    if (!activeCents || activeCents < 100) return
    setLoadingIntent(true)
    setIntentError('')

    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { amount: activeCents },
    })

    if (error || !data?.clientSecret) {
      setIntentError('Impossible de démarrer le paiement. Veuillez réessayer.')
      setLoadingIntent(false)
      return
    }

    setClientSecret(data.clientSecret)
    setLoadingIntent(false)
  }

  function handleCancel() {
    setClientSecret('')
    setIntentError('')
  }

  function handleSuccess() {
    setSuccess(true)
    setClientSecret('')
    titleRef.current?.focus()
  }

  const customInputId = 'support-custom-amount'

  if (success) {
    return (
      <section aria-labelledby="support-title">
        <h2
          id="support-title"
          ref={titleRef}
          tabIndex={-1}
          className="text-2xl font-bold mb-6 focus-visible:outline-none"
        >
          Merci pour votre soutien !
        </h2>
        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          Votre contribution a bien été reçue. Elle permet de maintenir et d'améliorer ADispo pour
          toute la communauté. Merci beaucoup.
        </p>
      </section>
    )
  }

  return (
    <section aria-labelledby="support-title">
      <h2
        id="support-title"
        ref={titleRef}
        tabIndex={-1}
        className="text-2xl font-bold mb-6 focus-visible:outline-none"
      >
        Soutenir ce projet
      </h2>

      <p className="text-base text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
        ADispo est un service indépendant et gratuit, développé bénévolement pour rendre les
        films et séries accessibles aux personnes aveugles ou malvoyantes. Votre soutien permet
        de maintenir le service, d'améliorer ses fonctionnalités, d'enrichir le catalogue et
        d'envisager une application disponible sur les stores iOS et Android. Chaque contribution
        compte et fait une vraie différence.
      </p>

      {!clientSecret ? (
        <>
          <fieldset className="mb-6">
            <legend className="text-base font-semibold mb-3">Choisissez un montant</legend>

            <div className="flex flex-wrap gap-3 mb-4" role="group" aria-label="Montants prédéfinis">
              {PRESETS.map(({ label, cents }) => (
                <button
                  key={cents}
                  type="button"
                  onClick={() => { setSelectedCents(cents); setCustomEuros('') }}
                  aria-pressed={selectedCents === cents && !customEuros}
                  className={[
                    'px-6 py-3 min-h-touch font-semibold rounded border-2 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white',
                    selectedCents === cents && !customEuros
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                      : 'border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor={customInputId} className="block text-sm font-medium mb-1">
                Autre montant (€)
              </label>
              <input
                id={customInputId}
                ref={customInputRef}
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                placeholder="Ex : 10"
                value={customEuros}
                onChange={(e) => { setCustomEuros(e.target.value); setSelectedCents(null) }}
                className="w-40 px-4 py-2 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-black focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
              />
            </div>
          </fieldset>

          {intentError && (
            <p role="alert" className="mb-4 text-sm text-red-700 dark:text-red-400">
              {intentError}
            </p>
          )}

          <button
            type="button"
            onClick={handleProceed}
            disabled={!activeCents || activeCents < 100 || loadingIntent}
            aria-disabled={!activeCents || activeCents < 100 || loadingIntent}
            aria-describedby={!activeCents ? 'support-amount-hint' : undefined}
            className="inline-flex items-center px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-semibold rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingIntent ? 'Chargement…' : 'Procéder au paiement'}
          </button>
          {!activeCents && (
            <p id="support-amount-hint" className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Veuillez choisir ou saisir un montant pour continuer.
            </p>
          )}
        </>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            locale: 'fr',
            appearance: {
              theme: 'stripe',
              variables: {
                fontFamily: 'Archivo, sans-serif',
                borderRadius: '4px',
              },
            },
          }}
        >
          <CheckoutForm
            amountCents={activeCents}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Elements>
      )}
    </section>
  )
}
