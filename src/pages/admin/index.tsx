import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { useAudioPlayer } from '../../context/audio-context'
import { PlayerTwo } from '../../components/player/player-two'

const BASE = 'https://vapira.ru'

type AdminTab = 'users' | 'tracks' | 'vinyls'

interface AdminUser {
    id: string | number
    email: string
    name?: string
    avatar_url?: string
    is_admin?: number
}

interface AdminTrack {
    id: number
    title: string
    artist: string
    avatar_url?: string | null
    stream_url?: string | null
}

interface AdminVinyl {
    id: number
    name: string
    artist?: string | null
    cover?: string | null
    bg_color?: string | null
}

const TrashIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6.17647H20M9 3H15M15.5 21H8.5C7.39543 21 6.5 20.0519 6.5 18.8824L6.0434 7.27937C6.01973 6.67783 6.47392 6.17647 7.04253 6.17647H16.9575C17.5261 6.17647 17.9803 6.67783 17.9566 7.27937L17.5 18.8824C17.5 20.0519 16.6046 21 15.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
)

type ReportType = 'tracks' | 'vinyl' | 'users'

const ReportsBadge = ({ token, type, id }: { token: string; type: ReportType; id: number | string }) => {
    const [count, setCount] = useState<number | null>(null)
    const [clearing, setClearing] = useState(false)
    const [confirm, setConfirm] = useState(false)

    useEffect(() => {
        fetch(`${BASE}/reports/${type}/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data === null) { setCount(0); return }
                setCount(Array.isArray(data) ? data.length : (data?.count ?? data?.total ?? 0))
            })
            .catch(() => setCount(0))
    }, [token, type, id])

    const handleClear = async () => {
        if (clearing) return
        setClearing(true)
        setConfirm(false)
        try {
            await fetch(`${BASE}/reports/${type}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            setCount(0)
        } finally {
            setClearing(false)
        }
    }

    if (count === null || count === 0) return null

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
            <span style={{
                background: '#3a1a1a', color: '#ff6b6b', fontSize: '0.65rem',
                fontWeight: 700, letterSpacing: '0.04em', borderRadius: '0.3rem',
                padding: '0.15rem 0.45rem', whiteSpace: 'nowrap',
            }}>
                {/* {count} жал. */}
                {count}
            </span>
            {confirm ? (
                <>
                    <button
                        onClick={handleClear}
                        disabled={clearing}
                        style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.15rem 0.3rem' }}
                    >
                        {clearing ? '...' : 'снять'}
                    </button>
                    <button
                        onClick={() => setConfirm(false)}
                        style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.15rem 0.3rem' }}
                    >
                        нет
                    </button>
                </>
            ) : (
                <button
                    onClick={() => setConfirm(true)}
                    style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.15rem 0.3rem', transition: 'color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ff6b6b' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                >
                    ×
                </button>
            )}
        </div>
    )
}

