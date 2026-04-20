// Convertit scripts/seed-data.json en fichiers SQL importables dans Supabase
// Usage : node scripts/json-to-sql.js
// Génère : scripts/seed-part-1.sql, seed-part-2.sql, ...

import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const PLATFORM_MAP = {
  'CANAL+': 'canal', 'Canal+': 'canal', 'canal+': 'canal', 'canal': 'canal',
  'Netflix': 'netflix', 'NETFLIX': 'netflix', 'netflix': 'netflix',
  'Disney+': 'disney', 'DISNEY+': 'disney', 'disney+': 'disney', 'disney': 'disney',
  'Prime Video': 'prime', 'PRIME VIDEO': 'prime', 'prime video': 'prime', 'prime': 'prime',
  'Apple TV+': 'apple', 'APPLE TV+': 'apple', 'apple tv+': 'apple', 'apple': 'apple',
  'CINÉ+OCS': 'cineocs', 'cineocs': 'cineocs',
  'M6': 'm6', 'm6': 'm6',
}

const CHUNK_SIZE = 400 // entrées par fichier SQL

function esc(str) {
  return str ? str.replace(/'/g, "''") : ''
}

const raw = JSON.parse(readFileSync(join(__dirname, 'seed-data.json'), 'utf-8'))

// Dédoublonne les titres pour la table contents
// On part de -2000 pour ne pas collisionner avec l'import.sql existant (-1 à -1120)
const titleMap = new Map()
let nextId = -2000
for (const entry of raw) {
  if (!titleMap.has(entry.title)) {
    titleMap.set(entry.title, nextId--)
  }
}

console.log(`${raw.length} entrées, ${titleMap.size} titres uniques`)

// Découpe en chunks
const allEntries = raw.map(entry => ({
  ...entry,
  platform: PLATFORM_MAP[entry.platform] || entry.platform,
  tmdbId: titleMap.get(entry.title),
})).filter(e => {
  if (!PLATFORM_MAP[e.platform] && !Object.values(PLATFORM_MAP).includes(e.platform)) {
    console.warn(`  ⚠ Plateforme inconnue ignorée : "${e.platform}" (titre: ${e.title})`)
    return false
  }
  return true
})

const chunks = []
for (let i = 0; i < allEntries.length; i += CHUNK_SIZE) {
  chunks.push(allEntries.slice(i, i + CHUNK_SIZE))
}

for (let ci = 0; ci < chunks.length; ci++) {
  const chunk = chunks[ci]
  const partNum = ci + 1

  // Titres uniques dans ce chunk
  const chunkTitles = new Map()
  for (const e of chunk) {
    if (!chunkTitles.has(e.title)) chunkTitles.set(e.title, e.tmdbId)
  }

  let sql = `-- ADispo seed — partie ${partNum}/${chunks.length}\n`
  sql += `-- ${chunkTitles.size} titres, ${chunk.length} statuts\n\n`

  // INSERT contents
  sql += `INSERT INTO contents (tmdb_id, title, year, genre, type)\nVALUES\n`
  const contentRows = [...chunkTitles.entries()].map(
    ([title, id]) => `  (${id}, '${esc(title)}', NULL, NULL, NULL)`
  )
  sql += contentRows.join(',\n')
  sql += `\nON CONFLICT (tmdb_id) DO UPDATE SET title = EXCLUDED.title;\n\n`

  // INSERT ad_status
  sql += `INSERT INTO ad_status (content_id, platform, status, trust_level, validation_count, lien)\n`
  sql += `SELECT c.id, v.platform, v.status, v.trust_level, v.validation_count, v.lien\n`
  sql += `FROM (VALUES\n`
  const adRows = chunk.map(e => {
    const status = e.status || 'available'
    const trust = e.trust_level || 'Signalé'
    const count = e.validation_count || 1
    const lien = e.link ? `'${esc(e.link)}'` : 'NULL'
    return `  (${e.tmdbId}, '${esc(e.platform)}', '${esc(status)}', '${esc(trust)}', ${count}, ${lien})`
  })
  sql += adRows.join(',\n')
  sql += `\n) AS v(tmdb_id, platform, status, trust_level, validation_count, lien)\n`
  sql += `JOIN contents c ON c.tmdb_id = v.tmdb_id\n`
  sql += `ON CONFLICT (content_id, platform) DO UPDATE SET\n`
  sql += `  status = EXCLUDED.status,\n`
  sql += `  trust_level = EXCLUDED.trust_level,\n`
  sql += `  validation_count = EXCLUDED.validation_count,\n`
  sql += `  lien = EXCLUDED.lien;\n`

  const outPath = join(__dirname, `seed-part-${partNum}.sql`)
  writeFileSync(outPath, sql, 'utf-8')
  console.log(`✓ scripts/seed-part-${partNum}.sql (${chunk.length} entrées)`)
}

console.log(`\nTerminé. Exécutez chaque fichier seed-part-*.sql dans Supabase → SQL Editor.`)
