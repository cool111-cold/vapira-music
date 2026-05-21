import React from 'react';
import { Environment } from '@react-three/drei';
import Record from '../../Record';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import RightArrowIcon from '../../media/icons/right-arrow.svg';
import LeftArrowIcon from '../../media/icons/left-arrow.svg';
import Arrow from '../../media/icons/arrow.svg';
import { useState, useEffect, useRef } from 'react';

import './index.css';
import { PlayerTwo } from '../../components/player/player-two';
import { useAuth } from '../../context/auth-context';
import { useAudioPlayer } from '../../context/audio-context';

const SPACING = 0.17;

interface VinylApi {
    id: number
    name: string
    artist: string | null
    description: string | null
    bg_color: string | null
    second_color: string | null
    disk_image: string | null
    cover: string | null
    video_cover: string | null
}

interface TrackApi {
    id: number
    title: string
    artist: string
    avatar_url: string | null
    position: number
}

interface VinylDisplay {
    id: number
    name: string
    artist: string
    description: string
    bgColor: string
    secondColor: string
    diskImage: string
    cover: string
    videoCover: string
}

const FALLBACK_PALETTE = [
    { bgColor: '#edebe0', secondColor: '#453d1c' },
    { bgColor: '#f8b3c6', secondColor: '#402d34' },
    { bgColor: '#e0e8f0', secondColor: '#2c3d5e' },
    { bgColor: '#83b3c1', secondColor: '#2c4a55' },
    { bgColor: '#c8b6e2', secondColor: '#3d2c5e' },
    { bgColor: '#b6e2c8', secondColor: '#2c5e3d' },
    { bgColor: '#e2c8b6', secondColor: '#5e3d2c' },
]

const BASE_URL = 'https://vapira.ru'
const toUrl = (path: string | null) => path ? `${BASE_URL}${path}` : ''

const toDisplay = (v: VinylApi, i: number): VinylDisplay => ({
    id: v.id,
    name: v.name,
    artist: v.artist ?? '',
    description: v.description ?? '',
    bgColor: v.bg_color ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length].bgColor,
    secondColor: v.second_color ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length].secondColor,
    diskImage: toUrl(v.disk_image),
    cover: toUrl(v.cover),
    videoCover: toUrl(v.video_cover),
})

const scaleForDist = (absDist: number) => {
    if (absDist < 0.5) return 1.2;
    if (absDist < 1.5) return 0.015 / 0.022;
    if (absDist < 2.5) return 0.012 / 0.022;
    return 0.005 / 0.022;
};

const AnimatedRecord = ({ index, counter, item, click, openFull }: { index: number; counter: number; item: VinylDisplay; click: () => void; openFull: boolean }) => {
    const { viewport } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const animX = useRef((index - (counter - 1)) * SPACING * viewport.width);
    const animScale = useRef(scaleForDist(Math.abs(index - (counter - 1))));
    const animRotY = useRef(0);
    const targetRotY = useRef(0);
    const prevCounter = useRef(counter);

    useEffect(() => {
        if (openFull && index === counter - 1) {
            targetRotY.current -= Math.PI * 2;
        }
    }, [openFull]);

    useFrame(() => {
        if (!groupRef.current) return;

        if (prevCounter.current !== counter) {
            const dir = counter > prevCounter.current ? 1 : -1;
            targetRotY.current += dir * Math.PI * 2;
            prevCounter.current = counter;
        }

        let targetX: number;
        let targetScale: number;

        if (openFull) {
            if (index === counter - 1) {
                targetX = -viewport.width * 0.035;
                targetScale = 0.9;
            } else {
                const dir = index < counter - 1 ? -1 : 1;
                targetX = dir * viewport.width * 2;
                targetScale = 0;
            }
        } else {
            targetX = (index - (counter - 1)) * SPACING * viewport.width;
            const absDist = Math.abs(targetX) / (SPACING * viewport.width);
            targetScale = scaleForDist(absDist);
        }

        animX.current = THREE.MathUtils.lerp(animX.current, targetX, 0.1);
        animScale.current = THREE.MathUtils.lerp(animScale.current, targetScale, 0.1);
        animRotY.current = THREE.MathUtils.lerp(animRotY.current, targetRotY.current, 0.07);

        groupRef.current.position.x = animX.current;
        groupRef.current.scale.setScalar(Math.max(0, animScale.current));
        groupRef.current.rotation.y = animRotY.current;
    });

    return (
        <group ref={groupRef}>
            <Record position={[0, 0, 0]} scale={0.022} centerImageUrl={item?.diskImage} click={click} />
        </group>
    );
};

