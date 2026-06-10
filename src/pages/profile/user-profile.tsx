import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
    is_admin?: number
}

const DotsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.0001 7.1999C10.6746 7.1999 9.6001 6.12539 9.6001 4.7999C9.6001 3.47442 10.6746 2.3999 12.0001 2.3999C13.3256 2.3999 14.4001 3.47442 14.4001 4.7999C14.4001 6.12539 13.3256 7.1999 12.0001 7.1999Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12.0001 14.3999C10.6746 14.3999 9.6001 13.3254 9.6001 11.9999C9.6001 10.6744 10.6746 9.5999 12.0001 9.5999C13.3256 9.5999 14.4001 10.6744 14.4001 11.9999C14.4001 13.3254 13.3256 14.3999 12.0001 14.3999Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12.0001 21.5999C10.6746 21.5999 9.6001 20.5254 9.6001 19.1999C9.6001 17.8744 10.6746 16.7999 12.0001 16.7999C13.3256 16.7999 14.4001 17.8744 14.4001 19.1999C14.4001 20.5254 13.3256 21.5999 12.0001 21.5999Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
)

const AdminCheckIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#fff', flexShrink: 0 }}>
        <title>Админ</title>
        <path d="M15.142 9.98299L10.875 14.25L9.42049 12.7955M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

interface FavTrack {
    id: number
    title: string
    artist: string
    avatar_url: string | null
    stream_url: string
}

interface ApiPost {
    id: number
    text?: string | null
    image_url?: string | null
    video_url?: string | null
    track_id?: number | null
    vinyl_id?: number | null
    user_id?: number | null
    author_id?: number | null
    time_code?: number | null
    show_lyrics?: boolean | null
    likes_count?: number | null
    is_liked?: boolean | null
    is_reposted?: boolean | null
    reposted_by_user_id?: number | null
}

interface FeedItem {
    id?: number
    type: string
    track_id: number
    autor_id: number
    vinyl_id?: number | null
    image: string | string[] | null
    video: string | null
    text: string
    timeCode?: number | null
    showLyrics?: boolean
    likesCount: number
    isLiked: boolean
    isReposted: boolean
    repostedByUserId?: number | null
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
    showLyrics: p.show_lyrics ?? false,
    likesCount: p.likes_count ?? 0,
    isLiked: p.is_liked ?? false,
    isReposted: p.is_reposted ?? false,
    repostedByUserId: p.reposted_by_user_id ?? null,
})

