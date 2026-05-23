import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from '../icon';
import { Text } from '../text';
import { useAudioPlayer } from '../../context/audio-context';
import { useAuth } from '../../context/auth-context';
import { useSaved } from '../../context/saved-context';

const NavButton = ({ path, children }: { path: string; children: React.ReactNode }) => {
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
                gap: 3,
                padding: '2px 8px',
                opacity: active ? 1 : 0.45,
                transition: 'opacity 0.2s',
            }}
        >
            {children}
        </button>
    );
};

const formatTime = (seconds: number): string => {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

const NAV_ICONS = {
    home: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9.41605C3 9.04665 3.18802 8.7001 3.50457 8.48603L11.3046 3.21117C11.7209 2.92961 12.2791 2.92961 12.6954 3.21117L20.4954 8.48603C20.812 8.70011 21 9.04665 21 9.41605V19.2882C21 20.2336 20.1941 21 19.2 21H4.8C3.80589 21 3 20.2336 3 19.2882V9.41605Z" stroke="white" strokeWidth="2"/>
        </svg>
    ),
    vinyl: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.5999 11.9999C21.5999 17.3018 17.3018 21.5999 11.9999 21.5999C6.69797 21.5999 2.3999 17.3018 2.3999 11.9999C2.3999 6.69797 6.69797 2.3999 11.9999 2.3999C17.3018 2.3999 21.5999 6.69797 21.5999 11.9999Z" stroke="white" strokeWidth="2"/>
            <path d="M14.3999 11.9999C14.3999 13.3254 13.3254 14.3999 11.9999 14.3999C10.6744 14.3999 9.5999 13.3254 9.5999 11.9999C9.5999 10.6744 10.6744 9.5999 11.9999 9.5999C13.3254 9.5999 14.3999 10.6744 14.3999 11.9999Z" stroke="white" strokeWidth="2"/>
        </svg>
    ),
    profile: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2"/>
            <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    ),
};

