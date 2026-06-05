import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { useAudioPlayer } from '../../context/audio-context';
import { useSaved } from '../../context/saved-context';
import { Icon } from '../../components/icon';

const BASE_URL = 'https://vapira.ru';

const LYRICS_LRC = `[00:49.94]Whip it like a Nascar, I can see the time pass
[00:53.10]Feel like I'm in high school, fuckin' me in gym class
[00:56.30]Shawty, I remember that
[00:57.86]I know you remember that
[00:59.45]You was fuckin' with me way before I even wrote raps
[01:02.72]Now I'm seein' cash flow
[01:04.26]I could be a asshole
[01:05.81]Yeah, I know
[01:06.59]But it's all good cause I let her spend my money, though
[01:09.70]Playboy bunny, though, shawty look like a pornstar
[01:13.14]I know she love me 'cause she fuck me in her sports car
[01:16.30]I pull up on her, tell her that we finna go far
[01:19.68]Drop top, smokin' thrax, lookin' at the stars
[01:22.83]Gettin' high, taking bars till we on Mars
[01:26.03]I could make the ground move like I'm Avatar
[01:29.17]Now I'm faded on my own in my bedroom
[01:32.37]Now I'm lookin' at my phone should I text you?
[01:35.37]I just wanna sex you, I just wanna bless you
[01:38.35]Baby, I'm a priest in the underworld, guess who
[01:41.60]Lil' Bo Peep with a brand new flow too
[01:44.72]Lookin' at my teeth like you never seen a gold tooth
[01:47.91]Never in the streets 'cause I never leave my home
[01:50.81]If you wanna live a dream, I ain't coming, bitch, I told you
[02:06.31]Whip it like a Nascar, I can see the time pass
[02:09.41]Feel like I'm in high school, fuckin' me in gym class
[02:12.52]Shawty, I remember that
[02:14.16]I know you remember that
[02:15.76]You was fuckin' with me way before I even wrote raps
[02:19.04]Now I'm seein' cash flow
[02:20.52]I could be a asshole
[02:22.10]Yeah, I know
[02:22.90]But it's all good cause I let her spend my money, though
[02:26.08]Playboy bunny, though, shawty look like a pornstar
[02:29.43]I know she love me 'cause she fuck me in her sports car
[02:32.57]I pull up on her, tell her that we finna go far
[02:35.94]Drop top, smokin' thrax, lookin' at the stars
[02:39.13]Gettin' high, taking bars till we on Mars
[02:42.29]I could make the ground move like I'm Avatar
[02:45.47]Now I'm faded on my own in my bedroom
[02:48.64]Now I'm lookin' at my phone should I text you?
[02:51.47]I just wanna sex you, I just wanna bless you
[02:54.66]Baby, I'm a priest in the underworld, guess who
[02:57.89]Lil' Bo Peep with a brand new flow too
[03:01.01]Lookin' at my teeth like you never seen a gold tooth
[03:04.27]Never in the streets 'cause I never leave my home
[03:07.11]If you wanna live a dream, I ain't coming, bitch, I-`;

const TEST_FEED = [
    {
        type: 'text',
        track_id: 11,
        autor_id: 1,
        vinyl_id: null,
        image: null,
        video: null,
        text: 'test text for test feed, this is text feed, uraaa',
        timeCode: 31,
    },
    {
        type: 'image',
        track_id: 23,
        autor_id: 4,
        vinyl_id: null,
        image: 'https://i.pinimg.com/736x/71/8e/7f/718e7f1da60c918f48513fd0722bc352.jpg',
        video: null,
        text: 'test text for test feed, this is image and text feed, uraaa',
        timeCode: null,
    },
    {
        type: 'video',
        track_id: 24,
        autor_id: 1,
        image: null,
        vinyl_id: null,
        video: 'https://vapira.ru/media/vinyl/ezgif-5dd68ae77c7b1c07.gif',
        text: '',
        timeCode: 0,
    },
    {
        type: 'image',
        track_id: 25,
        autor_id: 4,
        image: ['https://i.pinimg.com/736x/71/8e/7f/718e7f1da60c918f48513fd0722bc352.jpg', 'https://i.pinimg.com/736x/71/8e/7f/718e7f1da60c918f48513fd0722bc352.jpg', 'https://i.pinimg.com/736x/71/8e/7f/718e7f1da60c918f48513fd0722bc352.jpg'],
        video: null,
        text: 'test text for test feed, this is more images and text feed, uraaa',
        timeCode: 117,
    }
]

