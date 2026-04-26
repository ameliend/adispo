export const PLATFORMS = [
  { value: 'canal', label: 'CANAL+' },
  { value: 'netflix', label: 'Netflix' },
  { value: 'disney', label: 'Disney+' },
  { value: 'prime', label: 'Prime Video' },
  { value: 'apple', label: 'Apple TV+' },
]

export const PLATFORM_LABELS = {
  canal: 'CANAL+',
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

export const PLATFORM_SEARCH_URLS = {
  canal: 'https://www.canalplus.com/recherche/?q=',
  netflix: 'https://www.netflix.com/search?q=',
  disney: 'https://www.disneyplus.com/search/',
  prime: 'https://www.primevideo.com/search/ref=atv_nb_sr?phrase=',
  apple: 'https://tv.apple.com/search?term=',
}
