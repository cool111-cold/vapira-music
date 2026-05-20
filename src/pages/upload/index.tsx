import React, { useState, useRef, useEffect } from 'react'
import { PlayerTwo } from '../../components/player/player-two'
import { useAuth } from '../../context/auth-context'

type Tab = 'track' | 'vinyl'
type Status = 'idle' | 'loading' | 'success' | 'error'

async function uploadTrack(formData: {
    title: string
    artist: string
    avatar_url: string
    file: File
    token: string
}) {
    const form = new FormData()
    form.append('title', formData.title)
    form.append('artist', formData.artist)
    form.append('avatar_url', formData.avatar_url)
    form.append('file', formData.file)

    const res = await fetch('https://vapira.ru/tracks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${formData.token}` },
        body: form,
    })
    if (!res.ok) throw new Error((await res.json()).detail ?? 'Ошибка загрузки')
    return res.json()
}

async function createVinylApi(data: {
    name: string
    artist: string
    description: string
    bgColor: string
    secondColor: string
    diskImage: File | null
    cover: File | null
    videoCover: File | null
    token: string
}) {
    const form = new FormData()
    form.append('name', data.name)
    if (data.artist.trim()) form.append('artist', data.artist)
    if (data.description.trim()) form.append('description', data.description)
    if (data.bgColor) form.append('bg_color', data.bgColor)
    if (data.secondColor) form.append('second_color', data.secondColor)
    if (data.diskImage) form.append('disk_image', data.diskImage)
    if (data.cover) form.append('cover', data.cover)
    if (data.videoCover) form.append('video_cover', data.videoCover)

    const res = await fetch('https://vapira.ru/vinyl', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.token}` },
        body: form,
    })
    if (!res.ok) throw new Error((await res.json()).detail ?? 'Ошибка создания')
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

const FilePickerBox = ({
    file, accept, inputRef, onFile,
}: {
    file: File | null
    accept: string
    inputRef: React.RefObject<HTMLInputElement>
    onFile: (f: File) => void
}) => (
    <div
        style={{
            border: '1px dashed',
            borderColor: file ? '#FD5E5E' : '#444',
            borderRadius: '0.5rem',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
        }}
        onClick={() => inputRef.current?.click()}
    >
        {file ? (
            <>
                <span style={{ fontSize: '1.25rem' }}>✓</span>
                <span style={{ color: '#fff', fontSize: '0.8rem', wordBreak: 'break-all', flex: 1 }}>{file.name}</span>
                <span style={{ color: '#555', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
            </>
        ) : (
            <>
                <span style={{ fontSize: '1.25rem', color: '#444' }}>+</span>
                <span style={{ color: '#555', fontSize: '0.8rem' }}>click to select</span>
            </>
        )}
        <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
        />
    </div>
)

export const UploadPage = () => {
    const { token } = useAuth()
    const [tab, setTab] = useState<Tab>('track')

    // track form
    const [title, setTitle] = useState('')
    const [artist, setArtist] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [status, setStatus] = useState<Status>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // vinyl form
    const [vinylName, setVinylName] = useState('')
    const [vinylArtist, setVinylArtist] = useState('')
    const [vinylDescription, setVinylDescription] = useState('')
    const [vinylBgColor, setVinylBgColor] = useState('#edebe0')
    const [vinylSecondColor, setVinylSecondColor] = useState('#453d1c')
    const [vinylDiskImage, setVinylDiskImage] = useState<File | null>(null)
    const [vinylCover, setVinylCover] = useState<File | null>(null)
    const [vinylVideoCover, setVinylVideoCover] = useState<File | null>(null)
    const [vinylStatus, setVinylStatus] = useState<Status>('idle')
    const [vinylErrorMsg, setVinylErrorMsg] = useState('')
    const diskImageRef = useRef<HTMLInputElement>(null)
    const coverRef = useRef<HTMLInputElement>(null)
    const videoCoverRef = useRef<HTMLInputElement>(null)

    const trackReady = title.trim() && artist.trim() && avatarUrl.trim() && file

    const handleSubmit = async () => {
        if (!trackReady || !token) return
        setStatus('loading')
        setErrorMsg('')
        try {
            await uploadTrack({ title, artist, avatar_url: avatarUrl, file: file!, token })
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

    const handleCreateVinyl = async () => {
        if (!vinylName.trim() || !token) return
        setVinylStatus('loading')
        setVinylErrorMsg('')
        try {
            await createVinylApi({
                name: vinylName,
                artist: vinylArtist,
                description: vinylDescription,
                bgColor: vinylBgColor,
                secondColor: vinylSecondColor,
                diskImage: vinylDiskImage,
                cover: vinylCover,
                videoCover: vinylVideoCover,
                token,
            })
            setVinylStatus('success')
            setVinylName('')
            setVinylArtist('')
            setVinylDescription('')
            setVinylBgColor('#edebe0')
            setVinylSecondColor('#453d1c')
            setVinylDiskImage(null)
            setVinylCover(null)
            setVinylVideoCover(null)
        } catch (e) {
            setVinylStatus('error')
            setVinylErrorMsg(e instanceof Error ? e.message : 'Ошибка создания')
        }
    }

    useEffect(() => {
        if (file) {
            setTitle(file.name)
            setArtist(file.name)
        }
    }, [file])

    const btnStyle = (active: boolean): React.CSSProperties => ({
        width: '100%',
        padding: '1rem',
        backgroundColor: active ? '#FD5E5E' : '#333',
        color: active ? '#fff' : '#555',
        border: 'none',
        borderRadius: '0.5rem',
        fontFamily: 'inherit',
        fontSize: '0.875rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        cursor: active ? 'pointer' : 'not-allowed',
        transition: 'background-color 0.2s, color 0.2s',
    })

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

                {/* Tab toggle */}
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
                    {(['track', 'vinyl'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                background: 'none',
                                border: 'none',
                                borderBottom: tab === t ? '2px solid #FD5E5E' : '2px solid transparent',
                                color: tab === t ? '#fff' : '#555',
                                fontFamily: 'inherit',
                                fontSize: '2rem',
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                cursor: 'pointer',
                                padding: '0 0 0.25rem',
                                transition: 'color 0.2s, border-color 0.2s',
                            }}
                        >
                            {t === 'track' ? 'upload track' : 'create vinyl'}
                        </button>
                    ))}
                </div>

                {tab === 'track' && <>
                    <Field label="Title">
                        <input style={inputStyle} placeholder="Song name" value={title} onChange={e => setTitle(e.target.value)} />
                    </Field>
                    <Field label="Artist">
                        <input style={inputStyle} placeholder="Artist name" value={artist} onChange={e => setArtist(e.target.value)} />
                    </Field>
                    <Field label="Cover URL">
                        <input style={inputStyle} placeholder="https://..." value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
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
                                    <span style={{ color: '#fff', fontSize: '0.875rem', textAlign: 'center', wordBreak: 'break-all' }}>{file.name}</span>
                                    <span style={{ color: '#555', fontSize: '0.75rem' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: '1.5rem', color: '#444' }}>+</span>
                                    <span style={{ color: '#555', fontSize: '0.875rem' }}>click to select audio</span>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*"
                                style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setStatus('idle') } }}
                            />
                        </div>
                    </Field>
                    {status === 'error' && <p style={{ color: '#FD5E5E', fontSize: '0.8rem', marginBottom: '1rem' }}>{errorMsg}</p>}
                    {status === 'success' && <p style={{ color: '#5efd9a', fontSize: '0.8rem', marginBottom: '1rem' }}>трек загружен</p>}
                    <button onClick={handleSubmit} disabled={!trackReady || status === 'loading'} style={btnStyle(!!trackReady && status !== 'loading')}>
                        {status === 'loading' ? 'uploading...' : 'upload'}
                    </button>
                </>}

                {tab === 'vinyl' && <>
                    <Field label="Name">
                        <input style={inputStyle} placeholder="Album or playlist name" value={vinylName} onChange={e => { setVinylName(e.target.value); setVinylStatus('idle') }} />
                    </Field>
                    <Field label="Artist">
                        <input style={inputStyle} placeholder="Artist name" value={vinylArtist} onChange={e => setVinylArtist(e.target.value)} />
                    </Field>
                    <Field label="Description">
                        <textarea
                            style={{ ...inputStyle, resize: 'none', minHeight: '5rem', borderBottom: 'none', border: '1px solid #444', borderRadius: '0.35rem', padding: '0.5rem' }}
                            placeholder="About this vinyl..."
                            value={vinylDescription}
                            onChange={e => setVinylDescription(e.target.value)}
                        />
                    </Field>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.75rem' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <span style={labelStyle}>Background color</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem' }}>
                                <input
                                    type="color"
                                    value={vinylBgColor}
                                    onChange={e => setVinylBgColor(e.target.value)}
                                    style={{ width: '2.5rem', height: '2rem', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
                                />
                                <span style={{ color: '#666', fontSize: '0.8rem', fontFamily: 'monospace' }}>{vinylBgColor}</span>
                            </div>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <span style={labelStyle}>Accent color</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem' }}>
                                <input
                                    type="color"
                                    value={vinylSecondColor}
                                    onChange={e => setVinylSecondColor(e.target.value)}
                                    style={{ width: '2.5rem', height: '2rem', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
                                />
                                <span style={{ color: '#666', fontSize: '0.8rem', fontFamily: 'monospace' }}>{vinylSecondColor}</span>
                            </div>
                        </div>
                    </div>
                    <Field label="Disk image">
                        <FilePickerBox file={vinylDiskImage} accept="image/*" inputRef={diskImageRef} onFile={f => { setVinylDiskImage(f); setVinylStatus('idle') }} />
                    </Field>
                    <Field label="Cover image">
                        <FilePickerBox file={vinylCover} accept="image/*" inputRef={coverRef} onFile={f => { setVinylCover(f); setVinylStatus('idle') }} />
                    </Field>
                    <Field label="Video cover (gif / mp4)">
                        <FilePickerBox file={vinylVideoCover} accept="image/*,video/*" inputRef={videoCoverRef} onFile={f => { setVinylVideoCover(f); setVinylStatus('idle') }} />
                    </Field>
                    {vinylStatus === 'error' && <p style={{ color: '#FD5E5E', fontSize: '0.8rem', marginBottom: '1rem' }}>{vinylErrorMsg}</p>}
                    {vinylStatus === 'success' && (
                        <p style={{ color: '#5efd9a', fontSize: '0.8rem', marginBottom: '1rem' }}>
                            пластинка создана —{' '}
                            <a href="/vinyl" style={{ color: '#5efd9a' }}>открыть →</a>
                        </p>
                    )}
                    <button onClick={handleCreateVinyl} disabled={!vinylName.trim() || vinylStatus === 'loading'} style={btnStyle(vinylName.trim().length > 0 && vinylStatus !== 'loading')}>
                        {vinylStatus === 'loading' ? 'creating...' : 'create'}
                    </button>
                </>}
            </div>
        </div>
    )
}
