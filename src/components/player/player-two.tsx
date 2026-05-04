import { useContext, useEffect, useRef, useState } from "react";
import { Icon } from "../icon";
import { Colors } from "../../colors";
import { Text } from "../text";
import { Modal } from "./modal";
import { useMyContext } from "../../context";
import axios from "axios";
import { Howl } from "howler";
import { url } from "inspector";


export const PlayerTwo = () => {
    const [modalLeft, setModalLeft] = useState<boolean>(false);
    const [modalRight, setModalRight] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [cover, setCover] = useState<string | null>(null);
    const { trackList, trackIndex, setTrackIndex } = useMyContext();
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [audioStatus, setAudioStatus] = useState<boolean>(false); // false - пауза, true - воспроизведение
    const [coverHover, setCoverHover] = useState<boolean>(false);
    const [openPlayer, setOpenPlayer] = useState<boolean>(false);

    const howlRef = useRef<Howl | null>(null);

    // Загрузка аудио
    const fetchAudio = async () => {
        try {
            const response = await axios.get(`http://y91326yd.beget.tech/tracks/${trackIndex}`, {
                responseType: "blob",
            });
            const audioUrl = URL.createObjectURL(new Blob([response.data]));
            setAudioSrc(audioUrl);
        } catch (error) {
            console.error(error);
        }
    };

    // Инициализация Howler.js при изменении trackIndex
    useEffect(() => {
        fetchAudio();
        return () => {
            if (howlRef.current) {
                howlRef.current.unload(); // Очистка предыдущего экземпляра
            }
            if (audioSrc) {
                URL.revokeObjectURL(audioSrc); // Очистка URL
            }
        };
    }, [trackIndex]);

    // Настройка Howl после получения audioSrc
    useEffect(() => {
        if (audioSrc) {
            howlRef.current = new Howl({
                src: [audioSrc],
                html5: true, // Использует HTML5 Audio для потоковой передачи
                autoplay: true,
                onplay: () => setAudioStatus(true),
                onpause: () => setAudioStatus(false),
                onend: () => {
                    setTrackIndex((prev) => Number(trackList[prev + 1]?.id || prev)); // Переход к следующему треку
                },
                onloaderror: (id, error) => console.error("Ошибка загрузки:", error),
            });

            // Обновление текущего времени
            const interval = setInterval(() => {
                if (howlRef.current && howlRef.current.playing()) {
                    const duration = howlRef.current.duration();
                    const seek = howlRef.current.seek();
                    if (duration > 0) {
                        setCurrentTime((seek / duration) * 100);
                    }
                }
            }, 1000); // Обновление каждую секунду

            return () => clearInterval(interval);
        }
    }, [audioSrc]);

    // Обновление обложки
    useEffect(() => {
        if (trackList[trackIndex]?.cover) {
            setCover(trackList[trackIndex]?.cover);
        }
    }, [trackList[trackIndex]?.cover]);

    // Сброс времени при смене трека
    useEffect(() => {
        setCurrentTime(0);

    }, [trackIndex]);

    // Воспроизведение/пауза
    const handlePlay = () => {
        if (howlRef.current) {
            if (audioStatus) {
                howlRef.current.pause();
            } else {
                howlRef.current.play();
            }
            setAudioStatus((prev) => !prev);
        }
    };

    // Обработка изменения ползунка
    const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (howlRef.current) {
            const newTime = Number(event.target.value);
            const duration = howlRef.current.duration();
            howlRef.current.seek((newTime / 100) * duration);
            setCurrentTime(newTime);
        }
    };

    const handleNext = () => (
        trackIndex < trackList.length - 1 ? setTrackIndex(trackIndex + 1) : null
        // setAudioStatus(false)
    )

    const handlePrev = () => (
        trackIndex > 0 ? setTrackIndex(trackIndex - 1) : null
        // setAudioStatus(false)
    )

    return (
        <div className="player-container-two" style={{bottom: openPlayer ? -90 : 0}}>
            <div style={{
                width: '15%',
                height: 3,
                backgroundColor: openPlayer ? '#353535' : '#fff',
                position: 'absolute',
                top: openPlayer ? '-15%' : '0%',
                cursor: 'pointer',
                borderRadius: 10,
                transition: 'all ease .2s'
            }}
            onClick={()=>setOpenPlayer((e)=>!e)}
            >
                <div style={{
                    width: `${currentTime}%`,
                    height: '100%',
                    backgroundColor: '#fff',
                    display: openPlayer ? 'block' : 'none'
                }} />
            </div>
            <div style={{
                width: '70%',
                height: '80%',
                backgroundColor: '#353535',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    width: '70%',
                    height: '80%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: "space-between"
                }}>
                    <div className="" style={{display: 'flex', flexDirection: 'row'}}>
                        <div className="" style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 10}}>
                            <div style={{
                                width: 55,
                                height: 55,
                                background: `url(${cover}) center center / cover`,
                                borderRadius: 3
                                }}></div>
                            <div className="" style={{display: 'flex', flexDirection: 'column'}}>
                                <Text 
                                    content={trackList[trackIndex]?.name}
                                    link={`/track/${trackList[trackIndex]?.id}`}
                                    color="#fff"
                                />
                                <Text
                                    content={trackList[trackIndex]?.artist_name}
                                    color="#8D8D8D"
                                />
                                {/* <button onClick={handlePlay} style={{width: 10, height: 10}}></button> */}
                            </div>
                        </div>
                        <div style={{
                            width: 'auto',
                            height: 'auto',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <Icon name="volume" isClick/>
                            <Icon name="SkipBackIcon" size={30} color="#B4B4B4" hoverColor="#fff" isClick onClick={handlePrev}/>
                            {audioStatus ? 
                                <Icon name='PauseIcon' size={35} isClick onClick={handlePlay} style={{width: 45, height: 45, display: 'flex', alignItems: 'center', justifyContent: 'center'}}/>   
                            :
                                <Icon name="PlayTwoIcon" size={45} isClick onClick={handlePlay}/>
                            }
                            <Icon name="SkipNextIcon" size={30} color="#B4B4B4" hoverColor="#fff" isClick onClick={handleNext}/>
                            <Icon name='LikeTwoIcon' size={25} isClick />
                        </div>
                        <div>
                            <Icon name='addCircle' />
                        </div>
                    </div>
                    <input
                        style={{
                            width: '100%',
                            height: 5,
                            cursor: 'pointer',
                            backgroundColor: '#5D5D5D',
                        }}
                        type="range"
                        min="0"
                        id="radius"
                        max={100}
                        value={currentTime}
                        onChange={handleTimeChange}
                    />
                    {/* <div className="progress" style={{width: `${currentTime}%`}}></div> */}
                </div>
            </div>
        </div>
    );
};