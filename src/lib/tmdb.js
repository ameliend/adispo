const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92'

function apiKey() {
  return import.meta.env.VITE_TMDB_API_KEY
}

function mapResult(r) {
  return {
    tmdbId: r.id,
    title: r.title || r.name || '',
    year: (r.release_date || r.first_air_date || '').slice(0, 4),
    type: r.media_type,
    posterPath: r.poster_path ? `${TMDB_IMAGE_BASE}${r.poster_path}` : null,
    genreIds: r.genre_ids || [],
  }
}

export async function searchTmdb(query) {
  if (!query || !query.trim()) return { data: [], error: null }

  try {
    const params = new URLSearchParams({
      api_key: apiKey(),
      query: query.trim(),
      language: 'fr-FR',
      include_adult: 'false',
      page: '1',
    })

    const res = await fetch(`${TMDB_BASE}/search/multi?${params}`)

    if (!res.ok) {
      return { data: null, error: new Error(`TMDB error: ${res.status}`) }
    }

    const json = await res.json()
    const data = (json.results || [])
      .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
      .slice(0, 10)
      .map(mapResult)

    return { data, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function getTmdbDetails(tmdbId, mediaType) {
  try {
    const endpoint = mediaType === 'tv' ? 'tv' : 'movie'
    const params = new URLSearchParams({
      api_key: apiKey(),
      language: 'fr-FR',
    })

    const res = await fetch(`${TMDB_BASE}/${endpoint}/${tmdbId}?${params}`)

    if (!res.ok) {
      return { data: null, error: new Error(`TMDB error: ${res.status}`) }
    }

    const r = await res.json()
    const data = {
      tmdbId: r.id,
      title: r.title || r.name || '',
      year: (r.release_date || r.first_air_date || '').slice(0, 4),
      type: mediaType,
      genre:
        r.genres && r.genres.length > 0 ? r.genres.map((g) => g.name).join(', ') : null,
      posterPath: r.poster_path ? `${TMDB_IMAGE_BASE}${r.poster_path}` : null,
      overview: r.overview || '',
    }

    return { data, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}
