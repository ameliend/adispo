// Route temporaire — À SUPPRIMER après usage
// Appeler une seule fois : GET https://votre-app.vercel.app/api/seed?secret=SEED_SECRET

import { createClient } from '@supabase/supabase-js'

const PLATFORM_MAP = {
  'CANAL+': 'canal', 'Canal+': 'canal', 'canal+': 'canal', 'canal': 'canal',
  'Netflix': 'netflix', 'NETFLIX': 'netflix', 'netflix': 'netflix',
  'Disney+': 'disney', 'DISNEY+': 'disney', 'disney': 'disney',
  'Prime Video': 'prime', 'prime video': 'prime', 'prime': 'prime',
  'Apple TV+': 'apple', 'apple tv+': 'apple', 'apple': 'apple',
}

async function searchTmdb(title, apiKey) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=fr-FR`
  )
  if (!res.ok) return null
  const json = await res.json()
  const results = (json.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv')
  return results[0] || null
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

  // Collez ici votre tableau JSON complet
  const entries = [
    {
      "title": "Jurassic World : Renaissance",
      "platform": "CANAL+",
      "status": "available",
      "link": "https://www.canalplus.com/cinema/jurassic-world-renaissance/h/29507057_50001",
      "trust_level": "fiable",
      "validation_count": 5
    }
    // ... ajoutez le reste de vos entrées ici
  ]

  const results = []

  for (const entry of entries) {
    const platform = PLATFORM_MAP[entry.platform]
    if (!platform) {
      results.push({ title: entry.title, status: 'plateforme inconnue' })
      continue
    }

    const tmdb = await searchTmdb(entry.title, TMDB_KEY)
    if (!tmdb) {
      results.push({ title: entry.title, status: 'introuvable sur TMDB' })
      continue
    }

    const isMovie = tmdb.media_type === 'movie'
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .upsert({
        tmdb_id: String(tmdb.id),
        title: tmdb.title || tmdb.name || entry.title,
        year: isMovie ? (tmdb.release_date || '').slice(0, 4) || null : (tmdb.first_air_date || '').slice(0, 4) || null,
        type: isMovie ? 'movie' : 'tv',
        synopsis: tmdb.overview || null,
        poster_path: tmdb.poster_path || null,
      }, { onConflict: 'tmdb_id' })
      .select()
      .single()

    if (contentError) {
      results.push({ title: entry.title, status: `erreur: ${contentError.message}` })
      continue
    }

    const { error: adError } = await supabase
      .from('ad_status')
      .upsert({
        content_id: content.id,
        platform,
        status: entry.status || 'available',
        trust_level: entry.trust_level || 'Signalé',
        validation_count: entry.validation_count || 1,
        lien: entry.link || null,
      }, { onConflict: 'content_id,platform' })

    results.push({ title: entry.title, status: adError ? `erreur: ${adError.message}` : '✓ inséré' })

    await new Promise(r => setTimeout(r, 300))
  }

  return res.status(200).json({ results })
}
