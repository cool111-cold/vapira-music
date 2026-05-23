import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { PlayerTwo } from '../../components/player/player-two'
import { useAudioPlayer } from '../../context/audio-context'
import { Icon } from '../../components/icon'
import { TrackRow, LibTrack } from '../library/track-row'
import { VinylRow, VinylApi } from '../library/vinyls'

const BASE = 'https://vapira.ru'
const DEFAULT_BG = '/images/back.jpg'
const DEFAULT_AVATAR = '/images/ava.jpg'

interface PublicUser {
    id: string
    email: string
    name?: string
    avatar_url?: string
    bg_image_url?: string
    favorite_track_id?: number | null
    favorite_vinyl_id?: number | null
}

interface FavTrack {
    id: number
    title: string
    artist: string
    avatar_url: string | null
    stream_url: string
}

type MainTab = 'tracks' | 'vinyls' | null
type SubTab = 'saved' | 'uploaded'

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

const UserTracksList = ({ userId, token, endpoint }: { userId: string; token: string; endpoint: string }) => {
    const [tracks, setTracks] = useState<LibTrack[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch(`${BASE}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => Array.isArray(data) ? data.map((t: any) => ({
                id: String(t.id),
                title: t.title,
                artist: t.artist,
                cover: t.avatar_url,
                src: `${BASE}${t.stream_url}`,
            })) : [])
            .then(setTracks)
            .catch(() => setTracks([]))
            .finally(() => setLoading(false))
    }, [endpoint, token])

    return (
        <>
            {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>загрузка...</p>}
            {!loading && tracks.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>нет треков</p>}
            {tracks.map(t => <TrackRow key={t.id} track={t} />)}
        </>
    )
}

const UserVinylsList = ({ userId, token, endpoint }: { userId: string; token: string; endpoint: string }) => {
    const [vinyls, setVinyls] = useState<VinylApi[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch(`${BASE}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => Array.isArray(data) ? data : [])
            .then(setVinyls)
            .catch(() => setVinyls([]))
            .finally(() => setLoading(false))
    }, [endpoint, token])

    return (
        <>
            {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>загрузка...</p>}
            {!loading && vinyls.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>нет пластинок</p>}
            {vinyls.map(v => <VinylRow key={v.id} vinyl={v} token={token} onDeleted={() => {}} showSave />)}
        </>
    )
}

const VinylRecord = ({ cover }: { cover?: string }) => (
    <div style={{
        width: 50, height: 50, borderRadius: '50%', position: 'relative',
        boxShadow: '0 4px 24px rgba(0,0,0,0.9)',
        background: `
            radial-gradient(circle at center, transparent 20%, rgba(255,255,255,0.04) 20.5%, rgba(255,255,255,0.04) 22%, transparent 22.5%,
            transparent 28%, rgba(255,255,255,0.04) 28.5%, rgba(255,255,255,0.04) 30%, transparent 30.5%,
            transparent 36%, rgba(255,255,255,0.04) 36.5%, rgba(255,255,255,0.04) 38%, transparent 38.5%,
            transparent 44%, rgba(255,255,255,0.04) 44.5%, rgba(255,255,255,0.04) 46%, transparent 46.5%),
            #111
        `,
    }}>
        <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 20, height: 20, borderRadius: '50%', overflow: 'hidden', background: cover ? undefined : '#222',
        }}>
            {cover && <img src={cover} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 8, height: 8, borderRadius: '50%', background: '#000', zIndex: 1,
        }} />
    </div>
)

