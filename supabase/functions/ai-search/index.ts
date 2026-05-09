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

Selectionne 3 a 5 titres du catalogue qui correspondent le mieux a cette demande. Tiens compte du contexte, des themes, des genres, de la langue ou du pays evoques.

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
      return respond({ results: [], query, error: 'Gemini API error' })
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

    // Jaccard word-overlap — catches near-misses like
    // "un petit truc en moins" (score 0.67) -> "un petit truc en plus"
    function jaccardSimilarity(a: string, b: string): number {
      const words = (s: string) => new Set(s.split(' ').filter((w) => w.length >= 2))
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

    console.log(`Gemini: ${recommendations.length} recos, ${results.length} matched for "${query}"`)

    return respond({ results, query })
  } catch (err) {
    console.error(err)
    return respond({ error: 'Erreur serveur' }, 500)
  }
})
