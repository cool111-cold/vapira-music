import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlayerTwo } from '../../components/player/player-two'
import { useAuth, UserUpdate } from '../../context/auth-context'
import { useAudioPlayer } from '../../context/audio-context'
import { Icon } from '../../components/icon'
import { TrackRow, LibTrack } from '../library/track-row'
import { VinylRow, VinylApi } from '../library/vinyls'

const BASE = 'https://vapira.ru'

type MainTab = 'tracks' | 'vinyls' | null
type SubTab = 'saved' | 'uploaded'

const pageStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#000',
    paddingBottom: '6rem',
}

const VinylRecord = ({ cover, onClick }: { cover?: string; onClick?: () => void }) => (
    <div
        onClick={onClick}
        style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: '0 4px 24px rgba(0,0,0,0.9)',
            background: `
                radial-gradient(circle at center, transparent 20%, rgba(255,255,255,0.04) 20.5%, rgba(255,255,255,0.04) 22%, transparent 22.5%,
                transparent 28%, rgba(255,255,255,0.04) 28.5%, rgba(255,255,255,0.04) 30%, transparent 30.5%,
                transparent 36%, rgba(255,255,255,0.04) 36.5%, rgba(255,255,255,0.04) 38%, transparent 38.5%,
                transparent 44%, rgba(255,255,255,0.04) 44.5%, rgba(255,255,255,0.04) 46%, transparent 46.5%),
                #111
            `,
        }}
    >
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            borderRadius: '50%',
            overflow: 'hidden',
            background: cover ? undefined : '#222',
        }}>
            {cover && <img src={cover} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#000',
            zIndex: 1,
        }} />
    </div>
)

const TabBtn = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button
        onClick={onClick}
        style={{
            background: active ? '#fff' : 'none',
            border: `0px solid ${active ? '#fff' : '#333'}`,
            borderRadius: '0.4rem',
            color: active ? '#000' : '#aaa',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            fontWeight: active ? 700 : 400,
        }}
    >
        {label}
    </button>
)

