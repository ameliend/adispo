#!/usr/bin/env node
// Usage: node scripts/generate-sql.js [input.json]
// Reads a JSON file of titles, looks up real TMDB IDs, writes output.sql
//
// Input format (default: scripts/seed-data.json):
// [{ "title": "...", "platform": "canal|netflix|disney|prime|apple",
//    "status": "available", "link": "...", "trust_level": "...", "validation_count": 1 }]

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Load .env without dotenv ──────────────────────────────────────────────────
function loadEnv() {
  try {
    const content = readFileSync(join(__dirname, '../.env'), 'utf8')
    for (const line of content.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
    }
  } catch {}
}

loadEnv()

const TMDB_KEY = process.env.VITE_TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'

const PLATFORM_MAP = {
  'canal+': 'canal', 'canal': 'canal',
  'netflix': 'netflix',
  'disney+': 'disney', 'disney': 'disney',
  'prime video': 'prime', 'prime': 'prime', 'amazon': 'prime',
  'apple tv+': 'apple', 'apple': 'apple',
}

function normalizePlatform(p) {
  return PLATFORM_MAP[p?.toLowerCase()] || null
}

// ── SQL helpers ───────────────────────────────────────────────────────────────
function esc(val) {
  if (val === null || val === undefined || val === '') return 'NULL'
  return `'${String(val).replace(/'/g, "''")}'`
}

// ── TMDB API ──────────────────────────────────────────────────────────────────
async function searchTmdb(title, year) {
  const params = new URLSearchParams({
    api_key: TMDB_KEY,
    query: title,
    language: 'fr-FR',
    include_adult: 'false',
  })
  if (year) params.set('year', year)

  const res = await fetch(`${TMDB_BASE}/search/multi?${params}`)
  if (!res.ok) return null
  const json = await res.json()
  return (json.results || []).find(r => r.media_type === 'movie' || r.media_type === 'tv') || null
}

async function getDetails(tmdbId, mediaType) {
  const endpoint = mediaType === 'tv' ? 'tv' : 'movie'
  const params = new URLSearchParams({ api_key: TMDB_KEY, language: 'fr-FR' })
  const res = await fetch(`${TMDB_BASE}/${endpoint}/${tmdbId}?${params}`)
  if (!res.ok) return null
  return res.json()
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!TMDB_KEY) {
    console.error('❌  VITE_TMDB_API_KEY absent du fichier .env')
    process.exit(1)
  }

  const inputPath = process.argv[2] || join(__dirname, 'seed-data.json')
  let entries
  try {
    entries = JSON.parse(readFileSync(inputPath, 'utf8'))
  } catch (e) {
    console.error(`❌  Impossible de lire ${inputPath}`)
    process.exit(1)
  }

  console.log(`\n${entries.length} titre(s) à traiter…\n`)

  const sqlParts = [
    `-- Généré par scripts/generate-sql.js`,
    `-- ${new Date().toISOString()}`,
    `-- Exécuter dans l'éditeur SQL de Supabase`,
    ``,
  ]

  const notFound = []
  let ok = 0

  for (const entry of entries) {
    const platform = normalizePlatform(entry.platform)
    if (!platform) {
      console.warn(`  ⚠  Plateforme inconnue "${entry.platform}" pour "${entry.title}" — ignoré`)
      notFound.push(entry.title)
      continue
    }

    process.stdout.write(`→ ${entry.title}…`)

    const result = await searchTmdb(entry.title, entry.year)
    if (!result) {
      console.log(` ❌  introuvable sur TMDB`)
      notFound.push(entry.title)
      continue
    }

    const details = await getDetails(result.id, result.media_type)
    if (!details) {
      console.log(` ❌  erreur récupération détails`)
      notFound.push(entry.title)
      continue
    }

    const title   = details.title || details.name || entry.title
    const year    = (details.release_date || details.first_air_date || '').slice(0, 4) || null
    const type    = result.media_type
    const genre   = details.genres?.map(g => g.name).join(', ') || null
    const synopsis = details.overview || null
    const poster  = details.poster_path || null
    const tmdbId  = result.id
    const trustLevel = entry.trust_level || 'Signalé'
    const validationCount = entry.validation_count ?? 1
    const lien    = entry.link || null

    console.log(` ✓  ${title} (${year || '?'}) [tmdb:${tmdbId}]`)
    ok++

    sqlParts.push(`-- ────────────────────────────────────`)
    sqlParts.push(`-- ${title}${year ? ` (${year})` : ''} — ${platform}`)
    sqlParts.push(`INSERT INTO contents (tmdb_id, title, year, genre, type, synopsis, poster_path)`)
    sqlParts.push(`VALUES (${tmdbId}, ${esc(title)}, ${esc(year)}, ${esc(genre)}, ${esc(type)}, ${esc(synopsis)}, ${esc(poster)})`)
    sqlParts.push(`ON CONFLICT (tmdb_id) DO UPDATE SET`)
    sqlParts.push(`  title = EXCLUDED.title,`)
    sqlParts.push(`  year = EXCLUDED.year,`)
    sqlParts.push(`  genre = EXCLUDED.genre,`)
    sqlParts.push(`  type = EXCLUDED.type,`)
    sqlParts.push(`  synopsis = EXCLUDED.synopsis,`)
    sqlParts.push(`  poster_path = EXCLUDED.poster_path;`)
    sqlParts.push(``)
    sqlParts.push(`INSERT INTO ad_status (content_id, platform, status, trust_level, validation_count, lien)`)
    sqlParts.push(`SELECT id, ${esc(platform)}, 'available', ${esc(trustLevel)}, ${validationCount}, ${esc(lien)}`)
    sqlParts.push(`FROM contents WHERE tmdb_id = ${tmdbId}`)
    sqlParts.push(`ON CONFLICT (content_id, platform) DO UPDATE SET`)
    sqlParts.push(`  status      = 'available',`)
    sqlParts.push(`  trust_level = EXCLUDED.trust_level,`)
    sqlParts.push(`  validation_count = EXCLUDED.validation_count,`)
    sqlParts.push(`  lien        = EXCLUDED.lien;`)
    sqlParts.push(``)

    await new Promise(r => setTimeout(r, 250)) // évite le rate-limit TMDB
  }

  const outPath = join(__dirname, 'output.sql')
  writeFileSync(outPath, sqlParts.join('\n'))

  console.log(`\n✅  ${ok}/${entries.length} titres traités`)
  if (notFound.length) {
    console.log(`⚠️   Non trouvés (à ajouter manuellement) :`)
    notFound.forEach(t => console.log(`   - ${t}`))
  }
  console.log(`\n📄  SQL écrit dans : scripts/output.sql`)
  console.log(`    → Colle le contenu dans l'éditeur SQL de Supabase et exécute.\n`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
