import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/auth-context'
import { LibNav } from './lib-nav'
import { PlayerTwo } from '../../components/player/player-two'

const BASE = 'https://vapira.ru'

interface VinylApi {
    id: number
    name: string
    artist: string | null
    description: string | null
    bg_color: string | null
    cover: string | null
}

interface TrackApi {
    id: number
    title: string
    artist: string
    avatar_url: string | null
    position: number
}

interface LibTrack {
    id: number
    title: string
    artist: string
    cover: string | null
}

const pageStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#222222',
    padding: '2rem',
    paddingTop: '5rem',
    paddingBottom: '6rem',
}

const headingStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#fff',
    marginBottom: '2rem',
    letterSpacing: '-0.02em',
}

const modalOverlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}

const modalBox: React.CSSProperties = {
    backgroundColor: '#1a1a1a',
    borderRadius: '0.75rem',
    width: '90%',
    maxWidth: 480,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
}

interface AddTrackModalProps {
    vinylId: number
    vinylName: string
    existingTrackIds: Set<number>
    token: string
    onClose: () => void
    onAdded: (track: TrackApi) => void
}

const AddTrackModal: React.FC<AddTrackModalProps> = ({ vinylId, vinylName, existingTrackIds, token, onClose, onAdded }) => {
    const [allTracks, setAllTracks] = useState<LibTrack[]>([])
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState<number | null>(null)

    useEffect(() => {
        fetch(`${BASE}/library`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then((data: any[]) => setAllTracks(data.map(t => ({
                id: t.id,
                title: t.title,
                artist: t.artist,
                cover: t.avatar_url ?? null,
            }))))
            .catch(() => setAllTracks([]))
            .finally(() => setLoading(false))
    }, [token])

    const filtered = allTracks.filter(t => {
        if (!query) return true
        const q = query.toLowerCase()
        return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    })

    const handleAdd = async (track: LibTrack) => {
        if (adding !== null) return
        setAdding(track.id)
        try {
            const res = await fetch(`${BASE}/vinyl/${vinylId}/tracks`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ track_id: track.id }),
            })
            if (res.ok) {
                onAdded({ id: track.id, title: track.title, artist: track.artist, avatar_url: track.cover, position: 0 })
            }
        } finally {
            setAdding(null)
        }
    }

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={modalBox} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '1.25rem 1.25rem 0.75rem', borderBottom: '1px solid #2a2a2a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                            Add track to {vinylName}
                        </p>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1, padding: '0 0.25rem' }}>×</button>
                    </div>
                    <input
                        autoFocus
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="search..."
                        style={{
                            width: '100%',
                            background: '#2a2a2a',
                            border: 'none',
                            borderRadius: '0.4rem',
                            padding: '0.6rem 0.75rem',
                            color: '#fff',
                            fontSize: '0.875rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {loading && <p style={{ color: '#555', fontSize: '0.8rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>loading...</p>}
                    {!loading && filtered.length === 0 && <p style={{ color: '#555', fontSize: '0.8rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>no tracks found</p>}
                    {filtered.map(track => {
                        const already = existingTrackIds.has(track.id)
                        const isAdding = adding === track.id
                        return (
                            <div
                                key={track.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.65rem 1.25rem',
                                    borderBottom: '1px solid #222',
                                    opacity: already ? 0.4 : 1,
                                    cursor: already ? 'default' : 'pointer',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => { if (!already) e.currentTarget.style.background = '#252525' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                                onClick={() => { if (!already) handleAdd(track) }}
                            >
                                {track.cover
                                    ? <img src={`${track.cover}`} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                                    : <div style={{ width: 36, height: 36, borderRadius: 4, background: '#333', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '1rem' }}>♪</div>
                                }
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                                    <div style={{ color: '#666', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</div>
                                </div>
                                <span style={{ color: already ? '#555' : isAdding ? '#888' : '#FD5E5E', fontSize: '1.25rem', flexShrink: 0 }}>
                                    {already ? '✓' : isAdding ? '…' : '+'}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

interface VinylRowProps {
    vinyl: VinylApi
    token: string
    onDeleted: (id: number) => void
}

const VinylRow: React.FC<VinylRowProps> = ({ vinyl, token, onDeleted }) => {
    const [open, setOpen] = useState(false)
    const [tracks, setTracks] = useState<TrackApi[]>([])
    const [tracksLoaded, setTracksLoaded] = useState(false)
    const [tracksLoading, setTracksLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [removingId, setRemovingId] = useState<number | null>(null)

    const loadTracks = useCallback(() => {
        if (tracksLoaded) return
        setTracksLoading(true)
        fetch(`${BASE}/vinyl/${vinyl.id}/tracks`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { setTracks(data); setTracksLoaded(true) })
            .catch(() => setTracks([]))
            .finally(() => setTracksLoading(false))
    }, [vinyl.id, token, tracksLoaded])

    const handleToggle = () => {
        if (!open) loadTracks()
        setOpen(e => !e)
    }

    const handleDelete = async () => {
        if (deleting) return
        setDeleting(true)
        try {
            await fetch(`${BASE}/vinyl/${vinyl.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            onDeleted(vinyl.id)
        } finally {
            setDeleting(false)
            setConfirmDelete(false)
        }
    }

    const handleRemoveTrack = async (trackId: number) => {
        if (removingId !== null) return
        setRemovingId(trackId)
        try {
            await fetch(`${BASE}/vinyl/${vinyl.id}/tracks/${trackId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            setTracks(prev => prev.filter(t => t.id !== trackId))
        } finally {
            setRemovingId(null)
        }
    }

    const handleTrackAdded = (track: TrackApi) => {
        setTracks(prev => [...prev, track])
        setTracksLoaded(true)
        setShowModal(false)
    }

    const existingIds = new Set(tracks.map(t => t.id))

    return (
        <div style={{ borderBottom: '1px solid #2a2a2a' }}>
            <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 0', cursor: 'pointer' }}
                onClick={handleToggle}
            >
                {vinyl.cover
                    ? <img src={`${BASE}${vinyl.cover}`} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 40, height: 40, borderRadius: 4, background: vinyl.bg_color ?? '#333', flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vinyl.name}</div>
                    {vinyl.artist && <div style={{ color: '#666', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vinyl.artist}</div>}
                </div>
                <span style={{ color: '#444', fontSize: '0.75rem', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
                {confirmDelete ? (
                    <>
                        <button
                            onClick={e => { e.stopPropagation(); handleDelete() }}
                            disabled={deleting}
                            style={{ background: 'none', border: 'none', color: '#FD5E5E', cursor: deleting ? 'default' : 'pointer', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.25rem 0.4rem', lineHeight: 1, flexShrink: 0 }}
                        >
                            {deleting ? '...' : 'yes'}
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); setConfirmDelete(false) }}
                            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.25rem 0.4rem', lineHeight: 1, flexShrink: 0 }}
                        >
                            no
                        </button>
                    </>
                ) : (
                    <button
                        onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
                        title="delete vinyl"
                        style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem 0.5rem', lineHeight: 1, flexShrink: 0, transition: 'color 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#FD5E5E' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                    >
                        ✕
                    </button>
                )}
            </div>

            {open && (
                <div style={{ paddingLeft: '1.5rem', paddingBottom: '0.75rem' }}>
                    {tracksLoading && <p style={{ color: '#555', fontSize: '0.8rem', margin: '0.5rem 0' }}>loading...</p>}
                    {!tracksLoading && tracks.length === 0 && <p style={{ color: '#555', fontSize: '0.8rem', margin: '0.5rem 0' }}>no tracks yet</p>}
                    {tracks.map(track => (
                        <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0', borderBottom: '1px solid #2a2a2a' }}>
                            {/* {track.avatar_url
                                ? <img src={`${track.avatar_url}`} alt="" style={{ width: 32, height: 32, borderRadius: 3, objectFit: 'cover', flexShrink: 0 }} />
                                : <div style={{ width: 32, height: 32, borderRadius: 3, background: '#2a2a2a', flexShrink: 0 }} />
                            } */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                                <div style={{ color: '#666', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</div>
                            </div>
                            <button
                                onClick={() => handleRemoveTrack(track.id)}
                                disabled={removingId === track.id}
                                title="remove from vinyl"
                                style={{ background: 'none', border: 'none', color: '#444', cursor: removingId === track.id ? 'default' : 'pointer', fontSize: '1rem', padding: '0.25rem 0.4rem', lineHeight: 1, transition: 'color 0.2s' }}
                                onMouseEnter={e => { if (removingId !== track.id) e.currentTarget.style.color = '#FD5E5E' }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            marginTop: '0.75rem',
                            background: 'none',
                            border: '1px solid #333',
                            borderRadius: '0.35rem',
                            color: '#aaa',
                            fontSize: '0.75rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            padding: '0.45rem 0.85rem',
                            transition: 'border-color 0.2s, color 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#FD5E5E'; e.currentTarget.style.color = '#FD5E5E' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#aaa' }}
                    >
                        + add track
                    </button>
                </div>
            )}

            {showModal && (
                <AddTrackModal
                    vinylId={vinyl.id}
                    vinylName={vinyl.name}
                    existingTrackIds={existingIds}
                    token={token}
                    onClose={() => setShowModal(false)}
                    onAdded={handleTrackAdded}
                />
            )}
        </div>
    )
}

export const VinylsPage = () => {
    const { token } = useAuth()
    const [vinyls, setVinyls] = useState<VinylApi[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!token) return
        fetch(`${BASE}/vinyl`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(setVinyls)
            .catch(() => setVinyls([]))
            .finally(() => setLoading(false))
    }, [token])

    const handleDeleted = (id: number) => setVinyls(prev => prev.filter(v => v.id !== id))

    return (
        <div style={pageStyle}>
            <PlayerTwo top />
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555', marginBottom: '0.5rem' }}>vapira</p>
                <h1 style={headingStyle}>library</h1>
                <LibNav />
                {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>loading...</p>}
                {!loading && vinyls.length === 0 && (
                    <div>
                        <p style={{ color: '#555', fontSize: '0.875rem' }}>no vinyls yet</p>
                        <a href="/upload" style={{ color: '#FD5E5E', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>create one →</a>
                    </div>
                )}
                {token && vinyls.map(v => (
                    <VinylRow key={v.id} vinyl={v} token={token} onDeleted={handleDeleted} />
                ))}
            </div>
        </div>
    )
}
