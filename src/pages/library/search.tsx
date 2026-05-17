import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { LibNav } from './lib-nav'
import { TrackRow, LibTrack } from './track-row'
import { PlayerTwo } from '../../components/player/player-two'

const BASE = 'https://vapira.ru'

const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #444',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '1.2rem',
    padding: '0.5rem 0',
    outline: 'none',
    width: '100%',
    marginBottom: '2rem',
    transition: 'border-color 0.2s',
}

export const SearchPage = () => {
    const { token } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const q = searchParams.get('q') ?? ''
    const [input, setInput] = useState(q)
    const [tracks, setTracks] = useState<LibTrack[]>([])
    const [loading, setLoading] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    const handleChange = (val: string) => {
        setInput(val)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            setSearchParams(val.trim() ? { q: val.trim() } : {}, { replace: true })
        }, 400)
    }

    useEffect(() => {
        if (!q || !token) { setTracks([]); return }
        setLoading(true)
        fetch(`${BASE}/search?q=${encodeURIComponent(q)}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
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
    }, [q, token])

    useEffect(() => () => clearTimeout(debounceRef.current), [])

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#222222', padding: '2rem', paddingTop: '5rem', paddingBottom: '6rem' }}>
            <PlayerTwo top />
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555', marginBottom: '0.5rem' }}>vapira</p>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '2rem', letterSpacing: '-0.02em' }}>search</h1>
                <LibNav />
                <input
                    style={inputStyle}
                    placeholder="track or artist..."
                    value={input}
                    onChange={e => handleChange(e.target.value)}
                    autoFocus
                />
                {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>searching...</p>}
                {!loading && q && tracks.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>nothing found</p>}
                {tracks.map(t => <TrackRow key={t.id} track={t} />)}
            </div>
        </div>
    )
}
