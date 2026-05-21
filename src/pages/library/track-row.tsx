import React, { useState } from 'react'
import { useAudioPlayer } from '../../context/audio-context'
import { useAuth } from '../../context/auth-context'
import { useSaved } from '../../context/saved-context'
import { Icon } from '../../components/icon'

const BASE = 'https://vapira.ru'

export interface LibTrack {
    id: string
    title: string
    artist: string
    cover?: string
    src: string
}

interface TrackRowProps {
    track: LibTrack
    onRemove?: (id: string) => void
    onDelete?: (id: string) => void
    onEdited?: (updated: LibTrack) => void
}

const editInputStyle: React.CSSProperties = {
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

const editLabelStyle: React.CSSProperties = {
    color: '#888',
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '0.25rem',
    display: 'block',
}

const EditTrackModal: React.FC<{ track: LibTrack; token: string; onClose: () => void; onSaved: (updated: LibTrack) => void }> = ({ track, token, onClose, onSaved }) => {
    const [form, setForm] = useState({ title: track.title, artist: track.artist, avatar_url: track.cover ?? '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSave = async () => {
        setSaving(true)
        setError('')
        const payload: Record<string, string> = {}
        if (form.title !== track.title) payload.title = form.title
        if (form.artist !== track.artist) payload.artist = form.artist
        if (form.avatar_url !== (track.cover ?? '')) payload.avatar_url = form.avatar_url
        try {
            const res = await fetch(`${BASE}/tracks/${track.id}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error('Ошибка сохранения')
            onSaved({ ...track, title: form.title, artist: form.artist, cover: form.avatar_url || undefined })
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
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: '0.75rem', padding: '2rem', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Редактировать трек</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                </div>
                {[
                    { label: 'Название', key: 'title' as const },
                    { label: 'Исполнитель', key: 'artist' as const },
                    { label: 'Ссылка на обложку', key: 'avatar_url' as const },
                ].map(({ label, key }) => (
                    <div key={key}>
                        <label style={editLabelStyle}>{label}</label>
                        <input
                            value={form[key]}
                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            style={editInputStyle}
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

const PencilIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.7999 19.5514H19.7999M4.19995 19.5514L8.56594 18.6717C8.79771 18.625 9.01053 18.5109 9.17767 18.3437L18.9513 8.56461C19.4199 8.09576 19.4196 7.33577 18.9506 6.86731L16.8802 4.79923C16.4114 4.33097 15.6518 4.33129 15.1834 4.79995L5.40871 14.58C5.2419 14.7469 5.128 14.9593 5.08125 15.1906L4.19995 19.5514Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

export const TrackRow: React.FC<TrackRowProps> = ({ track, onRemove, onDelete, onEdited }) => {
    const { token } = useAuth()
    const { loadAndPlayExternal, currentTrack, isPlaying, toggle } = useAudioPlayer()
    const { savedIds, toggleSaved } = useSaved()
    const [toggling, setToggling] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [localTrack, setLocalTrack] = useState(track)

    const handleEdited = (updated: LibTrack) => {
        setLocalTrack(updated)
        onEdited?.(updated)
    }

    const isCurrentTrack = currentTrack?.id === localTrack.id
    const isThisPlaying = isCurrentTrack && isPlaying
    const isSaved = savedIds.has(localTrack.id)

    const handlePlay = () => {
        if (isCurrentTrack) {
            toggle()
        } else {
            loadAndPlayExternal({
                id: localTrack.id,
                name: localTrack.title,
                artist: localTrack.artist,
                cover: localTrack.cover,
                src: localTrack.src,
            })
        }
    }

    const handleSave = async () => {
        if (!token || toggling) return
        setToggling(true)
        try {
            await toggleSaved(localTrack.id)
            if (isSaved) onRemove?.(localTrack.id)
        } finally {
            setToggling(false)
        }
    }

    const handleDelete = async () => {
        if (!token || deleting) return
        setDeleting(true)
        try {
            await fetch(`${BASE}/tracks/${localTrack.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            onDelete?.(localTrack.id)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <>
            {editOpen && token && (
                <EditTrackModal
                    track={localTrack}
                    token={token}
                    onClose={() => setEditOpen(false)}
                    onSaved={handleEdited}
                />
            )}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0',
                borderBottom: '1px solid #2a2a2a',
            }}>
                <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0, cursor: 'pointer' }} onClick={handlePlay}>
                    {localTrack.cover
                        ? <img src={localTrack.cover} alt="" style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover', display: 'block' }} />
                        : <div style={{ width: 44, height: 44, borderRadius: 4, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '1.2rem' }}>♪</div>
                    }
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: 4,
                        background: isCurrentTrack ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s',
                    }}>
                        {isCurrentTrack && (
                            isThisPlaying
                                ? <Icon name="PauseIcon" size={20} color="#fff" />
                                : <Icon name="PlayTwoIcon" size={20} color="#fff" />
                        )}
                    </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{localTrack.title}</div>
                    <div style={{ color: '#666', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{localTrack.artist}</div>
                </div>
                <button
                    onClick={handlePlay}
                    title={isThisPlaying ? 'pause' : 'play'}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.4rem 0.5rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}
                >
                    {isThisPlaying
                        ? <Icon name="PauseIcon" size={18} color="#fff" />
                        : <Icon name="PlayTwoIcon" size={18} color="#fff" />
                    }
                </button>
                <button
                    onClick={handleSave}
                    disabled={toggling}
                    title={isSaved ? 'unsave' : 'save'}
                    style={{ background: 'none', border: 'none', color: isSaved ? '#fff' : '#444', cursor: toggling ? 'default' : 'pointer', fontSize: '1.2rem', padding: '0.4rem 0.5rem', lineHeight: 1 }}
                >
                    ♥
                </button>
                {onDelete && (
                    <>
                        <button
                            onClick={() => setEditOpen(true)}
                            title="edit"
                            style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '0.4rem 0.5rem', lineHeight: 1, transition: 'color 0.2s', display: 'flex' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                        >
                            <PencilIcon />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            title="delete"
                            style={{ background: 'none', border: 'none', color: '#444', cursor: deleting ? 'default' : 'pointer', padding: '0.4rem 0.5rem', lineHeight: 1, transition: 'color 0.2s', display: 'flex' }}
                            onMouseEnter={e => { if (!deleting) e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 6.17647H20M9 3H15M15.5 21H8.5C7.39543 21 6.5 20.0519 6.5 18.8824L6.0434 7.27937C6.01973 6.67783 6.47392 6.17647 7.04253 6.17647H16.9575C17.5261 6.17647 17.9803 6.67783 17.9566 7.27937L17.5 18.8824C17.5 20.0519 16.6046 21 15.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </>
    )
}