export const PlayerTwo = ({ top = false }: { top?: boolean }) => {
    const { currentTrack, isPlaying, currentTime, durationSec, volume, collapsed, setCollapsed, toggle, seek, setVolume, next, prev } = useAudioPlayer();
    const [showVolume, setShowVolume] = useState(false);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
    const volumeRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(null);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

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

    useAuth();
    const { savedIds, toggleSaved } = useSaved();
    const isLiked = currentTrack ? savedIds.has(currentTrack.id) : false;

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        seek(Number(e.target.value));
    };

    const currentSec = (currentTime / 100) * durationSec;
    const playerHeight = isMobile ? 108 : 72;

    const containerStyle: React.CSSProperties = isMobile
        ? { bottom: collapsed ? -playerHeight : 0, top: 'auto', height: playerHeight }
        : top
            ? { top: collapsed ? -playerHeight : 0, bottom: 'auto', height: playerHeight }
            : { bottom: collapsed ? -playerHeight : 0, top: 'auto', height: playerHeight };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (dx < -50) next();
        else if (dx > 50) prev();
    };

    const navButtons = (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0, justifyContent: 'space-evenly'}}>
            <NavButton path="/">{NAV_ICONS.home}</NavButton>
            <NavButton path="/pages/vinyl">{NAV_ICONS.vinyl}</NavButton>
            <NavButton path="/pages/profile">{NAV_ICONS.profile}</NavButton>
        </div>
    );

    const playbackControls = (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: isMobile ? 16 : 20, flexShrink: 0 }}>
            {!isMobile && (
                <div ref={volumeRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Icon
                        name="volume"
                        size={22}
                        color={showVolume ? '#fff' : '#B4B4B4'}
                        hoverColor="#fff"
                        isClick
                        onClick={() => setShowVolume(v => !v)}
                    />
                    {showVolume && (
                        <div style={{
                            position: 'absolute',
                            ...(top ? { top: '140%' } : { bottom: '140%' }),
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(20,20,20,0.95)',
                            borderRadius: 8,
                            padding: '10px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            zIndex: 10,
                        }}>
                            <span style={{ color: '#8D8D8D', fontSize: 10 }}>{Math.round(volume * 100)}</span>
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
            )}
            <Icon name="SkipBackIcon" size={22} color="#B4B4B4" hoverColor="#fff" isClick onClick={prev} />
            {isPlaying ? (
                <Icon name="PauseIcon" size={26} isClick onClick={toggle} />
            ) : (
                <Icon name="PlayTwoIcon" size={26} isClick onClick={toggle} />
            )}
            <Icon name="SkipNextIcon" size={22} color="#B4B4B4" hoverColor="#fff" isClick onClick={next} />
            {!isMobile && (
                <Icon
                    name="LikeTwoIcon"
                    size={22}
                    color={isLiked ? '#FD5E5E' : '#B4B4B4'}
                    hoverColor={isLiked ? '#FD5E5E' : '#fff'}
                    isClick
                    onClick={() => currentTrack && toggleSaved(currentTrack.id)}
                />
            )}
        </div>
    );

    return (
        <div className="player-container-two" style={containerStyle}>
            {/* Collapse toggle strip */}
            <div
                style={{
                    width: isMobile ? 48 : '15%',
                    height: 3,
                    backgroundColor: collapsed ? 'rgba(255,255,255,0.4)' : '#fff',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    top: top ? 'auto' : (collapsed ? '-15%' : '-10px'),
                    bottom: top ? (collapsed ? '-15%' : '-10px') : 'auto',
                    cursor: 'pointer',
                    borderRadius: 10,
                    transition: 'all ease .2s',
                    zIndex: 1,
                }}
                onClick={() => setCollapsed(v => !v)}
            >
                <div
                    style={{
                        width: `${currentTime}%`,
                        height: '100%',
                        backgroundColor: '#fff',
                        display: collapsed ? 'block' : 'none',
                    }}
                />
            </div>

            <div
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 15, 15, 0.5)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    padding: isMobile ? '0 16px' : '0',
                }}
            >
                {isMobile ? (
                    /* ── Mobile layout ── */
                    <div
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Row: cover + name + artist + like + play/pause */}
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {currentTrack?.cover && (
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    background: `url(${currentTrack.cover}) center center / cover`,
                                    borderRadius: 2,
                                    flexShrink: 0,
                                }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <Text content={currentTrack?.name ?? ''} color="#fff" />
                                <Text content={currentTrack?.artist ?? ''} color="#8D8D8D" />
                            </div>
                            <Icon
                                name="LikeTwoIcon"
                                size={22}
                                color={isLiked ? '#FD5E5E' : '#B4B4B4'}
                                hoverColor={isLiked ? '#FD5E5E' : '#fff'}
                                isClick
                                onClick={() => currentTrack && toggleSaved(currentTrack.id)}
                            />
                            {isPlaying ? (
                                <Icon name="PauseIcon" size={26} isClick onClick={toggle} />
                            ) : (
                                <Icon name="PlayTwoIcon" size={26} isClick onClick={toggle} />
                            )}
                        </div>
                        {/* Progress bar */}
                        <input
                            className="player-seek"
                            style={{
                                width: '100%',
                                height: 3,
                                cursor: 'pointer',
                                background: `linear-gradient(to right, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.85) ${currentTime}%, rgba(255,255,255,0.2) ${currentTime}%, rgba(255,255,255,0.2) 100%)`,
                            }}
                            type="range"
                            min="0"
                            max={100}
                            value={currentTime}
                            onChange={handleSeek}
                        />
                        {/* Navigation */}
                        {navButtons}
                    </div>
                ) : (
                    /* ── Desktop layout ── */
                    <div style={{ width: '85%', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                        {currentTrack && <>
                        {/* Track info */}
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                            {currentTrack?.cover && (
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    background: `url(${currentTrack.cover}) center center / cover`,
                                    borderRadius: 2,
                                    flexShrink: 0,
                                }} />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text content={currentTrack?.name ?? ''} color="#fff" />
                                <Text content={currentTrack?.artist ?? ''} color="#8D8D8D" />
                            </div>
                        </div>

                        {playbackControls}

                        {/* Seek bar with time */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: '#8D8D8D', fontSize: 12, flexShrink: 0, minWidth: 32, textAlign: 'right' }}>
                                {formatTime(currentSec)}
                            </span>
                            <input
                                className="player-seek"
                                style={{
                                    flex: 1,
                                    height: 3,
                                    cursor: 'pointer',
                                    background: `linear-gradient(to right, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.85) ${currentTime}%, rgba(255,255,255,0.2) ${currentTime}%, rgba(255,255,255,0.2) 100%)`,
                                }}
                                type="range"
                                min="0"
                                max={100}
                                value={currentTime}
                                onChange={handleSeek}
                            />
                            <span style={{ color: '#8D8D8D', fontSize: 12, flexShrink: 0, minWidth: 32 }}>
                                {formatTime(durationSec)}
                            </span>
                        </div>
                        </>}

                        {navButtons}
                    </div>
                )}
            </div>
        </div>
    );
};
