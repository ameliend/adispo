// Enrichit les contenus sans métadonnées TMDB (poster, year, genre, synopsis)
// Appeler en boucle : GET /api/enrich?secret=SEED_SECRET
// S'arrête quand remaining=0

import { createClient } from '@supabase/supabase-js'

const GENRE_MAP = {
  28: 'Action', 12: 'Aventure', 16: 'Animation', 35: 'Comédie',
  80: 'Crime', 99: 'Documentaire', 18: 'Drame', 10751: 'Famille',
  14: 'Fantastique', 36: 'Histoire', 27: 'Horreur', 10402: 'Musique',
  9648: 'Mystère', 10749: 'Romance', 878: 'Science-Fiction',
  10770: 'Téléfilm', 53: 'Thriller', 10752: 'Guerre', 37: 'Western',
}

async function searchTmdb(title, apiKey) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=fr-FR`
  )
  if (!res.ok) return null
  const json = await res.json()
  return (json.results || []).find(r => r.media_type === 'movie' || r.media_type === 'tv') || null
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

  // Récupère 5 contenus sans poster
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
      // Marque avec une valeur vide pour ne pas le retraiter indéfiniment
      await supabase.from('contents').update({ poster_path: '' }).eq('id', content.id)
      results.push({ title: content.title, status: 'introuvable sur TMDB' })
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
      status: updateError ? `erreur: ${updateError.message}` : '✓ enrichi',
      year: update.year,
      type: update.type,
    })

    await new Promise(r => setTimeout(r, 250))
  }

  // Compte combien il en reste
  const { count } = await supabase
    .from('contents')
    .select('id', { count: 'exact', head: true })
    .is('poster_path', null)

  return res.status(200).json({ processed: results.length, remaining: count, results })
}
