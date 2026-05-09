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
    if (!query?.trim()) return respond({ error: 'Requête vide' }, 400)

    // Fetch catalog — prioritise entries with synopsis, limit to 400
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: catalog, error: dbError } = await supabase
      .from('contents')
      .select('id, title, year, genre, type, synopsis')
      .order('synopsis', { ascending: false, nullsFirst: false })
      .limit(400)

    if (dbError) throw dbError

    const catalogText = (catalog ?? [])
      .map((c) => {
        const type = c.type === 'tv' ? 'Série' : 'Film'
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

    const prompt = `Tu es un assistant de recommandation de films et séries avec audiodescription en français.

Voici notre catalogue (titres disponibles avec audiodescription) :
${catalogText}

L'utilisateur demande : "${query}"

Sélectionne 3 à 5 titres du catalogue qui correspondent le mieux à cette demande. Tiens compte du contexte, des thèmes, des genres, de la langue ou du pays évoqués.

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour :
[{"title": "Titre exact du catalogue", "reason": "Explication courte en 1 phrase pourquoi ce titre correspond"}]`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
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

    // Extract JSON array from response (Gemini sometimes wraps it in markdown).
    // Use greedy match to capture the full array if it spans multiple objects.
    const match = raw.match(/\[[\s\S]*\]/)
    let recommendations: { title: string; reason: string }[] = []
    if (match) {
      try {
        recommendations = JSON.parse(match[0])
      } catch (e) {
        console.error('JSON parse error:', e instanceof Error ? e.message : e, '— raw:', match[0].slice(0, 300))
      }
    } else {
      console.log('No JSON array found in Gemini response')
    }

    // Normalise titles for matching: lowercase, strip accents, normalise quotes,
    // collapse whitespace and punctuation. Tolerates Gemini's typographic
    // variations (curly apostrophes, accents, trailing punctuation).
    const normalise = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[‘’ʼ`]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[^\w\s']/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

    const catalogByNormalised = new Map(
      (catalog ?? []).map((c) => [normalise(c.title), c])
    )

    const results = recommendations
      .map((rec) => {
        const key = normalise(rec.title)
        let content = catalogByNormalised.get(key)

        // Fallback: substring match (recommendation contains catalog title or vice-versa)
        if (!content && key.length >= 3) {
          for (const [catKey, catContent] of catalogByNormalised) {
            if (catKey === key || catKey.includes(key) || key.includes(catKey)) {
              content = catContent
              break
            }
          }
        }

        if (!content) {
          console.log(`Unmatched: "${rec.title}" → "${key}"`)
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
