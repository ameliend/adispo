import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function searchTitles(query, platform, genre) {
  try {
    let q = supabase
      .from('contents')
      .select(`
        id, tmdb_id, title, year, genre, type, synopsis, poster_path,
        ad_status (id, platform, status, trust_level, validation_count, updated_at, lien)
      `)

    if (query && query.trim()) {
      q = q.ilike('title', `%${query.trim()}%`)
    }

    if (genre && genre.trim()) {
      q = q.ilike('genre', `%${genre.trim()}%`)
    }

    if (platform && platform.trim()) {
      q = q.eq('ad_status.platform', platform.trim())
    }

    q = q.order('title', { ascending: true }).limit(50)

    const { data, error } = await q
    if (error) return { data: null, error }

    let filtered = data || []
    if (platform && platform.trim()) {
      filtered = filtered.filter(
        (c) => c.ad_status && c.ad_status.some((s) => s.platform === platform.trim())
      )
    }

    return { data: filtered, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function getAdStatus(contentId) {
  try {
    const { data, error } = await supabase
      .from('ad_status')
      .select('*')
      .eq('content_id', contentId)
      .order('platform', { ascending: true })

    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function incrementValidation(adStatusId) {
  try {
    const { data, error } = await supabase.rpc('increment_validation', {
      row_id: adStatusId,
    })
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function getRecentContributions() {
  try {
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        id, platform, claimed_status, submitted_at,
        contents (title, year)
      `)
      .eq('moderation_status', 'approved')
      .order('submitted_at', { ascending: false })
      .limit(10)

    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function submitContribution(payload) {
  try {
    const { data, error } = await supabase
      .from('contributions')
      .insert([
        {
          content_id: payload.content_id,
          platform: payload.platform,
          claimed_status: payload.claimed_status,
          contributor_email: payload.contributor_email || null,
          moderation_status: 'pending',
        },
      ])
      .select()
      .single()

    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function submitNewTitle(contentData, platforms, platformLinks = {}) {
  try {
    // Upsert content
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .upsert(
        {
          tmdb_id: contentData.tmdbId,
          title: contentData.title,
          year: contentData.year || null,
          genre: contentData.genre || null,
          type: contentData.type || null,
          synopsis: contentData.synopsis || null,
          poster_path: contentData.posterPath || null,
        },
        { onConflict: 'tmdb_id' }
      )
      .select()
      .single()

    if (contentError) return { data: null, error: contentError }

    // Upsert ad_status for each platform
    const adRows = platforms.map((platform) => ({
      content_id: content.id,
      platform,
      status: 'available',
      trust_level: 'Signalé',
      validation_count: 1,
      lien: platformLinks[platform] || null,
    }))

    const { error: adError } = await supabase
      .from('ad_status')
      .upsert(adRows, { onConflict: 'content_id,platform' })

    if (adError) return { data: null, error: adError }

    // Insert contributions as approved so they appear in recent additions
    const contributions = platforms.map((platform) => ({
      content_id: content.id,
      platform,
      claimed_status: 'available',
      moderation_status: 'approved',
    }))

    const { data, error } = await supabase
      .from('contributions')
      .insert(contributions)
      .select()

    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function checkContentExists(tmdbId, platforms) {
  try {
    const { data: content } = await supabase
      .from('contents')
      .select('id')
      .eq('tmdb_id', tmdbId)
      .maybeSingle()

    if (!content) return { existingPlatforms: [] }

    const { data: statuses } = await supabase
      .from('ad_status')
      .select('platform')
      .eq('content_id', content.id)
      .in('platform', platforms)

    return { existingPlatforms: (statuses || []).map((s) => s.platform) }
  } catch {
    return { existingPlatforms: [] }
  }
}

export async function getRandomByPlatform(platform, limit = 10) {
  try {
    const { data: adData, error } = await supabase
      .from('ad_status')
      .select(`
        id, platform, status, trust_level, validation_count, lien,
        contents (id, tmdb_id, title, year, genre, type, synopsis, poster_path)
      `)
      .eq('platform', platform)
      .eq('status', 'available')
      .limit(200)

    if (error || !adData) return { data: null, error: error || new Error('no data') }

    const valid = adData.filter((s) => s.contents)
    const shuffled = [...valid].sort(() => Math.random() - 0.5).slice(0, limit)

    const data = shuffled.map((s) => ({
      ...s.contents,
      ad_status: [
        {
          id: s.id,
          platform: s.platform,
          status: s.status,
          trust_level: s.trust_level,
          validation_count: s.validation_count,
          lien: s.lien,
        },
      ],
    }))

    return { data, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function getContentsByPlatform(platform) {
  try {
    const { data: adData, error } = await supabase
      .from('ad_status')
      .select(`
        id, platform, status, trust_level, validation_count, lien,
        contents (id, tmdb_id, title, year, genre, type, synopsis, poster_path)
      `)
      .eq('platform', platform)
      .eq('status', 'available')

    if (error || !adData) return { data: null, error: error || new Error('no data') }

    const data = adData
      .filter((s) => s.contents)
      .map((s) => ({
        ...s.contents,
        ad_status: [
          {
            id: s.id,
            platform: s.platform,
            status: s.status,
            trust_level: s.trust_level,
            validation_count: s.validation_count,
            lien: s.lien,
          },
        ],
      }))
      .sort((a, b) => a.title.localeCompare(b.title, 'fr'))

    return { data, error: null }
  } catch (err) {
    return { data: null, error: err }
  }
}
