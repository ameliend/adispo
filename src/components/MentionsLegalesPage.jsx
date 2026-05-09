import { useEffect, useRef } from 'react'

export default function MentionsLegalesPage() {
  const titleRef = useRef(null)

  useEffect(() => {
    document.title = 'Mentions légales — ADispo'
    titleRef.current?.focus()
  }, [])

  return (
    <section aria-labelledby="mentions-title">
      <h2
        id="mentions-title"
        ref={titleRef}
        tabIndex={-1}
        className="text-2xl font-bold mb-8 focus-visible:outline-none"
      >
        Mentions légales
      </h2>

      <div className="space-y-8 text-base text-gray-700 dark:text-gray-300 leading-relaxed">

        <section aria-labelledby="ml-editeur">
          <h3 id="ml-editeur" className="text-lg font-semibold text-black dark:text-white mb-3">
            1. Éditeur du site
          </h3>
          <p>Nom : Amélien Delahaie</p>
          <p>Qualité : Personne physique – Projet personnel</p>
          <p>
            Adresse email de contact :{' '}
            <a
              href="mailto:amelien.delahaie@gmail.com"
              className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              amelien.delahaie@gmail.com
            </a>
          </p>
          <p>Localisation : France</p>
        </section>

        <section aria-labelledby="ml-rgpd">
          <h3 id="ml-rgpd" className="text-lg font-semibold text-black dark:text-white mb-3">
            2. Responsable RGPD
          </h3>
          <p>
            En l'absence de délégué à la protection des données (DPO) formellement désigné,
            la responsabilité du traitement des données personnelles incombe au responsable
            du traitement : Amélien Delahaie.
          </p>
          <p className="mt-2">
            Pour toute question relative au traitement de vos données ou à l'exercice de
            vos droits RGPD, veuillez contacter :{' '}
            <a
              href="mailto:amelien.delahaie@gmail.com"
              className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              amelien.delahaie@gmail.com
            </a>
          </p>
        </section>

        <section aria-labelledby="ml-hebergement">
          <h3 id="ml-hebergement" className="text-lg font-semibold text-black dark:text-white mb-3">
            3. Hébergement et infrastructure
          </h3>
          <p>Frontend : Vercel Inc., 440 N Barranca Ave, Pasadena, CA 91107, États-Unis</p>
          <p>Base de données : Supabase (hébergée sur AWS, régions EU)</p>
        </section>

        <section aria-labelledby="ml-service">
          <h3 id="ml-service" className="text-lg font-semibold text-black dark:text-white mb-3">
            4. Description du service
          </h3>
          <p>
            ADispo est un service public gratuit conçu pour aider les utilisateurs en
            situation de handicap visuel à trouver la disponibilité de l'audiodescription
            sur les plateformes de streaming. Le service agrège et met à disposition des
            informations relatives à la disponibilité de l'audiodescription sur diverses
            plateformes (Netflix, Canal+, etc.).
          </p>
        </section>

        <section aria-labelledby="ml-donnees">
          <h3 id="ml-donnees" className="text-lg font-semibold text-black dark:text-white mb-3">
            5. Données collectées et conservation
          </h3>
          <p className="mb-2">Lors de l'utilisation d'ADispo, les données collectées incluent :</p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>Identifiants techniques (ID utilisateur)</li>
            <li>Adresse email (utilisée à des fins d'authentification uniquement)</li>
            <li>Pas de suivi analytique ou de cookies de traçage</li>
            <li>Pas de données sensibles au sens du RGPD</li>
          </ul>
          <p>
            Durée de conservation : Les comptes inactifs sont supprimés automatiquement
            après 24 mois d'inactivité.
          </p>
        </section>

        <section aria-labelledby="ml-droits">
          <h3 id="ml-droits" className="text-lg font-semibold text-black dark:text-white mb-3">
            6. Vos droits RGPD
          </h3>
          <p className="mb-2">
            Conformément au Règlement Général sur la Protection des Données (RGPD),
            vous disposez des droits suivants :
          </p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>Droit d'accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement (droit à l'oubli)</li>
            <li>Droit à la limitation du traitement</li>
            <li>Droit à la portabilité des données</li>
            <li>Droit d'opposition</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez :{' '}
            <a
              href="mailto:amelien.delahaie@gmail.com"
              className="font-medium underline hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 focus-visible:ring-black dark:focus-visible:ring-white"
            >
              amelien.delahaie@gmail.com
            </a>
          </p>
        </section>

        <section aria-labelledby="ml-responsabilite">
          <h3 id="ml-responsabilite" className="text-lg font-semibold text-black dark:text-white mb-3">
            7. Limitation de responsabilité
          </h3>
          <p className="mb-2">
            ADispo est fourni « en l'état ». Bien que tous les efforts soient faits pour
            assurer l'exactitude des informations, aucune garantie n'est fournie concernant :
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>L'exactitude ou la complétude des données affichées</li>
            <li>L'absence d'interruptions ou d'erreurs dans le service</li>
            <li>La compatibilité avec tous les appareils ou navigateurs</li>
          </ul>
        </section>

        <section aria-labelledby="ml-modifications">
          <h3 id="ml-modifications" className="text-lg font-semibold text-black dark:text-white mb-3">
            8. Modifications des mentions légales
          </h3>
          <p>
            Ces mentions légales peuvent être modifiées à tout moment. Les modifications
            entrent en vigueur dès leur publication sur ce site. Votre utilisation continue
            d'ADispo après modification implique votre acceptation des nouvelles conditions.
          </p>
        </section>

        <section aria-labelledby="ml-loi">
          <h3 id="ml-loi" className="text-lg font-semibold text-black dark:text-white mb-3">
            9. Loi applicable et juridiction
          </h3>
          <p>
            Ces mentions légales sont régies par le droit français. Tout litige sera soumis
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
