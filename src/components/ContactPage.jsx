import { useEffect, useRef } from 'react'

export default function ContactPage() {
  const titleRef = useRef(null)

  useEffect(() => {
    document.title = 'Contact — ADispo'
    titleRef.current?.focus()
  }, [])

  return (
    <section aria-labelledby="contact-title">
      <h2
        id="contact-title"
        ref={titleRef}
        tabIndex={-1}
        className="text-2xl font-bold mb-6 focus-visible:outline-none"
      >
        Contact
      </h2>

      <p className="text-base text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
        Ce site est développé par <strong>Amélien Delahaie</strong>.
      </p>

      <p className="text-base text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
        Pour toute question, suggestion, ou pour tester les fonctionnalités en cours
        de développement (comme la recherche vocale par IA), écrivez-moi à :
      </p>

      <p className="text-base mb-8">
        <a
          href="mailto:amelien.delahaie@gmail.com"
          className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
        >
          amelien.delahaie@gmail.com
        </a>
      </p>
    </section>
  )
}