const RecordsGroup = ({ counter, click, openFull, vinyls }: { counter: number; click: () => void; openFull: boolean; vinyls: VinylDisplay[] }) => {
    return (
        <>
            {vinyls.map((item, i) => (
                <AnimatedRecord key={item.id} index={i} counter={counter} item={item} click={click} openFull={openFull} />
            ))}
        </>
    );
};

const Slide = ({ item }: { item: VinylDisplay }) => {
    const fontSize = item.name.length <= 4 ? '25rem' : item.name.length <= 8 ? '15rem' : '8rem';
    return (
        <div style={{
            width: '100%', height: '100%', position: 'absolute',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: item.bgColor ?? '#b7b7b7',
        }}>
            <p style={{
                fontWeight: 900,
                fontSize,
                color: item.bgColor,
                filter: 'brightness(0.85)',
                userSelect: 'none',
                textTransform: 'uppercase',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
            }}>
                {item.name}
            </p>
        </div>
    );
};

const WaveClipPaths = () => (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
            <clipPath id="wave-clip-a" clipPathUnits="objectBoundingBox">
                <path d="M 0 0 L 1 0 L 1 1 Q 0.9 0.75 0.7 0.7 Q 0.55 0.65 0.5 0.5 Q 0.5 0.36 0.25 0.25 Q 0 0.15 0 0 Z" />
            </clipPath>
            <clipPath id="wave-clip-b" clipPathUnits="objectBoundingBox">
                <path d="M 0 0 L 0 1 L 1 1 Q 0.9 0.75 0.7 0.7 Q 0.55 0.65 0.5 0.5 Q 0.5 0.36 0.25 0.25 Q 0 0.15 0 0 Z" />
            </clipPath>
        </defs>
    </svg>
);

const SlideBackground = ({ counter, vinyls }: { counter: number; vinyls: VinylDisplay[] }) => {
    const [settled, setSettled] = useState(counter - 1);
    const [transIndex, setTransIndex] = useState<number | null>(null);
    const [atCorners, setAtCorners] = useState(false);
    const [waveKey, setWaveKey] = useState(0);
    const animIdRef = useRef(0);
    const isFirstRender = useRef(true);
    const prevCounterRef = useRef(counter);
    const settledRef = useRef(counter - 1);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const backward = counter < prevCounterRef.current;
        prevCounterRef.current = counter;
        const incoming = counter - 1;
        const myId = ++animIdRef.current;

        const oldIndex = settledRef.current;
        settledRef.current = incoming;

        let rafId1 = 0;
        let rafId2 = 0;

        if (!backward) {
            setSettled(incoming);
            setTransIndex(oldIndex);
            setAtCorners(false);
            setWaveKey(k => k + 1);

            rafId1 = requestAnimationFrame(() => {
                rafId2 = requestAnimationFrame(() => {
                    if (animIdRef.current !== myId) return;
                    setAtCorners(true);
                });
            });

            const timer = setTimeout(() => {
                if (animIdRef.current !== myId) return;
                setTransIndex(null);
                setAtCorners(false);
            }, 950);

            return () => { cancelAnimationFrame(rafId1); cancelAnimationFrame(rafId2); clearTimeout(timer); };
        } else {
            setTransIndex(incoming);
            setAtCorners(true);
            setWaveKey(k => k + 1);

            rafId1 = requestAnimationFrame(() => {
                rafId2 = requestAnimationFrame(() => {
                    if (animIdRef.current !== myId) return;
                    setAtCorners(false);
                });
            });

            const timer = setTimeout(() => {
                if (animIdRef.current !== myId) return;
                setSettled(incoming);
                setTransIndex(null);
                setAtCorners(false);
            }, 950);

            return () => { cancelAnimationFrame(rafId1); cancelAnimationFrame(rafId2); clearTimeout(timer); };
        }
    }, [counter]);

    const settledItem = vinyls[settled] ?? vinyls[0];
    const transItem = transIndex !== null && transIndex < vinyls.length ? vinyls[transIndex] : null;

    if (!settledItem) return null;

    return (
        <div style={{ width: '100%', height: '100%', position: 'absolute', zIndex: -1, overflow: 'hidden' }}>
            <WaveClipPaths />
            <Slide item={settledItem} />

            {transItem !== null && (['a', 'b'] as const).map((part) => (
                <div
                    key={`${waveKey}-${part}`}
                    style={{
                        width: '100%', height: '100%', position: 'absolute',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: transItem.bgColor ?? '#b7b7b7',
                        zIndex: 1,
                        clipPath: `url(#wave-clip-${part})`,
                        transform: atCorners
                            ? (part === 'a' ? 'translate(150%, -150%)' : 'translate(-150%, 150%)')
                            : 'translate(0, 0)',
                        transition: 'transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)',
                    }}
                >
                    <p style={{
                        fontWeight: 900,
                        fontSize: transItem.name.length <= 4 ? '25rem' : transItem.name.length <= 8 ? '15rem' : '8rem',
                        color: transItem.bgColor,
                        filter: 'brightness(0.85)',
                        userSelect: 'none',
                        textTransform: 'uppercase',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                    }}>
                        {transItem.name}
                    </p>
                </div>
            ))}
        </div>
    );
};

