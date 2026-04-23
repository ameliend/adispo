import { useCallback, useEffect, useState } from 'react'
import { getPlaylist, addToPlaylist, removeFromPlaylist } from '../lib/supabase.js'

export function usePlaylist(user) {
  const [playlistIds, setPlaylistIds] = useState(new Set())
  const [playlistItems, setPlaylistItems] = useState([])
  const [playlistLoading, setPlaylistLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      setPlaylistIds(new Set())
      setPlaylistItems([])
      return
    }
    setPlaylistLoading(true)
    getPlaylist(user.id).then(({ data }) => {
      const rows = data || []
      setPlaylistItems(rows)
      setPlaylistIds(new Set(rows.map((r) => r.contents?.id).filter(Boolean)))
      setPlaylistLoading(false)
    })
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlaylist = useCallback(
    async (contentId) => {
      if (!user) return
      if (playlistIds.has(contentId)) {
        await removeFromPlaylist(user.id, contentId)
        setPlaylistIds((prev) => { const s = new Set(prev); s.delete(contentId); return s })
        setPlaylistItems((prev) => prev.filter((r) => r.contents?.id !== contentId))
      } else {
        await addToPlaylist(user.id, contentId)
        const { data } = await getPlaylist(user.id)
        const rows = data || []
        setPlaylistItems(rows)
        setPlaylistIds(new Set(rows.map((r) => r.contents?.id).filter(Boolean)))
      }
    },
    [user, playlistIds] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return { playlistIds, playlistItems, playlistLoading, togglePlaylist }
}
