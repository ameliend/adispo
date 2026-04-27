import { useEffect, useRef } from 'react'

const KOFI_USERNAME = import.meta.env.VITE_KOFI_USERNAME || 'adispo'

export default function SupportPage() {
  const titleRef = useRef(null)

  useEffect(() => {
    document.title = 'Soutenir le projet — ADispo'
    titleRef.current?.focus()
  }, [])

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

      <p className="text-base text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
        Vous pouvez soutenir le projet via Ko-fi, en choisissant librement le montant qui vous
        convient.
      </p>

      <a
        href={`https://ko-fi.com/${KOFI_USERNAME}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Soutenir ADispo sur Ko-fi (nouvel onglet)"
        className="inline-flex items-center px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-semibold rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
      >
        Soutenir sur Ko-fi ↗
      </a>
    </section>
  )
}
