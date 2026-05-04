import { Environment } from '@react-three/drei';
import Record from '../../Record';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import RightArrowIcon from '../../media/icons/right-arrow.svg';
import LeftArrowIcon from '../../media/icons/left-arrow.svg'
import { useState, useEffect, useRef } from 'react';

const SPACING = 0.17;
// scales: center=0.022, ±1=0.015, ±2=0.012, off=0.005

interface Vynyl {
    bgColor: string
    diskImage: string
    name: string
    secondColor: string
    cover: string
}

const VYNYL = [{
        bgColor: '#f8b3c6',
        diskImage: 'https://static.insales-cdn.com/r/itZPHiUfev0/rs:fit:296:0:1/q:80/plain/images/products/1/14/242049038/large_tyler-the-creator-igor-cd2.jpg@jpg',
        name: 'IGOR',
        secondColor: '',
        cover: ''
    },
    {
        bgColor: '#fff',
        diskImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSk3M6BR0N9eVQcL2ueUag1RSGeCM1NdyizVA&s',
        name: 'CRY BABY',
        secondColor: '',
        cover: ''
    },
    {
        bgColor: '#83b3c1',
        diskImage: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZRKIbDri8K9f3xvXN7-sS3y0ZuYU6y-zVpg&s',
        name: 'K12',
        secondColor: '',
        cover: ''
    }
]
const scaleForDist = (absDist: number) => {
    if (absDist < 0.5) return 1.2;
    if (absDist < 1.5) return 0.015 / 0.022;
    if (absDist < 2.5) return 0.012 / 0.022;
    return 0.005 / 0.022;
};

const AnimatedRecord = ({ index, counter, item }: { index: number; counter: number, item: Vynyl }) => {
    const { viewport } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const animX = useRef((index - (counter - 1)) * SPACING * viewport.width);
    const animScale = useRef(scaleForDist(Math.abs(index - (counter - 1))));
    const animRotY = useRef(0);
    const targetRotY = useRef(0);
    const prevCounter = useRef(counter);

    const handleClick = () => {
        console.log('///')
    }

    useFrame(() => {
        if (!groupRef.current) return;

        if (prevCounter.current !== counter) {
            const dir = counter > prevCounter.current ? 1 : -1;
            targetRotY.current += dir * Math.PI * 2;
            prevCounter.current = counter;
        }

        const targetX = (index - (counter - 1)) * SPACING * viewport.width;
        const absDist = Math.abs(targetX) / (SPACING * viewport.width);
        const targetScale = scaleForDist(absDist);

        animX.current = THREE.MathUtils.lerp(animX.current, targetX, 0.1);
        animScale.current = THREE.MathUtils.lerp(animScale.current, targetScale, 0.1);
        animRotY.current = THREE.MathUtils.lerp(animRotY.current, targetRotY.current, 0.07);

        groupRef.current.position.x = animX.current;
        groupRef.current.scale.setScalar(animScale.current);
        groupRef.current.rotation.y = animRotY.current;
    });

    return (
        <group ref={groupRef}>
            <Record position={[0, 0, 0]} scale={0.022} centerImageUrl={item?.diskImage} click={() => console.log('////')} />
        </group>
    );
};