const parseLrc = (lrc: string): { time: number; text: string }[] =>
    lrc.trim().split('\n')
        .map(line => {
            const m = line.match(/^\[(\d+):(\d+\.\d+)\](.*)/);
            if (!m) return null;
            const text = m[3].trim();
            if (!text) return null;
            return { time: parseInt(m[1]) * 60 + parseFloat(m[2]), text };
        })
        .filter((x): x is { time: number; text: string } => x !== null);

const LYRICS = parseLrc(LYRICS_LRC);
const LINE_H = 48;

const FEED_LIMIT = 10;

let _vinylTracksLoadedId: number | null = null;

type FeedMode = 'all' | 'discover' | 'my' | 'uploaded' | 'saved' | 'feed';

const FEED_LABELS: Record<FeedMode, string> = {
    all: 'Все',
    discover: 'Открытия',
    my: 'Мои',
    uploaded: 'Загруженные',
    saved: 'Сохранённые',
    feed: 'Лента'
};

const FEED_MODES: FeedMode[] = ['feed', 'discover', 'all', 'my', 'uploaded', 'saved'];

const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const NAV_ICONS = {
    home: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 9.41605C3 9.04665 3.18802 8.7001 3.50457 8.48603L11.3046 3.21117C11.7209 2.92961 12.2791 2.92961 12.6954 3.21117L20.4954 8.48603C20.812 8.70011 21 9.04665 21 9.41605V19.2882C21 20.2336 20.1941 21 19.2 21H4.8C3.80589 21 3 20.2336 3 19.2882V9.41605Z" stroke="white" strokeWidth="2"/>
        </svg>
    ),
    vinyl: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M21.6 12C21.6 17.302 17.302 21.6 12 21.6C6.698 21.6 2.4 17.302 2.4 12C2.4 6.698 6.698 2.4 12 2.4C17.302 2.4 21.6 6.698 21.6 12Z" stroke="white" strokeWidth="2"/>
            <path d="M14.4 12C14.4 13.325 13.325 14.4 12 14.4C10.675 14.4 9.6 13.325 9.6 12C9.6 10.675 10.675 9.6 12 9.6C13.325 9.6 14.4 10.675 14.4 12Z" stroke="white" strokeWidth="2"/>
        </svg>
    ),
    profile: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2"/>
            <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    ),
};

const NavBtn = ({ path, children }: { path: string; children: React.ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const active = location.pathname === path;
    return (
        <button
            onClick={() => navigate(path)}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '4px 14px',
                opacity: active ? 1 : 0.38,
                transition: 'opacity 0.2s',
            }}
        >
            {children}
        </button>
    );
};

interface FeedAuthor {
    id: number;
    name?: string;
    email?: string;
    avatar_url?: string;
}

interface FeedItem {
    type: string;
    track_id: number;
    autor_id: number;
    vinyl_id?: number | null;
    image: string | string[] | null;
    video: string | null;
    text: string;
}

