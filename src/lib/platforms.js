export const PLATFORMS = [
  { value: 'canal', label: 'Canal+' },
  { value: 'netflix', label: 'Netflix' },
  { value: 'disney', label: 'Disney+' },
  { value: 'prime', label: 'Prime Video' },
  { value: 'apple', label: 'Apple TV+' },
]

export const PLATFORM_LABELS = {
  canal: 'Canal+',
  netflix: 'Netflix',
  disney: 'Disney+',
  prime: 'Prime Video',
  apple: 'Apple TV+',
  cineocs: 'CINÉ+OCS',
  m6: 'M6',
}

export function platformLabel(value) {
  return PLATFORM_LABELS[value] || value
}
