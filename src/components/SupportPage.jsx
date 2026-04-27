import { useEffect, useRef } from 'react'

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
        ADispo est un service gratuit créé pour faciliter la découverte des films et ses séries
        en audiodescription. Votre soutien nous permet de faire vivre le service, d'innover,
        d'enrichir le catalogue… et de préparer l'arrivée d'une application sur iOS et Android.
        Chaque contribution rend la culture plus accessible.
      </p>

      <p className="text-base text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
        Vous pouvez soutenir le projet via Buy Me a Coffee, en choisissant librement le montant
        qui vous convient.
      </p>

      <a
        href="https://buymeacoffee.com/ameliend"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Soutenir ADispo sur Buy Me a Coffee (nouvel onglet)"
        className="inline-flex items-center px-6 py-3 min-h-touch bg-black dark:bg-white text-white dark:text-black font-semibold rounded hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
      >
        Soutenir sur Buy Me a Coffee ↗
      </a>
    </section>
  )
}
