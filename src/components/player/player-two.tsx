import { Icon } from '../icon';
import { Text } from '../text';
import { useAudioPlayer } from '../../context/audio-context';

const formatTime = (seconds: number): string => {
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const PlayerTwo = ({ top = false }: { top?: boolean }) => {
    const { currentTrack, isPlaying, currentTime, durationSec, collapsed, setCollapsed, toggle, seek, next, prev } = useAudioPlayer();

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        seek(Number(e.target.value));
    };

    const currentSec = (currentTime / 100) * durationSec;

    const containerStyle: React.CSSProperties = top
        ? { top: collapsed ? -72 : 0, bottom: 'auto' }
        : { bottom: collapsed ? -72 : 0, top: 'auto' };

    return (
        <div className="player-container-two" style={containerStyle}>
            {/* Progress bar / collapse toggle */}
            <div
                style={{
                    width: '15%',
                    height: 3,
                    backgroundColor: collapsed ? 'rgba(255,255,255,0.4)' : '#fff',
                    position: 'absolute',
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
                }}
            >
                <div
                    style={{
                        width: '85%',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 24,
                    }}
                >
                    {/* Track info */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            flexShrink: 0,
                        }}
                    >
                        {currentTrack?.cover && (
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    background: `url(${currentTrack.cover}) center center / cover`,
                                    borderRadius: 4,
                                    flexShrink: 0,
                                }}
                            />
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text content={currentTrack?.name ?? ''} color="#fff" />
                            <Text content={currentTrack?.artist ?? ''} color="#8D8D8D" />
                        </div>
                    </div>

                    {/* Playback controls */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 20,
                            flexShrink: 0,
                        }}
                    >
                        <Icon name="volume" size={22} color="#B4B4B4" hoverColor="#fff" isClick />
                        <Icon
                            name="SkipBackIcon"
                            size={22}
                            color="#B4B4B4"
                            hoverColor="#fff"
                            isClick
                            onClick={prev}
                        />
                        {isPlaying ? (
                            <Icon name="PauseIcon" size={26} isClick onClick={toggle} />
                        ) : (
                            <Icon name="PlayTwoIcon" size={26} isClick onClick={toggle} />
                        )}
                        <Icon
                            name="SkipNextIcon"
                            size={22}
                            color="#B4B4B4"
                            hoverColor="#fff"
                            isClick
                            onClick={next}
                        />
                        <Icon name="LikeTwoIcon" size={22} color="#B4B4B4" hoverColor="#fff" isClick />
                    </div>

                    {/* Seek bar with time */}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
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
                </div>
            </div>
        </div>
    );
};