const FeedCard = ({ item, author }: { item: FeedItem; author: FeedAuthor | null }) => {
    const isMultiImage = Array.isArray(item.image);
    const isSingleImage = typeof item.image === 'string' && !!item.image;
    const isVideoFile = !!item.video && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(item.video);
    const isGif = !!item.video && !isVideoFile;
    const navigate = useNavigate();
    const DEFAULT_AVATAR = '/images/ava.jpg'

    const hasMedia = isMultiImage || isSingleImage || isVideoFile || isGif;

    return (
        <div style={{
            width: 'min(400px, 88vw)',
            minHeight: item.type === 'text' ? 200 : undefined,
            height: hasMedia ? 'calc(100vh - 18rem)' : undefined,
            maxHeight: 'calc(100vh - 18rem)',
            borderRadius: 20,
            overflow: 'hidden',
            background: 'rgba(12,12,12,0.88)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}>
            {/* Author header */}
            <div onClick={() => navigate(`/pages/users/${author?.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', flexShrink: 0 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    overflow: 'hidden', background: '#1f1f1f', flexShrink: 0,
                }}>
                    {author?.avatar_url ? (
                        <img
                            src={author.avatar_url.startsWith('http') ? author.avatar_url : `${BASE_URL}${author.avatar_url}`}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) :
                    <img
                        src={DEFAULT_AVATAR}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />}
                </div>
                <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>
                    {author?.name ?? author?.email ?? '—'}
                </span>
            </div>

            {/* Multiple images */}
            {isMultiImage && (
                <div style={{
                    flex: '1 1 auto',
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min((item.image as string[]).length, 3)}, 1fr)`,
                    gap: 2,
                }}>
                    {(item.image as string[]).map((img, i) => (
                        <img key={i} src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ))}
                </div>
            )}

            {/* Single image */}
            {isSingleImage && (
                <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                    <img src={item.image as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
            )}

            {/* Video */}
            {isVideoFile && (
                <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                    <video src={item.video!} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
            )}

            {/* GIF / animated image */}
            {isGif && (
                <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                    <img src={item.video!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
            )}

            {/* Text */}
            {item.text && (
                <div style={{
                    padding: item.type === 'text' ? '24px 20px' : '12px 16px',
                    color: 'rgba(255,255,255,0.87)',
                    fontSize: item.type === 'text' ? '1.05rem' : '0.875rem',
                    lineHeight: 1.65,
                    textAlign: item.type === 'text' ? 'center' : undefined,
                    flexShrink: 0,
                }}>
                    {item.text}
                </div>
            )}
        </div>
    );
};

export const PlayerScene = () => {
    const { token } = useAuth();
    const {
        tracks: audioTracks,
        trackIndex,
        currentTrack,
        isPlaying,
        currentTime,
        durationSec,
        volume,
        toggle,
        seek,
        seekAfterLoad,
        setVolume,
        next,
        prev,
        loadAndPlayExternal,
        loadQueueAndPlay,
        appendToQueue,
        selectedVinylId,
    } = useAudioPlayer();
    const { savedIds, toggleSaved } = useSaved();
    const [searchParams] = useSearchParams();

    const [feedMode, setFeedMode] = useState<FeedMode | null>(null);
    const [feedLoading, setFeedLoading] = useState(false);
    const feedSkipRef = useRef(0);
    const feedHasMoreRef = useRef(true);
    const feedLoadingRef = useRef(false);
    const sharedTrackHandledRef = useRef(false);

    const [feedItemIndex, setFeedItemIndex] = useState(0);
    const [feedAuthor, setFeedAuthor] = useState<FeedAuthor | null>(null);

    const [vinylTab, setVinylTab] = useState<{ id: number; name: string; videoCover: string | null } | null>(null);
    const [vinylTabActive, setVinylTabActive] = useState(false);

    const [showLyrics, setShowLyrics] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const volumeRef = useRef<HTMLDivElement>(null);

    // Close volume popup on outside click
    useEffect(() => {
        if (!showVolume) return;
        const handler = (e: MouseEvent) => {
            if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) {
                setShowVolume(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showVolume]);

    // Animation
    const [cardVisible, setCardVisible] = useState(true);
    const isAnimatingRef = useRef(false);

    const animate = useCallback((fn: () => void) => {
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;
        setCardVisible(false);
        setTimeout(() => {
            fn();
            setCardVisible(true);
            setTimeout(() => { isAnimatingRef.current = false; }, 300);
        }, 210);
    }, []);

    // Refs for feed state — used inside callbacks to avoid stale closures
    const feedModeRef = useRef<FeedMode | null>(feedMode);
    feedModeRef.current = feedMode;
    const feedItemIndexRef = useRef(feedItemIndex);
    feedItemIndexRef.current = feedItemIndex;

    const goNext = useCallback(() => {
        if (feedModeRef.current === 'feed') {
            animate(() => setFeedItemIndex(i => Math.min(i + 1, TEST_FEED.length - 1)));
        } else {
            animate(next);
        }
    }, [animate, next]);

    const goPrev = useCallback(() => {
        if (feedModeRef.current === 'feed') {
            if (feedItemIndexRef.current === 0) return;
            animate(() => setFeedItemIndex(i => Math.max(i - 1, 0)));
        } else {
            if (trackIndex === 0) return;
            animate(prev);
        }
    }, [animate, prev, trackIndex]);

    // Load feed
    const loadMoreFeed = useCallback(async (mode: FeedMode, skip: number) => {
        if (mode === 'feed') return;
        if (feedLoadingRef.current) return;
        feedLoadingRef.current = true;
        if (skip === 0) setFeedLoading(true);
        try {
            const r = await fetch(
                `${BASE_URL}/tracks?mode=${mode}&skip=${skip}&limit=${FEED_LIMIT}&shuffle=true`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data: any[] = await r.json();
            if (!Array.isArray(data)) return;
            const newTracks = data.map((t: any) => ({
                id: String(t.id),
                name: t.title,
                artist: t.artist,
                cover: t.avatar_url ?? undefined,
                src: `${BASE_URL}${t.stream_url}`,
            }));
            if (skip === 0) loadQueueAndPlay(newTracks);
            else appendToQueue(newTracks);
            feedSkipRef.current = skip + data.length;
            if (data.length < FEED_LIMIT) feedHasMoreRef.current = false;
        } catch {} finally {
            feedLoadingRef.current = false;
            setFeedLoading(false);
        }
    }, [token, loadQueueAndPlay, appendToQueue]);

    const loadMoreFeedRef = useRef(loadMoreFeed);
    loadMoreFeedRef.current = loadMoreFeed;

    useEffect(() => {
        if (!feedMode || feedMode === 'feed' || !feedHasMoreRef.current) return;
        if (audioTracks.length > 0 && trackIndex >= audioTracks.length - 5) {
            loadMoreFeedRef.current(feedMode, feedSkipRef.current);
        }
    }, [trackIndex, audioTracks.length, feedMode]);

    // Load track for current feed item (only when track_id changes)
    const currentFeedTrackId = feedMode === 'feed' ? (TEST_FEED[feedItemIndex]?.track_id ?? null) : null;

    useEffect(() => {
        if (!currentFeedTrackId || !token) return;
        fetch(`${BASE_URL}/tracks/${currentFeedTrackId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then((t: any) => {
                if (!t?.id) return;
                loadAndPlayExternal({
                    id: String(t.id),
                    name: t.title,
                    artist: t.artist,
                    cover: t.avatar_url ?? undefined,
                    src: `${BASE_URL}${t.stream_url}`,
                });
                seekAfterLoad(TEST_FEED[feedItemIndex]?.timeCode ?? 0);
            })
            .catch(() => {});
    }, [currentFeedTrackId, token]);

    // Load author for current feed item
    const currentAutorId = feedMode === 'feed' ? (TEST_FEED[feedItemIndex]?.autor_id ?? null) : null;

    useEffect(() => {
        if (!currentAutorId || !token) { setFeedAuthor(null); return; }
        fetch(`${BASE_URL}/users/${currentAutorId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(data => setFeedAuthor(data))
            .catch(() => setFeedAuthor(null));
    }, [currentAutorId, token]);

    const loadVinylTracks = useCallback(async (vinylId: number) => {
        if (feedLoadingRef.current) return;
        feedLoadingRef.current = true;
        setFeedLoading(true);
        try {
            const listRes = await fetch(`${BASE_URL}/vinyl/${vinylId}/tracks`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const list: Array<{ id: number }> = await listRes.json();
            if (!Array.isArray(list) || list.length === 0) return;
            const detailed = await Promise.all(
                list.map(t =>
                    fetch(`${BASE_URL}/tracks/${t.id}`, { headers: { Authorization: `Bearer ${token}` } })
                        .then(r => r.json()),
                ),
            );
            const tracks = detailed
                .filter(t => t?.stream_url)
                .map(t => ({
                    id: String(t.id),
                    name: t.title,
                    artist: t.artist,
                    cover: t.avatar_url ?? undefined,
                    src: `${BASE_URL}${t.stream_url}`,
                }));
            if (tracks.length > 0) loadQueueAndPlay(tracks);
        } catch {} finally {
            feedLoadingRef.current = false;
            setFeedLoading(false);
        }
    }, [token, loadQueueAndPlay]);

    useEffect(() => {
        if (!selectedVinylId || !token) return;
        const isNew = _vinylTracksLoadedId !== selectedVinylId;
        fetch(`${BASE_URL}/vinyl/${selectedVinylId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then((v: any) => {
                const toUrl = (p: string | null) => p ? `${BASE_URL}${p}` : null;
                setVinylTab({ id: selectedVinylId, name: v.name, videoCover: toUrl(v.video_cover) });
                if (isNew && !searchParams.get('trackId')) {
                    _vinylTracksLoadedId = selectedVinylId;
                    setVinylTabActive(true);
                    setFeedMode(null);
                    loadVinylTracks(selectedVinylId);
                }
            })
            .catch(() => {});
    }, [selectedVinylId, token, loadVinylTracks, searchParams]);

    const handleFeedSelect = (mode: FeedMode) => {
        setVinylTabActive(false);
        setFeedMode(mode);
        feedSkipRef.current = 0;
        feedHasMoreRef.current = true;
        if (mode === 'feed') {
            setFeedItemIndex(0);
            return;
        }
        loadMoreFeed(mode, 0);
    };

    const handleVinylTabSelect = () => {
        if (!vinylTab) return;
        setFeedMode(null);
        setVinylTabActive(true);
        loadVinylTracks(vinylTab.id);
    };

    // Shared track via URL
    useEffect(() => {
        const trackId = searchParams.get('trackId');
        if (!trackId || !token || sharedTrackHandledRef.current) return;
        sharedTrackHandledRef.current = true;
        fetch(`${BASE_URL}/tracks/${trackId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then((t: any) => {
                if (!t?.id) return;
                loadAndPlayExternal({
                    id: String(t.id),
                    name: t.title,
                    artist: t.artist,
                    cover: t.avatar_url ?? undefined,
                    src: `${BASE_URL}${t.stream_url}`,
                });
            })
            .catch(() => {});
    }, [token, searchParams]);

    // Wheel (debounced)
    const lastWheelRef = useRef(0);
    const handleWheel = useCallback((e: React.WheelEvent) => {
        const now = Date.now();
        if (now - lastWheelRef.current < 700) return;
        lastWheelRef.current = now;
        if (e.deltaY > 40) goNext();
        else if (e.deltaY < -40) goPrev();
    }, [goNext, goPrev]);

    // Touch
    const touchStartYRef = useRef(0);
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartYRef.current = e.touches[0].clientY;
    }, []);
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const delta = touchStartYRef.current - e.changedTouches[0].clientY;
        if (delta > 60) goNext();
        else if (delta < -60) goPrev();
    }, [goNext, goPrev]);

    const [muteValue, setMuteValue] = useState(1);
    const muteValueRef = useRef(muteValue);
    muteValueRef.current = muteValue;
    const volumeValRef = useRef(volume);
    volumeValRef.current = volume;

    // Keyboard
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 'w') goNext();
            else if (e.key === 'ArrowUp' || e.key === 's') goPrev();
            else if (e.key === 'ArrowLeft' || e.key === 'a') setVolume(Math.round((volumeValRef.current - 0.1) * 10) / 10);
            else if (e.key === 'ArrowRight' || e.key === 'd') setVolume(Math.round((volumeValRef.current + 0.1) * 10) / 10);
            else if (e.key === 'm' && muteValueRef.current !== 0) { setMuteValue(volumeValRef.current); setVolume(0); }
            else if (e.key === 'm' && muteValueRef.current === 0) { setVolume(muteValueRef.current); }
            else if (e.key === ' ') { e.preventDefault(); toggle(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goNext, goPrev, toggle]);

    const cover = currentTrack?.cover;
    const currentSec = (currentTime / 100) * durationSec;
    const isLiked = currentTrack ? savedIds.has(currentTrack.id) : false;

    const activeLyricIndex = useMemo(() => {
        if (!showLyrics || LYRICS.length === 0) return -1;
        let idx = -1;
        for (let i = 0; i < LYRICS.length; i++) {
            if (LYRICS[i].time <= currentSec) idx = i;
            else break;
        }
        return idx;
    }, [showLyrics, currentSec]);

    const isFeedMode = feedMode === 'feed';
    const lyricsActive = showLyrics && !isFeedMode;

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                background: '#000',
                position: 'relative',
                userSelect: 'none',
                touchAction: 'none',
            }}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Blurred BG */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                backgroundImage: cover ? `url(${cover})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#0a0a0a',
                filter: 'blur(48px) brightness(0.28) saturate(2)',
                transform: 'scale(1.15)',
                transition: 'background-image 0.7s ease, opacity 0.7s ease',
                opacity: vinylTabActive && vinylTab?.videoCover ? 0 : 1,
            }} />

            {/* Vinyl video_cover background */}
            {vinylTab?.videoCover && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    overflow: 'hidden',
                    opacity: vinylTabActive ? 1 : 0,
                    transition: 'opacity 0.7s ease',
                    transform: 'scale(1.15)',
                    filter: 'blur(48px) brightness(0.28) saturate(2)',
                }}>
                    {/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(vinylTab.videoCover) ? (
                        <video
                            key={vinylTab.videoCover}
                            src={vinylTab.videoCover}
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <img
                            src={vinylTab.videoCover}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                </div>
            )}

            {/* Gradient overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.05) 48%, rgba(0,0,0,0.4) 100%)',
            }} />

            {/* Top bar: nav left + feed tabs center */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 0.75rem 0.6rem',
                gap: '0.5rem',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
            }}>
                {/* Feed tabs */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', flex: 1, justifyContent: 'flex-start' }}>
                    {FEED_MODES.map(mode => (
                        <button
                            key={mode}
                            onClick={() => handleFeedSelect(mode)}
                            style={{
                                background: feedMode === mode ? 'rgba(255,255,255,0.18)' : 'transparent',
                                border: `1px solid ${feedMode === mode ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'}`,
                                color: feedMode === mode ? '#fff' : 'rgba(255,255,255,0.42)',
                                padding: '0.28rem 0.75rem',
                                borderRadius: '2rem',
                                cursor: 'pointer',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s ease',
                                backdropFilter: 'blur(6px)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {feedMode === mode && feedLoading ? '...' : FEED_LABELS[mode]}
                        </button>
                    ))}
                    {vinylTab && (
                        <button
                            onClick={handleVinylTabSelect}
                            style={{
                                background: vinylTabActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                                border: `1px solid ${vinylTabActive ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'}`,
                                color: vinylTabActive ? '#fff' : 'rgba(255,255,255,0.42)',
                                padding: '0.28rem 0.75rem',
                                borderRadius: '2rem',
                                cursor: 'pointer',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s ease',
                                backdropFilter: 'blur(6px)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {vinylTabActive && feedLoading ? '...' : vinylTab.name}
                        </button>
                    )}
                </div>

                {/* Nav icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', flexShrink: 0 }}>
                    <NavBtn path="/">{NAV_ICONS.home}</NavBtn>
                    <NavBtn path="/pages/vinyl">{NAV_ICONS.vinyl}</NavBtn>
                    <NavBtn path="/pages/profile">{NAV_ICONS.profile}</NavBtn>
                </div>
            </div>


            {/* Center: feed card or spinning vinyl + lyrics */}
            <div style={{
                position: 'absolute',
                top: '4.5rem',
                bottom: '7rem',
                left: 0,
                right: lyricsActive ? '5.75rem' : 0,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: lyricsActive ? 'flex-start' : 'center',
                paddingLeft: lyricsActive ? '24rem' : '0',
                gap: lyricsActive ? '1.5rem' : '0',
                opacity: cardVisible ? 1 : 0,
                transform: cardVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.94)',
                transition: 'opacity 0.21s ease, transform 0.21s ease',
                pointerEvents: isFeedMode ? 'auto' : 'none',
            }}>
                {isFeedMode ? (
                    <FeedCard item={TEST_FEED[feedItemIndex] as FeedItem} author={feedAuthor} />
                ) : currentTrack ? (
                    <>
                        <div style={{
                            position: 'relative',
                            width: lyricsActive ? 'clamp(120px, 32vw, 200px)' : 'clamp(180px, min(62vw, calc(100vh - 20rem)), 380px)',
                            height: lyricsActive ? 'clamp(120px, 32vw, 200px)' : 'clamp(180px, min(62vw, calc(100vh - 20rem)), 380px)',
                            flexShrink: 0,
                            transition: 'width 0.35s ease, height 0.35s ease',
                        }}>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '50%',
                                background: `
                                    radial-gradient(circle at center, transparent 29%, rgba(255,255,255,0.035) 29.5%,
                                    rgba(255,255,255,0.035) 31%, transparent 31.5%,
                                    transparent 37%, rgba(255,255,255,0.035) 37.5%,
                                    rgba(255,255,255,0.035) 39%, transparent 39.5%),
                                    #111
                                `,
                                boxShadow: '0 30px 90px rgba(0,0,0,0.75), 0 0 0 3px rgba(255,255,255,0.05)',
                                animation: isPlaying
                                    ? 'spinRecord 9s linear infinite'
                                    : 'spinRecord 9s linear infinite paused',
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '65%',
                                    height: '65%',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    background: cover ? undefined : '#1a1a1a',
                                }}>
                                    {cover && (
                                        <img
                                            src={cover}
                                            alt={currentTrack.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '8%',
                                    height: '8%',
                                    borderRadius: '50%',
                                    background: '#000',
                                    zIndex: 1,
                                }} />
                            </div>
                        </div>

                        {lyricsActive && (
                            <div style={{
                                flex: 1,
                                overflow: 'hidden',
                                height: `${LINE_H * 7}px`,
                                alignSelf: 'center',
                                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 28%, black 72%, transparent 100%)',
                                maskImage: 'linear-gradient(to bottom, transparent 0%, black 28%, black 72%, transparent 100%)',
                            }}>
                                <div style={{
                                    transform: `translateY(${(3 - Math.max(0, activeLyricIndex)) * LINE_H}px)`,
                                    transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                }}>
                                    {LYRICS.map((line, idx) => {
                                        const dist = activeLyricIndex >= 0
                                            ? Math.abs(idx - activeLyricIndex)
                                            : idx + 2;
                                        return (
                                            <div key={idx} style={{
                                                height: `${LINE_H}px`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: dist === 0 ? '#fff'
                                                    : dist === 1 ? 'rgba(255,255,255,0.52)'
                                                    : dist === 2 ? 'rgba(255,255,255,0.28)'
                                                    : dist === 3 ? 'rgba(255,255,255,0.12)'
                                                    : 'rgba(255,255,255,0.05)',
                                                fontSize: dist === 0 ? '1.1rem' : '0.85rem',
                                                fontWeight: dist === 0 ? 700 : 400,
                                                textShadow: dist === 0 ? '0 2px 12px rgba(0,0,0,0.9)' : 'none',
                                                transition: 'color 0.3s ease, font-size 0.3s ease',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {line.text}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                ) : !feedLoading && (
                    <p style={{
                        color: 'rgba(255,255,255,0.18)',
                        fontSize: '0.7rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        margin: 0,
                    }}>
                        Выберите режим выше
                    </p>
                )}
            </div>

            {/* Bottom left: track info */}
            <div style={{
                position: 'absolute',
                bottom: '6rem',
                left: '1.5rem',
                right: '5.75rem',
                zIndex: 3,
                opacity: cardVisible ? 1 : 0,
                transform: cardVisible ? 'translateY(0)' : 'translateY(18px)',
                transition: 'opacity 0.21s ease, transform 0.21s ease',
            }}>
                {currentTrack && (
                    <>
                        <div style={{gap: 12, display: 'flex', flexDirection: 'row'}}>
                            <p style={{
                                color: '#fff',
                                margin: 0,
                                fontSize: 'clamp(1.05rem, 5vw, 1.45rem)',
                                fontWeight: 800,
                                lineHeight: 1.2,
                                textShadow: '0 2px 14px rgba(0,0,0,0.7)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {currentTrack.name}
                            </p>
                            {!isFeedMode && (
                                <button
                                    onClick={() => setShowLyrics(v => !v)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: showLyrics ? 1 : 0.5,
                                        transition: 'opacity 0.2s',
                                    }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.2088 16.1999H12.124M12.124 16.1999H14.128M12.124 16.1999V7.7999M12.124 7.7999H8.9999C8.66853 7.7999 8.3999 8.06853 8.3999 8.3999V9.28225M12.124 7.7999H14.9999C15.3313 7.7999 15.5999 8.06853 15.5999 8.3999V9.52931M4.7999 21.5999H19.1999C20.5254 21.5999 21.5999 20.5254 21.5999 19.1999V4.7999C21.5999 3.47442 20.5254 2.3999 19.1999 2.3999H4.7999C3.47442 2.3999 2.3999 3.47442 2.3999 4.7999V19.1999C2.3999 20.5254 3.47442 21.5999 4.7999 21.5999Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                        <p style={{
                            color: 'rgba(255,255,255,0.58)',
                            margin: '0.3rem 0 0',
                            fontSize: 'clamp(0.78rem, 3.5vw, 0.95rem)',
                            fontWeight: 500,
                            textShadow: '0 1px 8px rgba(0,0,0,0.6)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {currentTrack.artist}
                        </p>
                        {durationSec > 0 && (
                            <p style={{
                                color: 'rgba(255,255,255,0.28)',
                                margin: '0.45rem 0 0',
                                fontSize: '0.62rem',
                                letterSpacing: '0.06em',
                            }}>
                                {formatTime(currentSec)} / {formatTime(durationSec)}
                            </p>
                        )}
                    </>
                )}
            </div>

            {/* Right sidebar: controls */}
            <div style={{
                position: 'absolute',
                right: '1.1rem',
                bottom: '6rem',
                zIndex: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.35rem',
            }}>
                {/* Volume */}
                <div ref={volumeRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Icon
                        name="volume"
                        size={22}
                        color={showVolume ? '#fff' : 'rgba(255,255,255,0.65)'}
                        hoverColor="#fff"
                        isClick
                        onClick={() => setShowVolume(v => !v)}
                    />
                    {showVolume && (
                        <div style={{
                            position: 'absolute',
                            bottom: '140%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(15,15,15,0.92)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.08)',
                            padding: '10px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            zIndex: 20,
                        }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                                {Math.round(volume * 100)}
                            </span>
                            <input
                                className="player-seek"
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={volume}
                                onChange={e => setVolume(Number(e.target.value))}
                                style={{
                                    writingMode: 'vertical-lr' as const,
                                    direction: 'rtl' as const,
                                    height: 80,
                                    width: 3,
                                    cursor: 'pointer',
                                    background: `linear-gradient(to top, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.85) ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`,
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Prev */}
                <button
                    onClick={goPrev}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '50%',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: (isFeedMode ? feedItemIndex === 0 : trackIndex === 0) ? 'default' : 'pointer',
                        color: (isFeedMode ? feedItemIndex === 0 : trackIndex === 0) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                    }}
                >
                    ↑
                </button>

                {/* Play / Pause */}
                <div
                    onClick={toggle}
                    style={{
                        background: 'rgba(255,255,255,0.96)',
                        borderRadius: '50%',
                        width: 54,
                        height: 54,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
                        flexShrink: 0,
                    }}
                >
                    {isPlaying ? (
                        <Icon name="PauseIcon" size={26} color="#000" style={{ display: 'flex' }} />
                    ) : (
                        <Icon name="PlayTwoIcon" size={26} color="#000" style={{ display: 'flex', paddingLeft: 2 }} />
                    )}
                </div>

                {/* Next */}
                <button
                    onClick={goNext}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '50%',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                    }}
                >
                    ↓
                </button>
                {/* Like */}
                <Icon
                    name="LikeTwoIcon"
                    size={22}
                    color={isLiked ? '#FD5E5E' : 'rgba(255,255,255,0.65)'}
                    hoverColor={isLiked ? '#FD5E5E' : '#fff'}
                    isClick
                    onClick={() => currentTrack && toggleSaved(currentTrack.id)}
                />
            </div>

            {/* Progress bar */}
            <div
                onClick={e => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    seek(((e.clientX - rect.left) / rect.width) * 100);
                }}
                style={{
                    position: 'absolute',
                    bottom: '1.75rem',
                    left: 0,
                    right: 0,
                    zIndex: 5,
                    height: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '0 1.5rem',
                    boxSizing: 'border-box',
                }}
            >
                <div style={{ position: 'relative', width: '100%', height: '3px', background: 'rgba(255,255,255,0.12)' }}>
                    <div style={{
                        position: 'absolute',
                        left: 0, top: 0, bottom: 0,
                        width: `${currentTime}%`,
                        background: 'rgba(255,255,255,0.82)',
                        transition: 'width 0.5s linear',
                    }} />
                </div>
            </div>


            <style>{`
                @keyframes spinRecord {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
