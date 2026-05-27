import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VinylTransport from '../../VinylTransport';
import { PlayerTwo } from '../../components/player/player-two';
import { useAuth } from '../../context/auth-context';
import { useAudioPlayer } from '../../context/audio-context';
import { TrackRow, LibTrack } from '../library/track-row';

const BASE_URL = 'https://vapira.ru';
const toUrl = (path: string | null) => (path ? `${BASE_URL}${path}` : '');

interface VinylInfo {
    id: number;
    name: string;
    artist: string | null;
    disk_image: string | null;
    bg_color: string;
    second_color: string;
}

interface TrackItem {
    id: number;
    title: string;
    artist: string;
}

const FEED_LIMIT = 10;

type FeedMode = 'all' | 'discover' | 'my' | 'uploaded' | 'saved'

const FEED_LABELS: Record<FeedMode, string> = {
    all: 'Все',
    discover: 'Открытия',
    my: 'Мои',
    uploaded: 'Загруженные',
    saved: 'Сохранённые',
}

const FEED_BACKGROUNDS: Record<FeedMode, string> = {
    discover: 'https://i.pinimg.com/1200x/5f/06/59/5f065984e4b8c2e1a05f4cdfc535b789.jpg',
    all:      'https://i.pinimg.com/1200x/9e/15/17/9e15176dcf687db9d4626ca60d34961e.jpg',
    my:       'https://i.pinimg.com/736x/10/86/14/108614008a12928220759c5d083c2afb.jpg',
    uploaded: 'https://i.pinimg.com/736x/63/57/fd/6357fdfa456f43e0858dbbf86fb61acd.jpg',
    saved:    'https://i.pinimg.com/736x/9a/fa/e4/9afae444206f5991697f06064ba1bd05.jpg',
}

const FEED_MODES: FeedMode[] = ['discover', 'all', 'my', 'uploaded', 'saved']

const FEED_DESCRIPTIONS: Record<FeedMode, string> = {
    discover: 'Треки, которые ты ещё не слышал — свежие открытия специально для тебя',
    all:      'Вся музыка платформы — от новинок до классики',
    my:       'Твои личные треки, собранные в одном месте',
    uploaded: 'Треки, которые ты загрузил на платформу',
    saved:    'Музыка, которую ты сохранил, чтобы вернуться',
}

const VinylRecord = ({ cover, size = 150 }: { cover?: string; size?: number }) => {
    const coverSize = Math.round(size * 0.67);
    const holeSize = Math.round(size * 0.08);
    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            position: 'relative',
            flexShrink: 0,
            background: `
                radial-gradient(circle at center, transparent 20%, rgba(255,255,255,0.04) 20.5%, rgba(255,255,255,0.04) 22%, transparent 22.5%,
                transparent 28%, rgba(255,255,255,0.04) 28.5%, rgba(255,255,255,0.04) 30%, transparent 30.5%,
                transparent 36%, rgba(255,255,255,0.04) 36.5%, rgba(255,255,255,0.04) 38%, transparent 38.5%,
                transparent 44%, rgba(255,255,255,0.04) 44.5%, rgba(255,255,255,0.04) 46%, transparent 46.5%),
                #111
            `,
        }}>
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: coverSize, height: coverSize, borderRadius: '50%',
                overflow: 'hidden', background: cover ? undefined : '#222',
            }}>
                {cover && <img src={cover} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: holeSize, height: holeSize, borderRadius: '50%',
                background: '#000', zIndex: 1,
            }} />
        </div>
    );
}

