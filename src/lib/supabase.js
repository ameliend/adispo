import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function searchTitles(query, platform, genre) {
  try {
    const hasText = query && query.trim()
    const hasPlatform = platform && platform.trim()
    const hasGenre = genre && genre.trim()

    let data, error

    if (hasPlatform && !hasText) {
      // Quand on filtre par plateforme sans texte : requêter ad_status directement
      const { data: adData, error: adError } = await supabase
        .from('ad_status')
        .select(`
          id, platform, status, trust_level, validation_count, lien,
          contents (id, tmdb_id, title, year, genre, type, synopsis, poster_path)
        `)
        .eq('platform', platform.trim())
        .eq('status', 'available')
        .limit(500)

      if (adError) return { data: null, error: adError }

      let items = (adData || [])
        .filter(s => s.contents)
        .filter(s => !hasGenre || (s.contents.genre || '').toLowerCase().includes(hasGenre.toLowerCase()))
        .map(s => ({ ...s.contents, ad_status: [{ id: s.id, platform: s.platform, status: s.status, trust_level: s.trust_level, validation_count: s.validation_count, lien: s.lien }] }))

      // Dédoublonne par titre
      const seen = new Map()
      for (const c of items) {
        const key = c.title.toLowerCase()
        if (!seen.has(key) || (!seen.get(key).poster_path && c.poster_path)) seen.set(key, c)
      }
      items = [...seen.values()].sort((a, b) => a.title.localeCompare(b.title, 'fr'))

      return { data: items, error: null }
    }

    // Recherche texte (avec ou sans filtres supplémentaires)
    let q = supabase
      .from('contents')
      .select(`
        id, tmdb_id, title, year, genre, type, synopsis, poster_path,
        ad_status (id, platform, status, trust_level, validation_count, updated_at, lien)
      `)

    if (hasText) q = q.ilike('title', `%${query.trim()}%`)
    if (hasGenre) q = q.ilike('genre', `%${hasGenre}%`)
    if (hasPlatform) q = q.eq('ad_status.platform', platform.trim())

    q = q.order('title', { ascending: true }).limit(100)

    ;({ data, error } = await q)
    if (error) return { data: null, error }

    let filtered = data || []
    if (hasPlatform) {
      filtered = filtered.filter(c => c.ad_status && c.ad_status.some(s => s.platform === platform.trim()))
    }

    // Dédoublonne par titre
    const seen = new Map()
    for (const c of filtered) {
      const key = c.title.toLowerCase()
      if (!seen.has(key) || (!seen.get(key).poster_path && c.poster_path)) seen.set(key, c)
    }

    return { data: [...seen.values()], error: null }
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
    const upsertData = {
      title: contentData.title,
      year: contentData.year || null,
      genre: contentData.genre || null,
      type: contentData.type || null,
      synopsis: contentData.synopsis || null,
      poster_path: contentData.posterPath || null,
    }
    if (contentData.tmdbId) upsertData.tmdb_id = contentData.tmdbId

    let contentResult
    if (contentData.tmdbId) {
      const res = await supabase
        .from('contents')
        .upsert(upsertData, { onConflict: 'tmdb_id' })
        .select()
        .single()
      contentResult = res
    } else {
      const res = await supabase
        .from('contents')
        .insert(upsertData)
        .select()
        .single()
      contentResult = res
    }

    const { data: content, error: contentError } = contentResult
    if (contentError) {
      console.error('[submitNewTitle] contents error:', contentError)
      return { data: null, error: contentError }
    }

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

    if (adError) {
      console.error('[submitNewTitle] ad_status error:', adError)
      return { data: null, error: adError }
    }

    // Insert contributions for "recent additions" display — non-blocking
    const contributions = platforms.map((platform) => ({
      content_id: content.id,
      platform,
      claimed_status: 'available',
      moderation_status: 'approved',
    }))

    const { error: contribError } = await supabase
      .from('contributions')
      .insert(contributions)

    if (contribError) {
      console.warn('[submitNewTitle] contributions insert failed (non-blocking):', contribError)
    }

    return { data: content, error: null }
  } catch (err) {
    console.error('[submitNewTitle] unexpected error:', err)
    return { data: null, error: err }
  }
}

