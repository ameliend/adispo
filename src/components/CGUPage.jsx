import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export default function CGUPage() {
  const titleRef = useRef(null)

  useEffect(() => {
    document.title = "Conditions générales d'utilisation — ADispo"
    titleRef.current?.focus()
  }, [])

  return (
    <section aria-labelledby="cgu-title">
      <h2
        id="cgu-title"
        ref={titleRef}
        tabIndex={-1}
        className="text-2xl font-bold mb-8 focus-visible:outline-none"
      >
        Conditions générales d'utilisation
      </h2>

      <div className="space-y-8 text-base text-gray-700 dark:text-gray-300 leading-relaxed">

        <section aria-labelledby="cgu-objet">
          <h3 id="cgu-objet" className="text-lg font-semibold text-black dark:text-white mb-3">
            1. Objet et champ d'application
          </h3>
          <p>
            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et
            l'utilisation du service ADispo, plateforme d'information concernant la
            disponibilité de l'audiodescription sur les plateformes de streaming.
          </p>
          <p className="mt-2">
            En accédant au service, vous acceptez sans réserve les termes des présentes CGU.
            Si vous n'acceptez pas ces conditions, veuillez cesser l'utilisation d'ADispo.
          </p>
        </section>

        <section aria-labelledby="cgu-acces">
          <h3 id="cgu-acces" className="text-lg font-semibold text-black dark:text-white mb-3">
            2. Accès et inscription
          </h3>
          <p>
            ADispo est accessible gratuitement et sans restriction d'accès (accès libre).
            Une inscription facultative permet de bénéficier de fonctionnalités
            supplémentaires. Lors de l'inscription, vous acceptez de fournir des
            informations exactes et à jour.
          </p>
          <p className="mt-2">
            Vous êtes seul responsable de la confidentialité de vos identifiants. Vous vous
            engagez à ne pas partager votre compte avec des tiers.
          </p>
        </section>

        <section aria-labelledby="cgu-utilisation">
          <h3 id="cgu-utilisation" className="text-lg font-semibold text-black dark:text-white mb-3">
            3. Utilisation acceptable
          </h3>
          <p className="mb-2">
            Vous vous engagez à utiliser ADispo conformément à la loi et aux bonnes mœurs.
            Vous vous interdisez notamment de :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Utiliser le service à des fins illicites ou frauduleuses</li>
            <li>Accéder à la plateforme par des moyens autres que ceux mis à disposition par ADispo</li>
            <li>Reproduire, copier ou exploiter les contenus sans autorisation</li>
            <li>Effectuer du scraping automatisé, du crawling ou du data mining (sauf autorisation explicite)</li>
            <li>Introduire des virus, malwares ou codes nuisibles</li>
            <li>Surcharger ou perturber le fonctionnement du service</li>
          </ul>
        </section>

        <section aria-labelledby="cgu-contenu">
          <h3 id="cgu-contenu" className="text-lg font-semibold text-black dark:text-white mb-3">
            4. Contenu utilisateur
          </h3>
          <p>
            ADispo ne héberge pas de contenu généré par les utilisateurs. Toute interaction
            se limite à l'utilisation des fonctionnalités prévues du service.
          </p>
        </section>

        <section aria-labelledby="cgu-donnees">
          <h3 id="cgu-donnees" className="text-lg font-semibold text-black dark:text-white mb-3">
            5. Données personnelles et RGPD
          </h3>
          <p>
            ADispo traite vos données personnelles conformément au Règlement Général sur la
            Protection des Données (RGPD) et à la Loi Informatique et Libertés. Consultez
            la rubrique « Données collectées et conservation » des{' '}
            <Link
              to="/mentions-legales"
              className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              Mentions légales
            </Link>{' '}
            pour plus de détails.
          </p>
          <p className="mt-2">
            Vous disposez d'un droit d'accès, de rectification, d'effacement et de
            portabilité sur vos données. Pour exercer ces droits, contactez :{' '}
            <a
              href="mailto:amelien.delahaie@gmail.com"
              className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              amelien.delahaie@gmail.com
            </a>
          </p>
        </section>

        <section aria-labelledby="cgu-propriete">
          <h3 id="cgu-propriete" className="text-lg font-semibold text-black dark:text-white mb-3">
            6. Propriété intellectuelle
          </h3>
          <p>
            Le design, le code source et l'interface d'ADispo sont la propriété exclusive
            du développeur. Aucune licence d'utilisation n'est accordée aux utilisateurs
            sauf celle de lire et d'utiliser le service à titre personnel et non commercial.
          </p>
          <p className="mt-2">
            Les informations affichées relatives aux contenus (titres, synopsis) sont la
            propriété de leurs propriétaires respectifs. ADispo les affiche à titre
            informatif uniquement.
          </p>
        </section>

        <section aria-labelledby="cgu-responsabilite">
          <h3 id="cgu-responsabilite" className="text-lg font-semibold text-black dark:text-white mb-3">
            7. Limitation de responsabilité
          </h3>
          <p className="mb-2">
            ADispo est fourni « en l'état » sans aucune garantie. Le responsable du service
            décline toute responsabilité pour :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>L'exactitude, la complétude ou la pertinence des informations</li>
            <li>Les interruptions, erreurs ou bugs du service</li>
            <li>Les dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service</li>
            <li>L'accès non autorisé à vos données ou compte</li>
          </ul>
        </section>

        <section aria-labelledby="cgu-resiliation">
          <h3 id="cgu-resiliation" className="text-lg font-semibold text-black dark:text-white mb-3">
            8. Résiliation et suspension
          </h3>
          <p>
            Vous pouvez cesser l'utilisation d'ADispo à tout moment. Votre compte reste
            actif jusqu'à suppression manuelle ou automatique (après 24 mois d'inactivité).
          </p>
          <p className="mt-2">
            Le responsable du service se réserve le droit de suspendre ou fermer un compte
            en cas de violation des présentes CGU.
          </p>
        </section>

        <section aria-labelledby="cgu-modifications">
          <h3 id="cgu-modifications" className="text-lg font-semibold text-black dark:text-white mb-3">
            9. Modification du service et des CGU
          </h3>
          <p>
            ADispo peut être modifié, amélioré ou interrompu à tout moment sans préavis.
            Les CGU peuvent être mises à jour à tout moment. Votre utilisation continue
            implique l'acceptation des nouvelles conditions.
          </p>
        </section>

        <section aria-labelledby="cgu-contact">
          <h3 id="cgu-contact" className="text-lg font-semibold text-black dark:text-white mb-3">
            10. Contact et support
          </h3>
          <p>
            Pour toute question, suggestion ou problème, contactez :{' '}
            <a
              href="mailto:amelien.delahaie@gmail.com"
              className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              amelien.delahaie@gmail.com
            </a>
          </p>
        </section>

        <section aria-labelledby="cgu-loi">
          <h3 id="cgu-loi" className="text-lg font-semibold text-black dark:text-white mb-3">
            11. Loi applicable
          </h3>
          <p>
            Les présentes CGU sont régies par le droit français. Tout litige sera soumis
            aux juridictions compétentes de Paris, France.
          </p>
        </section>

        <p className="text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
          Date de dernière mise à jour : mai 2026
        </p>

      </div>
    </section>
  )
}
