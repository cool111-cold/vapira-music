import React from 'react';
import { Environment } from '@react-three/drei';
import Record from '../../Record';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import RightArrowIcon from '../../media/icons/right-arrow.svg';
import LeftArrowIcon from '../../media/icons/left-arrow.svg'
import Arrow from '../../media/icons/arrow.svg';
import { useState, useEffect, useRef } from 'react';

const SPACING = 0.17;
// scales: center=0.022, ±1=0.015, ±2=0.012, off=0.005

interface Vynyl {
    bgColor: string
    diskImage: string
    name: string
    secondColor: string
    cover: string
    videoCover: string
}

const VYNYL = [{
        bgColor: '#f8b3c6',
        diskImage: 'https://static.insales-cdn.com/r/itZPHiUfev0/rs:fit:296:0:1/q:80/plain/images/products/1/14/242049038/large_tyler-the-creator-igor-cd2.jpg@jpg',
        name: 'IGOR',
        secondColor: '#402d34',
        cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTgDLhqbG-V61SdPE1DXz8BMNCPs_K83ZsEw&s',
        videoCover: 'https://i.pinimg.com/originals/72/e3/0f/72e30fa1acee559ec69e2a4a77cc7c19.gif'
    },
    {
        bgColor: '#fff',
        diskImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSk3M6BR0N9eVQcL2ueUag1RSGeCM1NdyizVA&s',
        name: 'CRY BABY',
        secondColor: '#906674',
        cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTgDLhqbG-V61SdPE1DXz8BMNCPs_K83ZsEw&s',
        videoCover: 'https://i.pinimg.com/originals/72/e3/0f/72e30fa1acee559ec69e2a4a77cc7c19.gif'
    },
    {
        bgColor: '#83b3c1',
        diskImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZRKIbDri8K9f3xvXN7-sS3y0ZuYU6y-zVpg&s',
        name: 'K12',
        secondColor: '#906674',
        cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTgDLhqbG-V61SdPE1DXz8BMNCPs_K83ZsEw&s',
        videoCover: 'https://i.pinimg.com/originals/72/e3/0f/72e30fa1acee559ec69e2a4a77cc7c19.gif'
    }
]
const scaleForDist = (absDist: number) => {
    if (absDist < 0.5) return 1.2;
    if (absDist < 1.5) return 0.015 / 0.022;
    if (absDist < 2.5) return 0.012 / 0.022;
    return 0.005 / 0.022;
};

