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
        id, tmdb_id, title, year, genre, type,
        ad_status (id, platform, status, trust_level, validation_count, updated_at)
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

    // If platform filter is active, only return contents that have at least one ad_status for that platform
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
      .limit(5)

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

export async function submitNewTitle(contentData, platforms) {
  try {
    // Upsert content by tmdb_id
    const { data: content, error: contentError } = await supabase
      .from('contents')
      .upsert(
        {
          tmdb_id: contentData.tmdbId,
          title: contentData.title,
          year: contentData.year,
          genre: contentData.genre || null,
          type: contentData.type,
        },
        { onConflict: 'tmdb_id' }
      )
      .select()
      .single()

    if (contentError) return { data: null, error: contentError }

    // Insert one contribution per platform
    const contributions = platforms.map((platform) => ({
      content_id: content.id,
      platform,
      claimed_status: 'available',
      moderation_status: 'pending',
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
