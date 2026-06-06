import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/auth-context'

const BASE = 'https://vapira.ru'

interface TrackResult {
    id: number
    title: string
    artist: string
    avatar_url: string | null
    stream_url: string
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                onDurationChange={() => audioRef.current && setDuration(audioRef.current.duration)}
                onEnded={() => setPlaying(false)}
            />
            <button
                onClick={toggle}
                style={{
                    width: 32, height: 32, flexShrink: 0,
                    borderRadius: '50%', border: 'none',
                    backgroundColor: '#fff', color: '#000',
                    fontSize: '0.75rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                {playing ? '⏸' : '▶'}
            </button>
            <div style={{ width: 36, height: 36, borderRadius: '0.3rem', overflow: 'hidden', background: '#1a1a1a', flexShrink: 0 }}>
                {coverSrc && <img src={coverSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.title}
                </div>
                <div style={{ color: '#666', fontSize: '0.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.35rem' }}>
                    {track.artist}
                </div>
                <div
                    style={{ height: 2, background: '#2a2a2a', borderRadius: 2, cursor: 'pointer', position: 'relative' }}
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
                    <span style={{ color: '#555', fontSize: '0.6rem' }}>{fmtTime(currentTime)}</span>
                    <span style={{ color: '#555', fontSize: '0.6rem' }}>{fmtTime(duration)}</span>
                </div>
            </div>
        </div>
    )
}

const IconPhoto = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
    </svg>
)

const IconVideo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 10l4.553-2.276A1 1 0 0121 8.724v6.552a1 1 0 01-1.447.894L15 14" />
        <rect x="3" y="6" width="12" height="12" rx="2" />
    </svg>
)

const IconMusic = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
)