const AnimatedRecord = ({ index, counter, item, click, openFull }: { index: number; counter: number, item: Vynyl, click: () => void, openFull: boolean }) => {
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

const RecordsGroup = ({ counter, click, openFull }: { counter: number, click: () => void, openFull: boolean }) => {
    return (
        <>
            {Array.from({ length: VYNYL.length }, (_, i) => (
                <AnimatedRecord key={i} index={i} counter={counter} item={VYNYL[i]} click={click} openFull={openFull} />
            ))}
            {/* {VYNYL.map((item, index) => {
                <AnimatedRecord key={index} index={index} counter={counter} item={item}  />
            })} */}
        </>
    );
};

const Slide = ({ index }: { index: number }) => {
    const item = VYNYL[index];
    return (
        <div style={{
            width: '100%', height: '100%', position: 'absolute',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: item.bgColor ?? '#b7b7b7',
        }}>
            <p style={{
                fontWeight: 900,
                fontSize: item.name.length < 6 ? '25rem' : '15rem',
                color: item.bgColor,
                filter: 'brightness(0.85)',
                userSelect: 'none',
            }}>
                {item.name}
            </p>
        </div>
    );
};

// SVG clip paths with wavy ↘ diagonal.
// Both triangles share the exact same wavy boundary (from (1,1) back to (0,0)).
// The only difference: A goes via top-right corner, B goes via bottom-left corner.
const WaveClipPaths = () => (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
            {/* Triangle A — upper-right half: M 0 0 → top-right → bottom-right → wave → 0 0 */}
            <clipPath id="wave-clip-a" clipPathUnits="objectBoundingBox">
                <path d="M 0 0 L 1 0 L 1 1 Q 0.9 0.75 0.7 0.7 Q 0.55 0.65 0.5 0.5 Q 0.5 0.36 0.25 0.25 Q 0 0.15 0 0 Z" />
            </clipPath>
            {/* Triangle B — lower-left half: M 0 0 → bottom-left → bottom-right → wave → 0 0 */}
            <clipPath id="wave-clip-b" clipPathUnits="objectBoundingBox">
                <path d="M 0 0 L 0 1 L 1 1 Q 0.9 0.75 0.7 0.7 Q 0.55 0.65 0.5 0.5 Q 0.5 0.36 0.25 0.25 Q 0 0.15 0 0 Z" />
            </clipPath>
        </defs>
    </svg>
);

const SlideBackground = ({ counter }: { counter: number }) => {
    const [settled, setSettled] = useState(counter - 1);
    const [transIndex, setTransIndex] = useState<number | null>(null);
    // true = triangles at CORNERS, false = COVERING screen
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
            // Forward: new slide is base; OLD slide departs from center to corners
            setSettled(incoming);
            setTransIndex(oldIndex);
            setAtCorners(false);        // mount covering (no transition)
            setWaveKey(k => k + 1);

            rafId1 = requestAnimationFrame(() => {
                rafId2 = requestAnimationFrame(() => {
                    if (animIdRef.current !== myId) return;
                    setAtCorners(true); // fly to corners
                });
            });

            const timer = setTimeout(() => {
                if (animIdRef.current !== myId) return;
                setTransIndex(null);
                setAtCorners(false);
            }, 950);

            return () => { cancelAnimationFrame(rafId1); cancelAnimationFrame(rafId2); clearTimeout(timer); };
        } else {
            // Backward: old slide stays as base; NEW slide arrives from corners to center
            setTransIndex(incoming);
            setAtCorners(true);         // mount at corners (no transition)
            setWaveKey(k => k + 1);

            rafId1 = requestAnimationFrame(() => {
                rafId2 = requestAnimationFrame(() => {
                    if (animIdRef.current !== myId) return;
                    setAtCorners(false); // fly inward to cover screen
                });
            });

            const timer = setTimeout(() => {
                if (animIdRef.current !== myId) return;
                setSettled(incoming);   // swap base after new slide fully covers
                setTransIndex(null);
                setAtCorners(false);
            }, 950);

            return () => { cancelAnimationFrame(rafId1); cancelAnimationFrame(rafId2); clearTimeout(timer); };
        }
    }, [counter]);

    const transItem = transIndex !== null ? VYNYL[transIndex] : null;

    return (
        <div style={{ width: '100%', height: '100%', position: 'absolute', zIndex: -1, overflow: 'hidden' }}>
            <WaveClipPaths />
            <Slide index={settled} />

            {transItem !== null && (['a', 'b'] as const).map((part) => (
                <div
                    key={`${waveKey}-${part}`}
                    style={{
                        width: '100%', height: '100%', position: 'absolute',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: transItem.bgColor ?? '#b7b7b7',
                        zIndex: 1,
                        // Wavy shape is fixed; only transform animates
                        clipPath: `url(#wave-clip-${part})`,
                        transform: atCorners
                            ? (part === 'a' ? 'translate(150%, -150%)' : 'translate(-150%, 150%)')
                            : 'translate(0, 0)',
                        transition: 'transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)',
                    }}
                >
                    <p style={{
                        fontWeight: 900,
                        fontSize: transItem.name.length < 6 ? '25rem' : '15rem',
                        color: transItem.bgColor,
                        filter: 'brightness(0.85)',
                        userSelect: 'none',
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

    const getOpacity = () => animState === 'idle' ? 1 : 0;

    return (
        <p style={{
            fontSize: '2rem',
            fontWeight: 800,
            opacity: getOpacity(),
            transform: getTransform(),
            transition: animState === 'enter'
                ? 'opacity 0.1s ease, transform 0.2s ease'
                : 'opacity 0.1s ease, transform 0.2s ease',
            display: 'inline-block',
            overflow: 'hidden',
        }}>
            {`${displayValue < 10 ? '0' : ''}${displayValue}`}
        </p>
    );
};

export const VinylPage = () => {
    const [counter, setCounter] = useState(1);
    const [openCover, setOpenCover] = useState(false);
    const [delayedOpen, setDelayedOpen] = useState(false);
    const [showCover, setShowCover] = useState(true);
    const [glitching, setGlitching] = useState(false);

    useEffect(() => {
        if (openCover) {
            const t = setTimeout(() => setDelayedOpen(true), 500);
            return () => clearTimeout(t);
        } else {
            setDelayedOpen(false);
        }
    }, [openCover]);

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
    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Canvas wrapper with zIndex: 2 so records stay above the red overlay (zIndex: 1) */}
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
                    <directionalLight
                        position={[5, 10, 5]}
                        intensity={2}
                    />
                    <RecordsGroup counter={counter} click={() => setOpenCover((e) => !e)} openFull={delayedOpen} />
                </Canvas>
            </div>
            <SlideBackground counter={counter} />

            {/* Overlay: mask = прозрачный круг в центре сжимается к нулю → фон заполняется от краёв к центру */}
            <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center', width: '100vw', height: '100vh', backgroundColor: VYNYL[counter - 1].secondColor, zIndex: 1, position: 'absolute', top: 0, left: 0, '--circle-radius': openCover ? '0%' : '150%', WebkitMaskImage: 'radial-gradient(circle at 50% 50%, transparent var(--circle-radius), black var(--circle-radius))', maskImage: 'radial-gradient(circle at 50% 50%, transparent var(--circle-radius), black var(--circle-radius))', transition: '--circle-radius 0.7s ease', pointerEvents: openCover ? 'auto' : 'none'} as React.CSSProperties}>
                <div style={{display: 'flex', flexDirection: 'column', marginLeft: '45vw', width: '40vw'}}>
                    <p style={{fontWeight: 700, fontSize: '2.5rem', color: '#fff'}}>IGOR</p>
                    <p style={{fontWeight: 700, fontSize: '2.5rem', color: '#fff'}}>TYLER THE CREATOR</p>
                    <p style={{fontWeight: 500, fontSize: '1rem', color: VYNYL[counter -1].bgColor, marginTop: '1rem'}}>Igor (stylized in all caps) is the sixth studio album by the American rapper and producer Tyler, the Creator, released on May 17, 2019, through Columbia Records. Produced solely by Tyler himself, the album features guest appearances from Playboi Carti, Lil Uzi Vert, Solange, Kanye West, and Jerrod Carmichael. </p>
                    <button style={{border: '1px solid #fff', backgroundColor: 'transparent', padding: '0.5rem 1.5rem 0.5rem 1.5rem', color: '#fff', width: 'min-content', marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12}}>PURCHASE <img src={Arrow}/></button>
                </div>
            </div>

            {/* Blue sidebar — vertically centered, slides in from left */}
            {/* <div style={{width: '25vw', height: '25vw', position: 'absolute', zIndex: 2, backgroundColor: 'blue', left: openCover ? '25vw' : '-25vw', top: '50%', transform: 'translateY(-50%)', transition: 'left ease 0.7s'}}>
            </div> */}
            <div style={{width: '25vw', height: '25vw', position: 'absolute', zIndex: showCover ? 3 : 2, left: delayedOpen ? '15vw' : '-25vw', top: '50%', transform: 'translateY(-50%)', transition: 'left ease 0.7s', borderRadius: '.3rem', overflow: 'hidden'}}>
                <img src={VYNYL[counter - 1].cover} style={{width: '100%', height: '100%', display: 'block', borderRadius: '.3rem', animation: glitching && showCover ? 'glitch-out 0.6s forwards' : 'none'}} />
            </div>
            {openCover && <div style={{width: '25vw', height: '25vw', position: 'absolute', zIndex: showCover ? 2 : 3, left: delayedOpen ? '15vw' : '-25vw', top: '50%', transform: 'translateY(-50%)', transition: 'left ease 0.7s', borderRadius: '.3rem', overflow: 'hidden'}}>
                <img src={VYNYL[counter - 1].videoCover} style={{width: '100%', height: '100%', display: 'block', borderRadius: '.3rem', animation: glitching && !showCover ? 'glitch-out 0.6s forwards' : 'none'}} />
            </div>}

            <div style={{width: '100%', height: '10%', position: 'absolute', bottom: 0, padding: "1rem 1rem 1rem 1rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: openCover ? 0 : 10}}>
                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'baseline', overflow: 'hidden'}}>
                    <AnimatedCounter value={counter} />
                    <p style={{fontSize: '1rem', fontWeight: 500}}>{`/${VYNYL.length < 10 ? '0' : ''}${VYNYL.length}`}</p>
                </div>
                <div>
                    <img src={LeftArrowIcon} style={{width: '3rem', cursor: 'pointer'}} onClick={() => setCounter((e) => Math.max(1, e - 1))} />
                    <img src={RightArrowIcon} style={{width: '3rem', cursor: 'pointer'}} onClick={() => setCounter((e) => Math.min(VYNYL.length, e + 1))} />
                </div>
            </div>
        </div>
    );
};