const RecordsGroup = ({ counter }: { counter: number }) => {
    return (
        <>
            {Array.from({ length: VYNYL.length }, (_, i) => (
                <AnimatedRecord key={i} index={i} counter={counter} item={VYNYL[i]} />
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

const WAVE_OVERLAYS = [0.28, 0.14, 0];
const EXPANDED_CLIP = 'polygon(-150% 50%, 50% -150%, 250% 50%, 50% 250%)';
const COLLAPSED_CLIP = 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)';

const SlideBackground = ({ counter }: { counter: number }) => {
    const [settled, setSettled] = useState(counter - 1);
    const [pending, setPending] = useState<number | null>(null);
    // forward: waves expand from center; backward: waves collapse to center
    const [isForward, setIsForward] = useState(true);
    // expanded=true → EXPANDED_CLIP, expanded=false → COLLAPSED_CLIP
    const [expanded, setExpanded] = useState(false);
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

        let rafId1 = 0;
        let rafId2 = 0;

        if (backward) {
            // Base immediately becomes new slide; waves = OLD slide collapsing to center
            const oldIndex = settledRef.current;
            settledRef.current = incoming;

            setSettled(incoming);
            setWaveKey(k => k + 1);
            setPending(oldIndex);
            setIsForward(false);
            setExpanded(true); // waves mount fully visible (no transition on first render)

            // Trigger collapse to center after mount
            rafId1 = requestAnimationFrame(() => {
                rafId2 = requestAnimationFrame(() => {
                    if (animIdRef.current !== myId) return;
                    setExpanded(false);
                });
            });

            const timer = setTimeout(() => {
                if (animIdRef.current !== myId) return;
                setPending(null);
            }, 1000);

            return () => {
                cancelAnimationFrame(rafId1);
                cancelAnimationFrame(rafId2);
                clearTimeout(timer);
            };
        } else {
            // Waves = NEW slide expanding from center; base stays old slide
            settledRef.current = incoming;

            setWaveKey(k => k + 1);
            setPending(incoming);
            setIsForward(true);
            setExpanded(false); // waves mount as invisible dot

            // Trigger expansion after mount
            rafId1 = requestAnimationFrame(() => {
                rafId2 = requestAnimationFrame(() => {
                    if (animIdRef.current !== myId) return;
                    setExpanded(true);
                });
            });

            const timer = setTimeout(() => {
                if (animIdRef.current !== myId) return;
                setSettled(incoming);
                setPending(null);
                setExpanded(false);
            }, 1000);

            return () => {
                cancelAnimationFrame(rafId1);
                cancelAnimationFrame(rafId2);
                clearTimeout(timer);
            };
        }
    }, [counter]);

    // Forward: wave 0 first, wave 2 last (expands last = on top = has text)
    // Backward: wave 2 collapses first (top disappears first), wave 0 last
    const delays = isForward ? [0, 180, 360] : [360, 180, 0];

    return (
        <div style={{ width: '100%', height: '100%', position: 'absolute', zIndex: -1, overflow: 'hidden' }}>
            <Slide index={settled} />
            {pending !== null && delays.map((delay, i) => (
                <div
                    key={`${waveKey}-${i}`}
                    style={{
                        width: '100%', height: '100%', position: 'absolute',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: VYNYL[pending].bgColor ?? '#b7b7b7',
                        zIndex: i + 1,
                        clipPath: expanded ? EXPANDED_CLIP : COLLAPSED_CLIP,
                        transition: `clip-path 0.7s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
                    }}
                >
                    {WAVE_OVERLAYS[i] > 0 && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            backgroundColor: `rgba(0,0,0,${WAVE_OVERLAYS[i]})`,
                            pointerEvents: 'none',
                        }} />
                    )}
                    {i === delays.length - 1 && (
                        <p style={{
                            fontWeight: 900,
                            fontSize: VYNYL[pending].name.length < 6 ? '25rem' : '15rem',
                            color: VYNYL[pending].bgColor,
                            filter: 'brightness(0.85)',
                            position: 'relative', zIndex: 1,
                            userSelect: 'none',
                        }}>
                            {VYNYL[pending].name}
                        </p>
                    )}
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
    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Canvas
                camera={{ zoom: 3, position: [0, 10, 0], up: [0, 0, -1], fov: 45 }}
                gl={{
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1,
                    outputColorSpace: THREE.SRGBColorSpace,
                }}
            >
                <Environment preset='park' />
                {/* <Environment preset='dawn' /> */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[5, 10, 5]}
                    intensity={2}
                />
                <RecordsGroup counter={counter} />
            </Canvas>
            <SlideBackground counter={counter} />

            <div style={{width: '100%', height: '10%', position: 'absolute', bottom: 0, padding: "1rem 1rem 1rem 1rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
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
