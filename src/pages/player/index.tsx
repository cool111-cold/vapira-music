import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { useAudioPlayer } from '../../context/audio-context';

const BASE_URL = 'https://vapira.ru';
const FEED_LIMIT = 10;

type FeedMode = 'all' | 'discover' | 'my' | 'uploaded' | 'saved';

const FEED_LABELS: Record<FeedMode, string> = {
    all: 'Все',
    discover: 'Открытия',
    my: 'Мои',
    uploaded: 'Загруженные',
    saved: 'Сохранённые',
};

const FEED_MODES: FeedMode[] = ['discover', 'all', 'my', 'uploaded', 'saved'];

const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const sideIconBtn = (disabled = false): React.CSSProperties => ({
    background: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '50%',
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'default' : 'pointer',
    color: disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)',
    fontSize: '1rem',
    flexShrink: 0,
    transition: 'background 0.15s, color 0.15s',
});

export const PlayerScene = () => {
    const { token } = useAuth();
    const {
        tracks: audioTracks,
        trackIndex,
        currentTrack,
        isPlaying,
        currentTime,
        durationSec,
        toggle,
        seek,
        next,
        prev,
        loadAndPlayExternal,
        loadQueueAndPlay,
        appendToQueue,
    } = useAudioPlayer();
    const [searchParams] = useSearchParams();

    const [feedMode, setFeedMode] = useState<FeedMode | null>(null);
    const [feedLoading, setFeedLoading] = useState(false);
    const feedSkipRef = useRef(0);
    const feedHasMoreRef = useRef(true);
    const feedLoadingRef = useRef(false);
    const sharedTrackHandledRef = useRef(false);

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

    const goNext = useCallback(() => {
        animate(next);
    }, [animate, next]);

    const goPrev = useCallback(() => {
        if (trackIndex === 0) return;
        animate(prev);
    }, [animate, prev, trackIndex]);

    // Load feed
    const loadMoreFeed = useCallback(async (mode: FeedMode, skip: number) => {
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
        if (!feedMode || !feedHasMoreRef.current) return;
        if (audioTracks.length > 0 && trackIndex >= audioTracks.length - 5) {
            loadMoreFeedRef.current(feedMode, feedSkipRef.current);
        }
    }, [trackIndex, audioTracks.length, feedMode]);

    const handleFeedSelect = (mode: FeedMode) => {
        setFeedMode(mode);
        feedSkipRef.current = 0;
        feedHasMoreRef.current = true;
        loadMoreFeed(mode, 0);
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
    }, [token, searchParams, loadAndPlayExternal]);

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

    // Keyboard
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 'j') goNext();
            else if (e.key === 'ArrowUp' || e.key === 'k') goPrev();
            else if (e.key === ' ') { e.preventDefault(); toggle(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goNext, goPrev, toggle]);

    const cover = currentTrack?.cover;
    const currentSec = (currentTime / 100) * durationSec;

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
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    backgroundImage: cover ? `url(${cover})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#0a0a0a',
                    filter: 'blur(48px) brightness(0.28) saturate(2)',
                    transform: 'scale(1.15)',
                    transition: 'background-image 0.7s ease',
                }}
            />

            {/* Gradient overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.05) 48%, rgba(0,0,0,0.4) 100%)',
            }} />

            {/* Feed tabs */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.4rem',
                padding: '1.1rem 1rem 0.9rem',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
            }}>
                {FEED_MODES.map(mode => (
                    <button
                        key={mode}
                        onClick={() => handleFeedSelect(mode)}
                        style={{
                            background: feedMode === mode ? 'rgba(255,255,255,0.18)' : 'transparent',
                            border: `1px solid ${feedMode === mode ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'}`,
                            color: feedMode === mode ? '#fff' : 'rgba(255,255,255,0.42)',
                            padding: '0.28rem 0.85rem',
                            borderRadius: '2rem',
                            cursor: 'pointer',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            transition: 'all 0.2s ease',
                            backdropFilter: 'blur(6px)',
                        }}
                    >
                        {feedMode === mode && feedLoading ? '...' : FEED_LABELS[mode]}
                    </button>
                ))}
            </div>

            {/* Track counter */}
            {audioTracks.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '4.5rem',
                    right: '1.5rem',
                    zIndex: 10,
                    color: 'rgba(255,255,255,0.25)',
                    fontSize: '0.58rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                }}>
                    {trackIndex + 1} / {audioTracks.length}
                </div>
            )}

            {/* Center cover (spinning vinyl) */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: '5rem',
                paddingBottom: '13rem',
                opacity: cardVisible ? 1 : 0,
                transform: cardVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.94)',
                transition: 'opacity 0.21s ease, transform 0.21s ease',
                pointerEvents: 'none',
            }}>
                {currentTrack ? (
                    <div style={{
                        position: 'relative',
                        width: 'min(64vw, 290px)',
                        height: 'min(64vw, 290px)',
                        flexShrink: 0,
                    }}>
                        {/* Outer vinyl ring */}
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
                            {/* Cover art circle */}
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
                            {/* Center hole */}
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

            {/* Bottom left info */}
            <div style={{
                position: 'absolute',
                bottom: '5.25rem',
                left: '1.5rem',
                right: '5.75rem',
                zIndex: 3,
                opacity: cardVisible ? 1 : 0,
                transform: cardVisible ? 'translateY(0)' : 'translateY(18px)',
                transition: 'opacity 0.21s ease, transform 0.21s ease',
            }}>
                {currentTrack && (
                    <>
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

            {/* Right sidebar */}
            <div style={{
                position: 'absolute',
                right: '1.1rem',
                bottom: '4.75rem',
                zIndex: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.4rem',
            }}>
                <button
                    onClick={goPrev}
                    style={sideIconBtn(trackIndex === 0)}
                    title="Предыдущий"
                >
                    ↑
                </button>

                <button
                    onClick={toggle}
                    style={{
                        background: 'rgba(255,255,255,0.96)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 54,
                        height: 54,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#000',
                        fontSize: '1.3rem',
                        boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
                        flexShrink: 0,
                        transition: 'transform 0.1s ease',
                    }}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>

                <button
                    onClick={goNext}
                    style={sideIconBtn(false)}
                    title="Следующий"
                >
                    ↓
                </button>
            </div>

            {/* Progress bar */}
            <div
                onClick={e => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    seek(((e.clientX - rect.left) / rect.width) * 100);
                }}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 5,
                    height: '3px',
                    background: 'rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                }}
            >
                <div style={{
                    height: '100%',
                    width: `${currentTime}%`,
                    background: 'rgba(255,255,255,0.82)',
                    transition: 'width 0.5s linear',
                }} />
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
