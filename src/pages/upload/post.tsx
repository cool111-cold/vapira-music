import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/auth-context'
import { PlayerTwo } from '../../components/player/player-two'

const BASE = 'https://vapira.ru'

interface TrackResult {
    id: number
    title: string
    artist: string
    avatar_url: string | null
    stream_url: string
}

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
}

const labelStyle: React.CSSProperties = {
    fontSize: '0.65rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#666',
    marginBottom: '0.35rem',
    display: 'block',
}

const fmtTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
}

const TrackMiniPlayer = ({
    track,
    onSeek,
}: {
    track: TrackResult
    onSeek: (seconds: number) => void
}) => {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [playing, setPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const src = `${BASE}${track.stream_url}`

    const toggle = () => {
        if (!audioRef.current) return
        playing ? audioRef.current.pause() : audioRef.current.play()
        setPlaying(p => !p)
    }

    const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return
        const rect = e.currentTarget.getBoundingClientRect()
        const t = ((e.clientX - rect.left) / rect.width) * duration
        audioRef.current.currentTime = t
        setCurrentTime(t)
        onSeek(Math.floor(t))
    }

    const coverSrc = track.avatar_url
        ? track.avatar_url.startsWith('http') ? track.avatar_url : `${BASE}${track.avatar_url}`
        : null

    return (
        <div style={{
            background: '#0d0d0d',
            border: '1px solid #1a1a1a',
            borderRadius: '0.75rem',
            padding: '0.875rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
        }}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                onDurationChange={() => audioRef.current && setDuration(audioRef.current.duration)}
                onEnded={() => setPlaying(false)}
            />
            <div style={{ width: 40, height: 40, borderRadius: '0.375rem', overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                {coverSrc && <img src={coverSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.title}
                </div>
                <div style={{ color: '#555', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.4rem' }}>
                    {track.artist}
                </div>
                <div
                    style={{ height: 2, background: '#222', borderRadius: 2, cursor: 'pointer', position: 'relative' }}
                    onClick={handleBarClick}
                >
                    <div style={{
                        height: '100%',
                        width: duration ? `${(currentTime / duration) * 100}%` : '0%',
                        background: '#fff',
                        borderRadius: 2,
                    }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                    <span style={{ color: '#444', fontSize: '0.6rem' }}>{fmtTime(currentTime)}</span>
                    <span style={{ color: '#444', fontSize: '0.6rem' }}>{fmtTime(duration)}</span>
                </div>
            </div>
            <button
                onClick={toggle}
                style={{
                    width: 34, height: 34, flexShrink: 0,
                    borderRadius: '50%', border: 'none',
                    backgroundColor: '#fff', color: '#000',
                    fontSize: '0.8rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                {playing ? '⏸' : '▶'}
            </button>
        </div>
    )
}

export const UploadPostPage = () => {
    const { user, token } = useAuth()
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState<TrackResult[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [selectedTrack, setSelectedTrack] = useState<TrackResult | null>(null)
    const [text, setText] = useState('')
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [videoPreview, setVideoPreview] = useState<string | null>(null)
    const [timeCode, setTimeCode] = useState('')
    const [seekSuggestion, setSeekSuggestion] = useState<number | null>(null)
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    useEffect(() => {
        return () => {
            imagePreviews.forEach(URL.revokeObjectURL)
            if (videoPreview) URL.revokeObjectURL(videoPreview)
        }
    }, [])

    useEffect(() => {
        clearTimeout(debounceRef.current)
        if (!query.trim() || !token) { setSearchResults([]); return }
        debounceRef.current = setTimeout(() => {
            setSearchLoading(true)
            fetch(`${BASE}/search?q=${encodeURIComponent(query)}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(r => r.ok ? r.json() : [])
                .then(data => setSearchResults(Array.isArray(data) ? data.slice(0, 8) : []))
                .catch(() => setSearchResults([]))
                .finally(() => setSearchLoading(false))
        }, 350)
        return () => clearTimeout(debounceRef.current)
    }, [query, token])

    const handleSelectTrack = (t: TrackResult) => {
        setSelectedTrack(t)
        setQuery('')
        setSearchResults([])
        setSeekSuggestion(null)
    }

    const handleAddImages = (files: FileList) => {
        const newFiles = Array.from(files)
        const newPreviews = newFiles.map(f => URL.createObjectURL(f))
        setImages(prev => [...prev, ...newFiles])
        setImagePreviews(prev => [...prev, ...newPreviews])
    }

    const handleRemoveImage = (idx: number) => {
        URL.revokeObjectURL(imagePreviews[idx])
        setImages(prev => prev.filter((_, i) => i !== idx))
        setImagePreviews(prev => prev.filter((_, i) => i !== idx))
    }

    const handleAddVideo = (file: File) => {
        if (videoPreview) URL.revokeObjectURL(videoPreview)
        setVideoFile(file)
        setVideoPreview(URL.createObjectURL(file))
    }

    const handleRemoveVideo = () => {
        if (videoPreview) URL.revokeObjectURL(videoPreview)
        setVideoFile(null)
        setVideoPreview(null)
    }

    const postType = videoFile ? 'video' : images.length > 0 ? 'image' : 'text'

    const handleSubmit = () => {
        const post = {
            type: postType,
            track_id: selectedTrack?.id ?? null,
            autor_id: user?.id ? Number(user.id) : null,
            vinyl_id: null,
            image: images.length > 1
                ? imagePreviews
                : images.length === 1 ? imagePreviews[0] : null,
            video: videoPreview || null,
            text,
            timeCode: timeCode !== '' ? Number(timeCode) : null,
        }
        console.log('Post data:', post)
    }

    const canSubmit = text.trim().length > 0

    return (
        <div style={{
            width: '100%',
            minHeight: '100vh',
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: isMobile ? '1rem' : '2rem',
            paddingBottom: '6rem',
        }}>
            <PlayerTwo top />
            <div style={{ width: '100%', maxWidth: '520px', marginTop: isMobile ? '4rem' : '3rem' }}>

                <h2 style={{
                    color: '#fff', fontSize: '0.85rem', letterSpacing: '0.12em',
                    textTransform: 'uppercase', marginBottom: '2rem', fontWeight: 600,
                }}>
                    Новый пост
                </h2>

                {/* Track picker */}
                <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                    <span style={labelStyle}>Трек</span>
                    {selectedTrack ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <TrackMiniPlayer track={selectedTrack} onSeek={s => setSeekSuggestion(s)} />
                            </div>
                            <button
                                onClick={() => { setSelectedTrack(null); setSeekSuggestion(null) }}
                                style={{
                                    background: 'none', border: 'none', color: '#555',
                                    cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1,
                                    padding: '0.5rem 0.25rem', flexShrink: 0,
                                }}
                            >×</button>
                        </div>
                    ) : (
                        <>
                            <input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Поиск по названию или исполнителю..."
                                style={inputStyle}
                                autoComplete="off"
                            />
                            {(searchResults.length > 0 || searchLoading) && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                                    background: '#111', border: '1px solid #222', borderRadius: '0.5rem',
                                    marginTop: '0.25rem', overflow: 'hidden',
                                }}>
                                    {searchLoading && (
                                        <div style={{ color: '#555', fontSize: '0.8rem', padding: '0.75rem 1rem' }}>поиск...</div>
                                    )}
                                    {searchResults.map(t => (
                                        <div
                                            key={t.id}
                                            onClick={() => handleSelectTrack(t)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                padding: '0.625rem 0.875rem', cursor: 'pointer',
                                                borderBottom: '1px solid #1a1a1a',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div style={{ width: 32, height: 32, borderRadius: '0.25rem', overflow: 'hidden', background: '#222', flexShrink: 0 }}>
                                                {t.avatar_url && (
                                                    <img
                                                        src={t.avatar_url.startsWith('http') ? t.avatar_url : `${BASE}${t.avatar_url}`}
                                                        alt=""
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ color: '#fff', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                                                <div style={{ color: '#555', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.artist}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Seek suggestion */}
                {seekSuggestion !== null && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.625rem 0.875rem',
                        background: '#0d0d0d', border: '1px solid #222',
                        borderRadius: '0.5rem', marginBottom: '1.25rem',
                    }}>
                        <span style={{ color: '#888', fontSize: '0.78rem', flex: 1 }}>
                            Опубликовать с тайм-кодом {fmtTime(seekSuggestion)}?
                        </span>
                        <button
                            onClick={() => { setTimeCode(String(seekSuggestion)); setSeekSuggestion(null) }}
                            style={{
                                background: '#fff', color: '#000', border: 'none',
                                borderRadius: '0.35rem', padding: '0.3rem 0.75rem',
                                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
                                textTransform: 'uppercase', cursor: 'pointer',
                            }}
                        >
                            Да
                        </button>
                        <button
                            onClick={() => setSeekSuggestion(null)}
                            style={{
                                background: 'none', color: '#555', border: 'none',
                                fontSize: '1.1rem', cursor: 'pointer', padding: '0.1rem 0.25rem', lineHeight: 1,
                            }}
                        >×</button>
                    </div>
                )}

                {/* Text */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <span style={labelStyle}>Текст</span>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Напишите что-нибудь..."
                        rows={4}
                        style={{
                            background: 'transparent',
                            border: '1px solid #333',
                            borderRadius: '0.5rem',
                            color: '#fff',
                            fontFamily: 'inherit',
                            fontSize: '0.95rem',
                            padding: '0.75rem',
                            outline: 'none',
                            width: '100%',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* Media buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <button
                        onClick={() => imageInputRef.current?.click()}
                        style={{
                            flex: 1, padding: '0.65rem',
                            background: 'none', border: '1px dashed #333',
                            borderRadius: '0.5rem', color: '#aaa',
                            fontSize: '0.75rem', letterSpacing: '0.08em',
                            textTransform: 'uppercase', cursor: 'pointer',
                            transition: 'border-color 0.2s, color 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#aaa' }}
                    >
                        + фото
                    </button>
                    <button
                        onClick={() => videoInputRef.current?.click()}
                        style={{
                            flex: 1, padding: '0.65rem',
                            background: 'none', border: '1px dashed #333',
                            borderRadius: '0.5rem', color: '#aaa',
                            fontSize: '0.75rem', letterSpacing: '0.08em',
                            textTransform: 'uppercase', cursor: 'pointer',
                            transition: 'border-color 0.2s, color 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#aaa' }}
                    >
                        + видео
                    </button>
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={e => { if (e.target.files) handleAddImages(e.target.files); e.target.value = '' }}
                    />
                    <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleAddVideo(f); e.target.value = '' }}
                    />
                </div>

                {/* Image previews */}
                {imagePreviews.length > 0 && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.min(imagePreviews.length, 3)}, 1fr)`,
                        gap: 4,
                        borderRadius: 8,
                        overflow: 'hidden',
                        marginBottom: '1.25rem',
                    }}>
                        {imagePreviews.map((src, i) => (
                            <div key={i} style={{ position: 'relative', aspectRatio: '1' }}>
                                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                <button
                                    onClick={() => handleRemoveImage(i)}
                                    style={{
                                        position: 'absolute', top: 4, right: 4,
                                        width: 22, height: 22, borderRadius: '50%',
                                        background: 'rgba(0,0,0,0.7)', border: 'none',
                                        color: '#fff', fontSize: '0.75rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        lineHeight: 1,
                                    }}
                                >×</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Video preview */}
                {videoPreview && (
                    <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                        <video
                            src={videoPreview}
                            controls
                            style={{ width: '100%', maxHeight: 300, borderRadius: 8, display: 'block' }}
                        />
                        <button
                            onClick={handleRemoveVideo}
                            style={{
                                position: 'absolute', top: 8, right: 8,
                                width: 26, height: 26, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.7)', border: 'none',
                                color: '#fff', fontSize: '1rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                lineHeight: 1,
                            }}
                        >×</button>
                    </div>
                )}

                {/* Timecode */}
                <div style={{ marginBottom: '1.75rem' }}>
                    <span style={labelStyle}>Тайм-код (секунды)</span>
                    <input
                        type="number"
                        value={timeCode}
                        onChange={e => setTimeCode(e.target.value)}
                        placeholder="0"
                        style={inputStyle}
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    style={{
                        width: '100%',
                        padding: '0.9rem',
                        backgroundColor: canSubmit ? '#fff' : '#111',
                        color: canSubmit ? '#000' : '#444',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontFamily: 'inherit',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                    }}
                >
                    Опубликовать
                </button>
            </div>
        </div>
    )
}