export const PlayerScene = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { tracks: audioTracks, trackIndex, currentTrack, isPlaying, toggle, playTrack, selectedVinylId, loadAndPlayExternal, loadQueueAndPlay, appendToQueue } = useAudioPlayer();
    const [searchParams] = useSearchParams();

    const [vinyl, setVinyl] = useState<VinylInfo | null>(null);
    const [tracks, setTracks] = useState<TrackItem[]>([]);
    const [loading, setLoading] = useState(false);
    const sharedTrackHandledRef = useRef(false);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
    const [feedMode, setFeedMode] = useState<FeedMode | null>(null);
    const [feedLoading, setFeedLoading] = useState(false);
    const feedSkipRef = useRef(0);
    const feedHasMoreRef = useRef(true);
    const feedLoadingRef = useRef(false);
    const [discoverVinyls, setDiscoverVinyls] = useState<VinylInfo[]>([]);
    const [discoverLoading, setDiscoverLoading] = useState(false);
    const [activeBannerIndex, setActiveBannerIndex] = useState(0);
    const [savedTracks, setSavedTracks] = useState<LibTrack[]>([]);
    const [savedTracksLoading, setSavedTracksLoading] = useState(false);
    const [mobileTab, setMobileTab] = useState<'vinyls' | 'music'>('vinyls');

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    useEffect(() => {
        if (isMobile && selectedVinylId !== null) setMobileTab('music');
    }, [selectedVinylId, isMobile]);

    const loadMoreFeed = useCallback(async (mode: FeedMode, skip: number) => {
        if (feedLoadingRef.current) return;
        feedLoadingRef.current = true;
        if (skip === 0) setFeedLoading(true);
        try {
            const shuffle = '&shuffle=true';
            const r = await fetch(`${BASE_URL}/tracks?mode=${mode}&skip=${skip}&limit=${FEED_LIMIT}${shuffle}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data: any[] = await r.json();
            if (!Array.isArray(data)) return;
            const newTracks = data.map((t: any) => ({
                id: String(t.id),
                name: t.title,
                artist: t.artist,
                cover: t.avatar_url ?? undefined,
                src: `${BASE_URL}${t.stream_url}`,
            }));
            if (skip === 0) {
                loadQueueAndPlay(newTracks);
            } else {
                appendToQueue(newTracks);
            }
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

    const handleBannerClick = (mode: FeedMode) => {
        setActiveBannerIndex(FEED_MODES.indexOf(mode));
        setFeedMode(mode);
        feedSkipRef.current = 0;
        feedHasMoreRef.current = true;
        loadMoreFeed(mode, 0);
    };

    useEffect(() => {
        if (!token) return;
        setDiscoverLoading(true);
        fetch(`${BASE_URL}/vinyl?mode=discover&shuffle=true&limit=10`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then((data: any[]) => { if (Array.isArray(data)) setDiscoverVinyls(data); })
            .catch(() => {})
            .finally(() => setDiscoverLoading(false));
    }, [token]);

    useEffect(() => {
        if (!token) return;
        setSavedTracksLoading(true);
        fetch(`${BASE_URL}/tracks?mode=saved&limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then((data: any[]) => {
                if (!Array.isArray(data)) return;
                setSavedTracks(data.map((t: any) => ({
                    id: String(t.id),
                    title: t.title,
                    artist: t.artist,
                    cover: t.avatar_url ?? undefined,
                    src: `${BASE_URL}${t.stream_url}`,
                    user_id: t.user_id ? String(t.user_id) : undefined,
                })));
            })
            .catch(() => {})
            .finally(() => setSavedTracksLoading(false));
    }, [token]);

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

    useEffect(() => {
        if (selectedVinylId === null || !token) {
            setVinyl(null);
            setTracks([]);
            return;
        }
        setLoading(true);
        Promise.all([
            fetch(`${BASE_URL}/vinyl/${selectedVinylId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${BASE_URL}/vinyl/${selectedVinylId}/tracks`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ])
            .then(([vinylData, tracksData]) => {
                setVinyl(vinylData);
                setTracks(Array.isArray(tracksData) ? tracksData : []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [selectedVinylId, token]);

    const handleTrackClick = async (track: TrackItem) => {
        const audioIndex = audioTracks.findIndex(t => t.id === String(track.id));
        if (audioIndex !== -1) {
            playTrack(audioIndex);
            return;
        }
        try {
            const resp = await fetch(`${BASE_URL}/tracks/${track.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await resp.json();
            if (data?.stream_url) {
                loadAndPlayExternal({
                    id: String(data.id),
                    name: data.title,
                    artist: data.artist,
                    cover: data.avatar_url ?? undefined,
                    src: `${BASE_URL}${data.stream_url}`,
                });
            }
        } catch {}
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: vinyl?.second_color ?? '#222',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            overflow: 'hidden',
        }}>
            <PlayerTwo top />

            {/* Mobile tab bar */}
            {isMobile && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    zIndex: 20,
                    display: 'flex',
                }}>
                    <div style={{ display: 'flex', gap: '0.25rem', padding: '0.4rem 1rem' }}>
                    {(['vinyls', 'music'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setMobileTab(tab)}
                            style={{
                                background: mobileTab === tab ? 'rgba(255,255,255,0.12)' : 'none',
                                border: '1px solid ' + (mobileTab === tab ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'),
                                borderRadius: '2rem',
                                color: mobileTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                padding: '0.35rem 0.9rem',
                                cursor: 'pointer',
                                transition: 'color 0.2s, background 0.2s, border-color 0.2s',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {tab === 'vinyls' ? 'Музыка' : 'Пластинки'}
                        </button>
                    ))}
                    </div>
                </div>
            )}

            {/* Left panel: Banner slider + 10 vinyls */}
            <div style={{
                width: isMobile ? '100%' : undefined,
                flex: 1,
                display: isMobile && mobileTab !== 'vinyls' ? 'none' : 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                paddingTop: isMobile ? '2.75rem' : '5.5rem',
                paddingBottom: isMobile ? '7rem' : 0,
                boxSizing: 'border-box',
                borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.15)',
            }}>
                {/* Banner slider */}
                <div style={{
                    position: 'relative',
                    margin: '0 1.5rem',
                    height: isMobile ? '220px' : 'clamp(200px, 240vh, 300px)',
                    flexShrink: 0,
                    overflow: 'hidden',
                    borderRadius: '0.5rem',
                }}>
                    {FEED_MODES.map((mode, i) => {
                        const isActive = i === activeBannerIndex;
                        return (
                            <div
                                key={mode}
                                onClick={() => handleBannerClick(mode)}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    opacity: isActive ? 1 : 0,
                                    pointerEvents: isActive ? 'auto' : 'none',
                                    // transition: 'opacity 0.4s ease',
                                    cursor: 'pointer',
                                    backgroundColor: '#1c1c1c',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    justifyContent: 'flex-end',
                                    padding: isMobile ? '1rem 1rem 1.25rem 2rem' : '1.75rem 1.5rem 2rem 4rem',
                                    boxSizing: 'border-box',
                                    gap: '0.5rem',
                                }}
                            >
                                <img src={FEED_BACKGROUNDS[mode]} style={{objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0}}/>
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)', zIndex: 0 }} />
                                <p style={{
                                    color: '#fff',
                                    fontSize: isMobile ? '1.1rem' : '1.5rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    margin: 0,
                                    position: 'relative',
                                    zIndex: 1,
                                    lineHeight: 1.1,
                                }}>
                                    {FEED_LABELS[mode]}
                                </p>
                                <p style={{
                                    color: 'rgba(255,255,255,0.7)',
                                    fontSize: isMobile ? '0.65rem' : '0.75rem',
                                    margin: 0,
                                    position: 'relative',
                                    zIndex: 1,
                                    lineHeight: 1.4,
                                    maxWidth: '90%',
                                }}>
                                    {FEED_DESCRIPTIONS[mode]}
                                </p>
                                <button
                                    onClick={e => { e.stopPropagation(); handleBannerClick(mode); }}
                                    style={{
                                        background: 'rgba(255,255,255,0.15)',
                                        border: '1px solid rgba(255,255,255,0.35)',
                                        color: '#fff',
                                        padding: '0.5rem 1.25rem',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        transition: 'background 0.15s',
                                        opacity: feedLoading && feedMode === mode ? 0.5 : 1,
                                        position: 'relative',
                                        zIndex: 1,
                                        marginTop: '0.25rem',
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.28)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'; }}
                                >
                                    {feedLoading && feedMode === mode ? '...' : '▶ Играть'}
                                </button>
                            </div>
                        );
                    })}

                    {/* Prev arrow */}
                    {activeBannerIndex > 0 && (
                        <button
                            onClick={e => { e.stopPropagation(); setActiveBannerIndex(i => i - 1); }}
                            style={{
                                position: 'absolute',
                                left: 0, top: 0, bottom: 0,
                                width: '2.5rem',
                                background: 'linear-gradient(to right, rgba(0, 0, 0, 0), transparent)',
                                border: 'none',
                                color: 'rgba(255,255,255,0.75)',
                                cursor: 'pointer',
                                fontSize: '1.4rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >‹</button>
                    )}

                    {/* Next arrow */}
                    {activeBannerIndex < FEED_MODES.length - 1 && (
                        <button
                            onClick={e => { e.stopPropagation(); setActiveBannerIndex(i => i + 1); }}
                            style={{
                                position: 'absolute',
                                right: 0, top: 0, bottom: 0,
                                width: '2.5rem',
                                background: 'linear-gradient(to left, rgba(255, 255, 255, 0), transparent)',
                                border: 'none',
                                color: 'rgba(255,255,255,0.75)',
                                cursor: 'pointer',
                                fontSize: '1.4rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >›</button>
                    )}

                    {/* Dots */}
                    <div style={{
                        position: 'absolute',
                        top: '0.6rem',
                        right: '0.75rem',
                        display: 'flex',
                        gap: '0.25rem',
                        alignItems: 'center',
                    }}>
                        {FEED_MODES.map((_, i) => (
                            <div
                                key={i}
                                onClick={e => { e.stopPropagation(); setActiveBannerIndex(i); }}
                                style={{
                                    width: i === activeBannerIndex ? 14 : 5,
                                    height: 5,
                                    borderRadius: '3px',
                                    background: i === activeBannerIndex ? '#fff' : 'rgba(255,255,255,0.3)',
                                    cursor: 'pointer',
                                    transition: 'width 0.25s, background 0.25s',
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* 10 discover vinyls */}
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '1rem 1.5rem 0', flexShrink: 0 }}>Новые пластинки</p>
                <div className="hide-scrollbar" style={{ flexShrink: 0, overflowX: 'auto', overflowY: 'hidden', width: '100%', padding: '1rem 1.5rem', boxSizing: 'border-box', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    {discoverLoading ? (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0, alignSelf: 'center' }}>загрузка...</p>
                    ) : discoverVinyls.map(v => (
                        <div
                            key={v.id}
                            onClick={() => navigate(`/pages/vinyl?vinylId=${v.id}`)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.4rem',
                                cursor: 'pointer',
                                flexShrink: 0,
                                width: isMobile ? 90 : 150,
                            }}
                        >
                            <VinylRecord cover={v.disk_image ? toUrl(v.disk_image) : undefined} size={isMobile ? 90 : 150} />
                            <p style={{
                                color: '#fff',
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                margin: 0,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                textAlign: 'center',
                                width: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {v.name}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Saved tracks */}
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 1.5rem 0.5rem', flexShrink: 0 }}>Избранные треки</p>
                <div style={{ width: '100%', padding: '0 1.5rem 2rem', boxSizing: 'border-box' }}>
                    {savedTracksLoading ? (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>загрузка...</p>
                    ) : savedTracks.map(t => (
                        <TrackRow key={t.id} track={t} accentWhite onRemove={id => setSavedTracks(prev => prev.filter(x => x.id !== id))} />
                    ))}
                </div>
            </div>

            {/* Right panel: Canvas + tracks + button */}
            <div style={{
                width: isMobile ? '100%' : '22vw',
                height: isMobile ? 'calc(100vh - 7rem)' : '100%',
                flex: isMobile ? undefined : undefined,
                display: isMobile && mobileTab !== 'music' ? 'none' : 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.15)',
            }}>
                {/* Canvas */}
                <div style={{ height: isMobile ? '45vh' : '60%', flexShrink: 0, paddingTop: isMobile ? '2.75rem' : '4rem', boxSizing: 'border-box' }}>
                    <Canvas
                        shadows
                        camera={{ zoom: 3, position: [0, 10, 0], up: [0, 0, -1], fov: 45 }}
                        gl={{
                            toneMapping: THREE.ACESFilmicToneMapping,
                            toneMappingExposure: 1,
                            outputColorSpace: THREE.SRGBColorSpace,
                        }}
                    >
                        <Environment preset='park' />
                        <ambientLight intensity={8} />
                        <directionalLight
                            position={[3, 6, -4]}
                            intensity={2.5}
                            castShadow
                            shadow-mapSize={[2048, 2048]}
                            shadow-camera-near={0.1}
                            shadow-camera-far={30}
                            shadow-camera-left={-5}
                            shadow-camera-right={5}
                            shadow-camera-top={5}
                            shadow-camera-bottom={-5}
                        />
                        <VinylTransport
                            position={[0, 0, 0]}
                            scale={5}
                            playing={isPlaying}
                            click={toggle}
                            centerImageUrl={vinyl?.disk_image ? toUrl(vinyl.disk_image) : undefined}
                        />
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
                            <planeGeometry args={[40, 40]} />
                            <shadowMaterial opacity={0.2} />
                        </mesh>
                        <OrbitControls makeDefault enableRotate={false} enablePan={false} />
                    </Canvas>
                </div>

                {/* Scrollable info + tracks */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1rem 1.25rem',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                }}>
                    {loading ? (
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>загрузка...</p>
                    ) : vinyl && selectedVinylId !== null ? (
                        <>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <p style={{
                                    color: '#fff',
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    margin: 0,
                                    lineHeight: 1.2,
                                    wordBreak: 'break-word',
                                }}>
                                    {vinyl.name}
                                </p>
                                {vinyl.artist && (
                                    <p style={{
                                        color: 'rgba(255,255,255,0.5)',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        textTransform: 'uppercase',
                                        margin: '0.2rem 0 0',
                                        letterSpacing: '0.07em',
                                        wordBreak: 'break-word',
                                    }}>
                                        {vinyl.artist}
                                    </p>
                                )}
                            </div>
                            {tracks.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>нет треков</p>
                            ) : tracks.map(track => {
                                const isActive = currentTrack?.id === String(track.id);
                                return (
                                    <div
                                        key={track.id}
                                        onClick={() => handleTrackClick(track)}
                                        style={{
                                            padding: '0.55rem 0',
                                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <p style={{
                                            color: isActive ? (vinyl.bg_color ?? '#fff') : '#fff',
                                            fontSize: '0.82rem',
                                            fontWeight: 600,
                                            margin: 0,
                                            wordBreak: 'break-word',
                                        }}>
                                            {track.title}
                                        </p>
                                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', margin: '0.1rem 0 0', wordBreak: 'break-word' }}>
                                            {track.artist}
                                        </p>
                                    </div>
                                );
                            })}
                        </>
                    ) : null}
                </div>

                {/* Button fixed at bottom */}
                <div style={{
                    padding: '0.75rem 1.25rem 1.25rem',
                    flexShrink: 0,
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <button
                        onClick={() => navigate('/pages/vinyl')}
                        style={{
                            width: '100%',
                            border: '1px solid rgba(255,255,255,0.25)',
                            background: 'transparent',
                            color: 'rgba(255,255,255,0.4)',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.62rem',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            transition: 'border-color 0.2s, color 0.2s',
                        }}
                        onMouseEnter={e => {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.borderColor = 'rgb(255, 255, 255)';
                            el.style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.borderColor = 'rgba(255,255,255,0.25)';
                            el.style.color = 'rgba(255,255,255,0.4)';
                        }}
                    >
                        {selectedVinylId !== null ? 'Сменить пластинку' : 'Выбрать пластинку →'}
                    </button>
                </div>
            </div>
        </div>
    );
};
