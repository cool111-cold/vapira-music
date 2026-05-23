import React, { useState, useRef, useEffect } from 'react'
import { PlayerTwo } from '../../components/player/player-two'
import { useAuth } from '../../context/auth-context'

const STEPS = ['Название', 'Исполнитель', 'Обложка', 'Диск']

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

const SmallFilePicker = ({
    file, accept, inputRef, onFile, placeholder,
}: {
    file: File | null
    accept: string
    inputRef: React.RefObject<HTMLInputElement>
    onFile: (f: File) => void
    placeholder: string
}) => (
    <div
        style={{
            border: '1px dashed',
            borderColor: file ? '#fff' : '#1e1e1e',
            borderRadius: '0.5rem',
            padding: '0.6rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
        }}
        onClick={() => inputRef.current?.click()}
    >
        {file ? (
            <>
                <span style={{ fontSize: '0.85rem', color: '#fff' }}>✓</span>
                <span style={{ color: '#bbb', fontSize: '0.75rem', wordBreak: 'break-all', flex: 1, lineHeight: 1.3 }}>{file.name}</span>
                <span style={{ color: '#444', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
            </>
        ) : (
            <>
                <span style={{ fontSize: '0.85rem', color: '#2a2a2a' }}>+</span>
                <span style={{ color: '#3a3a3a', fontSize: '0.75rem' }}>{placeholder}</span>
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

export const CreateVinylPage = () => {
    const { token } = useAuth()
    const [vinylName, setVinylName] = useState('')
    const [vinylArtist, setVinylArtist] = useState('')
    const [vinylDescription, setVinylDescription] = useState('')
    const [vinylBgColor, setVinylBgColor] = useState('#fff')
    const [vinylSecondColor, setVinylSecondColor] = useState('#000')
    const [vinylDiskImage, setVinylDiskImage] = useState<File | null>(null)
    const [vinylCover, setVinylCover] = useState<File | null>(null)
    const [vinylVideoCover, setVinylVideoCover] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const diskImageRef = useRef<HTMLInputElement>(null)
    const coverRef = useRef<HTMLInputElement>(null)
    const videoCoverRef = useRef<HTMLInputElement>(null)
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    const vinylReady = !!vinylName.trim()
    const completed = [!!vinylName.trim(), !!vinylArtist.trim(), !!vinylCover, !!vinylDiskImage]

    const handleSubmit = async () => {
        if (!vinylReady || !token) return
        setStatus('loading')
        setErrorMsg('')
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
            setStatus('success')
            setVinylName('')
            setVinylArtist('')
            setVinylDescription('')
            setVinylBgColor('#edebe0')
            setVinylSecondColor('#453d1c')
            setVinylDiskImage(null)
            setVinylCover(null)
            setVinylVideoCover(null)
        } catch (e) {
            setStatus('error')
            setErrorMsg(e instanceof Error ? e.message : 'Ошибка создания')
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

                    {/* Cover + disk + video */}
                    <div style={{
                        flex: isMobile ? 'none' : '0 0 220px',
                        width: isMobile ? '100%' : undefined,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                    }}>
                        <div
                            style={{
                                border: '1px dashed',
                                borderColor: vinylCover ? '#fff' : '#252525',
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
                            onClick={() => coverRef.current?.click()}
                        >
                            {vinylCover ? (
                                <>
                                    <span style={{ fontSize: isMobile ? '1.5rem' : '2rem', flexShrink: 0 }}>◈</span>
                                    <span style={{
                                        color: '#ccc', fontSize: '0.75rem', lineHeight: 1.4,
                                        flex: isMobile ? 1 : undefined,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        textAlign: isMobile ? 'left' : 'center',
                                    }}>{vinylCover.name}</span>
                                    <span style={{ color: '#fff', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>заменить</span>
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: isMobile ? '2rem' : '2.5rem', color: '#252525', lineHeight: 1 }}>+</span>
                                    <span style={{ color: '#3a3a3a', fontSize: '0.78rem', letterSpacing: '0.04em' }}>добавить обложку</span>
                                </>
                            )}
                            <input
                                ref={coverRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) { setVinylCover(f); setStatus('idle') } }}
                            />
                        </div>
                        <SmallFilePicker
                            file={vinylDiskImage}
                            accept="image/*"
                            inputRef={diskImageRef}
                            placeholder="изображение диска"
                            onFile={f => { setVinylDiskImage(f); setStatus('idle') }}
                        />
                        <SmallFilePicker
                            file={vinylVideoCover}
                            accept="image/*,video/*"
                            inputRef={videoCoverRef}
                            placeholder="видеообложка (gif / mp4)"
                            onFile={f => { setVinylVideoCover(f); setStatus('idle') }}
                        />
                    </div>

                    {/* Fields */}
                    <div style={{ flex: 1, width: isMobile ? '100%' : undefined }}>
                        <Field label="Название">
                            <input
                                style={inputStyle}
                                placeholder="Название альбома или плейлиста"
                                value={vinylName}
                                onChange={e => { setVinylName(e.target.value); setStatus('idle') }}
                            />
                        </Field>
                        <Field label="Исполнитель">
                            <input
                                style={inputStyle}
                                placeholder="Имя исполнителя"
                                value={vinylArtist}
                                onChange={e => setVinylArtist(e.target.value)}
                            />
                        </Field>
                        <Field label="Описание">
                            <textarea
                                style={{
                                    ...inputStyle,
                                    resize: 'none',
                                    minHeight: '4rem',
                                    borderBottom: 'none',
                                    border: '1px solid #1e1e1e',
                                    borderRadius: '0.35rem',
                                    padding: '0.5rem',
                                }}
                                placeholder="О пластинке..."
                                value={vinylDescription}
                                onChange={e => setVinylDescription(e.target.value)}
                            />
                        </Field>

                        {/* Colors */}
                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <span style={labelStyle}>Основной цвет</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem' }}>
                                    <input
                                        type="color"
                                        value={vinylBgColor}
                                        onChange={e => setVinylBgColor(e.target.value)}
                                        style={{ width: '2rem', height: '1.75rem', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
                                    />
                                    <span style={{ color: '#555', fontSize: '0.75rem', fontFamily: 'monospace' }}>{vinylBgColor}</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <span style={labelStyle}>Второстепенный цвет</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.5rem' }}>
                                    <input
                                        type="color"
                                        value={vinylSecondColor}
                                        onChange={e => setVinylSecondColor(e.target.value)}
                                        style={{ width: '2rem', height: '1.75rem', border: 'none', cursor: 'pointer', background: 'none', padding: 0 }}
                                    />
                                    <span style={{ color: '#555', fontSize: '0.75rem', fontFamily: 'monospace' }}>{vinylSecondColor}</span>
                                </div>
                            </div>
                        </div>

                        {status === 'error' && (
                            <p style={{ color: '#FD5E5E', fontSize: '0.78rem', marginBottom: '1rem' }}>{errorMsg}</p>
                        )}
                        {status === 'success' && (
                            <p style={{ color: '#5efd9a', fontSize: '0.78rem', marginBottom: '1rem' }}>
                                пластинка создана —{' '}
                                <a href="/pages/vinyl" style={{ color: '#5efd9a' }}>открыть →</a>
                            </p>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={!vinylReady || status === 'loading'}
                            style={{
                                width: '100%',
                                padding: '0.9rem',
                                backgroundColor: vinylReady && status !== 'loading' ? '#fff' : '#111',
                                color: vinylReady && status !== 'loading' ? '#000' : '#444',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontFamily: 'inherit',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                cursor: vinylReady && status !== 'loading' ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                            }}
                        >
                            {status === 'loading' ? 'загрузка...' : 'создать'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