const ActionBtn = ({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) => (
    <button
        onClick={onClick}
        style={{
            background: 'none',
            border: `0px solid #333`,
            borderRadius: '0.4rem',
            color: danger ? '#aaa' : '#aaa',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '0.5rem 1rem',
        }}
        // onMouseEnter={e => {
        //     e.currentTarget.style.borderColor = danger ? '#fff' : '#aaa'
        //     e.currentTarget.style.color = danger ? '#fff' : '#fff'
        // }}
        // onMouseLeave={e => {
        //     e.currentTarget.style.borderColor = danger ? '#333' : '#333'
        //     e.currentTarget.style.color = danger ? '#aaa' : '#aaa'
        // }}
    >
        {label}
    </button>
)

const AddBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button
        onClick={onClick}
        style={{
            marginTop: '1rem',
            background: 'none',
            border: '1px dashed #333',
            borderRadius: '0.4rem',
            color: '#aaa',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '0.6rem 1.25rem',
            width: '100%',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#aaa' }}
    >
        {label}
    </button>
)

const SavedTracksList = ({ token }: { token: string }) => {
    const [saved, setSaved] = useState<LibTrack[]>([])
    const [savedLoading, setSavedLoading] = useState(true)
    const [input, setInput] = useState('')
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState<LibTrack[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        setSavedLoading(true)
        fetch(`${BASE}/saved`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => data.map((t: any) => ({
                id: String(t.id),
                title: t.title,
                artist: t.artist,
                cover: t.avatar_url,
                src: `${BASE}${t.stream_url}`,
            })))
            .then(setSaved)
            .catch(() => setSaved([]))
            .finally(() => setSavedLoading(false))
    }, [token])

    useEffect(() => {
        if (!query) { setSearchResults([]); return }
        setSearchLoading(true)
        fetch(`${BASE}/search?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => data.map((t: any) => ({
                id: String(t.id),
                title: t.title,
                artist: t.artist,
                cover: t.avatar_url,
                src: `${BASE}${t.stream_url}`,
            })))
            .then(setSearchResults)
            .catch(() => setSearchResults([]))
            .finally(() => setSearchLoading(false))
    }, [query, token])

    useEffect(() => () => clearTimeout(debounceRef.current), [])

    const handleChange = (val: string) => {
        setInput(val)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setQuery(val.trim()), 400)
    }

    const handleRemove = (id: string) => setSaved(prev => prev.filter(t => t.id !== id))

    const isSearching = query.length > 0
    const loading = isSearching ? searchLoading : savedLoading
    const tracks = isSearching ? searchResults : saved

    return (
        <>
            <input
                value={input}
                onChange={e => handleChange(e.target.value)}
                placeholder="Название песни или исполнителя..."
                style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #444',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    padding: '0.4rem 0',
                    outline: 'none',
                    width: '100%',
                    marginBottom: '1.25rem',
                }}
            />
            {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>{isSearching ? 'поиск...' : 'загрузка...'}</p>}
            {!loading && tracks.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>{isSearching ? 'ничего не нашли' : 'нет сохраненных треков'}</p>}
            {tracks.map(t => <TrackRow key={t.id} track={t} onRemove={isSearching ? undefined : handleRemove} />)}
        </>
    )
}

const UploadedTracksList = ({ token }: { token: string }) => {
    const navigate = useNavigate()
    const [tracks, setTracks] = useState<LibTrack[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch(`${BASE}/tracks`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => data.map((t: any) => ({
                id: String(t.id),
                title: t.title,
                artist: t.artist,
                cover: t.avatar_url,
                src: `${BASE}${t.stream_url}`,
            })))
            .then(setTracks)
            .catch(() => setTracks([]))
            .finally(() => setLoading(false))
    }, [token])

    const handleDelete = (id: string) => setTracks(prev => prev.filter(t => t.id !== id))

    return (
        <>
            {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>загрузка...</p>}
            {!loading && tracks.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>нет загруженных треков</p>}
            {tracks.map(t => <TrackRow key={t.id} track={t} onDelete={handleDelete} />)}
            <AddBtn label="+ добавить трек" onClick={() => navigate('/upload/track')} />
        </>
    )
}

const SavedVinylsList = ({ token }: { token: string }) => {
    const [saved, setSaved] = useState<VinylApi[]>([])
    const [savedLoading, setSavedLoading] = useState(true)
    const [input, setInput] = useState('')
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState<VinylApi[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        setSavedLoading(true)
        fetch(`${BASE}/saved-vinyls`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => setSaved(Array.isArray(data) ? data : []))
            .catch(() => setSaved([]))
            .finally(() => setSavedLoading(false))
    }, [token])

    useEffect(() => {
        if (!query) { setSearchResults([]); return }
        setSearchLoading(true)
        fetch(`${BASE}/search/vinyl?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(setSearchResults)    
            // .then(data => setSearchResults(Array.isArray(data) ? data : []))
            .catch(() => setSearchResults([]))
            .finally(() => setSearchLoading(false))
    }, [query, token])

    useEffect(() => () => clearTimeout(debounceRef.current), [])

    const handleChange = (val: string) => {
        setInput(val)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setQuery(val.trim()), 400)
    }

    const handleRemove = (id: number) => setSaved(prev => prev.filter(v => v.id !== id))

    const isSearching = query.length > 0
    const loading = isSearching ? searchLoading : savedLoading
    const vinyls = isSearching ? searchResults : saved

    return (
        <>
            <input
                value={input}
                onChange={e => handleChange(e.target.value)}
                placeholder="Название пластинки или исполнителя..."
                style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #444',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    padding: '0.4rem 0',
                    outline: 'none',
                    width: '100%',
                    marginBottom: '1.25rem',
                }}
            />
            {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>{isSearching ? 'поиск...' : 'загрузка...'}</p>}
            {!loading && vinyls.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>{isSearching ? 'ничего не нашли' : 'нет сохраненных пластинок'}</p>}
            {vinyls.map(v => (
                <VinylRow
                    key={v.id}
                    vinyl={v}
                    token={token}
                    onDeleted={handleRemove}
                    showSave
                    initialSaved={!isSearching}
                />
            ))}
        </>
    )
}

