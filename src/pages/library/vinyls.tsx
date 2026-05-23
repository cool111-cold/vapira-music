import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { useSavedVinyls } from '../../context/saved-vinyls-context'
import { LibNav } from './lib-nav'
import { PlayerTwo } from '../../components/player/player-two'

const BASE = 'https://vapira.ru'

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
                                <span style={{ color: already ? '#555' : isAdding ? '#888' : '#fff', fontSize: '1.25rem', flexShrink: 0 }}>
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

export interface VinylApi {
    id: number
    name: string
    artist: string | null
    description: string | null
    bg_color: string | null
    second_color: string | null
    disk_image: string | null
    cover: string | null
    video_cover: string | null
    user_id: number
}

const vinylEditInputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #444',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    padding: '0.4rem 0',
    outline: 'none',
    width: '100%',
}

const vinylEditLabelStyle: React.CSSProperties = {
    color: '#888',
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '0.25rem',
    display: 'block',
}

const PencilIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.7999 19.5514H19.7999M4.19995 19.5514L8.56594 18.6717C8.79771 18.625 9.01053 18.5109 9.17767 18.3437L18.9513 8.56461C19.4199 8.09576 19.4196 7.33577 18.9506 6.86731L16.8802 4.79923C16.4114 4.33097 15.6518 4.33129 15.1834 4.79995L5.40871 14.58C5.2419 14.7469 5.128 14.9593 5.08125 15.1906L4.19995 19.5514Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

const ShareIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.37851 10.1907L5.14505 12.4242C4.31092 13.2583 3.83124 14.3933 3.84001 15.5861C3.84877 16.7789 4.31796 17.9208 5.19167 18.7675C6.03836 19.6413 7.18048 20.1104 8.3731 20.1192C9.59293 20.1282 10.701 19.6755 11.5352 18.8414L13.7687 16.6079M16.6215 13.8097L18.8549 11.5762C19.6891 10.7421 20.1688 9.60711 20.16 8.4143C20.1512 7.22149 19.682 6.0796 18.8083 5.23287C17.9618 4.38638 16.8199 3.91717 15.6271 3.90841C14.4343 3.89964 13.2992 4.35209 12.465 5.18625L10.2315 7.4197M8.6131 15.3274L15.3135 8.62701" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

const DotsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.0001 7.1999C10.6746 7.1999 9.6001 6.12539 9.6001 4.7999C9.6001 3.47442 10.6746 2.3999 12.0001 2.3999C13.3256 2.3999 14.4001 3.47442 14.4001 4.7999C14.4001 6.12539 13.3256 7.1999 12.0001 7.1999Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12.0001 14.3999C10.6746 14.3999 9.6001 13.3254 9.6001 11.9999C9.6001 10.6744 10.6746 9.5999 12.0001 9.5999C13.3256 9.5999 14.4001 10.6744 14.4001 11.9999C14.4001 13.3254 13.3256 14.3999 12.0001 14.3999Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12.0001 21.5999C10.6746 21.5999 9.6001 20.5254 9.6001 19.1999C9.6001 17.8744 10.6746 16.7999 12.0001 16.7999C13.3256 16.7999 14.4001 17.8744 14.4001 19.1999C14.4001 20.5254 13.3256 21.5999 12.0001 21.5999Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
)

const AuthorIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.23779 19.5C4.5632 17.2892 7.46807 15.7762 12.0001 15.7762C16.5321 15.7762 19.4369 17.2892 20.7623 19.5M15.6001 8.1C15.6001 10.0882 13.9883 11.7 12.0001 11.7C10.0118 11.7 8.40007 10.0882 8.40007 8.1C8.40007 6.11177 10.0118 4.5 12.0001 4.5C13.9883 4.5 15.6001 6.11177 15.6001 8.1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
)

const ReportIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12.9V8.41447M12 16.2248V16.2642M17.6699 20H6.33007C4.7811 20 3.47392 18.9763 3.06265 17.5757C2.88709 16.9778 3.10281 16.3551 3.43276 15.8249L9.10269 5.60102C10.4311 3.46632 13.5689 3.46633 14.8973 5.60103L20.5672 15.8249C20.8972 16.3551 21.1129 16.9778 20.9373 17.5757C20.5261 18.9763 19.2189 20 17.6699 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

const EditVinylModal: React.FC<{ vinyl: VinylApi; token: string; onClose: () => void; onSaved: (updated: VinylApi) => void }> = ({ vinyl, token, onClose, onSaved }) => {
    const [form, setForm] = useState({
        name: vinyl.name,
        artist: vinyl.artist ?? '',
        description: vinyl.description ?? '',
        bg_color: vinyl.bg_color ?? '',
        second_color: vinyl.second_color ?? '',
        disk_image: vinyl.disk_image ?? '',
        cover: vinyl.cover ?? '',
        video_cover: vinyl.video_cover ?? '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const set = (key: keyof typeof form, val: string) => setForm(f => ({ ...f, [key]: val }))

    const handleSave = async () => {
        setSaving(true)
        setError('')
        const payload: Record<string, string> = {}
        const fields: (keyof typeof form)[] = ['name', 'artist', 'description', 'bg_color', 'second_color', 'disk_image', 'cover', 'video_cover']
        for (const k of fields) {
            const orig = (vinyl[k as keyof VinylApi] ?? '') as string
            if (form[k] !== orig) payload[k] = form[k]
        }
        try {
            const res = await fetch(`${BASE}/vinyl/${vinyl.id}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error('Ошибка сохранения')
            onSaved({
                ...vinyl,
                name: form.name,
                artist: form.artist || null,
                description: form.description || null,
                bg_color: form.bg_color || null,
                second_color: form.second_color || null,
                disk_image: form.disk_image || null,
                cover: form.cover || null,
                video_cover: form.video_cover || null,
            })
            onClose()
        } catch (e: any) {
            setError(e.message ?? 'Ошибка')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: '0.75rem', padding: '2rem', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Редактировать пластинку</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                </div>
                {([
                    { label: 'Название', key: 'name' },
                    { label: 'Исполнитель', key: 'artist' },
                    { label: 'Описание', key: 'description' },
                    { label: 'Основной цвет (HEX)', key: 'bg_color' },
                    { label: 'Второй цвет (HEX)', key: 'second_color' },
                    { label: 'Обложка (URL)', key: 'cover' },
                    { label: 'Изображение диска (URL)', key: 'disk_image' },
                    { label: 'Видеообложка (URL)', key: 'video_cover' },
                ] as { label: string; key: keyof typeof form }[]).map(({ label, key }) => (
                    <div key={key}>
                        <label style={vinylEditLabelStyle}>{label}</label>
                        <input
                            value={form[key]}
                            onChange={e => set(key, e.target.value)}
                            style={vinylEditInputStyle}
                            autoComplete="off"
                        />
                    </div>
                ))}
                {error && <p style={{ color: '#f55', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '0.4rem', padding: '0.65rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, alignSelf: 'flex-end' }}
                >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
            </div>
        </div>
    )
}

interface VinylRowProps {
    vinyl: VinylApi
    token: string
    onDeleted: (id: number) => void
    showSave?: boolean
    initialSaved?: boolean
}

export const VinylRow: React.FC<VinylRowProps> = ({ vinyl, token, onDeleted, showSave, initialSaved }) => {
    const navigate = useNavigate()
    const { savedVinylIds, toggleSavedVinyl } = useSavedVinyls()
    const [open, setOpen] = useState(false)
    const [tracks, setTracks] = useState<TrackApi[]>([])
    const [tracksLoaded, setTracksLoaded] = useState(false)
    const [tracksLoading, setTracksLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [removingId, setRemovingId] = useState<number | null>(null)
    const [editOpen, setEditOpen] = useState(false)
    const [localVinyl, setLocalVinyl] = useState(vinyl)
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [reporting, setReporting] = useState(false)
    const [reported, setReported] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const saved = savedVinylIds.has(localVinyl.id)

    useEffect(() => {
        if (!menuOpen) return
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [menuOpen])

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation()
        navigator.clipboard.writeText(`${window.location.origin}/pages/vinyl?vinylId=${localVinyl.id}`)
        setCopied(true)
        setMenuOpen(false)
        setTimeout(() => setCopied(false), 1500)
    }

    const handleGoToAuthor = (e: React.MouseEvent) => {
        e.stopPropagation()
        setMenuOpen(false)
        navigate(`/pages/users/${localVinyl.user_id}`)
    }

    const handleReport = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (reporting || reported) return
        setReporting(true)
        setMenuOpen(false)
        try {
            await fetch(`${BASE}/reports/vinyl/${localVinyl.id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
            setReported(true)
        } finally {
            setReporting(false)
        }
    }

    const loadTracks = useCallback(() => {
        if (tracksLoaded) return
        setTracksLoading(true)
        fetch(`${BASE}/vinyl/${vinyl.id}/tracks`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { setTracks(Array.isArray(data) ? data : []); setTracksLoaded(true) })
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

    const handleSaveVinyl = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (saving) return
        setSaving(true)
        try {
            await toggleSavedVinyl(localVinyl.id)
            if (saved && initialSaved) onDeleted(localVinyl.id)
        } finally {
            setSaving(false)
        }
    }

    const existingIds = new Set(tracks.map(t => t.id))

    return (
        <>
            {editOpen && (
                <EditVinylModal
                    vinyl={localVinyl}
                    token={token}
                    onClose={() => setEditOpen(false)}
                    onSaved={updated => setLocalVinyl(updated)}
                />
            )}
            <div style={{ borderBottom: '1px solid #2a2a2a' }}>
            <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 0', cursor: 'pointer' }}
                onClick={handleToggle}
            >
                {localVinyl.cover
                    ? <img src={`${BASE}${localVinyl.cover}`} alt="" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 40, height: 40, borderRadius: 4, background: localVinyl.bg_color ?? '#333', flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{localVinyl.name}</div>
                    {localVinyl.artist && <div style={{ color: '#666', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{localVinyl.artist}</div>}
                </div>
                <span style={{ color: '#444', flexShrink: 0, display: 'flex', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 10L12.0008 14.58L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </span>
                {showSave && (
                    <button
                        onClick={handleSaveVinyl}
                        disabled={saving}
                        title={saved ? 'unsave' : 'save'}
                        style={{ background: 'none', border: 'none', color: saved ? '#fff' : '#444', cursor: saving ? 'default' : 'pointer', fontSize: '1.2rem', padding: '0.25rem 0.5rem', lineHeight: 1, flexShrink: 0 }}
                    >
                        ♥
                    </button>
                )}
                <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
                        title="menu"
                        style={{ background: 'none', border: 'none', color: menuOpen ? '#fff' : '#444', cursor: 'pointer', padding: '0.25rem 0.5rem', lineHeight: 1, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.color = '#444' }}
                    >
                        <DotsIcon />
                    </button>
                    {menuOpen && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '0.5rem', overflow: 'hidden', minWidth: 160 }}>
                            <button
                                onClick={handleShare}
                                style={{ width: '100%', background: 'none', border: 'none', color: copied ? '#4ade80' : '#ccc', cursor: 'pointer', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', textAlign: 'left', transition: 'background 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#252525' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                            >
                                {copied
                                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    : <ShareIcon />
                                }
                                {copied ? 'Скопировано' : 'Поделиться'}
                            </button>
                            <button
                                onClick={handleGoToAuthor}
                                style={{ width: '100%', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', textAlign: 'left', transition: 'background 0.15s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#252525' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                            >
                                <AuthorIcon />
                                Страница автора
                            </button>
                            {!showSave && <button
                                onClick={e => { e.stopPropagation(); setEditOpen(true) }}
                                title="edit vinyl"
                                style={{ width: '100%', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', textAlign: 'left', transition: 'background 0.15s' }}                                onMouseEnter={e => { e.currentTarget.style.background = '#252525' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                            >
                                <PencilIcon />
                                Редактировать
                            </button>}
                            <button
                                onClick={handleReport}
                                disabled={reporting || reported}
                                style={{ width: '100%', background: 'none', border: 'none', color: reported ? '#4ade80' : '#ccc', cursor: reporting || reported ? 'default' : 'pointer', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', textAlign: 'left', transition: 'background 0.15s', opacity: reporting ? 0.6 : 1 }}
                                onMouseEnter={e => { if (!reporting && !reported) e.currentTarget.style.background = '#252525' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                            >
                                <ReportIcon />
                                {reported ? 'Жалоба отправлена' : 'Пожаловаться'}
                            </button>
                        </div>
                    )}
                </div>
                {!showSave && (
                    <>
                        {/* <button
                            onClick={e => { e.stopPropagation(); setEditOpen(true) }}
                            title="edit vinyl"
                            style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '0.25rem 0.5rem', lineHeight: 1, flexShrink: 0, transition: 'color 0.2s', display: 'flex' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                        >
                            <PencilIcon />
                        </button> */}
                        {confirmDelete ? (
                            <>
                                <button
                                    onClick={e => { e.stopPropagation(); handleDelete() }}
                                    disabled={deleting}
                                    style={{ background: 'none', border: 'none', color: '#fff', cursor: deleting ? 'default' : 'pointer', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.25rem 0.4rem', lineHeight: 1, flexShrink: 0 }}
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
                                style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem 0.5rem', lineHeight: 1, flexShrink: 0, transition: 'color 0.2s', display: 'flex' }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 6.17647H20M9 3H15M15.5 21H8.5C7.39543 21 6.5 20.0519 6.5 18.8824L6.0434 7.27937C6.01973 6.67783 6.47392 6.17647 7.04253 6.17647H16.9575C17.5261 6.17647 17.9803 6.67783 17.9566 7.27937L17.5 18.8824C17.5 20.0519 16.6046 21 15.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        )}
                    </>
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
                            {!showSave && (
                                <button
                                    onClick={() => handleRemoveTrack(track.id)}
                                    disabled={removingId === track.id}
                                    title="remove from vinyl"
                                    style={{ background: 'none', border: 'none', color: '#444', cursor: removingId === track.id ? 'default' : 'pointer', padding: '0.25rem 0.4rem', lineHeight: 1, transition: 'color 0.2s', display: 'flex' }}
                                    onMouseEnter={e => { if (removingId !== track.id) e.currentTarget.style.color = '#fff' }}
                                    onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 6.17647H20M9 3H15M15.5 21H8.5C7.39543 21 6.5 20.0519 6.5 18.8824L6.0434 7.27937C6.01973 6.67783 6.47392 6.17647 7.04253 6.17647H16.9575C17.5261 6.17647 17.9803 6.67783 17.9566 7.27937L17.5 18.8824C17.5 20.0519 16.6046 21 15.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                    {!showSave && (
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
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#aaa' }}
                        >
                            + add track
                        </button>
                    )}
                </div>
            )}

            {showModal && (
                <AddTrackModal
                    vinylId={localVinyl.id}
                    vinylName={localVinyl.name}
                    existingTrackIds={existingIds}
                    token={token}
                    onClose={() => setShowModal(false)}
                    onAdded={handleTrackAdded}
                />
            )}
        </div>
    </>
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
                        <a href="/pages/upload/vinyl" style={{ color: '#fff', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>create one →</a>
                    </div>
                )}
                {token && vinyls.map(v => (
                    <VinylRow key={v.id} vinyl={v} token={token} onDeleted={handleDeleted} />
                ))}
            </div>
        </div>
    )
}
