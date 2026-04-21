// Enrichit les contenus sans métadonnées TMDB (poster, year, genre, synopsis)
// Appeler en boucle : GET /api/enrich?secret=SEED_SECRET
// Reset données corrompues : GET /api/enrich?secret=SEED_SECRET&reset=1

import { createClient } from '@supabase/supabase-js'

const GENRE_MAP = {
  28: 'Action', 12: 'Aventure', 16: 'Animation', 35: 'Comédie',
  80: 'Crime', 99: 'Documentaire', 18: 'Drame', 10751: 'Famille',
  14: 'Fantastique', 36: 'Histoire', 27: 'Horreur', 10402: 'Musique',
  9648: 'Mystère', 10749: 'Romance', 878: 'Science-Fiction',
  10770: 'Téléfilm', 53: 'Thriller', 10752: 'Guerre', 37: 'Western',
}

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function titlesMatch(searchTitle, tmdbTitle) {
  const a = normalize(searchTitle)
  const b = normalize(tmdbTitle)
  if (a === b) return true
  // Les mots significatifs (>3 lettres) du titre cherché doivent apparaître dans le résultat
  const words = a.split(/\s+/).filter(w => w.length > 3)
  if (words.length === 0) return a.includes(b) || b.includes(a)
  const matched = words.filter(w => b.includes(w))
  return matched.length / words.length >= 0.5
}

async function searchTmdb(title, apiKey) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=fr-FR`
  )
  if (!res.ok) return null
  const json = await res.json()
  const candidates = (json.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv')
  // Garde uniquement un résultat dont le titre correspond vraiment
  return candidates.find(r => titlesMatch(title, r.title || r.name)) || null
}

export default async function handler(req, res) {
  if (req.query.secret !== process.env.SEED_SECRET) {
    return res.status(401).json({ error: 'Non autorisé' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )
  const TMDB_KEY = process.env.VITE_TMDB_API_KEY

  // ?reset=1 : remet à NULL toutes les métadonnées pour repartir propre
  if (req.query.reset === '1') {
    const { error } = await supabase
      .from('contents')
      .update({ poster_path: null, synopsis: null, year: null, type: null, genre: null })
      .lt('tmdb_id', 0)
    return res.status(200).json({ reset: true, error: error?.message || null })
  }

  const { data: contents, error } = await supabase
    .from('contents')
    .select('id, title, tmdb_id')
    .is('poster_path', null)
    .limit(5)

  if (error) return res.status(500).json({ error: error.message })
  if (!contents || contents.length === 0) {
    return res.status(200).json({ done: true, message: 'Tous les contenus sont enrichis.' })
  }

  const results = []

  for (const content of contents) {
    const tmdb = await searchTmdb(content.title, TMDB_KEY)

    if (!tmdb) {
      await supabase.from('contents').update({ poster_path: '' }).eq('id', content.id)
      results.push({ title: content.title, status: 'introuvable ou titre non correspondant' })
      continue
    }

    const isMovie = tmdb.media_type === 'movie'
    const genreId = (tmdb.genre_ids || [])[0]
    const update = {
      year: isMovie
        ? (tmdb.release_date || '').slice(0, 4) || null
        : (tmdb.first_air_date || '').slice(0, 4) || null,
      type: isMovie ? 'movie' : 'tv',
      synopsis: tmdb.overview || null,
      poster_path: tmdb.poster_path || '',
      genre: genreId ? (GENRE_MAP[genreId] || null) : null,
    }

    const { error: updateError } = await supabase
      .from('contents')
      .update(update)
      .eq('id', content.id)

    results.push({
      title: content.title,
      tmdb_match: tmdb.title || tmdb.name,
      status: updateError ? `erreur: ${updateError.message}` : '✓ enrichi',
      year: update.year,
    })

    await new Promise(r => setTimeout(r, 250))
  }

  const { count } = await supabase
    .from('contents')
    .select('id', { count: 'exact', head: true })
    .is('poster_path', null)

  return res.status(200).json({ processed: results.length, remaining: count, results })
}
