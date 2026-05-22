import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/auth-context'
import { PlayerTwo } from '../../components/player/player-two'

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

export const UploadTrackPage = () => {
    const { token } = useAuth()
    const [title, setTitle] = useState('')
    const [artist, setArtist] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

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
            setStatus('success')
            setTitle('')
            setArtist('')
            setAvatarUrl('')
            setFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (e) {
            setStatus('error')
            setErrorMsg(e instanceof Error ? e.message : 'Ошибка загрузки')
        }
    }

    return (
        <div style={{
            width: '100%',
            minHeight: '100vh',
            backgroundColor: '#000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
        }}>
            <PlayerTwo top />
            <div style={{ width: '100%', maxWidth: '820px' }}>

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2.75rem' }}>
                    {STEPS.map((label, i) => {
                        const done = completed[i]
                        return (
                            <React.Fragment key={i}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
                                    <div style={{
                                        width: 26, height: 26,
                                        borderRadius: '50%',
                                        backgroundColor: done ? '#fff' : '#111',
                                        border: `1px solid ${done ? '#fff' : '#2a2a2a'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 700,
                                        color: done ? '#000' : '#444',
                                        transition: 'all 0.25s',
                                    }}>{i + 1}</div>
                                    <span style={{
                                        fontSize: '0.58rem',
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
                                        margin: '0.75rem 0.6rem 0',
                                        transition: 'background-color 0.25s',
                                    }} />
                                )}
                            </React.Fragment>
                        )
                    })}
                </div>

                {/* Horizontal layout */}
                <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>

                    {/* Left — file drop */}
                    <div
                        style={{
                            flex: '0 0 220px',
                            border: '1px dashed',
                            borderColor: file ? '#fff' : '#252525',
                            borderRadius: '1rem',
                            padding: '2rem 1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            cursor: 'pointer',
                            minHeight: '200px',
                            textAlign: 'center',
                            transition: 'border-color 0.2s',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {file ? (
                            <>
                                <span style={{ fontSize: '2rem' }}>♪</span>
                                <span style={{ color: '#ccc', fontSize: '0.75rem', wordBreak: 'break-all', lineHeight: 1.4 }}>{file.name}</span>
                                <span style={{ color: '#fff', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>заменить</span>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: '2.5rem', color: '#252525', lineHeight: 1 }}>+</span>
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

                    {/* Right — fields */}
                    <div style={{ flex: 1 }}>
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
                            <p style={{ color: '#5efd9a', fontSize: '0.78rem', marginBottom: '1rem' }}>трек загружен</p>
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
    )
}
