import { Howl } from 'howler';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useAuth } from './auth-context';

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
    volume: number; // 0–1
    collapsed: boolean;
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    toggle: () => void;
    seek: (percent: number) => void;
    seekAfterLoad: (sec: number) => void;
    setVolume: (v: number) => void;
    next: () => void;
    prev: () => void;
    playTrack: (index: number) => void;
    loadAndPlayExternal: (track: Track) => void;
    loadQueueAndPlay: (tracks: Track[]) => void;
    appendToQueue: (tracks: Track[]) => void;
    selectedVinylId: number | null;
    setSelectedVinylId: (id: number | null) => void;
    setRate: (rate: number) => void;
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [trackIndex, setTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [durationSec, setDurationSec] = useState(0);
    const VOLUME_KEY = 'player_volume';
    const savedVolume = parseFloat(localStorage.getItem(VOLUME_KEY) ?? '1');
    const initialVolume = isNaN(savedVolume) ? 1 : Math.max(0, Math.min(1, savedVolume));
    const [volume, setVolumeState] = useState(initialVolume);
    const [collapsed, setCollapsed] = useState(false);
    const [selectedVinylId, setSelectedVinylId] = useState<number | null>(null);
    const volumeRef = useRef(initialVolume);

    const howlRef = useRef<Howl | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pendingSeekSecRef = useRef<number | null>(null);
    const trackIndexRef = useRef(0);
    const tracksRef = useRef<Track[]>([]);
    tracksRef.current = tracks;
    const isInitializedRef = useRef(false);
    const pendingPlayIdRef = useRef<string | null>(null);
    const pendingQueuePlayRef = useRef(false);
    const playingTrackIdRef = useRef<string | null>(null);

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

        const track = tracksRef.current[index];
        if (!track) return;
        if (autoplay) playingTrackIdRef.current = track.id;

        howlRef.current = new Howl({
            src: [track.src],
            html5: true,
            volume: volumeRef.current,
            autoplay,
            onload: () => {
                const dur = howlRef.current?.duration() ?? 0;
                setDurationSec(dur);
                if (pendingSeekSecRef.current !== null && dur > 0) {
                    howlRef.current?.seek(pendingSeekSecRef.current);
                    setCurrentTime((pendingSeekSecRef.current / dur) * 100);
                    pendingSeekSecRef.current = null;
                }
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
                }, 50);
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
                if (next < tracksRef.current.length) {
                    setTrackIndex(next);
                    loadTrackRef.current(next, true);
                }
            },
        });

        if (autoplay) howlRef.current.play();
    };

    useEffect(() => {
        if (!token) { setTracks([]); return; }
        fetch('https://vapira.ru/saved', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                const saved = data.map((t: { id: number; title: string; artist: string; avatar_url?: string; stream_url: string }) => ({
                    id: String(t.id),
                    name: t.title,
                    artist: t.artist,
                    cover: t.avatar_url,
                    src: `https://vapira.ru${t.stream_url}`,
                }));
                // Preserve any externally-loaded tracks not in saved (e.g. from share links)
                setTracks(prev => {
                    const externals = prev.filter(p => !saved.some((s: Track) => s.id === p.id));
                    return [...saved, ...externals];
                });
            });
    }, [token]);

    // Load first track silently on initial fetch; reset on logout.
    useEffect(() => {
        if (tracks.length === 0) {
            isInitializedRef.current = false;
            pendingPlayIdRef.current = null;
            stopInterval();
            howlRef.current?.unload();
            howlRef.current = null;
            return;
        }
        if (pendingQueuePlayRef.current) {
            pendingQueuePlayRef.current = false;
            isInitializedRef.current = true;
            setTrackIndex(0);
            trackIndexRef.current = 0;
            loadTrackRef.current(0, true);
            return;
        }
        // Play a track added by loadAndPlayExternal once state is updated
        if (pendingPlayIdRef.current !== null) {
            const id = pendingPlayIdRef.current;
            pendingPlayIdRef.current = null;
            const idx = tracks.findIndex(t => t.id === id);
            if (idx >= 0) {
                setTrackIndex(idx);
                loadTrackRef.current(idx, true);
            }
            isInitializedRef.current = true;
            return;
        }
        if (isInitializedRef.current) {
            // Tracks array was replaced/extended (e.g. saved tracks loaded after a share link).
            // Keep trackIndex pointing to whatever track is actually playing.
            if (playingTrackIdRef.current) {
                const newIdx = tracks.findIndex(t => t.id === playingTrackIdRef.current);
                if (newIdx >= 0 && newIdx !== trackIndexRef.current) {
                    setTrackIndex(newIdx);
                    trackIndexRef.current = newIdx;
                }
            }
            return;
        }
        isInitializedRef.current = true;
        loadTrackRef.current(0, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tracks]);

    // Cleanup on unmount.
    useEffect(() => {
        return () => {
            stopInterval();
            howlRef.current?.unload();
        };
    }, []);

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

    const seekAfterLoad = useCallback((sec: number) => {
        pendingSeekSecRef.current = sec;
    }, []);

    const setVolume = useCallback((v: number) => {
        const clamped = Math.max(0, Math.min(1, v));
        volumeRef.current = clamped;
        setVolumeState(clamped);
        localStorage.setItem(VOLUME_KEY, String(clamped));
        if (howlRef.current) howlRef.current.volume(clamped);
    }, []);

    const playTrack = useCallback((index: number) => {
        setTrackIndex(index);
        loadTrackRef.current(index, true);
    }, []);

    const next = useCallback(() => {
        if (trackIndexRef.current < tracksRef.current.length - 1)
            playTrack(trackIndexRef.current + 1);
    }, [playTrack]);

    const prev = useCallback(() => {
        if (trackIndexRef.current > 0)
            playTrack(trackIndexRef.current - 1);
    }, [playTrack]);

    const loadAndPlayExternal = useCallback((track: Track) => {
        const idx = tracksRef.current.findIndex(t => t.id === track.id);
        if (idx >= 0) {
            playTrack(idx);
            return;
        }
        pendingPlayIdRef.current = track.id;
        setTracks(prev => [...prev, track]);
    }, [playTrack]);

    const loadQueueAndPlay = useCallback((newTracks: Track[]) => {
        if (newTracks.length === 0) return;
        pendingQueuePlayRef.current = true;
        pendingPlayIdRef.current = null;
        setTracks(newTracks);
    }, []);

    const setRate = useCallback((rate: number) => {
        if (howlRef.current) howlRef.current.rate(rate);
    }, []);

    const appendToQueue = useCallback((newTracks: Track[]) => {
        if (newTracks.length === 0) return;
        setTracks(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const fresh = newTracks.filter(t => !existingIds.has(t.id));
            return fresh.length > 0 ? [...prev, ...fresh] : prev;
        });
    }, []);

    return (
        <AudioCtx.Provider
            value={{
                tracks,
                trackIndex,
                currentTrack: tracks[trackIndex] ?? null,
                isPlaying,
                currentTime,
                durationSec,
                volume,
                collapsed,
                setCollapsed,
                toggle,
                seek,
                seekAfterLoad,
                setVolume,
                next,
                prev,
                playTrack,
                loadAndPlayExternal,
                loadQueueAndPlay,
                appendToQueue,
                selectedVinylId,
                setSelectedVinylId,
                setRate,
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
