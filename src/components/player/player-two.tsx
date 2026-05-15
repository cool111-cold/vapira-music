import { Icon } from '../icon';
import { Text } from '../text';
import { useAudioPlayer } from '../../context/audio-context';

export const PlayerTwo = ({ top = false }: { top?: boolean }) => {
    const { currentTrack, isPlaying, currentTime, collapsed, setCollapsed, toggle, seek, next, prev } = useAudioPlayer();

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        seek(Number(e.target.value));
    };

    const containerStyle: React.CSSProperties = top
        ? { top: collapsed ? -90 : 0, bottom: 'auto' }
        : { bottom: collapsed ? -90 : 0, top: 'auto' };

    return (
        <div className="player-container-two" style={containerStyle}>
            {/* Progress bar / collapse toggle */}
            <div
                style={{
                    width: '15%',
                    height: 3,
                    backgroundColor: collapsed ? '#353535' : '#fff',
                    position: 'absolute',
                    top: top ? 'auto' : (collapsed ? '-15%' : '0%'),
                    bottom: top ? (collapsed ? '-15%' : '0%') : 'auto',
                    cursor: 'pointer',
                    borderRadius: 10,
                    transition: 'all ease .2s',
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
                    width: '70%',
                    height: '80%',
                    backgroundColor: '#353535',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: '70%',
                        height: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* Track info + controls */}
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'flex-end',
                                gap: 10,
                            }}
                        >
                            {currentTrack?.cover && (
                                <div
                                    style={{
                                        width: 55,
                                        height: 55,
                                        background: `url(${currentTrack.cover}) center center / cover`,
                                        borderRadius: 3,
                                    }}
                                />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text
                                    content={currentTrack?.name ?? ''}
                                    color="#fff"
                                />
                                <Text
                                    content={currentTrack?.artist ?? ''}
                                    color="#8D8D8D"
                                />
                            </div>
                        </div>

                        {/* Playback controls */}
                        <div
                            style={{
                                width: 'auto',
                                height: 'auto',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Icon name="volume" isClick />
                            <Icon
                                name="SkipBackIcon"
                                size={30}
                                color="#B4B4B4"
                                hoverColor="#fff"
                                isClick
                                onClick={prev}
                            />
                            {isPlaying ? (
                                <Icon
                                    name="PauseIcon"
                                    size={35}
                                    isClick
                                    onClick={toggle}
                                    style={{
                                        width: 45,
                                        height: 45,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                />
                            ) : (
                                <Icon name="PlayTwoIcon" size={45} isClick onClick={toggle} />
                            )}
                            <Icon
                                name="SkipNextIcon"
                                size={30}
                                color="#B4B4B4"
                                hoverColor="#fff"
                                isClick
                                onClick={next}
                            />
                            <Icon name="LikeTwoIcon" size={25} isClick />
                        </div>

                        <div>
                            <Icon name="addCircle" />
                        </div>
                    </div>

                    {/* Seek bar */}
                    <input
                        style={{
                            width: '100%',
                            height: 5,
                            cursor: 'pointer',
                            backgroundColor: '#5D5D5D',
                        }}
                        type="range"
                        min="0"
                        max={100}
                        value={currentTime}
                        onChange={handleSeek}
                    />
                </div>
            </div>
        </div>
    );
};