const PageLoader = () => (
    <div style={{
        position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
        <div style={{
            width: 36, height: 36, border: '2px solid #222',
            borderTop: '2px solid #fff', borderRadius: '50%',
            animation: 'profile-spin 0.75s linear infinite',
        }} />
        <style>{`@keyframes profile-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
)

export const UserProfilePage = () => {
    const { id } = useParams<{ id: string }>()
    const { token } = useAuth()
    const { loadAndPlayExternal } = useAudioPlayer()
    const navigate = useNavigate()

    const [profileUser, setProfileUser] = useState<PublicUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [favTrack, setFavTrack] = useState<FavTrack | null>(null)
    const [favVinyl, setFavVinyl] = useState<VinylApi | null>(null)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [subscriptionLoaded, setSubscriptionLoaded] = useState(false)
    const [actionPending, setActionPending] = useState(false)
    const [mainTab, setMainTab] = useState<MainTab>(null)
    const [subTab, setSubTab] = useState<SubTab>('uploaded')

    useEffect(() => {
        if (!id || !token) return
        setLoading(true)
        fetch(`${BASE}/users/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setProfileUser)
            .catch(() => setProfileUser(null))
            .finally(() => setLoading(false))
    }, [id, token])

    useEffect(() => {
        if (!token || !id) return
        fetch(`${BASE}/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(subs => {
                setIsSubscribed(Array.isArray(subs) && subs.some((u: { id: string | number }) => String(u.id) === String(id)))
                setSubscriptionLoaded(true)
            })
            .catch(() => setSubscriptionLoaded(true))
    }, [id, token])

    useEffect(() => {
        if (!profileUser?.favorite_track_id || !token) { setFavTrack(null); return }
        fetch(`${BASE}/tracks/${profileUser.favorite_track_id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setFavTrack)
            .catch(() => setFavTrack(null))
    }, [profileUser?.favorite_track_id, token])

    useEffect(() => {
        if (!profileUser?.favorite_vinyl_id || !token) { setFavVinyl(null); return }
        fetch(`${BASE}/vinyl/${profileUser.favorite_vinyl_id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setFavVinyl)
            .catch(() => setFavVinyl(null))
    }, [profileUser?.favorite_vinyl_id, token])

    const handleMainTab = (tab: MainTab) => {
        if (mainTab === tab) {
            setMainTab(null)
        } else {
            setMainTab(tab)
            setSubTab('uploaded')
        }
    }

    const subscribe = async () => {
        if (!id || !token || actionPending) return
        setActionPending(true)
        try {
            const res = await fetch(`${BASE}/subscriptions/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setIsSubscribed(true)
        } finally {
            setActionPending(false)
        }
    }

    const unsubscribe = async () => {
        if (!id || !token || actionPending) return
        setActionPending(true)
        try {
            const res = await fetch(`${BASE}/subscriptions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setIsSubscribed(false)
        } finally {
            setActionPending(false)
        }
    }

    if (loading) return <PageLoader />

    if (!profileUser) return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlayerTwo top />
            <p style={{ color: '#555', fontSize: '0.875rem' }}>пользователь не найден</p>
        </div>
    )

    const bgImage = profileUser.bg_image_url || DEFAULT_BG
    const avatarImage = profileUser.avatar_url || DEFAULT_AVATAR

    return (
        <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#000', paddingBottom: '6rem' }}>
            <PlayerTwo top />

            <div style={{ width: '100%', height: '75vh' }}>
                <img src={bgImage} style={{ width: '100%', height: '75vh', objectFit: 'cover' }} />
            </div>

            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    position: 'absolute', top: '5rem', left: '2rem',
                    background: 'rgba(0,0,0,0.5)', border: '1px solid #333',
                    borderRadius: '0.4rem', color: '#aaa', fontSize: '0.75rem',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    cursor: 'pointer', padding: '0.4rem 0.8rem', backdropFilter: 'blur(4px)',
                }}
            >
                ← назад
            </button>

            {/* Avatar */}
            <img
                src={avatarImage}
                style={{ width: 150, height: 150, objectFit: 'cover', position: 'absolute', top: '65vh', left: '45vw', borderRadius: 100, border: '5px solid #000' }}
            />

            {/* Name under avatar */}
            <div style={{ position: 'absolute', top: 'calc(65vh + 162px)', left: '45vw', width: 150, textAlign: 'center' }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em' }}>
                    {profileUser.name ?? profileUser.email}
                </span>
            </div>

            {/* Favourite vinyl — bottom left */}
            {favVinyl && (
                <div style={{
                    position: 'absolute', top: '55vh', left: '5vw',
                    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: '#ffffff9e', borderRadius: 100, padding: 15,
                }}>
                    <VinylRecord cover={favVinyl.cover ? `${BASE}${favVinyl.cover}` : undefined} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#000', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{favVinyl.name}</div>
                        <div style={{ color: '#333', fontSize: 11, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{favVinyl.artist}</div>
                    </div>
                </div>
            )}

            {/* Favourite track — right */}
            {favTrack && (
                <div
                    style={{
                        position: 'absolute', top: '40vh', right: '8vw', transform: 'translateY(-50%)',
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
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
                        width: 150, height: 36, borderRadius: 25, background: '#fff',
                        display: 'flex', alignItems: 'center', padding: 15, gap: 6, justifyContent: 'center',
                    }}>
                        <div>Слушать</div>
                        <Icon name="PlayTwoIcon" size={20} color="#000" isClick onClick={() => null} style={{ display: 'flex', alignItems: 'center' }} />
                    </div>
                </div>
            )}

            {/* Friend action + tabs */}
            <div style={{ width: '100%', margin: '0 auto', padding: '1.5rem 2rem 2rem' }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: mainTab ? '1.5rem' : 0 }}>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <TabBtn active={mainTab === 'tracks'} onClick={() => handleMainTab('tracks')} label="Треки" />
                        <TabBtn active={mainTab === 'vinyls'} onClick={() => handleMainTab('vinyls')} label="Виниловые пластинки" />
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {subscriptionLoaded && (
                        <div>
                            {isSubscribed ? (
                                <button
                                    onClick={unsubscribe}
                                    disabled={actionPending}
                                    style={{
                                        background: 'none', border: '1px solid #333', borderRadius: '0.4rem',
                                        color: '#555', fontSize: '0.75rem', letterSpacing: '0.08em',
                                        textTransform: 'uppercase', cursor: actionPending ? 'not-allowed' : 'pointer',
                                        padding: '0.5rem 1rem', opacity: actionPending ? 0.5 : 1,
                                    }}
                                >
                                    {actionPending ? '...' : 'отписаться'}
                                </button>
                            ) : (
                                <button
                                    onClick={subscribe}
                                    disabled={actionPending}
                                    style={{
                                        background: '#fff', border: 'none', borderRadius: '0.4rem',
                                        color: '#000', fontSize: '0.75rem', letterSpacing: '0.08em',
                                        textTransform: 'uppercase', cursor: actionPending ? 'not-allowed' : 'pointer',
                                        padding: '0.5rem 1rem', opacity: actionPending ? 0.5 : 1, fontWeight: 600,
                                    }}
                                >
                                    {actionPending ? '...' : '+ подписаться'}
                                </button>
                            )}
                        </div>
                    )}
                    </div>
                </div>

                {/* Tracks section */}
                {mainTab === 'tracks' && id && token && (
                    <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <TabBtn active={subTab === 'uploaded'} onClick={() => setSubTab('uploaded')} label="Загруженные" />
                            <TabBtn active={subTab === 'saved'} onClick={() => setSubTab('saved')} label="Сохранённые" />
                        </div>
                        {subTab === 'uploaded' && (
                            <UserTracksList userId={id} token={token} endpoint={`/users/${id}/tracks`} />
                        )}
                        {subTab === 'saved' && (
                            <UserTracksList userId={id} token={token} endpoint={`/users/${id}/saved-tracks`} />
                        )}
                    </div>
                )}

                {/* Vinyls section */}
                {mainTab === 'vinyls' && id && token && (
                    <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <TabBtn active={subTab === 'uploaded'} onClick={() => setSubTab('uploaded')} label="Созданные" />
                            <TabBtn active={subTab === 'saved'} onClick={() => setSubTab('saved')} label="Сохранённые" />
                        </div>
                        {subTab === 'uploaded' && (
                            <UserVinylsList userId={id} token={token} endpoint={`/users/${id}/vinyls`} />
                        )}
                        {subTab === 'saved' && (
                            <UserVinylsList userId={id} token={token} endpoint={`/users/${id}/saved-vinyls`} />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
