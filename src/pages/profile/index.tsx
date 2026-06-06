import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { PlayerTwo } from '../../components/player/player-two'
import { useAuth, UserUpdate } from '../../context/auth-context'
import { useAudioPlayer } from '../../context/audio-context'
import { Icon } from '../../components/icon'
import { TrackRow, LibTrack } from '../library/track-row'
import { VinylRow, VinylApi } from '../library/vinyls'
import { CreatePostModal } from '../upload/post'

const BASE = 'https://vapira.ru'


type MainTab = 'feed' | 'tracks' | 'vinyls' | 'social' | null
type SubTab = 'saved' | 'uploaded' | 'subscriptions' | 'subscribers' | 'liked'

interface SubscriptionUser {
    id: string
    name?: string
    email: string
    avatar_url?: string
}

const pageStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#000',
    paddingBottom: '6rem',
    overflowX: 'hidden',
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

const UserRow = ({
    user, isSubscribed, isPending, isSearching, onClick, onSubscribe, onUnsubscribe,
}: {
    user: SubscriptionUser; isSubscribed: boolean; isPending: boolean; isSearching: boolean
    onClick: () => void; onSubscribe: () => void; onUnsubscribe: () => void
}) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid #1a1a1a' }}>
        <div onClick={onClick} style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#222', cursor: 'pointer', flexShrink: 0 }}>
            <img src={user.avatar_url || DEFAULT_AVATAR} onError={e => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR }} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div onClick={onClick} style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name ?? user.email}
            </div>
            {user.name && <div style={{ color: '#555', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>}
        </div>
        {isSearching && !isSubscribed && (
            <button
                onClick={e => { e.stopPropagation(); onSubscribe() }}
                disabled={isPending}
                style={{
                    background: 'none', border: '1px solid #333', borderRadius: '0.4rem',
                    color: '#aaa', fontSize: '0.7rem', letterSpacing: '0.08em',
                    textTransform: 'uppercase', cursor: isPending ? 'not-allowed' : 'pointer',
                    padding: '0.3rem 0.75rem', opacity: isPending ? 0.5 : 1, flexShrink: 0,
                }}
            >
                {isPending ? '...' : '+ подписаться'}
            </button>
        )}
        {isSearching && isSubscribed && (
            <span style={{ color: '#555', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>подписан</span>
        )}
        {!isSearching && (
            <button
                onClick={e => { e.stopPropagation(); onUnsubscribe() }}
                disabled={isPending}
                style={{
                    background: 'none', border: '1px solid #333', borderRadius: '0.4rem',
                    color: '#555', fontSize: '0.7rem', letterSpacing: '0.08em',
                    textTransform: 'uppercase', cursor: isPending ? 'not-allowed' : 'pointer',
                    padding: '0.3rem 0.75rem', opacity: isPending ? 0.5 : 1, flexShrink: 0,
                }}
            >
                {isPending ? '...' : 'отписаться'}
            </button>
        )}
    </div>
)

const SubscriptionsList = ({ token }: { token: string }) => {
    const navigate = useNavigate()
    const [subscriptions, setSubscriptions] = useState<SubscriptionUser[]>([])
    const [loading, setLoading] = useState(true)
    const [input, setInput] = useState('')
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SubscriptionUser[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        setLoading(true)
        fetch(`${BASE}/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => setSubscriptions(Array.isArray(data) ? data : []))
            .catch(() => setSubscriptions([]))
            .finally(() => setLoading(false))
    }, [token])

    useEffect(() => {
        if (!query) { setSearchResults([]); return }
        setSearchLoading(true)
        fetch(`${BASE}/search/users?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => setSearchResults(Array.isArray(data) ? data : []))
            .catch(() => setSearchResults([]))
            .finally(() => setSearchLoading(false))
    }, [query, token])

    useEffect(() => () => clearTimeout(debounceRef.current), [])

    const handleChange = (val: string) => {
        setInput(val)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setQuery(val.trim()), 400)
    }

    const isSubscribed = (userId: string) => subscriptions.some(u => u.id === userId)

    const subscribe = async (userId: string) => {
        setPendingIds(prev => new Set(prev).add(userId))
        try {
            const res = await fetch(`${BASE}/subscriptions/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) {
                const found = searchResults.find(u => u.id === userId)
                if (found) setSubscriptions(prev => [...prev, found])
            }
        } finally {
            setPendingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
        }
    }

    const unsubscribe = async (userId: string) => {
        setPendingIds(prev => new Set(prev).add(userId))
        try {
            const res = await fetch(`${BASE}/subscriptions/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setSubscriptions(prev => prev.filter(u => u.id !== userId))
        } finally {
            setPendingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
        }
    }

    const isSearching = query.length > 0
    const displayLoading = isSearching ? searchLoading : loading
    const displayList = isSearching ? searchResults : subscriptions

    return (
        <>
            <input
                value={input}
                onChange={e => handleChange(e.target.value)}
                placeholder="Поиск по имени или email..."
                style={{
                    background: 'transparent', border: 'none', borderBottom: '1px solid #444',
                    color: '#fff', fontFamily: 'inherit', fontSize: '1rem',
                    padding: '0.4rem 0', outline: 'none', width: '100%', marginBottom: '1.25rem',
                }}
            />
            {displayLoading && <p style={{ color: '#555', fontSize: '0.875rem' }}>{isSearching ? 'поиск...' : 'загрузка...'}</p>}
            {!displayLoading && displayList.length === 0 && (
                <p style={{ color: '#555', fontSize: '0.875rem' }}>{isSearching ? 'никого не нашли' : 'нет подписок'}</p>
            )}
            {displayList.map(u => (
                <UserRow
                    key={u.id}
                    user={u}
                    isSubscribed={isSubscribed(u.id)}
                    isPending={pendingIds.has(u.id)}
                    isSearching={isSearching}
                    onSubscribe={() => subscribe(u.id)}
                    onUnsubscribe={() => unsubscribe(u.id)}
                    onClick={() => navigate(`/pages/users/${u.id}`)}
                />
            ))}
        </>
    )
}

const SubscribersList = ({ token, userId }: { token: string; userId: string }) => {
    const navigate = useNavigate()
    const [subscribers, setSubscribers] = useState<SubscriptionUser[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch(`${BASE}/users/${userId}/subscribers`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => setSubscribers(Array.isArray(data) ? data : []))
            .catch(() => setSubscribers([]))
            .finally(() => setLoading(false))
    }, [token, userId])

    return (
        <>
            {!loading && subscribers.length > 0 && (
                <p style={{ color: '#555', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    {subscribers.length} {subscribers.length === 1 ? 'подписчик' : subscribers.length >= 2 && subscribers.length <= 4 ? 'подписчика' : 'подписчиков'}
                </p>
            )}
            {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>загрузка...</p>}
            {!loading && subscribers.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>нет подписчиков</p>}
            {subscribers.map(u => (
                <div
                    key={u.id}
                    onClick={() => navigate(`/pages/users/${u.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid #1a1a1a', cursor: 'pointer' }}
                >
                    <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#222', flexShrink: 0 }}>
                        <img src={u.avatar_url || DEFAULT_AVATAR} onError={e => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR }} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.name ?? u.email}
                        </div>
                        {u.name && <div style={{ color: '#555', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>}
                    </div>
                </div>
            ))}
        </>
    )
}

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
        fetch(`${BASE}/tracks?mode=saved`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => data.map((t: any) => ({
                id: String(t.id),
                title: t.title,
                artist: t.artist,
                cover: t.avatar_url,
                src: `${BASE}${t.stream_url}`,
                user_id: t.user_id
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
                user_id: t.user_id
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
        fetch(`${BASE}/tracks?mode=uploaded`, { headers: { Authorization: `Bearer ${token}` } })
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
            <AddBtn label="+ добавить трек" onClick={() => navigate('/pages/upload/track')} />
            {tracks.map(t => <TrackRow key={t.id} track={t} onDelete={handleDelete} />)}
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
            {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>загрузка...</p>}
            {!loading && vinyls.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>нет загруженных пластинок</p>}
            <AddBtn label="+ добавить виниловую пластинку" onClick={() => navigate('/pages/upload/vinyl')} />
            {vinyls.map(v => <VinylRow key={v.id} vinyl={v} token={token} onDeleted={handleDeleted} />)}
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

const AdminCheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#fff', flexShrink: 0 }}>
        <title>Админ</title>
        <path d="M15.142 9.98299L10.875 14.25L9.42049 12.7955M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

const DotsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.0001 7.1999C10.6746 7.1999 9.6001 6.12539 9.6001 4.7999C9.6001 3.47442 10.6746 2.3999 12.0001 2.3999C13.3256 2.3999 14.4001 3.47442 14.4001 4.7999C14.4001 6.12539 13.3256 7.1999 12.0001 7.1999Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12.0001 14.3999C10.6746 14.3999 9.6001 13.3254 9.6001 11.9999C9.6001 10.6744 10.6746 9.5999 12.0001 9.5999C13.3256 9.5999 14.4001 10.6744 14.4001 11.9999C14.4001 13.3254 13.3256 14.3999 12.0001 14.3999Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12.0001 21.5999C10.6746 21.5999 9.6001 20.5254 9.6001 19.1999C9.6001 17.8744 10.6746 16.7999 12.0001 16.7999C13.3256 16.7999 14.4001 17.8744 14.4001 19.1999C14.4001 20.5254 13.3256 21.5999 12.0001 21.5999Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
)

interface ApiPost {
    id: number;
    text?: string | null;
    image_url?: string | null;
    video_url?: string | null;
    track_id?: number | null;
    vinyl_id?: number | null;
    user_id?: number | null;
    author_id?: number | null;
    time_code?: number | null;
    likes_count?: number | null;
    is_liked?: boolean | null;
    is_reposted?: boolean | null;
}

interface FeedItem {
    id?: number;
    type: string;
    track_id: number;
    autor_id: number;
    vinyl_id?: number | null;
    image: string | string[] | null;
    video: string | null;
    text: string;
    timeCode?: number | null;
    likesCount: number;
    isLiked: boolean;
    isReposted: boolean;
}

const mapApiPost = (p: ApiPost): FeedItem => ({
    id: p.id,
    type: p.image_url ? 'image' : p.video_url ? 'video' : 'text',
    track_id: p.track_id ?? 0,
    autor_id: p.user_id ?? p.author_id ?? 0,
    vinyl_id: p.vinyl_id ?? null,
    image: p.image_url ? (p.image_url.startsWith('http') ? p.image_url : `${BASE}${p.image_url}`) : null,
    video: p.video_url ? (p.video_url.startsWith('http') ? p.video_url : `${BASE}${p.video_url}`) : null,
    text: p.text ?? '',
    timeCode: p.time_code ?? null,
    likesCount: p.likes_count ?? 0,
    isLiked: p.is_liked ?? false,
    isReposted: p.is_reposted ?? false,
});

const FeedPost = ({ item, token, onDelete, onEdited, readOnly }: { item: FeedItem; token: string; onDelete?: (id: number) => void; onEdited?: (id: number, text: string) => void; readOnly?: boolean }) => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { seekAfterLoad } = useAudioPlayer()
    const [track, setTrack] = useState<LibTrack | null>(null)
    const [author, setAuthor] = useState<{ id: number; name?: string; email?: string; avatar_url?: string } | null>(null)
    const [copied, setCopied] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(item.text)
    const [saving, setSaving] = useState(false)
    const [liked, setLiked] = useState(item.isLiked)
    const [likesCount, setLikesCount] = useState(item.likesCount)
    const [likeLoading, setLikeLoading] = useState(false)
    const [reposted, setReposted] = useState(item.isReposted)
    const [repostLoading, setRepostLoading] = useState(false)
    const [reporting, setReporting] = useState(false)
    const [reported, setReported] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const dotsRef = useRef<HTMLButtonElement>(null)
    const dotsMenuRef = useRef<HTMLDivElement>(null)

    const canRepost = !!user && String((user as any).id) !== String(item.autor_id)

    useEffect(() => {
        if (!menuOpen) return
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (!dotsRef.current?.contains(target) && !dotsMenuRef.current?.contains(target)) {
                setMenuOpen(false)
                setConfirmDelete(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [menuOpen])

    useEffect(() => {
        if (!item.track_id) return
        fetch(`${BASE}/tracks/${item.track_id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then((t: any) => {
                if (!t?.id) return
                setTrack({ id: String(t.id), title: t.title, artist: t.artist, cover: t.avatar_url, src: `${BASE}${t.stream_url}` })
            })
            .catch(() => {})
    }, [item.track_id, token])

    useEffect(() => {
        fetch(`${BASE}/users/${item.autor_id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(setAuthor)
            .catch(() => {})
    }, [item.autor_id, token])

    useEffect(() => { setEditText(item.text) }, [item.text])

    const handleLike = async () => {
        if (!item.id || likeLoading) return
        setLikeLoading(true)
        try {
            if (liked) {
                await fetch(`${BASE}/posts/${item.id}/like`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
                setLiked(false)
                setLikesCount(c => Math.max(0, c - 1))
            } else {
                await fetch(`${BASE}/posts/${item.id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                setLiked(true)
                setLikesCount(c => c + 1)
            }
        } finally {
            setLikeLoading(false)
        }
    }

    const handleRepost = async () => {
        if (!item.id || repostLoading || !canRepost) return
        setRepostLoading(true)
        try {
            if (reposted) {
                await fetch(`${BASE}/posts/${item.id}/repost`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
                setReposted(false)
            } else {
                await fetch(`${BASE}/posts/${item.id}/repost`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
                setReposted(true)
            }
        } finally {
            setRepostLoading(false)
        }
    }

    const handleShare = () => {
        navigator.clipboard.writeText(`${window.location.origin}/?postId=${item.id}`);  
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    const handleReport = async () => {
        if (!item.id || reporting || reported) return
        setReporting(true)
        try {
            await fetch(`${BASE}/reports/posts/${item.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
            setReported(true)
        } finally {
            setReporting(false)
        }
    }

    const handleDelete = async () => {
        if (!item.id || deleting) return
        setDeleting(true)
        try {
            const res = await fetch(`${BASE}/posts/${item.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) onDelete?.(item.id)
        } finally {
            setDeleting(false)
        }
    }

    const handleSaveEdit = async () => {
        if (!item.id || saving) return
        setSaving(true)
        try {
            const res = await fetch(`${BASE}/posts/${item.id}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: editText }),
            })
            if (res.ok) {
                onEdited?.(item.id, editText)
                setIsEditing(false)
            }
        } finally {
            setSaving(false)
        }
    }

    const isMultiImage = Array.isArray(item.image)
    const isSingleImage = typeof item.image === 'string' && !!item.image
    const isVideoFile = !!item.video && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(item.video)
    const isGif = !!item.video && !isVideoFile

    const actBtnStyle = (color: string, disabled?: boolean): React.CSSProperties => ({
        background: 'none', border: 'none', color,
        cursor: disabled ? 'default' : 'pointer',
        padding: '0.3rem 0.5rem', fontSize: '0.75rem',
        display: 'flex', alignItems: 'center', gap: 4,
        borderRadius: '0.3rem', opacity: disabled ? 0.5 : 1,
        letterSpacing: '0.03em',
    })

    return (
        <div style={{ borderBottom: '1px solid #1a1a1a', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div
                onClick={() => author && navigate(`/pages/users/${author.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer' }}
            >
                <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#1f1f1f', flexShrink: 0 }}>
                    {author?.avatar_url && (
                        <img
                            src={author.avatar_url.startsWith('http') ? author.avatar_url : `${BASE}${author.avatar_url}`}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                </div>
                <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}>
                    {author?.name ?? author?.email ?? '—'}
                </span>
            </div>

            {isEditing ? (
                <div style={{ marginBottom: 12 }}>
                    <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        autoFocus
                        rows={3}
                        style={{
                            width: '100%', background: '#111', border: '1px solid #333',
                            borderRadius: '0.4rem', color: '#fff', padding: '0.6rem',
                            fontSize: '0.875rem', lineHeight: 1.6, resize: 'vertical',
                            fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                        }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                        <button
                            onClick={() => { setIsEditing(false); setEditText(item.text) }}
                            style={{ background: 'none', border: '1px solid #333', borderRadius: '0.4rem', color: '#888', fontSize: '0.75rem', cursor: 'pointer', padding: '0.35rem 0.75rem' }}
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            style={{ background: '#fff', border: 'none', borderRadius: '0.4rem', color: '#000', fontSize: '0.75rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', padding: '0.35rem 0.75rem', opacity: saving ? 0.6 : 1 }}
                        >
                            {saving ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </div>
            ) : item.text ? (
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 12px' }}>
                    {item.text}
                </p>
            ) : null}

            {isMultiImage && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min((item.image as string[]).length, 3)}, 1fr)`, gap: 2, borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                    {(item.image as string[]).map((img, i) => (
                        <img key={i} src={img} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                    ))}
                </div>
            )}
            {isSingleImage && (
                <img src={item.image as string} alt="" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8, display: 'block', marginBottom: 12 }} />
            )}
            {isVideoFile && (
                <video src={item.video!} autoPlay loop muted playsInline style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8, display: 'block', marginBottom: 12 }} />
            )}
            {isGif && (
                <img src={item.video!} alt="" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8, display: 'block', marginBottom: 12 }} />
            )}

            {track && (
                <div onClick={() => seekAfterLoad(item.timeCode ?? 0)}>
                    <TrackRow track={track} />
                </div>
            )}

            <div style={{ display: 'flex', gap: 2, marginTop: 10, alignItems: 'center' }}>
                <button
                    onClick={handleLike}
                    disabled={likeLoading}
                    style={actBtnStyle(liked ? '#FD5E5E' : '#555', likeLoading)}
                    onMouseEnter={e => { if (!likeLoading) e.currentTarget.style.color = liked ? '#FD5E5E' : '#fff' }}
                    onMouseLeave={e => { if (!likeLoading) e.currentTarget.style.color = liked ? '#FD5E5E' : '#555' }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {likesCount > 0 ? likesCount : ''}
                </button>
                {canRepost && (
                    <button
                        onClick={handleRepost}
                        disabled={repostLoading}
                        style={actBtnStyle(reposted ? '#4ade80' : '#555', repostLoading)}
                        onMouseEnter={e => { if (!repostLoading) e.currentTarget.style.color = reposted ? '#4ade80' : '#fff' }}
                        onMouseLeave={e => { if (!repostLoading) e.currentTarget.style.color = reposted ? '#4ade80' : '#555' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M17 1L21 5L17 9M21 5H8C5.79086 5 4 6.79086 4 9V11M7 23L3 19L7 15M3 19H16C18.2091 19 20 17.2091 20 15V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {reposted ? 'Репостнуто' : 'Репост'}
                    </button>
                )}
                <button
                    ref={dotsRef}
                    onClick={e => {
                        e.stopPropagation()
                        if (dotsRef.current) {
                            const rect = dotsRef.current.getBoundingClientRect()
                            setMenuPos({ x: rect.right, y: rect.bottom })
                        }
                        setMenuOpen(v => !v)
                    }}
                    style={actBtnStyle(menuOpen ? '#fff' : '#555')}
                    onMouseEnter={e => { if (!menuOpen) e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.color = menuOpen ? '#fff' : '#555' }}
                >
                    <DotsIcon />
                </button>
            </div>

            {menuOpen && createPortal(
                <div
                    ref={dotsMenuRef}
                    style={{
                        position: 'fixed',
                        top: menuPos.y + 4,
                        left: menuPos.x - 172,
                        zIndex: 1000,
                        background: 'rgba(20,20,20,0.97)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        padding: '6px 0',
                        minWidth: 172,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                    }}
                >
                    <button
                        onClick={() => { handleShare(); setMenuOpen(false) }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            width: '100%', background: 'none', border: 'none',
                            color: copied ? '#4ade80' : 'rgba(255,255,255,0.85)',
                            padding: '10px 16px', cursor: 'pointer',
                            fontSize: '0.82rem', textAlign: 'left',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M7.37851 10.1907L5.14505 12.4242C4.31092 13.2583 3.83124 14.3933 3.84001 15.5861C3.84877 16.7789 4.31796 17.9208 5.19167 18.7675C6.03836 19.6413 7.18048 20.1104 8.3731 20.1192C9.59293 20.1282 10.701 19.6755 11.5352 18.8414L13.7687 16.6079M16.6215 13.8097L18.8549 11.5762C19.6891 10.7421 20.1688 9.60711 20.16 8.4143C20.1512 7.22149 19.682 6.0796 18.8083 5.23287C17.9618 4.38638 16.8199 3.91717 15.6271 3.90841C14.4343 3.89964 13.2992 4.35209 12.465 5.18625L10.2315 7.4197M8.6131 15.3274L15.3135 8.62701" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Поделиться
                    </button>
                    {!readOnly && (
                        <button
                            onClick={() => { setEditModalOpen(true); setMenuOpen(false) }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                width: '100%', background: 'none', border: 'none',
                                color: 'rgba(255,255,255,0.85)',
                                padding: '10px 16px', cursor: 'pointer',
                                fontSize: '0.82rem', textAlign: 'left',
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M13.7999 19.5514H19.7999M4.19995 19.5514L8.56594 18.6717C8.79771 18.625 9.01053 18.5109 9.17767 18.3437L18.9513 8.56461C19.4199 8.09576 19.4196 7.33577 18.9506 6.86731L16.8802 4.79923C16.4114 4.33097 15.6518 4.33129 15.1834 4.79995L5.40871 14.58C5.2419 14.7469 5.128 14.9593 5.08125 15.1906L4.19995 19.5514Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Редактировать
                        </button>
                    )}
                    {!readOnly && (
                        confirmDelete ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 16px' }}>
                                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', flexGrow: 1 }}>Удалить пост?</span>
                                <button
                                    onClick={() => { handleDelete(); setMenuOpen(false); setConfirmDelete(false) }}
                                    disabled={deleting}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: 'rgba(255,100,100,0.85)',
                                        cursor: deleting ? 'default' : 'pointer',
                                        fontSize: '0.82rem', padding: '4px 8px', opacity: deleting ? 0.5 : 1,
                                    }}
                                >
                                    {deleting ? '...' : 'Да'}
                                </button>
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: 'rgba(255,255,255,0.5)',
                                        cursor: 'pointer',
                                        fontSize: '0.82rem', padding: '4px 8px',
                                    }}
                                >
                                    Нет
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmDelete(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    width: '100%', background: 'none', border: 'none',
                                    color: 'rgba(255,100,100,0.85)',
                                    padding: '10px 16px', cursor: 'pointer',
                                    fontSize: '0.82rem', textAlign: 'left',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 6.17647H20M9 3H15M15.5 21H8.5C7.39543 21 6.5 20.0519 6.5 18.8824L6.0434 7.27937C6.01973 6.67783 6.47392 6.17647 7.04253 6.17647H16.9575C17.5261 6.17647 17.9803 6.67783 17.9566 7.27937L17.5 18.8824C17.5 20.0519 16.6046 21 15.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                Удалить
                            </button>
                        )
                    )}
                    {readOnly && (
                        <button
                            onClick={() => { handleReport(); setMenuOpen(false) }}
                            disabled={reporting || reported}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                width: '100%', background: 'none', border: 'none',
                                color: reported ? '#4ade80' : 'rgba(255,100,100,0.85)',
                                padding: '10px 16px', cursor: reporting || reported ? 'default' : 'pointer',
                                fontSize: '0.82rem', textAlign: 'left', opacity: reporting ? 0.5 : 1,
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.31 1.55 18.66 1.55 19.01C1.55 19.36 1.64 19.71 1.82 20.02C2 20.33 2.26 20.58 2.57 20.76C2.88 20.94 3.23 21.04 3.59 21.04H20.42C20.78 21.04 21.13 20.94 21.44 20.76C21.75 20.58 22.01 20.33 22.19 20.02C22.37 19.71 22.46 19.36 22.46 19.01C22.46 18.66 22.37 18.31 22.19 18L13.71 3.86C13.53 3.55 13.27 3.3 12.96 3.12C12.65 2.94 12.3 2.85 11.95 2.85C11.6 2.85 11.25 2.94 10.94 3.12C10.63 3.3 10.47 3.55 10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {reported ? 'Жалоба отправлена' : reporting ? 'Отправка...' : 'Пожаловаться'}
                        </button>
                    )}
                </div>,
                document.body
            )}
            {editModalOpen && (
                <CreatePostModal
                    onClose={() => setEditModalOpen(false)}
                    defaultText={item.text}
                    defaultTrack={track ? {
                        id: Number(track.id),
                        title: track.title,
                        artist: track.artist,
                        avatar_url: track.cover || null,
                        stream_url: track.src.startsWith(BASE) ? track.src.slice(BASE.length) : track.src,
                    } : null}
                    defaultTimeCode={item.timeCode}
                    defaultImages={item.image ? (Array.isArray(item.image) ? item.image : [item.image]) : []}
                    defaultVideo={item.video ?? null}
                    editPostId={item.id}
                    onEdited={(id, text) => { onEdited?.(id, text); setEditModalOpen(false) }}
                />
            )}
        </div>
    )
}

const POSTS_LIMIT = 20

const FeedPostsList = ({ token }: { token: string }) => {
    const [posts, setPosts] = useState<FeedItem[]>([])
    const [loading, setLoading] = useState(true)
    const [hasMore, setHasMore] = useState(true)
    const [skip, setSkip] = useState(0)

    useEffect(() => {
        setLoading(true)
        fetch(`${BASE}/posts/my?skip=0&limit=${POSTS_LIMIT}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then((data: ApiPost[]) => {
                if (!Array.isArray(data)) return
                setPosts(data.map(mapApiPost))
                setSkip(data.length)
                if (data.length < POSTS_LIMIT) setHasMore(false)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [token])

    const loadMore = () => {
        fetch(`${BASE}/posts/my?skip=${skip}&limit=${POSTS_LIMIT}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then((data: ApiPost[]) => {
                if (!Array.isArray(data)) return
                setPosts(prev => [...prev, ...data.map(mapApiPost)])
                setSkip(s => s + data.length)
                if (data.length < POSTS_LIMIT) setHasMore(false)
            })
            .catch(() => {})
    }

    const handleDelete = (id: number) => setPosts(prev => prev.filter(p => p.id !== id))
    const handleEdited = (id: number, text: string) => setPosts(prev => prev.map(p => p.id === id ? { ...p, text } : p))

    return (
        <div style={{ marginTop: '6rem', maxWidth: 520, margin: '6rem auto 0' }}>
            {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>загрузка...</p>}
            {!loading && posts.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>нет постов</p>}
            {posts.map((item, i) => (
                <FeedPost key={item.id ?? i} item={item} token={token} onDelete={handleDelete} onEdited={handleEdited} />
            ))}
            {hasMore && !loading && posts.length > 0 && (
                <button
                    onClick={loadMore}
                    style={{
                        width: '100%', padding: '0.6rem', background: 'none',
                        border: '1px solid #333', borderRadius: '0.4rem',
                        color: '#555', cursor: 'pointer', fontSize: '0.75rem',
                        letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '1rem',
                    }}
                >
                    Загрузить ещё
                </button>
            )}
        </div>
    )
}

const LikedPostsList = ({ token }: { token: string }) => {
    const [posts, setPosts] = useState<FeedItem[]>([])
    const [loading, setLoading] = useState(true)
    const [hasMore, setHasMore] = useState(true)
    const [skip, setSkip] = useState(0)

    useEffect(() => {
        setLoading(true)
        fetch(`${BASE}/posts/liked?skip=0&limit=${POSTS_LIMIT}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then((data: ApiPost[]) => {
                if (!Array.isArray(data)) return
                setPosts(data.map(mapApiPost))
                setSkip(data.length)
                if (data.length < POSTS_LIMIT) setHasMore(false)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [token])

    const loadMore = () => {
        fetch(`${BASE}/posts/liked?skip=${skip}&limit=${POSTS_LIMIT}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then((data: ApiPost[]) => {
                if (!Array.isArray(data)) return
                setPosts(prev => [...prev, ...data.map(mapApiPost)])
                setSkip(s => s + data.length)
                if (data.length < POSTS_LIMIT) setHasMore(false)
            })
            .catch(() => {})
    }

    return (
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
            {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>загрузка...</p>}
            {!loading && posts.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>нет понравившихся постов</p>}
            {posts.map((item, i) => (
                <FeedPost key={item.id ?? i} item={item} token={token} readOnly />
            ))}
            {hasMore && !loading && posts.length > 0 && (
                <button
                    onClick={loadMore}
                    style={{
                        width: '100%', padding: '0.6rem', background: 'none',
                        border: '1px solid #333', borderRadius: '0.4rem',
                        color: '#555', cursor: 'pointer', fontSize: '0.75rem',
                        letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '1rem',
                    }}
                >
                    Загрузить ещё
                </button>
            )}
        </div>
    )
}

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
    const [mainTab, setMainTab] = useState<MainTab>('feed')
    const [subTab, setSubTab] = useState<SubTab>('saved')
    const [editOpen, setEditOpen] = useState(false)
    const [postOpen, setPostOpen] = useState(false)
    const [favTrack, setFavTrack] = useState<FavTrack | null>(null)
    const [favVinyl, setFavVinyl] = useState<VinylApi | null>(null)
    const [favTrackLoading, setFavTrackLoading] = useState(false)
    const [favVinylLoading, setFavVinylLoading] = useState(false)
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
    const [tabsVisible, setTabsVisible] = useState(true)
    const tabsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    // useEffect(() => {
    //     if (!tabsRef.current) return
    //     const observer = new IntersectionObserver(
    //         ([entry]) => setTabsVisible(entry.isIntersecting),
    //         { threshold: 0 }
    //     )
    //     observer.observe(tabsRef.current)
    //     return () => observer.disconnect()
    // }, [])

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
            if (tab === 'social') setSubTab('subscriptions')
            else if (tab === 'feed') setSubTab('uploaded')
            else setSubTab('saved')
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('player_volume');
        logout();
        navigate('/pages/login');
    }

    const bgImage = user?.bg_image_url || DEFAULT_BG
    const avatarImage = user?.avatar_url || DEFAULT_AVATAR

    return (
        <div style={pageStyle}>
            {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} />}
            {postOpen && <CreatePostModal onClose={() => setPostOpen(false)} />}
            <PlayerTwo top />
            <div style={{width: '100%', height: '75vh'}}>
                <img src={bgImage} style={{width: '100%', height: '75vh', objectFit: 'cover'}}/>
            </div>

            {/* Avatar */}
            <img
                src={avatarImage}
                style={{width: 150, height: 150, objectFit: 'cover', position: 'absolute', top: 'calc(75vh - 75px)', left: '50%', transform: 'translateX(-50%)', borderRadius: 100, border: '5px solid #000'}}
            />

            {/* Profile name under avatar */}
            <div style={{
                position: 'absolute',
                top: 'calc(75vh + 87px)',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 150,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 4,
            }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em' }}>
                    {user?.name ?? user?.email ?? 'vapira'}
                </span>
                {user?.is_admin === 1 && <AdminCheckIcon />}
            </div>

            {/* Favourite vinyl — bottom left */}
            {favVinyl && (
                <div
                    onClick={() => navigate(`/pages/vinyl?vinylId=${favVinyl.id}`)}
                    style={{
                    position: 'absolute',
                    top: '55vh',
                    left: '5vw',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: isMobile ? 6 : 12,
                    backgroundColor: '#ffffff9e',
                    borderRadius: 100,
                    padding: isMobile ? 8 : 15,
                    cursor: 'pointer',
                    maxWidth: isMobile ? '42vw' : 'none',
                }}>
                    <div style={{ flexShrink: 0, transform: isMobile ? 'scale(0.7)' : 'none', transformOrigin: 'center' }}>
                        <VinylRecord cover={favVinyl.cover ? `${BASE}${favVinyl.cover}` : undefined} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#000', fontSize: isMobile ? 10 : 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{favVinyl.name}</div>
                        <div style={{ color: '#333', fontSize: isMobile ? 9 : 11, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{favVinyl.artist}</div>
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
                        maxWidth: isMobile ? '55vw' : 'none',
                    }}
                    onClick={() => loadAndPlayExternal({
                        id: String(favTrack.id),
                        name: favTrack.title,
                        artist: favTrack.artist,
                        src: `${BASE}${favTrack.stream_url}`,
                        cover: favTrack.avatar_url ?? undefined,
                    })}
                >
                    <span style={{ color: '#fff', fontSize: isMobile ? 12 : 20, alignSelf: 'flex-end' }}>Выбор пользователя</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div>
                            <div style={{ color: '#fff', fontSize: isMobile ? 20 : 40, fontWeight: 900, marginBottom: 4, maxWidth: isMobile ? '55vw' : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{favTrack.title}</div>
                            <div style={{ color: '#fff', fontSize: isMobile ? 13 : 20, fontWeight: 900 }}>{favTrack.artist}</div>
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
            <div style={{ marginTop: isMobile ? 120 : 0 }}>
                <div style={{ width: '100%', margin: '0 auto', padding: isMobile ? '1rem' : '1.5rem 2rem 2rem'}}>

                    {/* Main buttons */}
                    <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        gap: isMobile ? '0.75rem' : 0,
                        marginBottom: mainTab ? '1.5rem' : 0,
                    }}>
                        <div ref={tabsRef} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <TabBtn active={mainTab === 'feed'} onClick={() => handleMainTab('feed')} label="Посты" />
                            <TabBtn active={mainTab === 'tracks'} onClick={() => handleMainTab('tracks')} label="Треки" />
                            <TabBtn active={mainTab === 'vinyls'} onClick={() => handleMainTab('vinyls')} label="Виниловые пластинки" />
                            <TabBtn active={mainTab === 'social'} onClick={() => handleMainTab('social')} label="Подписки" />
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            {user?.is_admin === 1 && (
                                <ActionBtn label="Администратор" onClick={() => navigate('/pages/admin')} />
                            )}
                            <ActionBtn label="Редактировать профиль" onClick={() => setEditOpen(true)} />
                            <ActionBtn label="Выйти" onClick={handleLogout} danger />
                        </div>
                    </div>

                    {/* Feed section */}
                    {mainTab === 'feed' && token && (
                        <div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                <TabBtn active={subTab !== 'liked'} onClick={() => setSubTab('uploaded')} label="Мои посты" />
                                <TabBtn active={subTab === 'liked'} onClick={() => setSubTab('liked')} label="Понравившиеся" />
                            </div>
                            {subTab !== 'liked' && <FeedPostsList token={token} />}
                            {subTab === 'liked' && <LikedPostsList token={token} />}
                        </div>
                    )}

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

                    {/* Social section */}
                    {mainTab === 'social' && (
                        <div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                <TabBtn active={subTab === 'subscriptions'} onClick={() => setSubTab('subscriptions')} label="Подписки" />
                                <TabBtn active={subTab === 'subscribers'} onClick={() => setSubTab('subscribers')} label="Подписчики" />
                            </div>
                            {token && subTab === 'subscriptions' && <SubscriptionsList token={token} />}
                            {token && subTab === 'subscribers' && user && <SubscribersList token={token} userId={user.id} />}
                        </div>
                    )}
                </div>
            </div>

            {/* FAB: context-aware add button */}
            <button
                onClick={
                    mainTab === 'tracks' ? () => navigate('/pages/upload/track') :
                    mainTab === 'vinyls' ? () => navigate('/pages/upload/vinyl') :
                    () => setPostOpen(true)
                }
                style={{
                    position: 'fixed',
                    bottom: isMobile ? '7.5rem' : '1.5rem',
                    right: '1.5rem',
                    zIndex: 50,
                    width: isMobile ? 42 : 52,
                    height: isMobile ? 42 : 52,
                    borderRadius: '50%',
                    background: '#fff',
                    border: 'none',
                    color: '#000',
                    fontSize: '1.6rem',
                    lineHeight: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                    transition: 'transform 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
                +
            </button>

            {/* Sticky sidebar — desktop only, appears when tabs scroll off screen */}
            {!isMobile && !tabsVisible && (
                <div style={{
                    position: 'fixed',
                    left: '1.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    alignItems: 'flex-start',
                }}>
                    <TabBtn active={mainTab === 'feed'} onClick={() => handleMainTab('feed')} label="Посты" />
                    <TabBtn active={mainTab === 'tracks'} onClick={() => handleMainTab('tracks')} label="Треки" />
                    <TabBtn active={mainTab === 'vinyls'} onClick={() => handleMainTab('vinyls')} label="Пластинки" />
                    <TabBtn active={mainTab === 'social'} onClick={() => handleMainTab('social')} label="Подписки" />
                </div>
            )}
        </div>
    )
}