const FeedPost = ({ item, token }: { item: FeedItem; token: string }) => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { seekAfterLoad } = useAudioPlayer()
    const [track, setTrack] = React.useState<LibTrack | null>(null)
    const [author, setAuthor] = React.useState<{ id: number; name?: string; email?: string; avatar_url?: string } | null>(null)
    const [copied, setCopied] = useState(false)
    const [reporting, setReporting] = useState(false)
    const [reported, setReported] = useState(false)
    const [liked, setLiked] = useState(item.isLiked)
    const [likesCount, setLikesCount] = useState(item.likesCount)
    const [reposted, setReposted] = useState(item.isReposted)
    const [likeLoading, setLikeLoading] = useState(false)
    const [repostLoading, setRepostLoading] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
    const dotsRef = useRef<HTMLButtonElement>(null)
    const dotsMenuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!menuOpen) return
        const handler = (e: MouseEvent) => {
            const target = e.target as Node
            if (!dotsRef.current?.contains(target) && !dotsMenuRef.current?.contains(target)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [menuOpen])

    React.useEffect(() => {
        if (!item.track_id) return
        fetch(`${BASE}/tracks/${item.track_id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then((t: any) => {
                if (!t?.id) return
                setTrack({ id: String(t.id), title: t.title, artist: t.artist, cover: t.avatar_url, src: `${BASE}${t.stream_url}` })
            })
            .catch(() => {})
    }, [item.track_id, token])

    React.useEffect(() => {
        fetch(`${BASE}/users/${item.autor_id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(setAuthor)
            .catch(() => {})
    }, [item.autor_id, token])

    const handleShare = () => {
        navigator.clipboard.writeText(`${window.location.origin}/?postId=${item.id}`);  
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    const handleReport = async () => {
        if (!item.id || reporting || reported) return
        setReporting(true)
        try {
            await fetch(`${BASE}/reports/posts/${item.id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
            setReported(true)
        } finally {
            setReporting(false)
        }
    }

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

    const canRepost = !!user && String(user.id) !== String(item.autor_id)

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

            {item.text && (
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 12px' }}>
                    {item.text}
                </p>
            )}

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
                        {/* {reposted ? 'Репостнуто' : 'Репост'} */}
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
                </div>,
                document.body
            )}
        </div>
    )
}

const POSTS_LIMIT = 20

const FeedPostsList = ({ token, userId }: { token: string; userId: string }) => {
    const [posts, setPosts] = useState<FeedItem[]>([])
    const [loading, setLoading] = useState(true)
    const [hasMore, setHasMore] = useState(true)
    const [skip, setSkip] = useState(0)

    useEffect(() => {
        setLoading(true)
        fetch(`${BASE}/posts/user/${userId}?skip=0&limit=${POSTS_LIMIT}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then((data: ApiPost[]) => {
                if (!Array.isArray(data)) return
                setPosts(data.map(mapApiPost))
                setSkip(data.length)
                if (data.length < POSTS_LIMIT) setHasMore(false)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [token, userId])

    const loadMore = () => {
        fetch(`${BASE}/posts/user/${userId}?skip=${skip}&limit=${POSTS_LIMIT}`, { headers: { Authorization: `Bearer ${token}` } })
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
        <div style={{ maxWidth: 520, margin: '1.5rem auto 0' }}>
            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                    <div style={{ width: 24, height: 24, border: '2px solid #222', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'profile-spin 0.75s linear infinite' }} />
                    <style>{`@keyframes profile-spin { to { transform: rotate(360deg) } }`}</style>
                </div>
            )}
            {!loading && posts.length === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>нет постов</p>}
            {posts.map((item, i) => (
                <FeedPost key={item.id ?? i} item={item} token={token} />
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

type MainTab = 'posts' | 'tracks' | 'vinyls' | 'social' | null
type SubTab = 'saved' | 'uploaded' | 'subscriptions' | 'subscribers'

interface SocialUser {
    id: string | number
    name?: string
    email: string
    avatar_url?: string
}

const SocialUserRow = ({ user, onClick }: { user: SocialUser; onClick: () => void }) => (
    <div
        onClick={onClick}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid #1a1a1a', cursor: 'pointer' }}
    >
        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#222', flexShrink: 0 }}>
            {user.avatar_url && <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name ?? user.email}
            </div>
            {user.name && <div style={{ color: '#555', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>}
        </div>
    </div>
)

const UserSocialList = ({ token, endpoint, emptyText, showCount }: { token: string; endpoint: string; emptyText: string; showCount?: boolean }) => {
    const navigate = useNavigate()
    const [users, setUsers] = useState<SocialUser[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch(`${BASE}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(() => setUsers([]))
            .finally(() => setLoading(false))
    }, [endpoint, token])

    const count = users.length
    const countLabel = count === 1 ? 'подписчик' : count >= 2 && count <= 4 ? 'подписчика' : 'подписчиков'

    return (
        <>
            {showCount && !loading && count > 0 && (
                <p style={{ color: '#555', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                    {count} {countLabel}
                </p>
            )}
            {loading && <p style={{ color: '#555', fontSize: '0.875rem' }}>загрузка...</p>}
            {!loading && count === 0 && <p style={{ color: '#555', fontSize: '0.875rem' }}>{emptyText}</p>}
            {users.map(u => (
                <SocialUserRow key={String(u.id)} user={u} onClick={() => navigate(`/pages/users/${u.id}`)} />
            ))}
        </>
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

const UserTracksList = ({ token, endpoint }: { userId: string; token: string; endpoint: string }) => {
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

const UserVinylsList = ({ token, endpoint }: { userId: string; token: string; endpoint: string }) => {
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
    const { token, user: currentUser } = useAuth()
    const { loadAndPlayExternal } = useAudioPlayer()
    const navigate = useNavigate()

    const [profileUser, setProfileUser] = useState<PublicUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [favTrack, setFavTrack] = useState<FavTrack | null>(null)
    const [favVinyl, setFavVinyl] = useState<VinylApi | null>(null)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [subscriptionLoaded, setSubscriptionLoaded] = useState(false)
    const [actionPending, setActionPending] = useState(false)
    const [mainTab, setMainTab] = useState<MainTab>('posts')
    const [subTab, setSubTab] = useState<SubTab>('uploaded')
    const [reporting, setReporting] = useState(false)
    const [reported, setReported] = useState(false)
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640)
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

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
            setSubTab(tab === 'social' ? 'subscriptions' : 'uploaded')
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

    const handleReportUser = async () => {
        if (!id || !token || reporting || reported) return
        setReporting(true)
        try {
            await fetch(`${BASE}/reports/users/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
            setReported(true)
        } finally {
            setReporting(false)
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
        <div style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: '#000', paddingBottom: '6rem', overflowX: 'hidden' }}>
            <PlayerTwo top />

            <div style={{ width: '100%', height: '75vh' }}>
                <img src={bgImage} style={{ display: 'block', width: '100%', height: '75vh', objectFit: 'cover', objectPosition: 'top center' }} />
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
                style={{ width: 150, height: 150, objectFit: 'cover', position: 'absolute', top: 'calc(75vh - 75px)', left: '50%', transform: 'translateX(-50%)', borderRadius: 100, border: '5px solid #000' }}
            />

            {/* Name under avatar */}
            <div style={{ position: 'absolute', top: 'calc(75vh + 87px)', left: '50%', transform: 'translateX(-50%)', width: 150, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em' }}>
                    {profileUser.name ?? profileUser.email}
                </span>
                {profileUser.is_admin === 1 && <AdminCheckIcon />}
            </div>

            {/* Favourite vinyl — bottom left */}
            {favVinyl && (
                <div
                    onClick={() => navigate(`/pages/vinyl?vinylId=${favVinyl.id}`)}
                    style={{
                    position: 'absolute', top: '55vh', left: '5vw',
                    display: 'flex', flexDirection: 'row', alignItems: 'center',
                    gap: isMobile ? 6 : 12,
                    backgroundColor: '#ffffff9e', borderRadius: 100,
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

            {/* Favourite track — right */}
            {favTrack && (
                <div
                    style={{
                        position: 'absolute', top: '40vh', right: '8vw', transform: 'translateY(-50%)',
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
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
                        width: 150, height: 36, borderRadius: 25, background: '#fff',
                        display: 'flex', alignItems: 'center', padding: 15, gap: 6, justifyContent: 'center',
                    }}>
                        <div>Слушать</div>
                        <Icon name="PlayTwoIcon" size={20} color="#000" isClick onClick={() => null} style={{ display: 'flex', alignItems: 'center' }} />
                    </div>
                </div>
            )}

            {/* Friend action + tabs */}
            <div style={{ marginTop: isMobile ? 120 : 0 }}>
            <div style={{ width: '100%', margin: '0 auto', padding: isMobile ? '1rem' : '1.5rem 2rem 2rem' }}>
                <div style={{
                    width: '100%', display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    gap: isMobile ? '0.75rem' : 0,
                    marginBottom: mainTab ? '1.5rem' : 0,
                }}>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <TabBtn active={mainTab === 'posts'} onClick={() => handleMainTab('posts')} label="Посты" />
                        <TabBtn active={mainTab === 'tracks'} onClick={() => handleMainTab('tracks')} label="Треки" />
                        <TabBtn active={mainTab === 'vinyls'} onClick={() => handleMainTab('vinyls')} label="Виниловые пластинки" />
                        <TabBtn active={mainTab === 'social'} onClick={() => handleMainTab('social')} label="Подписки" />
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {subscriptionLoaded && String(currentUser?.id) !== String(id) && (
                        <>
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
                            <button
                                onClick={handleReportUser}
                                disabled={reporting || reported}
                                title={reported ? 'Жалоба отправлена' : 'Пожаловаться'}
                                style={{
                                    background: 'none', border: '1px solid #333', borderRadius: '0.4rem',
                                    color: '#555', fontSize: '0.75rem', letterSpacing: '0.08em',
                                    textTransform: 'uppercase', cursor: actionPending ? 'not-allowed' : 'pointer',
                                    padding: '0.5rem 1rem', opacity: actionPending ? 0.5 : 1,
                                }}
                            >
                                {reported ? 'Жалоба отправлена' : 'Пожаловаться'}
                            </button>
                        </>
                    )}
                    </div>
                </div>

                {/* Posts section */}
                {mainTab === 'posts' && token && id && (
                    <FeedPostsList token={token} userId={id} />
                )}

                {/* Tracks section */}
                {mainTab === 'tracks' && id && token && (
                    <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <TabBtn active={subTab === 'uploaded'} onClick={() => setSubTab('uploaded')} label="Загруженные" />
                            <TabBtn active={subTab === 'saved'} onClick={() => setSubTab('saved')} label="Сохранённые" />
                        </div>
                        {subTab === 'uploaded' && (
                            <UserTracksList userId={id} token={token} endpoint={`/users/${id}/tracks?mode=uploaded`} />
                        )}
                        {/* ?mode=saved` */}
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

                {/* Social section */}
                {mainTab === 'social' && id && token && (
                    <div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <TabBtn active={subTab === 'subscriptions'} onClick={() => setSubTab('subscriptions')} label="Подписки" />
                            <TabBtn active={subTab === 'subscribers'} onClick={() => setSubTab('subscribers')} label="Подписчики" />
                        </div>
                        {subTab === 'subscriptions' && (
                            <UserSocialList token={token} endpoint={`/users/${id}/subscriptions`} emptyText="нет подписок" />
                        )}
                        {subTab === 'subscribers' && (
                            <UserSocialList token={token} endpoint={`/users/${id}/subscribers`} emptyText="нет подписчиков" showCount />
                        )}
                    </div>
                )}
            </div>
            </div>
        </div>
    )
}
