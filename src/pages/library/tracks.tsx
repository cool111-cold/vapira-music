import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/auth-context'
import { LibNav } from './lib-nav'
import { TrackRow, LibTrack } from './track-row'
import { PlayerTwo } from '../../components/player/player-two'

const BASE = 'https://vapira.ru'

const pageStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#222222',
    padding: '2rem',
    paddingTop: '5rem',
    paddingBottom: '6rem',
}

export const TracksPage = () => {
    const { token } = useAuth()
    const [tracks, setTracks] = useState<LibTrack[]>([])
    const [loading, setLoading] = useState(true)

    const handleDelete = (id: string) => {
        setTracks(prev => prev.filter(t => t.id !== id))
    }

    useEffect(() => {
        if (!token) return
        setLoading(true)
        fetch(`${BASE}/tracks`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => data.map((t: any) => ({
                id: String(t.id),
                title: t.title,
                artist: t.artist,
                cover: t.avatar_url,
            })))
            .then(setTracks)
            .catch(() => setTracks([]))
            .finally(() => setLoading(false))
    }, [token])

    return (
        <div style={pageStyle}>
            <PlayerTwo top />
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555', marginBottom: '0.5rem' }}>vapira</p>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '2rem', letterSpacing: '-0.02em' }}>uploaded</h1>
                <LibNav />
                {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>loading...</p>}
                {!loading && tracks.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>no tracks</p>}
                {tracks.map(t => <TrackRow key={t.id} track={t} onDelete={handleDelete} />)}
            </div>
        </div>
    )
}
