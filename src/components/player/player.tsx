import { useContext, useEffect, useRef, useState } from "react";
import { Icon } from "../icon";
import { Colors } from "../../colors";
import { Text } from "../text";
import { Modal } from "./modal";
import { useMyContext } from "../../context";
import axios from "axios";
import { Howl } from "howler";

export const Player = () => {
    const [modalLeft, setModalLeft] = useState<boolean>(false);
    const [modalRight, setModalRight] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [cover, setCover] = useState<string | null>(null);
    const { trackList, trackIndex, setTrackIndex } = useMyContext();
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [audioStatus, setAudioStatus] = useState<boolean>(false); // false - пауза, true - воспроизведение
    const [coverHover, setCoverHover] = useState<boolean>(false);

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

    return (
        <div className="player-container">
            <div className="player-info">
                <div
                    className=""
                    style={{
                        background: `url(${cover}) center center / cover`,
                        width: 150,
                        height: 150,
                        position: "relative",
                        bottom: 0,
                        pointerEvents: "all",
                    }}
                    onMouseEnter={() => setCoverHover(true)}
                    onMouseLeave={() => setCoverHover(false)}
                >
                    <div
                        className="shadow-block"
                        style={{
                            backgroundColor: Colors.shadow,
                            display: coverHover ? "flex" : "none",
                        }}
                    >
                        <div onClick={handlePlay}>
                            <Icon name={'play'} size={45} />
                        </div>
                    </div>
                </div>
                <Modal data={trackIndex - 1 >= 0 ? trackList[trackIndex - 1] : null} isVisible={modalLeft} />
                <div
                    className=""
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        marginLeft: 10,
                        pointerEvents: "all",
                    }}
                >
                    <Text
                        content={trackList[trackIndex]?.name}
                        color={Colors.default}
                        inBlock
                        styleBlock={{ paddingBottom: 3, paddingTop: 3, paddingLeft: 5, paddingRight: 15 }}
                        link={`/track/${trackList[trackIndex]?.id}`}
                        size={20}
                    />
                    <Text
                        content={trackList[trackIndex]?.artist_name}
                        color={Colors.bodyfont}
                        inBlock
                        styleBlock={{
                            paddingBottom: 3,
                            paddingTop: 3,
                            paddingLeft: 5,
                            paddingRight: 15,
                            marginTop: 5,
                            width: "fit-content",
                        }}
                        link="/"
                    />
                </div>
            </div>
            <div className="player-sub">
                {trackList[trackIndex]?.subtitle && (
                    <Text
                        content={trackList[trackIndex]?.subtitle!}
                        inBlock
                        color={Colors.bodyfont}
                        textStyle={{ whiteSpace: "normal", wordWrap: "break-word" }}
                        styleBlock={{
                            maxWidth: "30%",
                            maxHeight: "50%",
                            pointerEvents: "all",
                            textAlign: "right",
                            paddingRight: 15,
                            paddingTop: 5,
                            paddingLeft: 5,
                            paddingBottom: 5,
                        }}
                    />
                )}
                <Modal
                    data={trackIndex + 1 <= trackList.length - 1 ? trackList[trackIndex + 1] : null}
                    isVisible={modalRight}
                    isRight
                />
            </div>
            <div className="player-line">
                <div
                    className="player-line-btn"
                    onMouseEnter={() => setModalLeft(true)}
                    onMouseLeave={() => setModalLeft(false)}
                    onClick={() => (trackIndex > 0 ? setTrackIndex(trackIndex - 1) : null)}
                />
                <input
                    style={{
                        width: "98%",
                        height: "100%",
                        color: "red",
                        background: `linear-gradient(90deg, rgba(0,0,0,1) ${currentTime - 30}%, ${
                            trackList[trackIndex]?.color ? trackList[trackIndex].color : "#000"
                        } ${currentTime}%, rgba(255,255,255,0) ${currentTime}%)`,
                    }}
                    type="range"
                    min="0"
                    max={100}
                    value={currentTime}
                    onChange={handleTimeChange}
                    className="custom-range"
                />
                <div
                    className="player-line-btn"
                    onMouseEnter={() => setModalRight(true)}
                    onMouseLeave={() => setModalRight(false)}
                    onClick={() =>
                        trackIndex < trackList.length - 1 ? setTrackIndex(trackIndex + 1) : null
                    }
                />
            </div>
        </div>
    );
};