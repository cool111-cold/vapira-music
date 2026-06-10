import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { PlayerTwo } from '../../components/player/player-two'
import { CreatePostModal } from './post'

const STEPS = ['Файл', 'Название', 'Исполнитель', 'Обложка']

const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #333',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '1rem',
    padding: '0.5rem 0',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: '0.35rem',
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
        <span style={labelStyle}>{label}</span>
        {children}
    </div>
)

const MiniPlayer = ({ file }: { file: File | null }) => {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [playing, setPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [src, setSrc] = useState<string | null>(null)

    useEffect(() => {
        if (!file) { setSrc(null); return }
        const url = URL.createObjectURL(file)
        setSrc(url)
        setPlaying(false)
        setProgress(0)
        return () => URL.revokeObjectURL(url)
    }, [file])

    const toggle = () => {
        if (!audioRef.current) return
        playing ? audioRef.current.pause() : audioRef.current.play()
        setPlaying(p => !p)
    }

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !audioRef.current.duration) return
        const rect = e.currentTarget.getBoundingClientRect()
        audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * audioRef.current.duration
    }

    if (!file) return null

    return (
        <div style={{
            marginTop: '1.75rem',
            padding: '1rem 1.25rem',
            background: '#0d0d0d',
            borderRadius: '0.75rem',
            border: '1px solid #1a1a1a',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        }}>
            {src && (
                <audio
                    ref={audioRef}
                    src={src}
                    onTimeUpdate={() => {
                        const a = audioRef.current
                        if (a && a.duration) setProgress(a.currentTime / a.duration)
                    }}
                    onEnded={() => setPlaying(false)}
                />
            )}
            <button
                onClick={toggle}
                style={{
                    width: 36, height: 36, flexShrink: 0,
                    borderRadius: '50%', border: 'none',
                    backgroundColor: '#fff', color: '#000',
                    fontSize: '0.85rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                {playing ? '⏸' : '▶'}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '0.72rem', color: '#888',
                    marginBottom: '0.5rem',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {file.name}
                </div>
                <div
                    style={{ height: 2, background: '#222', borderRadius: 2, cursor: 'pointer', position: 'relative' }}
                    onClick={handleSeek}
                >
                    <div style={{
                        height: '100%',
                        width: `${progress * 100}%`,
                        background: '#fff',
                        borderRadius: 2,
                        transition: 'width 0.1s linear',
                    }} />
                </div>
            </div>
            <span style={{ fontSize: '0.65rem', color: '#444', flexShrink: 0 }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB
            </span>
        </div>
    )
}

interface VinylItem { id: number; name: string; cover: string | null }
interface UploadedTrack { id: number; title: string; artist: string; avatar_url: string | null; stream_url: string }

export const UploadTrackPage = () => {
    const { token } = useAuth()
    const navigate = useNavigate()
    const [title, setTitle] = useState('')
    const [artist, setArtist] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
    const [uploadedTrack, setUploadedTrack] = useState<UploadedTrack | null>(null)
    const [showVinylMenu, setShowVinylMenu] = useState(false)
    const [vinyls, setVinyls] = useState<VinylItem[]>([])
    const [vinylsLoading, setVinylsLoading] = useState(false)
    const [vinylAdded, setVinylAdded] = useState(false)
    const [showPostModal, setShowPostModal] = useState(false)

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    const trackReady = !!(title.trim() && artist.trim() && avatarUrl.trim() && file)

    const completed = [!!file, !!title.trim(), !!artist.trim(), !!avatarUrl.trim()]

    const handleFile = (f: File) => {
        setFile(f)
        setTitle(f.name.replace(/\.[^/.]+$/, ''))
        setArtist(f.name.replace(/\.[^/.]+$/, ''))
        setStatus('idle')
    }

    const handleSubmit = async () => {
        if (!trackReady || !token) return
        setStatus('loading')
        setErrorMsg('')
        try {
            const form = new FormData()
            form.append('title', title)
            form.append('artist', artist)
            form.append('avatar_url', avatarUrl)
            form.append('file', file!)
            const res = await fetch('https://vapira.ru/tracks', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            })
            if (!res.ok) throw new Error((await res.json()).detail ?? 'Ошибка загрузки')
            const data = await res.json()
            setUploadedTrack({ id: data.id, title: data.title ?? title, artist: data.artist ?? artist, avatar_url: data.avatar_url ?? avatarUrl, stream_url: data.stream_url ?? '' })
            setStatus('success')
            setTitle('')
            setArtist('')
            setAvatarUrl('')
            setFile(null)
            setShowVinylMenu(false)
            setVinylAdded(false)
            setShowPostModal(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (e) {
            setStatus('error')
            setErrorMsg(e instanceof Error ? e.message : 'Ошибка загрузки')
        }
    }

    const handleOpenVinylMenu = async () => {
        setShowVinylMenu(v => !v)
        if (vinyls.length > 0) return
        setVinylsLoading(true)
        try {
            const res = await fetch('https://vapira.ru/vinyl?mode=created', { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setVinyls(await res.json())
        } finally {
            setVinylsLoading(false)
        }
    }

    const handleAddToVinyl = async (vinylId: number) => {
        if (!uploadedTrack || !token) return
        await fetch(`https://vapira.ru/vinyl/${vinylId}/tracks/${uploadedTrack.id}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        })
        setVinylAdded(true)
        setShowVinylMenu(false)
    }

    return (
        <>
        <div style={{
            width: '100%',
            minHeight: '100vh',
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: isMobile ? 'flex-start' : 'center',
            padding: isMobile ? '1rem' : '2rem',
            paddingBottom: isMobile ? '6rem' : '2rem',
        }}>
            <PlayerTwo top />
            <div style={{ width: '100%', maxWidth: '820px', marginTop: isMobile ? '1rem' : 0 }}>

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: isMobile ? '1.75rem' : '2.75rem' }}>
                    {STEPS.map((label, i) => {
                        const done = completed[i]
                        return (
                            <React.Fragment key={i}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
                                    <div style={{
                                        width: isMobile ? 22 : 26, height: isMobile ? 22 : 26,
                                        borderRadius: '50%',
                                        backgroundColor: done ? '#fff' : '#111',
                                        border: `1px solid ${done ? '#fff' : '#2a2a2a'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: 700,
                                        color: done ? '#000' : '#444',
                                        transition: 'all 0.25s',
                                    }}>{i + 1}</div>
                                    <span style={{
                                        fontSize: isMobile ? '0.5rem' : '0.58rem',
                                        color: done ? '#fff' : '#444',
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        transition: 'color 0.25s',
                                    }}>{label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div style={{
                                        flex: 1,
                                        height: 1,
                                        backgroundColor: done ? '#fff' : '#1e1e1e',
                                        margin: isMobile ? '0.55rem 0.4rem 0' : '0.75rem 0.6rem 0',
                                        transition: 'background-color 0.25s',
                                    }} />
                                )}
                            </React.Fragment>
                        )
                    })}
                </div>

                {/* Layout: row on desktop, column on mobile */}
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '1.5rem' : '2.5rem',
                    alignItems: 'flex-start',
                }}>

                    {/* File drop */}
                    <div
                        style={{
                            flex: isMobile ? 'none' : '0 0 220px',
                            width: isMobile ? '100%' : undefined,
                            border: '1px dashed',
                            borderColor: file ? '#fff' : '#252525',
                            borderRadius: '1rem',
                            padding: isMobile ? '1.25rem 1rem' : '2rem 1.25rem',
                            display: 'flex',
                            flexDirection: isMobile ? 'row' : 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            cursor: 'pointer',
                            minHeight: isMobile ? 'auto' : '200px',
                            transition: 'border-color 0.2s',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {file ? (
                            <>
                                <span style={{ fontSize: isMobile ? '1.5rem' : '2rem', flexShrink: 0 }}>♪</span>
                                <span style={{
                                    color: '#ccc', fontSize: '0.75rem', lineHeight: 1.4,
                                    flex: isMobile ? 1 : undefined,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    textAlign: isMobile ? 'left' : 'center',
                                }}>{file.name}</span>
                                <span style={{ color: '#fff', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>заменить</span>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: isMobile ? '2rem' : '2.5rem', color: '#252525', lineHeight: 1 }}>+</span>
                                <span style={{ color: '#3a3a3a', fontSize: '0.78rem', letterSpacing: '0.04em' }}>добавить аудио</span>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*"
                            style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                        />
                    </div>

                    {/* Fields */}
                    <div style={{ flex: 1, width: isMobile ? '100%' : undefined }}>
                        <Field label="Название">
                            <input
                                style={inputStyle}
                                placeholder="Название трека"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </Field>
                        <Field label="Исполнитель">
                            <input
                                style={inputStyle}
                                placeholder="Имя исполнителя"
                                value={artist}
                                onChange={e => setArtist(e.target.value)}
                            />
                        </Field>
                        <Field label="Обложка (URL)">
                            <input
                                style={inputStyle}
                                placeholder="https://..."
                                value={avatarUrl}
                                onChange={e => setAvatarUrl(e.target.value)}
                            />
                        </Field>

                        {status === 'error' && (
                            <p style={{ color: '#FD5E5E', fontSize: '0.78rem', marginBottom: '1rem' }}>{errorMsg}</p>
                        )}
                        {status === 'success' && (
                            <div style={{ marginBottom: '1rem' }}>
                                <p style={{ color: '#5efd9a', fontSize: '0.78rem', marginBottom: '0.75rem' }}>трек загружен</p>
                                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={handleOpenVinylMenu}
                                        style={{
                                            padding: '0.45rem 0.9rem',
                                            background: vinylAdded ? '#1a1a1a' : '#111',
                                            border: `1px solid ${vinylAdded ? '#5efd9a' : '#2a2a2a'}`,
                                            borderRadius: '0.4rem',
                                            color: vinylAdded ? '#5efd9a' : '#aaa',
                                            fontSize: '0.72rem',
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        {vinylAdded ? '✓ добавлено в пластинку' : '+ в пластинку'}
                                    </button>
                                    <button
                                        onClick={() => navigate(`/pages/lyrics-editor${uploadedTrack?.id ? `?trackId=${uploadedTrack.id}` : ''}`)}
                                        style={{
                                            padding: '0.45rem 0.9rem',
                                            background: '#111',
                                            border: '1px solid #2a2a2a',
                                            borderRadius: '0.4rem',
                                            color: '#aaa',
                                            fontSize: '0.72rem',
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        + субтитры
                                    </button>
                                    <button
                                        onClick={() => setShowPostModal(true)}
                                        style={{
                                            padding: '0.45rem 0.9rem',
                                            background: '#111',
                                            border: '1px solid #2a2a2a',
                                            borderRadius: '0.4rem',
                                            color: '#aaa',
                                            fontSize: '0.72rem',
                                            letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit',
                                        }}
                                    >
                                        + создать пост
                                    </button>
                                </div>
                                {showVinylMenu && (
                                    <div style={{
                                        marginTop: '0.6rem',
                                        background: '#0d0d0d',
                                        border: '1px solid #1e1e1e',
                                        borderRadius: '0.5rem',
                                        overflow: 'hidden',
                                        maxHeight: '220px',
                                        overflowY: 'auto',
                                    }}>
                                        {vinylsLoading && (
                                            <p style={{ color: '#555', fontSize: '0.72rem', padding: '0.75rem 1rem', margin: 0 }}>загрузка...</p>
                                        )}
                                        {!vinylsLoading && vinyls.length === 0 && (
                                            <p style={{ color: '#555', fontSize: '0.72rem', padding: '0.75rem 1rem', margin: 0 }}>нет пластинок</p>
                                        )}
                                        {vinyls.map(v => (
                                            <div
                                                key={v.id}
                                                onClick={() => handleAddToVinyl(v.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.6rem',
                                                    padding: '0.6rem 1rem',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #111',
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.background = '#151515')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                {v.cover && (
                                                    <img src={`https://vapira.ru/${v.cover}`} alt="" style={{ width: 28, height: 28, borderRadius: '0.25rem', objectFit: 'cover', flexShrink: 0 }} />
                                                )}
                                                <span style={{ fontSize: '0.78rem', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={!trackReady || status === 'loading'}
                            style={{
                                width: '100%',
                                padding: '0.9rem',
                                backgroundColor: trackReady && status !== 'loading' ? '#fff' : '#111',
                                color: trackReady && status !== 'loading' ? '#000' : '#444',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontFamily: 'inherit',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                cursor: trackReady && status !== 'loading' ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                            }}
                        >
                            {status === 'loading' ? 'загрузка...' : 'загрузить'}
                        </button>
                    </div>
                </div>

                {/* Mini player */}
                <MiniPlayer file={file} />
            </div>
        </div>
        {showPostModal && (
            <CreatePostModal
                onClose={() => setShowPostModal(false)}
                defaultTrack={uploadedTrack}
                onCreated={() => setShowPostModal(false)}
            />
        )}
        </>
    )
}
