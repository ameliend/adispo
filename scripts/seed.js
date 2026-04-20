// Usage: node scripts/seed.js
// Requires: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_TMDB_API_KEY in .env

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { config } from 'dotenv'

config()

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY
const TMDB_KEY = process.env.VITE_TMDB_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !TMDB_KEY) {
  console.error('Manque VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY ou VITE_TMDB_API_KEY dans .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Normalise les noms de plateforme vers les valeurs internes
const PLATFORM_MAP = {
  'CANAL+': 'canal',
  'Canal+': 'canal',
  'canal+': 'canal',
  'canal': 'canal',
  'Netflix': 'netflix',
  'NETFLIX': 'netflix',
  'netflix': 'netflix',
  'Disney+': 'disney',
  'DISNEY+': 'disney',
  'disney+': 'disney',
  'disney': 'disney',
  'Prime Video': 'prime',
  'PRIME VIDEO': 'prime',
  'prime video': 'prime',
  'prime': 'prime',
  'Apple TV+': 'apple',
  'APPLE TV+': 'apple',
  'apple tv+': 'apple',
  'apple': 'apple',
}

async function searchTmdb(title) {
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&language=fr-FR`
  const res = await fetch(url)
  if (!res.ok) return null
  const json = await res.json()
  const results = (json.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv')
  return results[0] || null
}

async function processEntry(entry) {
  const platform = PLATFORM_MAP[entry.platform]
  if (!platform) {
    console.warn(`  ⚠ Plateforme inconnue : "${entry.platform}" — ignoré`)
    return
  }

  console.log(`\n→ "${entry.title}"`)

  const tmdb = await searchTmdb(entry.title)
  if (!tmdb) {
    console.warn(`  ⚠ Introuvable sur TMDB — ignoré`)
    return
  }

  const isMovie = tmdb.media_type === 'movie'
  const contentData = {
    tmdb_id: String(tmdb.id),
    title: tmdb.title || tmdb.name || entry.title,
    year: isMovie
      ? (tmdb.release_date || '').slice(0, 4) || null
      : (tmdb.first_air_date || '').slice(0, 4) || null,
    type: isMovie ? 'movie' : 'tv',
    synopsis: tmdb.overview || null,
    poster_path: tmdb.poster_path || null,
    genre: null,
  }

  console.log(`  TMDB: ${contentData.title} (${contentData.year}) [${contentData.type}]`)

  // Upsert dans contents
  const { data: content, error: contentError } = await supabase
    .from('contents')
    .upsert(contentData, { onConflict: 'tmdb_id' })
    .select()
    .single()

  if (contentError) {
    console.error(`  ✗ Erreur contents:`, contentError.message)
    return
  }

  // Upsert dans ad_status
  const adRow = {
    content_id: content.id,
    platform,
    status: entry.status || 'available',
    trust_level: entry.trust_level || 'Signalé',
    validation_count: entry.validation_count || 1,
    lien: entry.link || null,
  }

  const { error: adError } = await supabase
    .from('ad_status')
    .upsert(adRow, { onConflict: 'content_id,platform' })

  if (adError) {
    console.error(`  ✗ Erreur ad_status:`, adError.message)
    return
  }

  console.log(`  ✓ Inséré sur ${platform}`)
}

async function main() {
  const dataPath = join(__dirname, 'seed-data.json')
  const entries = JSON.parse(readFileSync(dataPath, 'utf-8'))
  console.log(`${entries.length} entrées à importer…`)

  for (const entry of entries) {
    await processEntry(entry)
    // Pause légère pour éviter le rate-limit TMDB
    await new Promise(r => setTimeout(r, 300))
  }

  console.log('\nTerminé.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
