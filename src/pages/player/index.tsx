import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate, useSearchParams } from 'react-router-dom';
import VinylTransport from '../../VinylTransport';
import { PlayerTwo } from '../../components/player/player-two';
import { useAuth } from '../../context/auth-context';
import { useAudioPlayer } from '../../context/audio-context';

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
    avatar_url: string | null;
    stream_url: string;
    position?: number;
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

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const loadMoreFeed = useCallback(async (mode: FeedMode, skip: number) => {
        if (feedLoadingRef.current) return;
        feedLoadingRef.current = true;
        if (skip === 0) setFeedLoading(true);
        try {
            const shuffle = ['all', 'discover', 'my'].includes(mode) ? '&shuffle=true' : '';
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

    const handleModeClick = (mode: FeedMode) => {
        const next = feedMode === mode ? null : mode;
        setFeedMode(next);
        feedSkipRef.current = 0;
        feedHasMoreRef.current = true;
        if (next) {
            loadMoreFeed(next, 0);
        }
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

            {/* Canvas */}
            <div style={{
                flex: isMobile ? 'none' : 1,
                width: isMobile ? '100%' : undefined,
                height: isMobile ? '45vh' : '100%',
            }}>
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

            {/* Panel */}
            <div style={{
                width: isMobile ? '100%' : '28vw',
                flex: isMobile ? 1 : undefined,
                height: isMobile ? undefined : '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                padding: isMobile ? '1.25rem 1.25rem 5.5rem' : '2rem',
                paddingTop: isMobile ? '1.25rem' : '6rem',
                boxSizing: 'border-box',
                borderLeft: isMobile ? 'none' : '1px solid rgb(255, 255, 255)',
                borderTop: isMobile ? '1px solid rgba(255,255,255,0.15)' : 'none',
                overflowY: 'auto',
            }}>
                {selectedVinylId === null ? (
                    <>
                        {/* Mode buttons */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem', width: '100%' }}>
                            {(['all', 'discover', 'my', 'uploaded', 'saved'] as FeedMode[]).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => handleModeClick(mode)}
                                    style={{
                                        border: `1px solid ${feedMode === mode ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)'}`,
                                        background: feedMode === mode ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        color: feedMode === mode ? '#fff' : 'rgba(255,255,255,0.45)',
                                        padding: '0.3rem 0.75rem',
                                        cursor: feedLoading && feedMode === mode ? 'not-allowed' : 'pointer',
                                        fontSize: '0.62rem',
                                        letterSpacing: '0.15em',
                                        textTransform: 'uppercase',
                                        borderRadius: '0.25rem',
                                        transition: 'all 0.15s',
                                        opacity: feedLoading && feedMode === mode ? 0.6 : 1,
                                    }}
                                >
                                    {feedLoading && feedMode === mode ? '...' : FEED_LABELS[mode]}
                                </button>
                            ))}
                        </div>

                        {/* Discover vinyls */}
                        <div style={{ width: '100%', marginBottom: '1.25rem' }}>
                            {discoverLoading ? (
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>загрузка...</p>
                            ) : discoverVinyls.map(v => (
                                <div
                                    key={v.id}
                                    onClick={() => navigate(`/pages/vinyl?vinylId=${v.id}`)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.65rem',
                                        padding: '0.55rem 0',
                                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: v.bg_color ?? '#fff',
                                        flexShrink: 0,
                                    }} />
                                    <div>
                                        <p style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {v.name}
                                        </p>
                                        {v.artist && (
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', margin: '0.1rem 0 0', letterSpacing: '0.04em' }}>
                                                {v.artist}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate('/pages/vinyl')}
                            style={{
                                border: '1px solid rgba(255,255,255,0.25)',
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.4)',
                                padding: '0.5rem 1.5rem',
                                cursor: 'pointer',
                                fontSize: '0.65rem',
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
                            Выбрать пластинку →
                        </button>
                    </>
                ) : loading ? (
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>загрузка...</p>
                ) : (
                    <>
                        {vinyl && (
                            <div style={{ marginBottom: '1.25rem', width: '100%' }}>
                                <p style={{ color: '#fff', fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 700, textTransform: 'uppercase', margin: 0, lineHeight: 1.1 }}>
                                    {vinyl.name}
                                </p>
                                {vinyl.artist && (
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', margin: '0.3rem 0 0', letterSpacing: '0.08em' }}>
                                        {vinyl.artist}
                                    </p>
                                )}
                            </div>
                        )}

                        <div style={{ width: '100%', marginBottom: '1.5rem' }}>
                            {tracks.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>нет треков</p>
                            ) : tracks.map(track => {
                                const isActive = currentTrack?.id === String(track.id);
                                return (
                                    <div
                                        key={track.id}
                                        onClick={() => handleTrackClick(track)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0.7rem 0',
                                            borderBottom: '1px solid rgba(255,255,255,0.15)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div>
                                            <p style={{ color: isActive ? (vinyl?.bg_color ?? '#fff') : '#fff', fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>
                                                {track.title}
                                            </p>
                                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.73rem', margin: '0.15rem 0 0' }}>
                                                {track.artist}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => navigate('/pages/vinyl')}
                            style={{
                                border: '1px solid rgba(255,255,255,0.3)',
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.5)',
                                padding: '0.5rem 1.5rem',
                                cursor: 'pointer',
                                fontSize: '0.65rem',
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                alignSelf: 'flex-start',
                                transition: 'border-color 0.2s, color 0.2s',
                            }}
                            onMouseEnter={e => {
                                const el = e.currentTarget as HTMLButtonElement;
                                el.style.borderColor = 'rgb(255, 255, 255)';
                                el.style.color = '#fff';
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget as HTMLButtonElement;
                                el.style.borderColor = 'rgba(255,255,255,0.3)';
                                el.style.color = 'rgba(255,255,255,0.5)';
                            }}
                        >
                            Сменить пластинку
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