const TabBtn = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button
        onClick={onClick}
        style={{
            background: active ? '#fff' : 'none',
            border: '0px solid',
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

const searchInputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #333',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    padding: '0.4rem 0',
    outline: 'none',
    width: '100%',
    marginBottom: '1.25rem',
}

const DeleteBtn = ({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) => {
    const [confirm, setConfirm] = useState(false)

    if (confirm) {
        return (
            <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                    onClick={() => { setConfirm(false); onConfirm() }}
                    disabled={disabled}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.25rem 0.4rem' }}
                >
                    да
                </button>
                <button
                    onClick={() => setConfirm(false)}
                    style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.7rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.25rem 0.4rem' }}
                >
                    нет
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={() => setConfirm(true)}
            style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '0.25rem 0.5rem', display: 'flex', transition: 'color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ff4444' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
        >
            <TrashIcon />
        </button>
    )
}

const UsersTab = ({ token, currentUserId }: { token: string; currentUserId: string }) => {
    const navigate = useNavigate()
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [pendingAdminId, setPendingAdminId] = useState<string | null>(null)
    const [query, setQuery] = useState('')

    useEffect(() => {
        fetch(`${BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(() => setUsers([]))
            .finally(() => setLoading(false))
    }, [token])

    const handleDelete = async (id: string) => {
        if (deletingId) return
        setDeletingId(id)
        try {
            const res = await fetch(`${BASE}/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setUsers(prev => prev.filter(u => String(u.id) !== id))
        } finally {
            setDeletingId(null)
        }
    }

    const handleToggleAdmin = async (id: string, isAdmin: boolean) => {
        if (pendingAdminId) return
        setPendingAdminId(id)
        const endpoint = isAdmin ? 'remove-admin' : 'make-admin'
        try {
            const res = await fetch(`${BASE}/admin/users/${id}/${endpoint}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setUsers(prev => prev.map(u => String(u.id) === id ? { ...u, is_admin: isAdmin ? 0 : 1 } : u))
        } finally {
            setPendingAdminId(null)
        }
    }

    if (loading) return <p style={{ color: '#555', fontSize: '0.875rem' }}>загрузка...</p>
    if (users.length === 0) return <p style={{ color: '#555', fontSize: '0.875rem' }}>нет пользователей</p>

    const q = query.toLowerCase()
    const filtered = query ? users.filter(u => u.email.toLowerCase().includes(q) || (u.name ?? '').toLowerCase().includes(q)) : users

    return (
        <div>
            <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск по имени или email..."
                style={searchInputStyle}
            />
            <p style={{ color: '#555', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                {filtered.length} из {users.length} пользователей
            </p>
            {filtered.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>ничего не найдено</p>}
            {filtered.map(u => {
                const uid = String(u.id)
                const isSelf = uid === currentUserId
                return (
                    <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid #1a1a1a' }}>
                        <div
                            onClick={() => navigate(`/users/${u.id}`)}
                            style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#222', cursor: 'pointer', flexShrink: 0 }}
                        >
                            {u.avatar_url && <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
                        </div>
                        <div onClick={() => navigate(`/users/${u.id}`)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                            <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {u.name ?? u.email}
                                {isSelf && <span style={{ color: '#555', fontSize: '0.7rem', marginLeft: '0.5rem' }}>(вы)</span>}
                            </div>
                            {u.name && <div style={{ color: '#555', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>}
                        </div>
                        <ReportsBadge token={token} type="users" id={u.id} />
                        {!isSelf && (
                            <>
                                <button
                                    onClick={() => handleToggleAdmin(uid, u.is_admin === 1)}
                                    disabled={pendingAdminId === uid}
                                    title={u.is_admin === 1 ? 'Снять права админа' : 'Назначить админом'}
                                    style={{
                                        background: 'none', border: '1px solid',
                                        borderColor: u.is_admin === 1 ? '#555' : '#333',
                                        borderRadius: '0.3rem', color: u.is_admin === 1 ? '#aaa' : '#555',
                                        fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                                        cursor: pendingAdminId === uid ? 'not-allowed' : 'pointer',
                                        padding: '0.2rem 0.5rem', flexShrink: 0,
                                        opacity: pendingAdminId === uid ? 0.5 : 1,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {pendingAdminId === uid ? '...' : u.is_admin === 1 ? 'админ ×' : '+ админ'}
                                </button>
                                <DeleteBtn onConfirm={() => handleDelete(uid)} disabled={deletingId === uid} />
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

const TracksTab = ({ token }: { token: string }) => {
    const { loadAndPlayExternal } = useAudioPlayer()
    const [tracks, setTracks] = useState<AdminTrack[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [query, setQuery] = useState('')

    useEffect(() => {
        fetch(`${BASE}/admin/tracks`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => setTracks(Array.isArray(data) ? data : []))
            .catch(() => setTracks([]))
            .finally(() => setLoading(false))
    }, [token])

    const handleDelete = async (id: number) => {
        if (deletingId !== null) return
        setDeletingId(id)
        try {
            const res = await fetch(`${BASE}/admin/tracks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setTracks(prev => prev.filter(t => t.id !== id))
        } finally {
            setDeletingId(null)
        }
    }

    const handlePlay = (t: AdminTrack) => {
        if (!t.stream_url) return
        loadAndPlayExternal({
            id: String(t.id),
            name: t.title,
            artist: t.artist,
            src: `${BASE}${t.stream_url}`,
            cover: t.avatar_url ?? undefined,
        })
    }

    if (loading) return <p style={{ color: '#555', fontSize: '0.875rem' }}>загрузка...</p>
    if (tracks.length === 0) return <p style={{ color: '#555', fontSize: '0.875rem' }}>нет треков</p>

    const q = query.toLowerCase()
    const filtered = query ? tracks.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)) : tracks

    return (
        <div>
            <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск по названию или исполнителю..."
                style={searchInputStyle}
            />
            <p style={{ color: '#555', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                {filtered.length} из {tracks.length} треков
            </p>
            {filtered.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>ничего не найдено</p>}
            {filtered.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid #1a1a1a' }}>
                    <div
                        onClick={() => handlePlay(t)}
                        style={{ width: 36, height: 36, borderRadius: 4, overflow: 'hidden', flexShrink: 0, cursor: t.stream_url ? 'pointer' : 'default' }}
                    >
                        {t.avatar_url
                            ? <img src={`${t.avatar_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '1rem' }}>♪</div>
                        }
                    </div>
                    <div onClick={() => handlePlay(t)} style={{ flex: 1, minWidth: 0, cursor: t.stream_url ? 'pointer' : 'default' }}>
                        <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                        <div style={{ color: '#555', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.artist}</div>
                    </div>
                    <ReportsBadge token={token} type="tracks" id={t.id} />
                    <DeleteBtn onConfirm={() => handleDelete(t.id)} disabled={deletingId === t.id} />
                </div>
            ))}
        </div>
    )
}

const VinylsTab = ({ token }: { token: string }) => {
    const navigate = useNavigate()
    const [vinyls, setVinyls] = useState<AdminVinyl[]>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [query, setQuery] = useState('')

    useEffect(() => {
        fetch(`${BASE}/admin/vinyl`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => setVinyls(Array.isArray(data) ? data : []))
            .catch(() => setVinyls([]))
            .finally(() => setLoading(false))
    }, [token])

    const handleDelete = async (id: number) => {
        if (deletingId !== null) return
        setDeletingId(id)
        try {
            const res = await fetch(`${BASE}/admin/vinyl/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setVinyls(prev => prev.filter(v => v.id !== id))
        } finally {
            setDeletingId(null)
        }
    }

    if (loading) return <p style={{ color: '#555', fontSize: '0.875rem' }}>загрузка...</p>
    if (vinyls.length === 0) return <p style={{ color: '#555', fontSize: '0.875rem' }}>нет пластинок</p>

    const q = query.toLowerCase()
    const filtered = query ? vinyls.filter(v => v.name.toLowerCase().includes(q) || (v.artist ?? '').toLowerCase().includes(q)) : vinyls

    return (
        <div>
            <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Поиск по названию или исполнителю..."
                style={searchInputStyle}
            />
            <p style={{ color: '#555', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                {filtered.length} из {vinyls.length} пластинок
            </p>
            {filtered.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>ничего не найдено</p>}
            {filtered.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid #1a1a1a' }}>
                    <div
                        onClick={() => navigate(`/vinyl?vinylId=${v.id}`)}
                        style={{ width: 36, height: 36, borderRadius: 4, overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}
                    >
                        {v.cover
                            ? <img src={`${BASE}${v.cover}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', background: v.bg_color ?? '#333' }} />
                        }
                    </div>
                    <div onClick={() => navigate(`/vinyl?vinylId=${v.id}`)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                        <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</div>
                        {v.artist && <div style={{ color: '#555', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.artist}</div>}
                    </div>
                    <ReportsBadge token={token} type="vinyl" id={v.id} />
                    <DeleteBtn onConfirm={() => handleDelete(v.id)} disabled={deletingId === v.id} />
                </div>
            ))}
        </div>
    )
}

export const AdminPage = () => {
    const { token, user, logout } = useAuth()
    const navigate = useNavigate()
    const [tab, setTab] = useState<AdminTab>('users')
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    if (!token || !user) return null

    const handleLogout = () => {
        localStorage.removeItem('player_volume')
        logout()
        navigate('/pages/login')
    }

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#000', paddingBottom: '6rem' }}>
            <PlayerTwo top />
            <div style={{ maxWidth: 700, margin: '0 auto', padding: isMobile ? '5rem 1rem 2rem' : '5rem 2rem 2rem' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: isMobile ? '0.75rem' : 0,
                    marginBottom: '2rem',
                }}>
                    <div>
                        <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555', marginBottom: '0.4rem' }}>vapira</p>
                        <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Администратор</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => navigate('/pages/profile')}
                            style={{ background: 'none', border: '1px solid #333', borderRadius: '0.4rem', color: '#aaa', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '0.5rem 1rem' }}
                        >
                            Профиль
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{ background: 'none', border: '0px solid', borderRadius: '0.4rem', color: '#555', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', padding: '0.5rem 1rem' }}
                        >
                            Выйти
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <TabBtn active={tab === 'users'} onClick={() => setTab('users')} label="Пользователи" />
                    <TabBtn active={tab === 'tracks'} onClick={() => setTab('tracks')} label="Треки" />
                    <TabBtn active={tab === 'vinyls'} onClick={() => setTab('vinyls')} label="Пластинки" />
                </div>

                {tab === 'users' && <UsersTab token={token} currentUserId={user.id} />}
                {tab === 'tracks' && <TracksTab token={token} />}
                {tab === 'vinyls' && <VinylsTab token={token} />}
            </div>
        </div>
    )
}
