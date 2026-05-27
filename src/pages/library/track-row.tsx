import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAudioPlayer } from '../../context/audio-context'
import { useAuth } from '../../context/auth-context'
import { useSaved } from '../../context/saved-context'
import { Icon } from '../../components/icon'

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

const BASE = 'https://vapira.ru'

export interface LibTrack {
    id: string
    title: string
    artist: string
    cover?: string
    src: string
    user_id?: string
}

interface TrackRowProps {
    track: LibTrack
    onRemove?: (id: string) => void
    onDelete?: (id: string) => void
    onEdited?: (updated: LibTrack) => void
    accentWhite?: boolean
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

const DownloadIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 20.3827C4.40471 20.778 4.95361 21 5.52595 21H18.4741C19.0464 21 19.5953 20.778 20 20.3827M12.0012 3V14.9425M7.06859 10.3793L12.0012 14.9425L16.9338 10.3793" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

const ReportIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12.9V8.41447M12 16.2248V16.2642M17.6699 20H6.33007C4.7811 20 3.47392 18.9763 3.06265 17.5757C2.88709 16.9778 3.10281 16.3551 3.43276 15.8249L9.10269 5.60102C10.4311 3.46632 13.5689 3.46633 14.8973 5.60103L20.5672 15.8249C20.8972 16.3551 21.1129 16.9778 20.9373 17.5757C20.5261 18.9763 19.2189 20 17.6699 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

export const TrackRow: React.FC<TrackRowProps> = ({ track, onRemove, onDelete, onEdited, accentWhite }) => {
    const { token } = useAuth()
    const navigate = useNavigate()
    const { loadAndPlayExternal, currentTrack, isPlaying, toggle } = useAudioPlayer()
    const { savedIds, toggleSaved } = useSaved()
    const [toggling, setToggling] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [reporting, setReporting] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [reported, setReported] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [localTrack, setLocalTrack] = useState(track)
    const [copied, setCopied] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const [isMobile] = useState(() => window.innerWidth < 640)

    // console.log(track, '/./././')

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

    const handleEdited = (updated: LibTrack) => {
        setLocalTrack(updated)
        onEdited?.(updated)
    }

    const handleShare = () => {
        navigator.clipboard.writeText(`${window.location.origin}/?trackId=${localTrack.id}`)
        setCopied(true)
        setMenuOpen(false)
        setTimeout(() => setCopied(false), 1500)
    }

    const handleGoToAuthor = () => {
        setMenuOpen(false)
        if (localTrack.user_id) navigate(`/pages/users/${localTrack.user_id}`)
    }

    const handleReport = async () => {
        if (!token || reporting || reported) return
        setReporting(true)
        setMenuOpen(false)
        try {
            await fetch(`${BASE}/reports/tracks/${localTrack.id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
            setReported(true)
        } finally {
            setReporting(false)
        }
    }

    const handleDownload = async () => {
        if (downloading) return
        setDownloading(true)
        try {
            const headers: Record<string, string> = {}
            if (token) headers['Authorization'] = `Bearer ${token}`
            const res = await fetch(`${BASE}/tracks/${localTrack.id}/download`, { headers })
            if (!res.ok) return
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            const disposition = res.headers.get('Content-Disposition')
            const match = disposition?.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)/)
            a.download = match?.[1] ?? `${localTrack.title}.mp3`
            a.click()
            URL.revokeObjectURL(url)
        } finally {
            setDownloading(false)
        }
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
                borderBottom: `1px solid ${accentWhite ? 'rgba(255,255,255,0.15)' : '#2a2a2a'}`,
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
                <div ref={menuRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setMenuOpen(o => !o)}
                        title="menu"
                        style={{ background: 'none', border: 'none', color: menuOpen ? '#fff' : (accentWhite ? 'rgba(255,255,255,0.6)' : '#444'), cursor: 'pointer', padding: '0.4rem 0.5rem', lineHeight: 1, display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.color = accentWhite ? 'rgba(255,255,255,0.6)' : '#444' }}
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
                                onClick={handleDownload}
                                disabled={downloading}
                                style={{ width: '100%', background: 'none', border: 'none', color: '#ccc', cursor: downloading ? 'default' : 'pointer', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', textAlign: 'left', transition: 'background 0.15s', opacity: downloading ? 0.6 : 1 }}
                                onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = '#252525' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                            >
                                {downloading
                                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="28 56" strokeLinecap="round"/></svg>
                                    : <DownloadIcon />
                                }
                                {downloading ? 'Скачивание...' : 'Скачать'}
                            </button>
                            {localTrack.user_id && (
                                <button
                                    onClick={handleGoToAuthor}
                                    style={{ width: '100%', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', textAlign: 'left', transition: 'background 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#252525' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                                >
                                    <AuthorIcon />
                                    Страница автора
                                </button>
                            )}
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
                            {isMobile && onDelete && (
                                <>
                                    <button
                                        onClick={() => { setMenuOpen(false); setEditOpen(true) }}
                                        style={{ width: '100%', background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', textAlign: 'left', transition: 'background 0.15s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#252525' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                                    >
                                        <PencilIcon />
                                        Редактировать
                                    </button>
                                    <button
                                        onClick={() => { setMenuOpen(false); handleDelete() }}
                                        disabled={deleting}
                                        style={{ width: '100%', background: 'none', border: 'none', color: '#f55', cursor: deleting ? 'default' : 'pointer', padding: '0.65rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', textAlign: 'left', transition: 'background 0.15s', opacity: deleting ? 0.6 : 1 }}
                                        onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = '#252525' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 6.17647H20M9 3H15M15.5 21H8.5C7.39543 21 6.5 20.0519 6.5 18.8824L6.0434 7.27937C6.01973 6.67783 6.47392 6.17647 7.04253 6.17647H16.9575C17.5261 6.17647 17.9803 6.67783 17.9566 7.27937L17.5 18.8824C17.5 20.0519 16.6046 21 15.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                        {deleting ? 'Удаление...' : 'Удалить'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
                {onDelete && !isMobile && (
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