export async function updateContent(contentId, tmdbData) {
  try {
    const { data, error } = await supabase
      .from('contents')
      .update({
        tmdb_id: tmdbData.tmdbId,
        title: tmdbData.title,
        year: tmdbData.year || null,
        genre: tmdbData.genre || null,
        type: tmdbData.type || null,
        synopsis: tmdbData.synopsis || null,
        poster_path: tmdbData.posterPath || null,
      })
      .eq('id', contentId)
      .select()
      .single()
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function getContentById(id) {
  try {
    const { data, error } = await supabase
      .from('contents')
      .select(`
        id, tmdb_id, title, year, genre, type, synopsis, poster_path,
        ad_status (id, platform, status, trust_level, validation_count, lien)
      `)
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function updateAdStatusLink(adStatusId, lien) {
  try {
    const { error } = await supabase
      .from('ad_status')
      .update({ lien: lien || null })
      .eq('id', adStatusId)
    return { error }
  } catch (err) {
    return { error: err }
  }
}

export async function addPlatformToContent(contentId, platform, lien) {
  try {
    const { data, error } = await supabase
      .from('ad_status')
      .insert({
        content_id: contentId,
        platform,
        status: 'available',
        trust_level: 'Signalé',
        validation_count: 1,
        lien: lien || null,
      })
      .select('id, platform, status, trust_level, validation_count, lien')
      .single()

    if (!error) {
      await supabase.from('contributions').insert({
        content_id: contentId,
        platform,
        submitted_at: new Date().toISOString(),
        moderation_status: 'pending',
      })
    }

    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function getContentById(id) {
  try {
    const { data, error } = await supabase
      .from('contents')
      .select(`
        id, tmdb_id, title, year, genre, type, synopsis, poster_path,
        ad_status (id, platform, status, trust_level, validation_count, lien)
      `)
      .eq('id', id)
      .maybeSingle()
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
  }
}

export async function getContentByTmdbId(tmdbId) {
  try {
    const { data, error } = await supabase
      .from('contents')
      .select(`
        id, tmdb_id, title, year, genre, type, synopsis, poster_path,
        ad_status (id, platform, status, trust_level, validation_count, lien)
      `)
      .eq('tmdb_id', tmdbId)
      .maybeSingle()
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

export async function getContentsCount() {
  try {
    const { count, error } = await supabase
      .from('contents')
      .select('*', { count: 'exact', head: true })
    return { count, error }
  } catch (err) {
    return { count: null, error: err }
  }
}

export async function getRecentContents(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('contents')
      .select(`
        id, tmdb_id, title, year, genre, type, poster_path,
        ad_status (id, platform, status, trust_level, validation_count, lien)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    return { data, error }
  } catch (err) {
    return { data: null, error: err }
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

export async function updateEmail(newEmail) {
  const { data, error } = await supabase.auth.updateUser({ email: newEmail })
  return { data, error }
}

export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  return { data, error }
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function verifyOtp(tokenHash, type) {
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
  return { data, error }
}

// ── Playlist ──────────────────────────────────────────────────────────────────

export async function getPlaylist(userId) {
  const { data, error } = await supabase
    .from('playlists')
    .select(`
      id, added_at,
      contents (id, tmdb_id, title, year, genre, type, poster_path,
        ad_status (id, platform, status, trust_level, validation_count, lien))
    `)
    .eq('user_id', userId)
    .order('added_at', { ascending: false })
  return { data, error }
}

export async function addToPlaylist(userId, contentId) {
  const { data, error } = await supabase
    .from('playlists')
    .insert({ user_id: userId, content_id: contentId })
    .select()
    .single()
  return { data, error }
}

export async function removeFromPlaylist(userId, contentId) {
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('user_id', userId)
    .eq('content_id', contentId)
  return { error }
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
