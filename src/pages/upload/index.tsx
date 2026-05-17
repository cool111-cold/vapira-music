import React, { useState, useRef, useEffect } from 'react'
import { PlayerTwo } from '../../components/player/player-two'

async function uploadTrack(formData: {
    title: string
    artist: string
    avatar_url: string
    file: File
}) {
    const form = new FormData()
    form.append('title', formData.title)
    form.append('artist', formData.artist)
    form.append('avatar_url', formData.avatar_url)
    form.append('file', formData.file)

    const res = await fetch('https://vapira.ru/tracks', {
        method: 'POST',
        body: form,
    })
    return res.json()
}

const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #444',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '1rem',
    padding: '0.5rem 0',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
}

const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: '0.35rem',
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.75rem' }}>
        <span style={labelStyle}>{label}</span>
        {children}
    </div>
)

type Status = 'idle' | 'loading' | 'success' | 'error'

export const UploadPage = () => {
    const [title, setTitle] = useState('')
    const [artist, setArtist] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<Status>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const ready = title.trim() && artist.trim() && avatarUrl.trim() && file

    const handleSubmit = async () => {
        if (!ready) return
        setStatus('loading')
        setErrorMsg('')
        try {
            await uploadTrack({ title, artist, avatar_url: avatarUrl, file: file! })
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

    useEffect(() => {
        if (file) {
            setTitle(file?.name);
            setArtist(file?.name);
        }
    }, [file])

    return (
        <div style={{
            width: '100%',
            minHeight: '100vh',
            backgroundColor: '#222222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
        }}>
            <PlayerTwo top />
            <div style={{ width: '100%', maxWidth: '480px', paddingTop: '1rem' }}>
                <p style={{
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#555',
                    marginBottom: '0.5rem',
                }}>
                    vapira
                </p>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#fff',
                    marginBottom: '3rem',
                    letterSpacing: '-0.02em',
                }}>
                    upload track
                </h1>

                <Field label="Title">
                    <input
                        style={inputStyle}
                        placeholder="Song name"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </Field>

                <Field label="Artist">
                    <input
                        style={inputStyle}
                        placeholder="Artist name"
                        value={artist}
                        onChange={e => setArtist(e.target.value)}
                    />
                </Field>

                <Field label="Cover URL">
                    <input
                        style={inputStyle}
                        placeholder="https://..."
                        value={avatarUrl}
                        onChange={e => setAvatarUrl(e.target.value)}
                    />
                </Field>

                <Field label="Audio file">
                    <div
                        style={{
                            border: '1px dashed',
                            borderColor: file ? '#FD5E5E' : '#444',
                            borderRadius: '0.5rem',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {file ? (
                            <>
                                <span style={{ fontSize: '1.5rem' }}>♪</span>
                                <span style={{ color: '#fff', fontSize: '0.875rem', textAlign: 'center', wordBreak: 'break-all' }}>
                                    {file.name}
                                </span>
                                <span style={{ color: '#555', fontSize: '0.75rem' }}>
                                    {(file.size / 1024 / 1024).toFixed(1)} MB
                                </span>
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: '1.5rem', color: '#444' }}>+</span>
                                <span style={{ color: '#555', fontSize: '0.875rem' }}>
                                    click to select audio
                                </span>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="audio/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                                const f = e.target.files?.[0]
                                if (f) { setFile(f); setStatus('idle') }
                            }}
                        />
                    </div>
                </Field>

                {status === 'error' && (
                    <p style={{ color: '#FD5E5E', fontSize: '0.8rem', marginBottom: '1rem' }}>
                        {errorMsg}
                    </p>
                )}

                {status === 'success' && (
                    <p style={{ color: '#5efd9a', fontSize: '0.8rem', marginBottom: '1rem' }}>
                        трек загружен
                    </p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={!ready || status === 'loading'}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: ready && status !== 'loading' ? '#FD5E5E' : '#333',
                        color: ready && status !== 'loading' ? '#fff' : '#555',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontFamily: 'inherit',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        cursor: ready && status !== 'loading' ? 'pointer' : 'not-allowed',
                        transition: 'background-color 0.2s, color 0.2s',
                    }}
                >
                    {status === 'loading' ? 'uploading...' : 'upload'}
                </button>
            </div>
        </div>
    )
}
