import { Howl } from 'howler';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

export interface Track {
    id: string;
    name: string;
    artist: string;
    src: string;
    cover?: string;
}

interface AudioContextType {
    tracks: Track[];
    trackIndex: number;
    currentTrack: Track | null;
    isPlaying: boolean;
    currentTime: number; // 0–100 percent
    durationSec: number; // total duration in seconds
    collapsed: boolean;
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    toggle: () => void;
    seek: (percent: number) => void;
    next: () => void;
    prev: () => void;
    playTrack: (index: number) => void;
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [trackIndex, setTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [durationSec, setDurationSec] = useState(0);
    const [collapsed, setCollapsed] = useState(false);

    const howlRef = useRef<Howl | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const trackIndexRef = useRef(0);

    // loadTrackRef always holds the latest version of loadTrack so Howl's
    // onend callback never closes over a stale copy.
    const loadTrackRef = useRef<(index: number, autoplay: boolean) => void>(null!);

    const stopInterval = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // Reassigned every render so any async callback gets the latest closure.
    loadTrackRef.current = (index: number, autoplay: boolean) => {
        stopInterval();
        if (howlRef.current) {
            howlRef.current.unload();
            howlRef.current = null;
        }

        setCurrentTime(0);
        setDurationSec(0);
        trackIndexRef.current = index;

        const track = tracks[index];
        if (!track) return;

        howlRef.current = new Howl({
            src: [track.src],
            html5: true,
            autoplay,
            onload: () => {
                const dur = howlRef.current?.duration() ?? 0;
                setDurationSec(dur);
            },
            onplay: () => {
                setIsPlaying(true);
                const dur = howlRef.current?.duration() ?? 0;
                if (dur > 0) setDurationSec(dur);
                intervalRef.current = setInterval(() => {
                    if (howlRef.current?.playing()) {
                        const d = howlRef.current.duration();
                        const pos = howlRef.current.seek() as number;
                        if (d > 0) setCurrentTime((pos / d) * 100);
                    }
                }, 500);
            },
            onpause: () => {
                setIsPlaying(false);
                stopInterval();
            },
            onstop: () => {
                setIsPlaying(false);
                stopInterval();
            },
            onend: () => {
                setIsPlaying(false);
                stopInterval();
                const next = trackIndexRef.current + 1;
                if (next < tracks.length) {
                    setTrackIndex(next);
                    loadTrackRef.current(next, true);
                }
            },
        });

        if (autoplay) howlRef.current.play();
    };

    useEffect(() => {
        fetch('https://vapira.ru/tracks')
            .then((r) => r.json())
            .then((data) =>
                data.map((t: { id: number; title: string; artist: string; avatar_url?: string; stream_url: string }) => ({
                    id: String(t.id),
                    name: t.title,
                    artist: t.artist,
                    cover: t.avatar_url,
                    src: `https://vapira.ru${t.stream_url}`,
                }))
            )
            .then(setTracks);
    }, []);

    // Load first track silently once tracks arrive; clean up on unmount.
    useEffect(() => {
        if (tracks.length === 0) return;
        loadTrackRef.current(0, false);
        return () => {
            stopInterval();
            howlRef.current?.unload();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tracks]);

    const toggle = useCallback(() => {
        const h = howlRef.current;
        if (!h) {
            loadTrackRef.current(trackIndexRef.current, true);
            return;
        }
        if (h.playing()) h.pause();
        else h.play();
    }, []);

    const seek = useCallback((percent: number) => {
        const h = howlRef.current;
        if (!h) return;
        h.seek((percent / 100) * h.duration());
        setCurrentTime(percent);
    }, []);

    const playTrack = useCallback((index: number) => {
        setTrackIndex(index);
        loadTrackRef.current(index, true);
    }, []);

    const next = useCallback(() => {
        if (trackIndexRef.current < tracks.length - 1)
            playTrack(trackIndexRef.current + 1);
    }, [playTrack, tracks.length]);

    const prev = useCallback(() => {
        if (trackIndexRef.current > 0)
            playTrack(trackIndexRef.current - 1);
    }, [playTrack]);

    return (
        <AudioCtx.Provider
            value={{
                tracks,
                trackIndex,
                currentTrack: tracks[trackIndex] ?? null,
                isPlaying,
                currentTime,
                durationSec,
                collapsed,
                setCollapsed,
                toggle,
                seek,
                next,
                prev,
                playTrack,
            }}
        >
            {children}
        </AudioCtx.Provider>
    );
};

export const useAudioPlayer = (): AudioContextType => {
    const ctx = useContext(AudioCtx);
    if (!ctx) throw new Error('useAudioPlayer must be used within <AudioProvider>');
    return ctx;
};