const PostComposer = ({ onClose }: { onClose: () => void }) => {
    const { user, token } = useAuth()
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState<TrackResult[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [selectedTrack, setSelectedTrack] = useState<TrackResult | null>(null)
    const [showTrackPicker, setShowTrackPicker] = useState(false)
    const [text, setText] = useState('')
    const [images, setImages] = useState<File[]>([])
    const [imagePreviews, setImagePreviews] = useState<string[]>([])
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [videoPreview, setVideoPreview] = useState<string | null>(null)
    const [timeCode, setTimeCode] = useState<number | null>(null)
    const [seekSuggestion, setSeekSuggestion] = useState<number | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const pickerRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        return () => {
            imagePreviews.forEach(URL.revokeObjectURL)
            if (videoPreview) URL.revokeObjectURL(videoPreview)
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowTrackPicker(false)
                setQuery('')
                setSearchResults([])
            }
        }
        if (showTrackPicker) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showTrackPicker])

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

    const autoResizeTextarea = () => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
    }

    const handleSelectTrack = (t: TrackResult) => {
        setSelectedTrack(t)
        setQuery('')
        setSearchResults([])
        setShowTrackPicker(false)
        setSeekSuggestion(null)
        setTimeCode(null)
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

    const handleSubmit = async () => {
        if (!token || submitting) return
        setSubmitting(true)
        setError('')
        try {
            const type = videoFile ? 'images' : images.length > 0 ? 'images' : 'text'

            const fd = new FormData()
            fd.append('type', type)
            if (text.trim()) fd.append('text', text.trim())
            if (selectedTrack) fd.append('track_id', String(selectedTrack.id))
            if (timeCode !== null) fd.append('time_code', String(timeCode))
            images.forEach(img => fd.append('image', img))
            if (videoFile) fd.append('video', videoFile)

            const res = await fetch(`${BASE}/posts`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => null)
                throw new Error(errData?.detail ?? `Ошибка ${res.status}`)
            }
            onClose()
        } catch (e: any) {
            setError(e.message ?? 'Ошибка')
        } finally {
            setSubmitting(false)
        }
    }

    const canSubmit = !submitting && (text.trim().length > 0 || selectedTrack !== null || images.length > 0 || videoFile !== null)

    const avatarInitial = user?.name ? user.name[0].toUpperCase() : '?'

    return (
        <div style={{
            background: '#0a0a0a',
            border: '1px solid #1c1c1c',
            borderRadius: '1rem',
            overflow: 'visible',
        }}>
            {/* Text area */}
            <div style={{ display: 'flex', gap: '0.875rem', padding: '1.25rem 1.25rem 0' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: '#1a1a1a', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#666', fontSize: '0.85rem', fontWeight: 600,
                }}>
                    {avatarInitial}
                </div>
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={e => { setText(e.target.value); autoResizeTextarea() }}
                    placeholder="Что нового..."
                    rows={3}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: '#fff',
                        fontFamily: 'inherit',
                        fontSize: '1rem',
                        lineHeight: 1.5,
                        outline: 'none',
                        resize: 'none',
                        padding: '0.5rem 0',
                        minHeight: 72,
                    }}
                />
            </div>

            {/* Image previews */}
            {imagePreviews.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: imagePreviews.length === 1 ? '1fr' : `repeat(${Math.min(imagePreviews.length, 3)}, 1fr)`,
                    gap: 3,
                    margin: '1rem 1.25rem 0',
                    borderRadius: '0.625rem',
                    overflow: 'hidden',
                }}>
                    {imagePreviews.map((src, i) => (
                        <div key={i} style={{ position: 'relative', aspectRatio: imagePreviews.length === 1 ? '16/9' : '1' }}>
                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <button
                                onClick={() => handleRemoveImage(i)}
                                style={{
                                    position: 'absolute', top: 6, right: 6,
                                    width: 24, height: 24, borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.75)', border: 'none',
                                    color: '#fff', fontSize: '0.8rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                            >×</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Video preview */}
            {videoPreview && (
                <div style={{ position: 'relative', margin: '1rem 1.25rem 0', borderRadius: '0.625rem', overflow: 'hidden' }}>
                    <video src={videoPreview} controls style={{ width: '100%', maxHeight: 260, display: 'block' }} />
                    <button
                        onClick={handleRemoveVideo}
                        style={{
                            position: 'absolute', top: 8, right: 8,
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'rgba(0,0,0,0.75)', border: 'none',
                            color: '#fff', fontSize: '1rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >×</button>
                </div>
            )}

            {/* Selected track */}
            {selectedTrack && (
                <div style={{
                    margin: '1rem 1.25rem 0',
                    background: '#111',
                    border: '1px solid #1e1e1e',
                    borderRadius: '0.625rem',
                    padding: '0.75rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <TrackMiniPlayer track={selectedTrack} onSeek={s => setSeekSuggestion(s)} />
                        </div>
                        <button
                            onClick={() => { setSelectedTrack(null); setSeekSuggestion(null); setTimeCode(null) }}
                            style={{
                                background: 'none', border: 'none', color: '#555',
                                cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1,
                                padding: '0.2rem 0.25rem', flexShrink: 0, marginTop: '0.1rem',
                            }}
                        >×</button>
                    </div>
                    {seekSuggestion !== null && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            marginTop: '0.625rem',
                            padding: '0.5rem 0.625rem',
                            background: '#0d0d0d', borderRadius: '0.4rem',
                            border: '1px solid #222',
                        }}>
                            <span style={{ color: '#888', fontSize: '0.75rem', flex: 1 }}>
                                Тайм-код {fmtTime(seekSuggestion)}?
                            </span>
                            <button
                                onClick={() => { setTimeCode(seekSuggestion); setSeekSuggestion(null) }}
                                style={{
                                    background: '#fff', color: '#000', border: 'none',
                                    borderRadius: '0.3rem', padding: '0.25rem 0.6rem',
                                    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
                                    textTransform: 'uppercase', cursor: 'pointer',
                                }}
                            >Да</button>
                            <button
                                onClick={() => setSeekSuggestion(null)}
                                style={{ background: 'none', color: '#555', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0 0.2rem', lineHeight: 1 }}
                            >×</button>
                        </div>
                    )}
                    {timeCode !== null && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#555', fontSize: '0.7rem' }}>тайм-код:</span>
                            <span style={{ color: '#aaa', fontSize: '0.7rem', fontWeight: 600 }}>{fmtTime(timeCode)}</span>
                            <button
                                onClick={() => setTimeCode(null)}
                                style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1, padding: 0 }}
                            >×</button>
                        </div>
                    )}
                </div>
            )}

            {/* Track picker */}
            {showTrackPicker && !selectedTrack && (
                <div ref={pickerRef} style={{
                    margin: '0.875rem 1.25rem 0',
                    background: '#111',
                    border: '1px solid #1e1e1e',
                    borderRadius: '0.625rem',
                    overflow: 'hidden',
                }}>
                    <div style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid #1a1a1a' }}>
                        <input
                            autoFocus
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Поиск трека..."
                            style={{
                                background: 'transparent', border: 'none',
                                color: '#fff', fontFamily: 'inherit',
                                fontSize: '0.9rem', outline: 'none', width: '100%', padding: 0,
                            }}
                        />
                    </div>
                    {searchLoading && (
                        <div style={{ color: '#555', fontSize: '0.8rem', padding: '0.75rem 1rem' }}>поиск...</div>
                    )}
                    {!searchLoading && query.trim() && searchResults.length === 0 && (
                        <div style={{ color: '#555', fontSize: '0.8rem', padding: '0.75rem 1rem' }}>ничего не найдено</div>
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
                            <div style={{ width: 34, height: 34, borderRadius: '0.3rem', overflow: 'hidden', background: '#222', flexShrink: 0 }}>
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

            {/* Bottom toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                marginTop: '0.75rem',
                borderTop: '1px solid #141414',
                gap: '0.25rem',
            }}>
                <button
                    onClick={() => imageInputRef.current?.click()}
                    title="Добавить фото"
                    style={{
                        background: 'none', border: 'none', color: '#555', cursor: 'pointer',
                        padding: '0.4rem', borderRadius: '0.4rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#1a1a1a' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'none' }}
                >
                    <IconPhoto />
                </button>
                <button
                    onClick={() => videoInputRef.current?.click()}
                    title="Добавить видео"
                    style={{
                        background: 'none', border: 'none', color: '#555', cursor: 'pointer',
                        padding: '0.4rem', borderRadius: '0.4rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#1a1a1a' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = 'none' }}
                >
                    <IconVideo />
                </button>
                <button
                    onClick={() => setShowTrackPicker(v => !v)}
                    title="Прикрепить трек"
                    style={{
                        background: 'none', border: 'none',
                        color: selectedTrack ? '#fff' : '#555',
                        cursor: 'pointer',
                        padding: '0.4rem', borderRadius: '0.4rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'color 0.15s, background 0.15s',
                        position: 'relative',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = '#1a1a1a' }}
                    onMouseLeave={e => { e.currentTarget.style.color = selectedTrack ? '#fff' : '#555'; e.currentTarget.style.background = 'none' }}
                >
                    <IconMusic />
                    {!selectedTrack && (
                        <span style={{
                            position: 'absolute', top: 4, right: 4,
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#e55',
                        }} />
                    )}
                </button>

                <div style={{ flex: 1 }} />

                {text.length > 0 && (
                    <span style={{ color: '#444', fontSize: '0.72rem', marginRight: '0.5rem' }}>
                        {text.length}
                    </span>
                )}

                {error && (
                    <span style={{ color: '#ff6b6b', fontSize: '0.7rem', marginRight: '0.5rem', whiteSpace: 'nowrap' }}>
                        {error}
                    </span>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    style={{
                        padding: '0.5rem 1.25rem',
                        backgroundColor: canSubmit ? '#fff' : '#181818',
                        color: canSubmit ? '#000' : '#444',
                        border: 'none',
                        borderRadius: '2rem',
                        fontFamily: 'inherit',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {submitting ? '...' : 'Опубликовать'}
                </button>
            </div>

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
    )
}

export const CreatePostModal = ({ onClose }: { onClose: () => void }) => {
    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div style={{
                width: '100%', maxWidth: 560,
                maxHeight: '90vh', overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: '1rem',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                        color: '#fff', fontSize: '0.8rem',
                        letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
                    }}>
                        Новый пост
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', color: '#666',
                            cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1,
                            padding: '0.25rem',
                        }}
                    >×</button>
                </div>
                <PostComposer onClose={onClose} />
            </div>
        </div>
    )
}
