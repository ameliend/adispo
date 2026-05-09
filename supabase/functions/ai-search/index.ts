import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405)

  try {
    const { query } = await req.json()
    if (!query?.trim()) return respond({ error: 'Requete vide' }, 400)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: catalog, error: dbError } = await supabase
      .from('contents')
      .select('id, title, year, genre, type, synopsis')
      .order('synopsis', { ascending: false, nullsFirst: false })
      .limit(400)

    if (dbError) throw dbError

    const catalogText = (catalog ?? [])
      .map((c) => {
        const type = c.type === 'tv' ? 'Serie' : 'Film'
        const parts = [
          `"${c.title}"`,
          c.year ? `(${c.year})` : null,
          `[${type}]`,
          c.genre ? `Genres: ${c.genre}` : null,
          c.synopsis ? `Synopsis: ${c.synopsis.slice(0, 180)}` : null,
        ]
        return parts.filter(Boolean).join(' ')
      })
      .join('\n')

    const prompt = `Tu es un assistant de recommandation de films et series avec audiodescription en francais.

Voici notre catalogue (titres disponibles avec audiodescription) :
${catalogText}

L'utilisateur demande : "${query}"

ETAPE 1 - RECHERCHE DE TITRE EXACT : Si la demande ressemble a un titre de film ou de serie (ex: "c etait mieux demain", "un petit truc en plus", "la plateforme 2"), cherche d abord ce titre ou un titre tres proche (1 ou 2 mots differents) dans le catalogue. Si tu le trouves, inclus-le en premier dans ta reponse avec la raison "Correspond au titre recherche."

ETAPE 2 - RECOMMANDATIONS THEMATIQUES : Selectionne 2 a 4 autres titres du catalogue qui correspondent aux themes, genres, pays ou ambiance de la demande.

Reponds UNIQUEMENT avec un tableau JSON valide, sans texte autour :
[{"title": "Titre exact du catalogue", "reason": "Explication courte en 1 phrase pourquoi ce titre correspond"}]`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
        }),
      }
    )

    const geminiData = await geminiRes.json()

    if (!geminiRes.ok) {
      console.error('Gemini API error:', geminiRes.status, JSON.stringify(geminiData))
      // Fallback: keyword search directly in catalog when Gemini is unavailable
      const normalise = (s: string) =>
        s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[''’ʼʼ`]/g, "'").replace(/[^\w\s']/g, ' ').replace(/\s+/g, ' ').trim()
      const words = (s: string) => new Set(s.split(/[\s']+/).filter((w) => w.length >= 2))
      const qw = words(normalise(query))
      const fallbackResults = (catalog ?? [])
        .map((c) => {
          const cw = words(normalise(c.title + ' ' + (c.genre ?? '') + ' ' + (c.synopsis ?? '').slice(0, 200)))
          const inter = [...qw].filter((w) => cw.has(w)).length
          const union = new Set([...qw, ...cw]).size
          return { content: c, score: union === 0 ? 0 : inter / union, reason: 'Correspond à votre recherche.' }
        })
        .filter((r) => r.score >= 0.05)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(({ content, reason }) => ({ content, reason }))
      console.log(`Gemini unavailable, fallback keyword search: ${fallbackResults.length} results for "${query}"`)
      return respond({ results: fallbackResults, query, fallback: true })
    }

    const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    console.log(`Gemini raw response (${raw.length} chars): ${raw.slice(0, 500)}`)
    console.log(`Catalog size: ${catalog?.length ?? 0}`)

    const matchJson = raw.match(/\[[\s\S]*\]/)
    let recommendations: { title: string; reason: string }[] = []
    if (matchJson) {
      try {
        recommendations = JSON.parse(matchJson[0])
      } catch (e) {
        console.error('JSON parse error:', e instanceof Error ? e.message : e)
      }
    } else {
      console.log('No JSON array found in Gemini response')
    }

    // Normalise: lowercase, strip combining diacritics (U+0300-U+036F),
    // normalise apostrophes/quotes, collapse punctuation and whitespace.
    const normalise = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/['‘’ʼ`]/g, "'")
        .replace(/["“”]/g, '"')
        .replace(/[^\w\s']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    const catalogByNormalised = new Map(
      (catalog ?? []).map((c) => [normalise(c.title), c])
    )

    // Jaccard word-overlap. Split on spaces AND apostrophes so "c'etait" and
    // "cetait" both yield the token "etait", avoiding elision mismatches.
    function jaccardSimilarity(a: string, b: string): number {
      const words = (s: string) => new Set(s.split(/[\s']+/).filter((w) => w.length >= 2))
      const wa = words(a)
      const wb = words(b)
      const intersection = [...wa].filter((w) => wb.has(w)).length
      const union = new Set([...wa, ...wb]).size
      return union === 0 ? 0 : intersection / union
    }

    const results = recommendations
      .map((rec) => {
        const key = normalise(rec.title)
        let content = catalogByNormalised.get(key)

        // Fallback 1: substring match
        if (!content && key.length >= 3) {
          for (const [catKey, catContent] of catalogByNormalised) {
            if (catKey.includes(key) || key.includes(catKey)) {
              content = catContent
              break
            }
          }
        }

        // Fallback 2: Jaccard similarity >= 0.6
        if (!content && key.length >= 5) {
          let bestScore = 0
          let bestContent = null
          for (const [catKey, catContent] of catalogByNormalised) {
            const score = jaccardSimilarity(key, catKey)
            if (score > bestScore) {
              bestScore = score
              bestContent = catContent
            }
          }
          if (bestScore >= 0.6) {
            console.log(`Fuzzy match (${Math.round(bestScore * 100)}%): "${rec.title}" -> "${bestContent?.title}"`)
            content = bestContent
          }
        }

        if (!content) {
          console.log(`Unmatched: "${rec.title}" -> "${key}"`)
          return null
        }
        return { content, reason: rec.reason }
      })
      .filter(Boolean)

    // Direct query-to-title fuzzy search: catches cases where the user says a
    // title-like phrase that Gemini misinterprets (e.g. "un petit truc en moins"
    // → finds "un petit truc en plus" with Jaccard 0.67).
    const queryKey = normalise(query)
    const resultIds = new Set((results as { content: { id: string } }[]).map((r) => r.content.id))
    const directMatches: { content: (typeof catalog)[number]; reason: string }[] = []

    for (const [catKey, catContent] of catalogByNormalised) {
      if (resultIds.has(catContent.id)) continue
      const score = jaccardSimilarity(queryKey, catKey)
      if (score >= 0.55) {
        console.log(`Direct title match (${Math.round(score * 100)}%): query "${query}" -> "${catContent.title}"`)
        directMatches.push({ content: catContent, reason: 'Titre proche de votre recherche.' })
        resultIds.add(catContent.id)
      }
    }

    // Prepend direct title matches so they appear first
    const merged = [...directMatches, ...results]

    console.log(`Gemini: ${recommendations.length} recos, ${results.length} matched, ${directMatches.length} direct title matches for "${query}"`)

    return respond({ results: merged, query })
  } catch (err) {
    console.error(err)
    return respond({ error: 'Erreur serveur' }, 500)
  }
})
