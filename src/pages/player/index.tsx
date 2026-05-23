import { useEffect, useRef, useState } from 'react';
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
    position: number;
}

export const PlayerScene = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const { tracks: audioTracks, currentTrack, isPlaying, toggle, playTrack, selectedVinylId, loadAndPlayExternal } = useAudioPlayer();
    const [searchParams] = useSearchParams();

    const [vinyl, setVinyl] = useState<VinylInfo | null>(null);
    const [tracks, setTracks] = useState<TrackItem[]>([]);
    const [loading, setLoading] = useState(false);
    const sharedTrackHandledRef = useRef(false);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

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
                justifyContent: selectedVinylId !== null ? 'flex-start' : 'center',
                alignItems: selectedVinylId !== null ? 'flex-start' : 'center',
                padding: isMobile ? '1.25rem 1.25rem 5.5rem' : '2rem',
                paddingTop: isMobile ? '1.25rem' : '6rem',
                boxSizing: 'border-box',
                borderLeft: isMobile ? 'none' : '1px solid rgb(255, 255, 255)',
                borderTop: isMobile ? '1px solid rgba(255,255,255,0.15)' : 'none',
                overflowY: 'auto',
            }}>
                {selectedVinylId === null ? (
                    <button
                        onClick={() => navigate('/pages/vinyl')}
                        style={{
                            border: '1px solid rgb(255, 255, 255)',
                            background: 'transparent',
                            color: '#aaa',
                            padding: '0.75rem 2rem',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            transition: 'border-color 0.2s, color 0.2s, background 0.2s',
                        }}
                        onMouseEnter={e => {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.background = 'rgb(255, 255, 255)';
                            el.style.borderColor = 'rgb(255, 255, 255)';
                            el.style.color = '#000';
                        }}
                        onMouseLeave={e => {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.background = 'transparent';
                            el.style.borderColor = 'rgba(255,255,255,0.25)';
                            el.style.color = '#aaa';
                        }}
                    >
                        Выбрать пластинку →
                    </button>
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
