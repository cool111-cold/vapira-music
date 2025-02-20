import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Props {
  trackId: number;
  currentTime: number;
  setCurrentTime: (time: number)=>void;
}

const AudioPlayer: React.FC<Props> = ({ trackId, currentTime, setCurrentTime }) => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
//   const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchAudio = async () => {
    try {
      const response = await axios.get(`http://y91326yd.beget.tech/tracks/${trackId}`, {
        responseType: 'blob', // Указываем, что ожидаем двоичные данные
      });
      const audioUrl = URL.createObjectURL(new Blob([response.data]));
      setAudioSrc(audioUrl);
    } catch (error) {
      setError('Ошибка при загрузке аудиофайла');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAudio();
    // Очистка URL объекта при размонтировании компонента
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [trackId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
    //   setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(event.target.value));
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Number(event.target.value);
    //   setCurrentTime(Number(event.target.value));
    }
  };

  useEffect(()=>{
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Number(currentTime);
    //   setCurrentTime(Number(event.target.value));
    }
  },[currentTime])

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      {audioSrc ? (
        <div>
          <audio
            ref={audioRef}
            src={audioSrc}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />
          <div>
            <button onClick={handlePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              defaultValue={0.1}
              onChange={handleVolumeChange}
            />
          </div>
        </div>
      ) : (
        <div>Загрузка...</div>
      )}
    </div>
  );
};

export default AudioPlayer;
