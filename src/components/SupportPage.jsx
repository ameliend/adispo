import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

const PRESET_AMOUNTS = [2, 5, 15]

export default function SupportPage() {
  const [searchParams] = useSearchParams()
  const isSuccess = searchParams.get('success') === 'true'
  const [selectedPreset, setSelectedPreset] = useState(5)
  const [customAmount, setCustomAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const titleRef = useRef(null)
  const errorRef = useRef(null)

  useEffect(() => {
    document.title = 'Soutenir le projet — ADispo'
    titleRef.current?.focus()
  }, [])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedPreset

  async function handleSubmit(e) {
    e.preventDefault()
    if (!finalAmount || finalAmount < 1) {
      setError("Veuillez entrer un montant d'au moins 1 €.")
      return
    }
    setIsLoading(true)
    setError('')
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: {
          amount: Math.round(finalAmount * 100),
          successUrl: `${window.location.origin}/soutenir?success=true`,
          cancelUrl: `${window.location.origin}/soutenir`,
        },
      })
      if (fnError || !data?.url) {
        setError('Une erreur est survenue. Veuillez réessayer.')
        setIsLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
      setIsLoading(false)
    }
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

      {isSuccess ? (
        <div className="p-5 border-2 border-green-700 rounded-lg bg-green-50 dark:bg-green-950">
          <p className="text-green-900 dark:text-green-100 font-medium text-base">
            Merci beaucoup pour votre soutien ! Votre contribution aide à maintenir et améliorer
            ADispo. 🙏
          </p>
        </div>
      ) : (
        <>
          <p className="text-base text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
            ADispo est un service indépendant et gratuit, développé bénévolement pour rendre les
            films et séries accessibles aux personnes aveugles ou malvoyantes. Votre soutien permet
            de maintenir le service, d'améliorer ses fonctionnalités, d'enrichir le catalogue et
            d'envisager une application disponible sur les stores iOS et Android. Chaque contribution
            compte et fait une vraie différence.
          </p>

          {error && (
            <p
              ref={errorRef}
              role="alert"
              tabIndex={-1}
              className="mb-6 p-3 bg-red-50 dark:bg-red-950 border border-red-700 rounded text-red-900 dark:text-red-100 text-sm focus-visible:outline-none"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <fieldset className="mb-6">
              <legend className="text-base font-semibold mb-3">Choisissez un montant</legend>
              <div className="flex flex-wrap gap-3">
                {PRESET_AMOUNTS.map((preset) => {
                  const isSelected = selectedPreset === preset && !customAmount
                  return (
                    <label
                      key={preset}
                      className={`flex items-center justify-center px-6 min-h-touch border-2 rounded font-semibold text-base cursor-pointer ${
                        isSelected
                          ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                          : 'border-gray-300 dark:border-gray-600 hover:border-black dark:hover:border-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="preset-amount"
                        value={preset}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedPreset(preset)
                          setCustomAmount('')
                        }}
                        className="sr-only"
                      />
                      {preset} €
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div className="mb-8">
              <label htmlFor="custom-amount" className="block mb-2 font-medium">
                Autre montant{' '}
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400">(en €)</span>
              </label>
              <input
                id="custom-amount"
                type="number"
                min="1"
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Ex. : 10"
                className="w-full max-w-xs px-3 py-2 min-h-touch border-2 border-black dark:border-white rounded bg-white dark:bg-gray-900 text-base focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !finalAmount || finalAmount < 1}
              className="px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-semibold rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? 'Redirection vers le paiement…'
                : `Soutenir avec ${finalAmount ? `${finalAmount} €` : '…'}`}
            </button>
          </form>
        </>
      )}
    </section>
  )
}
