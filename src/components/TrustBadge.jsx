export function getTrustLevel(validationCount) {
  if (!validationCount || validationCount < 1) return null
  if (validationCount === 1) return 'Signalé'
  if (validationCount <= 4) return 'Confirmé'
  return 'Fiable'
}

export function getTrustProgress(validationCount) {
  if (!validationCount || validationCount < 1) return 0
  return Math.min(100, Math.round((validationCount / 5) * 100))
}

const LEVEL_STYLES = {
  Signalé: 'bg-yellow-100 text-black',
  Confirmé: 'bg-blue-700 text-white',
  Fiable: 'bg-green-700 text-white',
}

export default function TrustBadge({ validationCount }) {
  const level = getTrustLevel(validationCount)

  if (!level) return null

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${LEVEL_STYLES[level]}`}
      aria-label={`Niveau de confiance : ${level} (${validationCount} validation${validationCount > 1 ? 's' : ''})`}
    >
      {level}
    </span>
  )
}