const AnimatedCounter = ({ value }: { value: number }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [animState, setAnimState] = useState<'idle' | 'exit' | 'enter'>('idle');
    const [direction, setDirection] = useState<'up' | 'down'>('up');
    const prevValue = useRef(value);

    useEffect(() => {
        if (value === prevValue.current) return;
        const dir = value < prevValue.current ? 'up' : 'down';
        setDirection(dir);
        setAnimState('exit');

        const t1 = setTimeout(() => {
            setDisplayValue(value);
            prevValue.current = value;
            setAnimState('enter');
        }, 100);

        const t2 = setTimeout(() => {
            setAnimState('idle');
        }, 200);

        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [value]);

    const getTransform = () => {
        if (animState === 'exit') return direction === 'up' ? 'translateY(-20%)' : 'translateY(20%)';
        if (animState === 'enter') return direction === 'up' ? 'translateY(20%)' : 'translateY(-20%)';
        return 'translateY(0)';
    };

    return (
        <p style={{
            fontSize: '2rem',
            fontWeight: 800,
            opacity: animState === 'idle' ? 1 : 0,
            transform: getTransform(),
            transition: 'opacity 0.1s ease, transform 0.2s ease',
            display: 'inline-block',
            overflow: 'hidden',
        }}>
            {`${displayValue < 10 ? '0' : ''}${displayValue}`}
        </p>
    );
};

export const VinylPage = () => {
    const { token } = useAuth()
    const { tracks: audioTracks, playTrack, currentTrack } = useAudioPlayer()
    const [vinyls, setVinyls] = useState<VinylDisplay[]>([])
    const [loading, setLoading] = useState(true)
    const [tracks, setTracks] = useState<TrackApi[]>([])
    const [tracksLoading, setTracksLoading] = useState(false)
    const [counter, setCounter] = useState(1);
    const [openCover, setOpenCover] = useState(false);
    const [delayedOpen, setDelayedOpen] = useState(false);
    const [showCover, setShowCover] = useState(true);
    const [glitching, setGlitching] = useState(false);
    const [showTracks, setShowTracks] = useState(false);

    useEffect(() => {
        if (!token) return
        fetch('https://vapira.ru/vinyl-library', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then((data: VinylApi[]) => setVinyls(data.map(toDisplay)))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [token])

    useEffect(() => {
        if (!openCover || !vinyls.length || !token) {
            setTracks([])
            return
        }
        const vinyl = vinyls[counter - 1]
        if (!vinyl) return
        setTracksLoading(true)
        fetch(`https://vapira.ru/vinyl/${vinyl.id}/tracks`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(setTracks)
            .catch(() => setTracks([]))
            .finally(() => setTracksLoading(false))
    }, [openCover, counter, token])

    useEffect(() => {
        if (openCover) {
            const t = setTimeout(() => setDelayedOpen(true), 500);
            return () => clearTimeout(t);
        } else {
            setDelayedOpen(false);
            setShowTracks(false);
        }
    }, [openCover]);

    useEffect(() => {
        setShowTracks(false);
    }, [counter]);

    useEffect(() => {
        const interval = setInterval(() => {
            setGlitching(true);
            setTimeout(() => {
                setShowCover(prev => !prev);
                setGlitching(false);
            }, 600);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const removeTrack = async (trackId: number) => {
        const vinyl = vinyls[counter - 1]
        if (!vinyl || !token) return
        await fetch(`https://vapira.ru/vinyl/${vinyl.id}/tracks/${trackId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        })
        setTracks(prev => prev.filter(t => t.id !== trackId))
    }

    const currentVinyl = vinyls[counter - 1]

    if (loading) {
        return (
            <div style={{ width: '100vw', height: '100vh', backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlayerTwo top />
                <p style={{ color: '#555', fontSize: '0.875rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>loading...</p>
            </div>
        )
    }

    if (vinyls.length === 0) {
        return (
            <div style={{ width: '100vw', height: '100vh', backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                <PlayerTwo top />
                <p style={{ color: '#555', fontSize: '0.875rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>no vinyls yet</p>
                <a href="/upload" style={{ color: '#FD5E5E', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>create one →</a>
            </div>
        )
    }

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <PlayerTwo top />
            <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
                <Canvas
                    camera={{ zoom: 3, position: [0, 10, 0], up: [0, 0, -1], fov: 45 }}
                    gl={{
                        toneMapping: THREE.ACESFilmicToneMapping,
                        toneMappingExposure: 1,
                        outputColorSpace: THREE.SRGBColorSpace,
                    }}
                >
                    <Environment preset='park' />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 10, 5]} intensity={2} />
                    <RecordsGroup counter={counter} click={() => setOpenCover(e => !e)} openFull={delayedOpen} vinyls={vinyls} />
                </Canvas>
            </div>
            <SlideBackground counter={counter} vinyls={vinyls} />

            {/* Colour overlay with radial mask */}
            <div style={{
                width: '100vw', height: '100vh', backgroundColor: currentVinyl?.secondColor ?? '#222',
                zIndex: 1, position: 'absolute', top: 0, left: 0,
                '--circle-radius': openCover ? '0%' : '150%',
                WebkitMaskImage: 'radial-gradient(circle at 50% 50%, transparent var(--circle-radius), black var(--circle-radius))',
                maskImage: 'radial-gradient(circle at 50% 50%, transparent var(--circle-radius), black var(--circle-radius))',
                transition: '--circle-radius 0.7s ease', pointerEvents: 'none',
            } as React.CSSProperties} />

            {/* Detail overlay content */}
            <div style={{
                display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center',
                width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 10,
                pointerEvents: 'none',
                '--circle-radius': openCover ? '0%' : '150%',
                WebkitMaskImage: 'radial-gradient(circle at 50% 50%, transparent var(--circle-radius), black var(--circle-radius))',
                maskImage: 'radial-gradient(circle at 50% 50%, transparent var(--circle-radius), black var(--circle-radius))',
                transition: '--circle-radius 0.7s ease',
            } as React.CSSProperties}>
                <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '45vw', width: '40vw', pointerEvents: openCover ? 'auto' : 'none' }}>
                    {!showTracks ? (
                        <>
                            <p style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '2.5rem', color: '#fff', margin: 0, lineHeight: 1.1 }}>
                                {currentVinyl?.name}
                            </p>
                            {currentVinyl?.artist && (
                                <p style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '2.5rem', color: '#fff', margin: 0, lineHeight: 1.1 }}>
                                    {currentVinyl.artist}
                                </p>
                            )}
                            {currentVinyl?.description && (
                                <p style={{ fontWeight: 500, fontSize: '1rem', color: currentVinyl.bgColor, marginTop: '1rem', lineHeight: 1.5, pointerEvents: 'none' }}>
                                    {currentVinyl.description}
                                </p>
                            )}
                        </>
                    ) : (
                        <div style={{ maxHeight: '35vh', overflowY: 'auto' }}>
                            {tracksLoading ? (
                                <p style={{ color: '#fff', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>loading tracks...</p>
                            ) : tracks.length === 0 ? (
                                <p style={{ color: '#fff', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>no tracks</p>
                            ) : tracks.map(track => {
                                const audioIndex = audioTracks.findIndex(t => t.id === String(track.id));
                                const isActive = currentTrack?.id === String(track.id);
                                return (
                                <div key={track.id}
                                    onClick={() => audioIndex !== -1 && playTrack(audioIndex)}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.75rem 0',
                                        borderBottom: `1px solid ${currentVinyl?.bgColor ?? '#333'}44`,
                                        cursor: audioIndex !== -1 ? 'pointer' : 'default',
                                        opacity: audioIndex === -1 ? 0.5 : 1,
                                    }}>
                                    <div>
                                        <p style={{ color: isActive ? currentVinyl?.bgColor ?? '#FD5E5E' : '#fff', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{track.title}</p>
                                        <p style={{ color: '#aaa', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>{track.artist}</p>
                                    </div>
                                    {/* <button
                                        onClick={() => removeTrack(track.id)}
                                        style={{ background: 'none', border: 'none', color: '#FD5E5E', cursor: 'pointer', fontSize: '1.5rem', padding: '0 0.25rem', lineHeight: 1 }}
                                    >
                                        ×
                                    </button> */}
                                </div>
                                );
                            })}
                        </div>
                    )}
                    <button className="purchase-btn" onClick={() => setShowTracks((e) => !e)}>{showTracks ? "INFO" : "LISTEN"} <img src={Arrow}/></button>
                </div>
            </div>

            {/* Cover image with glitch swap to video_cover */}
            {currentVinyl?.cover && (
                <div style={{
                    width: '25vw', height: '25vw', position: 'absolute', zIndex: showCover ? 3 : 2,
                    left: delayedOpen ? '15vw' : '-25vw', top: '50%', transform: 'translateY(-50%)',
                    transition: 'left ease 0.7s', borderRadius: '.3rem', overflow: 'hidden',
                }}>
                    <img
                        src={currentVinyl.cover}
                        style={{ width: '100%', height: '100%', display: 'block', borderRadius: '.3rem', objectFit: 'cover', animation: glitching && showCover ? 'glitch-out 0.6s forwards' : 'none' }}
                    />
                </div>
            )}
            {openCover && currentVinyl?.videoCover && (
                <div style={{
                    width: '25vw', height: '25vw', position: 'absolute', zIndex: showCover ? 2 : 3,
                    left: delayedOpen ? '15vw' : '-25vw', top: '50%', transform: 'translateY(-50%)',
                    transition: 'left ease 0.7s', borderRadius: '.3rem', overflow: 'hidden',
                }}>
                    <img
                        src={currentVinyl.videoCover}
                        style={{ width: '100%', height: '100%', display: 'block', borderRadius: '.3rem', objectFit: 'cover', animation: glitching && !showCover ? 'glitch-out 0.6s forwards' : 'none' }}
                    />
                </div>
            )}

            {/* Navigation */}
            <div style={{ width: '100%', height: '10%', position: 'absolute', bottom: 0, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: openCover ? 0 : 10 }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', overflow: 'hidden' }}>
                    <AnimatedCounter value={counter} />
                    <p style={{ fontSize: '1rem', fontWeight: 500 }}>{`/${vinyls.length < 10 ? '0' : ''}${vinyls.length}`}</p>
                </div>
                <div>
                    <img src={LeftArrowIcon} style={{ width: '3rem', cursor: 'pointer' }} onClick={() => setCounter(e => Math.max(1, e - 1))} />
                    <img src={RightArrowIcon} style={{ width: '3rem', cursor: 'pointer' }} onClick={() => setCounter(e => Math.min(vinyls.length, e + 1))} />
                </div>
            </div>
        </div>
    );
};
