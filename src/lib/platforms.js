export const PLATFORMS = [
  { value: 'canal', label: 'CANAL+' },
  { value: 'netflix', label: 'Netflix' },
  { value: 'disney', label: 'Disney+' },
  { value: 'prime', label: 'Prime Video' },
  { value: 'apple', label: 'Apple TV+' },
  { value: 'arte', label: 'Arte' },
  { value: 'tf1plus', label: 'TF1+' },
  { value: 'm6plus', label: 'M6+' },
  { value: 'hbomax', label: 'HBO Max' },
  { value: 'paramount', label: 'Paramount+' },
]

export const PLATFORM_LABELS = {
  canal: 'CANAL+',
  netflix: 'Netflix',
  disney: 'Disney+',
  prime: 'Prime Video',
  apple: 'Apple TV+',
  arte: 'Arte',
  tf1plus: 'TF1+',
  m6plus: 'M6+',
  hbomax: 'HBO Max',
  paramount: 'Paramount+',
  cineocs: 'CINÉ+OCS',
  m6: 'M6',
}

export function platformLabel(value) {
  return PLATFORM_LABELS[value] || value
}

export const PLATFORM_SEARCH_URLS = {
  canal:     { url: 'https://www.canalplus.com/', withQuery: false },
  netflix:   { url: 'https://www.netflix.com/search?q=', withQuery: true },
  disney:    { url: 'https://www.disneyplus.com/search/', withQuery: false },
  prime:     { url: 'https://www.primevideo.com/search/ref=atv_nb_sr?phrase=', withQuery: true },
  apple:     { url: 'https://tv.apple.com/fr', withQuery: false },
  arte:      { url: 'https://www.arte.tv/fr/search/?q=', withQuery: true },
  tf1plus:   { url: 'https://www.tf1plus.fr/', withQuery: false },
  m6plus:    { url: 'https://www.m6plus.fr/', withQuery: false },
  hbomax:    { url: 'https://www.max.com/fr/fr', withQuery: false },
  paramount: { url: 'https://www.paramountplus.com/fr/', withQuery: false },
}