const UploadedVinylsList = ({ token }: { token: string }) => {
    const navigate = useNavigate()
    const [vinyls, setVinyls] = useState<VinylApi[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch(`${BASE}/vinyl`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(setVinyls)
            .catch(() => setVinyls([]))
            .finally(() => setLoading(false))
    }, [token])

    const handleDeleted = (id: number) => setVinyls(prev => prev.filter(v => v.id !== id))

    return (
        <>
            {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>звгрузка...</p>}
            {!loading && vinyls.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>нет загруженных пластинок</p>}
            {vinyls.map(v => <VinylRow key={v.id} vinyl={v} token={token} onDeleted={handleDeleted} />)}
            <AddBtn label="+ добавить виниловую пластинку" onClick={() => navigate('/upload/vinyl')} />
        </>
    )
}

const inputStyle: React.CSSProperties = {
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

const labelStyle: React.CSSProperties = {
    color: '#888',
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '0.25rem',
    display: 'block',
}

const EditProfileModal = ({ onClose }: { onClose: () => void }) => {
    const { user, token, updateUser } = useAuth()
    const [form, setForm] = useState<UserUpdate>({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        avatar_url: user?.avatar_url ?? '',
        bg_image_url: user?.bg_image_url ?? '',
        favorite_track_id: user?.favorite_track_id ?? undefined,
        favorite_vinyl_id: user?.favorite_vinyl_id ?? undefined,
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [tracks, setTracks] = useState<FavTrack[]>([])
    const [vinyls, setVinyls] = useState<VinylApi[]>([])

    useEffect(() => {
        if (!token) return
        fetch(`${BASE}/library`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then((data: FavTrack[]) => {
                const seen = new Set<number>()
                setTracks(data.filter(t => seen.has(t.id) ? false : (seen.add(t.id), true)))
            })
            .catch(() => {})
        fetch(`${BASE}/vinyl-library`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(setVinyls)
            .catch(() => {})
    }, [token])

    const set = (key: keyof UserUpdate, val: string) =>
        setForm(f => ({ ...f, [key]: val }))

    const handleSave = async () => {
        setSaving(true)
        setError('')
        const payload: UserUpdate = {}
        if (form.name) payload.name = form.name
        if (form.email) payload.email = form.email
        if (form.password) payload.password = form.password
        if (form.avatar_url !== undefined) payload.avatar_url = form.avatar_url
        if (form.bg_image_url !== undefined) payload.bg_image_url = form.bg_image_url
        if (form.favorite_track_id !== undefined) payload.favorite_track_id = form.favorite_track_id
        if (form.favorite_vinyl_id !== undefined) payload.favorite_vinyl_id = form.favorite_vinyl_id
        try {
            await updateUser(payload)
            onClose()
        } catch (e: any) {
            setError(e.message ?? 'Ошибка')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
            <div style={{
                background: '#111', border: '1px solid #222',
                borderRadius: '0.75rem', padding: '2rem', width: '100%', maxWidth: 420,
                display: 'flex', flexDirection: 'column', gap: '1.25rem',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                        Редактировать профиль
                    </span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                </div>

                {[
                    { label: 'Имя', key: 'name' as const, type: 'text' },
                    { label: 'Email', key: 'email' as const, type: 'email' },
                    { label: 'Новый пароль', key: 'password' as const, type: 'password' },
                    { label: 'Ссылка на аватар', key: 'avatar_url' as const, type: 'text' },
                    { label: 'Фоновое изображение (URL)', key: 'bg_image_url' as const, type: 'text' },
                ].map(({ label, key, type }) => (
                    <div key={key}>
                        <label style={labelStyle}>{label}</label>
                        <input
                            type={type}
                            value={String(form[key] ?? '')}
                            onChange={e => set(key, e.target.value)}
                            style={inputStyle}
                            autoComplete="off"
                        />
                    </div>
                ))}

                <div>
                    <label style={labelStyle}>Любимый трек</label>
                    <select
                        value={form.favorite_track_id ?? ''}
                        onChange={e => setForm(f => ({ ...f, favorite_track_id: e.target.value ? Number(e.target.value) : undefined }))}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                        <option value="">— не выбран —</option>
                        {tracks.map(t => (
                            <option key={t.id} value={t.id}>{t.title} — {t.artist}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Любимая пластинка</label>
                    <select
                        value={form.favorite_vinyl_id ?? ''}
                        onChange={e => setForm(f => ({ ...f, favorite_vinyl_id: e.target.value ? Number(e.target.value) : undefined }))}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                        <option value="">— не выбрана —</option>
                        {vinyls.map(v => (
                            <option key={v.id} value={v.id}>{v.name}{v.artist ? ` — ${v.artist}` : ''}</option>
                        ))}
                    </select>
                </div>

                {error && <p style={{ color: '#f55', fontSize: '0.8rem', margin: 0 }}>{error}</p>}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        background: '#fff', color: '#000', border: 'none',
                        borderRadius: '0.4rem', padding: '0.65rem 1.5rem',
                        fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em',
                        textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1, alignSelf: 'flex-end',
                    }}
                >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
            </div>
        </div>
    )
}

interface FavTrack {
    id: number
    title: string
    artist: string
    avatar_url: string | null
    stream_url: string
}

const DEFAULT_BG = '/images/back.jpg'
const DEFAULT_AVATAR = '/images/ava.jpg'

const PageLoader = () => (
    <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
        <div style={{
            width: 36, height: 36,
            border: '2px solid #222',
            borderTop: '2px solid #fff',
            borderRadius: '50%',
            animation: 'profile-spin 0.75s linear infinite',
        }} />
        <style>{`@keyframes profile-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
)

export const ProfilePage = () => {
    const { user, token, logout } = useAuth()
    const { loadAndPlayExternal } = useAudioPlayer()
    const navigate = useNavigate()
    const [mainTab, setMainTab] = useState<MainTab>(null)
    const [subTab, setSubTab] = useState<SubTab>('saved')
    const [editOpen, setEditOpen] = useState(false)
    const [favTrack, setFavTrack] = useState<FavTrack | null>(null)
    const [favVinyl, setFavVinyl] = useState<VinylApi | null>(null)
    const [favTrackLoading, setFavTrackLoading] = useState(false)
    const [favVinylLoading, setFavVinylLoading] = useState(false)

    useEffect(() => {
        if (!user?.favorite_track_id || !token) { setFavTrack(null); setFavTrackLoading(false); return }
        setFavTrackLoading(true)
        fetch(`${BASE}/tracks/${user.favorite_track_id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setFavTrack)
            .catch(() => setFavTrack(null))
            .finally(() => setFavTrackLoading(false))
    }, [user?.favorite_track_id, token])

    useEffect(() => {
        if (!user?.favorite_vinyl_id || !token) { setFavVinyl(null); setFavVinylLoading(false); return }
        setFavVinylLoading(true)
        fetch(`${BASE}/vinyl/${user.favorite_vinyl_id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setFavVinyl)
            .catch(() => setFavVinyl(null))
            .finally(() => setFavVinylLoading(false))
    }, [user?.favorite_vinyl_id, token])

    const pageLoading = (!!token && !user) || favTrackLoading || favVinylLoading

    if (pageLoading) return <PageLoader />

    const handleMainTab = (tab: MainTab) => {
        if (mainTab === tab) {
            setMainTab(null)
        } else {
            setMainTab(tab)
            setSubTab('saved')
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('player_volume');
        logout();
        navigate('/login');
    }

    const bgImage = user?.bg_image_url || DEFAULT_BG
    const avatarImage = user?.avatar_url || DEFAULT_AVATAR

    return (
        <div style={pageStyle}>
            {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}
            <PlayerTwo top />
            <div style={{width: '100%', height: '75vh'}}>
                <img src={bgImage} style={{width: '100%', height: '75vh', objectFit: 'cover'}}/>
            </div>

            {/* Avatar */}
            <img
                src={avatarImage}
                style={{width: 150, height: 150, objectFit: 'cover', position: 'absolute', top: '65vh', left: '45vw', borderRadius: 100, border: '5px solid #000'}}
            />

            {/* Profile name under avatar */}
            <div style={{
                position: 'absolute',
                top: 'calc(65vh + 162px)',
                left: '45vw',
                width: 150,
                textAlign: 'center',
            }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em' }}>
                    {user?.name ?? user?.email ?? 'vapira'}
                </span>
            </div>

            {/* Favourite vinyl — bottom left */}
            {favVinyl && (
                <div style={{
                    position: 'absolute',
                    top: '55vh',
                    left: '5vw',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: '#ffffff9e',
                    borderRadius: 100,
                    padding: 15,
                    cursor: 'default',
                }}>
                    <VinylRecord cover={favVinyl.cover ? `${BASE}${favVinyl.cover}` : undefined} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#000', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{favVinyl.name}</div>
                        <div style={{ color: '#333', fontSize: 11, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{favVinyl.artist}</div>
                    </div>
                </div>
            )}

            {/* Favourite track — right center */}
            {favTrack && (
                <div
                    style={{
                        position: 'absolute',
                        top: '40vh',
                        right: '8vw',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 10,
                        cursor: 'pointer',
                    }}
                    onClick={() => loadAndPlayExternal({
                        id: String(favTrack.id),
                        name: favTrack.title,
                        artist: favTrack.artist,
                        src: `${BASE}${favTrack.stream_url}`,
                        cover: favTrack.avatar_url ?? undefined,
                    })}
                >
                    <span style={{ color: '#fff', fontSize: 20, alignSelf: 'flex-end' }}>Выбор пользователя</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div>
                            <div style={{ color: '#fff', fontSize: 40, fontWeight: 900, marginBottom: 4, maxWidth: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{favTrack.title}</div>
                            <div style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>{favTrack.artist}</div>
                        </div>
                    </div>
                    <div style={{
                        width: 150,
                        height: 36,
                        borderRadius: 25,
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 15,
                        gap: 6,
                        justifyContent: 'center',
                    }}>
                        <div>Слушать</div>
                        <Icon name="PlayTwoIcon" size={20} color="#000" isClick onClick={() => null} style={{ display: 'flex', alignItems: 'center' }} />
                    </div>
                </div>
            )}

            <div style={{width: '100%'}} />

            {/* Action section */}
            <div>
                <div style={{ width: '100%', margin: '0 auto', padding: '1.5rem 2rem 2rem'}}>

                    {/* Main buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: mainTab ? '1.5rem' : 0}}>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <TabBtn active={mainTab === 'tracks'} onClick={() => handleMainTab('tracks')} label="Треки" />
                            <TabBtn active={mainTab === 'vinyls'} onClick={() => handleMainTab('vinyls')} label="Виниловые пластинки" />
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <ActionBtn label="Редактировать профиль" onClick={() => setEditOpen(true)} />
                            <ActionBtn label="Выйти" onClick={handleLogout} danger />
                        </div>
                    </div>

                    {/* Tracks section */}
                    {mainTab === 'tracks' && (
                        <div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                <TabBtn active={subTab === 'saved'} onClick={() => setSubTab('saved')} label="Добавленные" />
                                <TabBtn active={subTab === 'uploaded'} onClick={() => setSubTab('uploaded')} label="Загруженные" />
                            </div>
                            {token && subTab === 'saved' && <SavedTracksList token={token} />}
                            {token && subTab === 'uploaded' && <UploadedTracksList token={token} />}
                        </div>
                    )}

                    {/* Vinyls section */}
                    {mainTab === 'vinyls' && (
                        <div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                <TabBtn active={subTab === 'saved'} onClick={() => setSubTab('saved')} label="Добавленные" />
                                <TabBtn active={subTab === 'uploaded'} onClick={() => setSubTab('uploaded')} label="Загруженные" />
                            </div>
                            {token && subTab === 'saved' && <SavedVinylsList token={token} />}
                            {token && subTab === 'uploaded' && <UploadedVinylsList token={token} />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
