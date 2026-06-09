import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { useAudioPlayer } from '../../context/audio-context';
import { useSaved } from '../../context/saved-context';
import { Icon } from '../../components/icon';

const BASE_URL = 'https://vapira.ru';

const LYRICS_LRC = `[00:49.94]Whip it like a Nascar, I can see the time pass
[00:53.10]Feel like I'm in high school, fuckin' me in gym class
[00:56.30]Shawty, I remember that
[00:57.86]I know you remember that
[00:59.45]You was fuckin' with me way before I even wrote raps
[01:02.72]Now I'm seein' cash flow
[01:04.26]I could be a asshole
[01:05.81]Yeah, I know
[01:06.59]But it's all good cause I let her spend my money, though
[01:09.70]Playboy bunny, though, shawty look like a pornstar
[01:13.14]I know she love me 'cause she fuck me in her sports car
[01:16.30]I pull up on her, tell her that we finna go far
[01:19.68]Drop top, smokin' thrax, lookin' at the stars
[01:22.83]Gettin' high, taking bars till we on Mars
[01:26.03]I could make the ground move like I'm Avatar
[01:29.17]Now I'm faded on my own in my bedroom
[01:32.37]Now I'm lookin' at my phone should I text you?
[01:35.37]I just wanna sex you, I just wanna bless you
[01:38.35]Baby, I'm a priest in the underworld, guess who
[01:41.60]Lil' Bo Peep with a brand new flow too
[01:44.72]Lookin' at my teeth like you never seen a gold tooth
[01:47.91]Never in the streets 'cause I never leave my home
[01:50.81]If you wanna live a dream, I ain't coming, bitch, I told you
[02:06.31]Whip it like a Nascar, I can see the time pass
[02:09.41]Feel like I'm in high school, fuckin' me in gym class
[02:12.52]Shawty, I remember that
[02:14.16]I know you remember that
[02:15.76]You was fuckin' with me way before I even wrote raps
[02:19.04]Now I'm seein' cash flow
[02:20.52]I could be a asshole
[02:22.10]Yeah, I know
[02:22.90]But it's all good cause I let her spend my money, though
[02:26.08]Playboy bunny, though, shawty look like a pornstar
[02:29.43]I know she love me 'cause she fuck me in her sports car
[02:32.57]I pull up on her, tell her that we finna go far
[02:35.94]Drop top, smokin' thrax, lookin' at the stars
[02:39.13]Gettin' high, taking bars till we on Mars
[02:42.29]I could make the ground move like I'm Avatar
[02:45.47]Now I'm faded on my own in my bedroom
[02:48.64]Now I'm lookin' at my phone should I text you?
[02:51.47]I just wanna sex you, I just wanna bless you
[02:54.66]Baby, I'm a priest in the underworld, guess who
[02:57.89]Lil' Bo Peep with a brand new flow too
[03:01.01]Lookin' at my teeth like you never seen a gold tooth
[03:04.27]Never in the streets 'cause I never leave my home
[03:07.11]If you wanna live a dream, I ain't coming, bitch, I-`;


const LYRICS_LRC_MS = `[[[8023] Знаешь [8507] мы [8833] щас [9024] типа [9293] в [9457] лондоне {#b76151} [9951] целуй [10347] меня [10797] на [11259] футболке [11706] я [11911] курю [12310] сиги [12690] под [12908] теплым [13488] дождем | [17438] знаешь [17953] мы [18136] щас [18417] типа [18717] в [18815] лондоне [19377] целуй [19943] меня [20239] на [20349] футболке [21190] я [21396] курю [21614] сиги [22210] под [22419] теплым [22696] дождем | [23535] грязные [24024] кроссы [24410] хожу [24793] в [24966] них [25146] так [25305] долго [25870] да [26086] они [26335] знают [26704] что [26981] мне [27130] все [27440] равно | [28114] на [28233] мне [28443] нет [28742] парфюма [29106] я [29477] пахну [29681] собой [30404] говорю [30886] по [31256] техе [31560] я [31757] щас [32061] занятой | [32699] снова [33169] потяряться [34080] махаю [34538] рукой [35208] давно [35474] хотел [35774] сказать [36246] хотя [36587] ладно [37058] https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0R626zSan4Gqjsn1fA0NThk03p21xh_dfwA&s | [37536] Smirnoff [38222] Ice [38500] в [38670] руке [39417] волны [39911] ласкают [40887] мне [41110] уши [41662] еду [41950] в [42116] такси [42535] домой [43481] мертвая [44270] лиса [44938] на [45216] обочине [46236] https://media.tenor.com/dwsRFTPe6BsAAAAe/%D0%B3%D1%80%D1%83%D1%81%D1%82%D0%BD%D1%8B%D0%B9-%D1%81%D0%BC%D0%B0%D0%B9%D0%BB%D0%B8%D0%BA-%D0%B3%D1%80%D1%83%D1%81%D1%82%D0%BD%D0%BE.png | [47020] В ритме [47946] большого [48731] города [49694] в [49754] сумке [50295] Red Bull 0.5 [52094] Легкие [52794] заполнены [54088] дымом [54137] — [54671] тяжело [55480] https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnmcsEqjnYnQvxgHR3ibLcvmj-QNLD5j3vhw&s | [55619] Знаешь [55923] мы [55946] ща [56054] типа [56371] в [56514] Лондоне [57014] целуй [57467] меня [57857] на [58018] футболке [58858] я [58992] курю [59284] сиги [59698] под [59913] теплым [60371] дождем | [61198] грязные [61696] кроссы [62157] хожу [62512] в [62577] них [62734] так [62988] долго [63581] да [63821] они [64085] знают [64437] что [64650] мне [64848] все [65102] равно | [65803] на [65866] мне [66108] нет [66241] парфюма [66791] я [66982] пахну [67401] собой [68094] говорю [68556] по [68754] техе [69127] я [69361] ща [69595] занятой | [70472] снова [70935] потяряться [71536] махаю [72148] рукой [72864] давно [73144] хотел [73422] сказать [74014] хотя [74186] ладно [74792] https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0R626zSan4Gqjsn1fA0NThk03p21xh_dfwA&s]
]`

// const LYRICS_LRC_MS = `[[21721] Эй [23314] че [23589] такое [23952] че [24145] такое [25006] (Чё такое? Эй, а, ай, а-а) [28157] Fuck [28339] y'all [28452] till [28681] I [28765] die [29162] ONDA [29462] ANDAR [29849] ха [31526] ONDA [31859] ANDAR [32364] ха | [32864] а-а-а | [38356] а-а-а | [44615] ты [44766] не [44993] про [45176] всех [45912] как [46120] и [46316] я [46632] тоже [47929] услышь [48260] как [48367] шумит [48874] моя [49399] кожа]`
const parseLrc = (lrc: string): { time: number; text: string }[] =>
    lrc.trim().split('\n')
        .map(line => {
            const m = line.match(/^\[(\d+):(\d+\.\d+)\](.*)/);
            if (!m) return null;
            const text = m[3].trim();
            if (!text) return null;
            return { time: parseInt(m[1]) * 60 + parseFloat(m[2]), text };
        })
        .filter((x): x is { time: number; text: string } => x !== null);

const LYRICS = parseLrc(LYRICS_LRC);

const parseLrcMs = (lrc: string): { time: number; text: string; phrase: number }[] => {
    const result: { time: number; text: string; phrase: number }[] = [];
    lrc.split('|').forEach((phraseStr, phraseIdx) => {
        const re = /\[(\d+)\]\s*([^\[\]\n]+)/g;
        let m;
        while ((m = re.exec(phraseStr)) !== null) {
            const text = m[2].trim();
            if (text) result.push({ time: parseInt(m[1]), text, phrase: phraseIdx });
        }
    });
    return result;
};
const LYRICS_MS = parseLrcMs(LYRICS_LRC_MS);

const LINE_H = 48;

const FEED_LIMIT = 10;

let _vinylTracksLoadedId: number | null = null;

type FeedMode = 'all' | 'discover' | 'my' | 'uploaded' | 'saved' | 'feed';

const FEED_LABELS: Record<FeedMode, string> = {
    all: 'Все',
    discover: 'Открытия',
    my: 'Мои',
    uploaded: 'Загруженные',
    saved: 'Сохранённые',
    feed: 'Лента'
};

const FEED_MODES: FeedMode[] = ['feed', 'discover', 'all', 'my', 'uploaded', 'saved'];

const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const NAV_ICONS = {
    home: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 9.41605C3 9.04665 3.18802 8.7001 3.50457 8.48603L11.3046 3.21117C11.7209 2.92961 12.2791 2.92961 12.6954 3.21117L20.4954 8.48603C20.812 8.70011 21 9.04665 21 9.41605V19.2882C21 20.2336 20.1941 21 19.2 21H4.8C3.80589 21 3 20.2336 3 19.2882V9.41605Z" stroke="white" strokeWidth="2"/>
        </svg>
    ),
    vinyl: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M21.6 12C21.6 17.302 17.302 21.6 12 21.6C6.698 21.6 2.4 17.302 2.4 12C2.4 6.698 6.698 2.4 12 2.4C17.302 2.4 21.6 6.698 21.6 12Z" stroke="white" strokeWidth="2"/>
            <path d="M14.4 12C14.4 13.325 13.325 14.4 12 14.4C10.675 14.4 9.6 13.325 9.6 12C9.6 10.675 10.675 9.6 12 9.6C13.325 9.6 14.4 10.675 14.4 12Z" stroke="white" strokeWidth="2"/>
        </svg>
    ),
    profile: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2"/>
            <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    ),
};

const DotsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.0001 7.1999C10.6746 7.1999 9.6001 6.12539 9.6001 4.7999C9.6001 3.47442 10.6746 2.3999 12.0001 2.3999C13.3256 2.3999 14.4001 3.47442 14.4001 4.7999C14.4001 6.12539 13.3256 7.1999 12.0001 7.1999Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12.0001 14.3999C10.6746 14.3999 9.6001 13.3254 9.6001 11.9999C9.6001 10.6744 10.6746 9.5999 12.0001 9.5999C13.3256 9.5999 14.4001 10.6744 14.4001 11.9999C14.4001 13.3254 13.3256 14.3999 12.0001 14.3999Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12.0001 21.5999C10.6746 21.5999 9.6001 20.5254 9.6001 19.1999C9.6001 17.8744 10.6746 16.7999 12.0001 16.7999C13.3256 16.7999 14.4001 17.8744 14.4001 19.1999C14.4001 20.5254 13.3256 21.5999 12.0001 21.5999Z" stroke="currentColor" strokeWidth="2"/>
    </svg>
)

const NavBtn = ({ path, children }: { path: string; children: React.ReactNode }) => {
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
                padding: '4px 14px',
                opacity: active ? 1 : 0.38,
                transition: 'opacity 0.2s',
            }}
        >
            {children}
        </button>
    );
};

export interface FeedAuthor {
    id: number;
    name?: string;
    email?: string;
    avatar_url?: string;
}

export interface ApiPost {
    id: number;
    text?: string | null;
    image_url?: string | null;
    video_url?: string | null;
    track_id?: number | null;
    vinyl_id?: number | null;
    user_id?: number | null;
    author_id?: number | null;
    time_code?: number | null;
    likes_count?: number | null;
    is_liked?: boolean | null;
    is_reposted?: boolean | null;
    reposted_by_user_id?: number | null;
}

export interface FeedItem {
    id?: number;
    type: string;
    track_id: number;
    autor_id: number;
    vinyl_id?: number | null;
    image: string | string[] | null;
    video: string | null;
    text: string;
    timeCode?: number | null;
    likesCount: number;
    isLiked: boolean;
    isReposted: boolean;
    repostedByUserId?: number | null;
}

export const mapApiPost = (p: ApiPost): FeedItem => ({
    id: p.id,
    type: p.image_url ? 'image' : p.video_url ? 'video' : 'text',
    track_id: p.track_id ?? 0,
    autor_id: p.user_id ?? p.author_id ?? 0,
    vinyl_id: p.vinyl_id ?? null,
    image: p.image_url ? (p.image_url.startsWith('http') ? p.image_url : `${BASE_URL}${p.image_url}`) : null,
    video: p.video_url ? (p.video_url.startsWith('http') ? p.video_url : `${BASE_URL}${p.video_url}`) : null,
    text: p.text ?? '',
    timeCode: p.time_code ?? null,
    likesCount: p.likes_count ?? 0,
    isLiked: p.is_liked ?? false,
    isReposted: p.is_reposted ?? false,
    repostedByUserId: p.reposted_by_user_id ?? null,
});

export const FeedCard = ({ item, author }: { item: FeedItem; author: FeedAuthor | null }) => {
    const navigate = useNavigate();

    const isMultiImage = Array.isArray(item.image);
    const isSingleImage = typeof item.image === 'string' && !!item.image;
    const isVideoFile = !!item.video && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(item.video);
    const isGif = !!item.video && !isVideoFile;
    const DEFAULT_AVATAR = '/images/ava.jpg'

    const hasMedia = isMultiImage || isSingleImage || isVideoFile || isGif;

    return (
        <div style={{
            width: 'min(400px, 88vw)',
            minHeight: item.type === 'text' ? 200 : undefined,
            height: hasMedia ? 'calc(100vh - 18rem)' : undefined,
            maxHeight: 'calc(100vh - 18rem)',
            borderRadius: 20,
            overflow: 'hidden',
            background: 'rgba(12,12,12,0.88)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}>
            {/* Author header */}
            <div onClick={() => navigate(`/pages/users/${author?.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', flexShrink: 0 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    overflow: 'hidden', background: '#1f1f1f', flexShrink: 0,
                }}>
                    {author?.avatar_url ? (
                        <img
                            src={author.avatar_url.startsWith('http') ? author.avatar_url : `${BASE_URL}${author.avatar_url}`}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) :
                    <img
                        src={DEFAULT_AVATAR}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />}
                </div>
                <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600 }}>
                    {author?.name ?? author?.email ?? '—'}
                </span>
            </div>

            {/* Multiple images */}
            {isMultiImage && (
                <div style={{
                    flex: '1 1 auto',
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'grid',
                    gridTemplateColumns: `repeat(${Math.min((item.image as string[]).length, 3)}, 1fr)`,
                    gap: 2,
                }}>
                    {(item.image as string[]).map((img, i) => (
                        <img key={i} src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ))}
                </div>
            )}

            {/* Single image */}
            {isSingleImage && (
                <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                    <img src={item.image as string} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
            )}

            {/* Video */}
            {isVideoFile && (
                <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                    <video src={item.video!} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
            )}

            {/* GIF / animated image */}
            {isGif && (
                <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
                    <img src={item.video!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
            )}

            {/* Text */}
            {item.text && (
                <div style={{
                    padding: item.type === 'text' ? '24px 20px' : '12px 16px',
                    color: 'rgba(255,255,255,0.87)',
                    fontSize: item.type === 'text' ? '1.05rem' : '0.875rem',
                    lineHeight: 1.65,
                    textAlign: item.type === 'text' ? 'center' : undefined,
                    flexShrink: 0,
                }}>
                    {item.text}
                </div>
            )}

        </div>
    );
};

export const PlayerScene = () => {
    const { token } = useAuth();
    const {
        tracks: audioTracks,
        trackIndex,
        currentTrack,
        isPlaying,
        currentTime,
        durationSec,
        volume,
        toggle,
        seek,
        seekAfterLoad,
        setVolume,
        next,
        prev,
        loadAndPlayExternal,
        loadQueueAndPlay,
        appendToQueue,
        selectedVinylId,
        setRate,
    } = useAudioPlayer();
    const { savedIds, toggleSaved } = useSaved();
    const [searchParams] = useSearchParams();

    const [feedMode, setFeedMode] = useState<FeedMode | null>(null);
    const [feedLoading, setFeedLoading] = useState(false);
    const feedSkipRef = useRef(0);
    const feedHasMoreRef = useRef(true);
    const feedLoadingRef = useRef(false);
    const sharedTrackHandledRef = useRef(false);
    const sharedPostHandledRef = useRef(false);

    const [feedItemIndex, setFeedItemIndex] = useState(0);
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const feedItemsRef = useRef<FeedItem[]>([]);
    feedItemsRef.current = feedItems;
    const feedPostsSkipRef = useRef(0);
    const feedPostsHasMoreRef = useRef(true);
    const [feedAuthor, setFeedAuthor] = useState<FeedAuthor | null>(null);

    const [postLiked, setPostLiked] = useState(false);
    const [postLikesCount, setPostLikesCount] = useState(0);
    const [postReposted, setPostReposted] = useState(false);
    const [postLikeLoading, setPostLikeLoading] = useState(false);
    const [postRepostLoading, setPostRepostLoading] = useState(false);

    const [dotsMenuOpen, setDotsMenuOpen] = useState(false);
    const [dotsMenuPos, setDotsMenuPos] = useState({ x: 0, y: 0 });
    const dotsRef = useRef<HTMLButtonElement>(null);
    const dotsMenuRef = useRef<HTMLDivElement>(null);

    const [vinylTab, setVinylTab] = useState<{ id: number; name: string; videoCover: string | null } | null>(null);
    const [vinylTabActive, setVinylTabActive] = useState(false);

    const [showLyrics, setShowLyrics] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const volumeRef = useRef<HTMLDivElement>(null);

    // Close dots menu on outside click
    useEffect(() => {
        if (!dotsMenuOpen) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            const insideTrigger = dotsRef.current?.contains(target);
            const insideMenu = dotsMenuRef.current?.contains(target);
            if (!insideTrigger && !insideMenu) setDotsMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [dotsMenuOpen]);

    // Close volume popup on outside click
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

    // Animation
    const [cardVisible, setCardVisible] = useState(true);
    const isAnimatingRef = useRef(false);

    const animate = useCallback((fn: () => void) => {
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;
        setCardVisible(false);
        setTimeout(() => {
            fn();
            setCardVisible(true);
            setTimeout(() => { isAnimatingRef.current = false; }, 300);
        }, 210);
    }, []);

    // Refs for feed state — used inside callbacks to avoid stale closures
    const feedModeRef = useRef<FeedMode | null>(feedMode);
    feedModeRef.current = feedMode;
    const feedItemIndexRef = useRef(feedItemIndex);
    feedItemIndexRef.current = feedItemIndex;

    const goNext = useCallback(() => {
        if (feedModeRef.current === 'feed') {
            animate(() => setFeedItemIndex(i => Math.min(i + 1, Math.max(feedItemsRef.current.length - 1, 0))));
        } else {
            animate(next);
        }
    }, [animate, next]);

    const goPrev = useCallback(() => {
        if (feedModeRef.current === 'feed') {
            if (feedItemIndexRef.current === 0) return;
            animate(() => setFeedItemIndex(i => Math.max(i - 1, 0)));
        } else {
            if (trackIndex === 0) return;
            animate(prev);
        }
    }, [animate, prev, trackIndex]);

    const loadPostsFeed = useCallback(async (skip: number, prependItem?: FeedItem) => {
        if (feedLoadingRef.current) return;
        feedLoadingRef.current = true;
        if (skip === 0) setFeedLoading(true);
        try {
            const r = await fetch(
                `${BASE_URL}/posts/feed?skip=${skip}&limit=${FEED_LIMIT}`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data: ApiPost[] = await r.json();
            if (!Array.isArray(data)) return;
            const newItems = data.map(mapApiPost);
            if (skip === 0) {
                if (prependItem) {
                    setFeedItems([prependItem, ...newItems.filter(i => i.id !== prependItem.id)]);
                } else {
                    setFeedItems(newItems);
                }
            } else {
                setFeedItems(prev => [...prev, ...newItems]);
            }
            feedPostsSkipRef.current = skip + data.length;
            if (data.length < FEED_LIMIT) feedPostsHasMoreRef.current = false;
        } catch {} finally {
            feedLoadingRef.current = false;
            setFeedLoading(false);
        }
    }, [token]);

    const loadPostsFeedRef = useRef(loadPostsFeed);
    loadPostsFeedRef.current = loadPostsFeed;

    // Load feed
    const loadMoreFeed = useCallback(async (mode: FeedMode, skip: number) => {
        if (mode === 'feed') return;
        if (feedLoadingRef.current) return;
        feedLoadingRef.current = true;
        if (skip === 0) setFeedLoading(true);
        try {
            const r = await fetch(
                `${BASE_URL}/tracks?mode=${mode}&skip=${skip}&limit=${FEED_LIMIT}&shuffle=true`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            const data: any[] = await r.json();
            if (!Array.isArray(data)) return;
            const newTracks = data.map((t: any) => ({
                id: String(t.id),
                name: t.title,
                artist: t.artist,
                cover: t.avatar_url ?? undefined,
                src: `${BASE_URL}${t.stream_url}`,
            }));
            if (skip === 0) loadQueueAndPlay(newTracks);
            else appendToQueue(newTracks);
            feedSkipRef.current = skip + data.length;
            if (data.length < FEED_LIMIT) feedHasMoreRef.current = false;
        } catch {} finally {
            feedLoadingRef.current = false;
            setFeedLoading(false);
        }
    }, [token, loadQueueAndPlay, appendToQueue]);

    const loadMoreFeedRef = useRef(loadMoreFeed);
    loadMoreFeedRef.current = loadMoreFeed;

    useEffect(() => {
        if (!feedMode || feedMode === 'feed' || !feedHasMoreRef.current) return;
        if (audioTracks.length > 0 && trackIndex >= audioTracks.length - 5) {
            loadMoreFeedRef.current(feedMode, feedSkipRef.current);
        }
    }, [trackIndex, audioTracks.length, feedMode]);

    useEffect(() => {
        if (feedMode !== 'feed' || !feedPostsHasMoreRef.current) return;
        if (feedItems.length > 0 && feedItemIndex >= feedItems.length - 3) {
            loadPostsFeedRef.current(feedPostsSkipRef.current);
        }
    }, [feedItemIndex, feedItems.length, feedMode]);

    // Load track for current feed item (only when track_id changes)
    const currentFeedTrackId = feedMode === 'feed' ? (feedItems[feedItemIndex]?.track_id || null) : null;

    useEffect(() => {
        if (!currentFeedTrackId || !token) return;
        fetch(`${BASE_URL}/tracks/${currentFeedTrackId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then((t: any) => {
                if (!t?.id) return;
                loadAndPlayExternal({
                    id: String(t.id),
                    name: t.title,
                    artist: t.artist,
                    cover: t.avatar_url ?? undefined,
                    src: `${BASE_URL}${t.stream_url}`,
                });
                seekAfterLoad(feedItems[feedItemIndex]?.timeCode ?? 0);
            })
            .catch(() => {});
    }, [currentFeedTrackId, token]);

    // Load author for current feed item
    const currentAutorId = feedMode === 'feed' ? (feedItems[feedItemIndex]?.autor_id || null) : null;

    useEffect(() => {
        if (!currentAutorId || !token) { setFeedAuthor(null); return; }
        fetch(`${BASE_URL}/users/${currentAutorId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(data => setFeedAuthor(data))
            .catch(() => setFeedAuthor(null));
    }, [currentAutorId, token]);

    const currentPostId = feedMode === 'feed' ? feedItems[feedItemIndex]?.id : undefined;

    useEffect(() => {
        const item = feedItems[feedItemIndex];
        if (!item) { setPostLiked(false); setPostLikesCount(0); setPostReposted(false); return; }
        setPostLiked(item.isLiked);
        setPostLikesCount(item.likesCount);
        setPostReposted(item.isReposted);
    }, [currentPostId]);

    const handlePostLike = useCallback(async () => {
        const item = feedItemsRef.current[feedItemIndexRef.current];
        if (!item?.id || !token || postLikeLoading) return;
        setPostLikeLoading(true);
        try {
            if (postLiked) {
                await fetch(`${BASE_URL}/posts/${item.id}/like`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                setPostLiked(false);
                setPostLikesCount(c => Math.max(0, c - 1));
            } else {
                await fetch(`${BASE_URL}/posts/${item.id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                setPostLiked(true);
                setPostLikesCount(c => c + 1);
            }
        } finally {
            setPostLikeLoading(false);
        }
    }, [token, postLiked, postLikeLoading]);

    const handlePostRepost = useCallback(async () => {
        const item = feedItemsRef.current[feedItemIndexRef.current];
        if (!item?.id || !token || postRepostLoading) return;
        setPostRepostLoading(true);
        try {
            if (postReposted) {
                await fetch(`${BASE_URL}/posts/${item.id}/repost`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                setPostReposted(false);
            } else {
                await fetch(`${BASE_URL}/posts/${item.id}/repost`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                setPostReposted(true);
            }
        } finally {
            setPostRepostLoading(false);
        }
    }, [token, postReposted, postRepostLoading]);

    const handlePostShare = useCallback(() => {
        const item = feedItemsRef.current[feedItemIndexRef.current];
        if (!item?.id) return;
        navigator.clipboard.writeText(`${window.location.origin}/?postId=${item.id}`);
    }, []);

    const handlePostReport = useCallback(async () => {
        const item = feedItemsRef.current[feedItemIndexRef.current];
        if (!item?.id || !token) return;
        await fetch(`${BASE_URL}/posts/${item.id}/report`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
    }, [token]);

    const loadVinylTracks = useCallback(async (vinylId: number) => {
        if (feedLoadingRef.current) return;
        feedLoadingRef.current = true;
        setFeedLoading(true);
        try {
            const listRes = await fetch(`${BASE_URL}/vinyl/${vinylId}/tracks`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const list: Array<{ id: number }> = await listRes.json();
            if (!Array.isArray(list) || list.length === 0) return;
            const detailed = await Promise.all(
                list.map(t =>
                    fetch(`${BASE_URL}/tracks/${t.id}`, { headers: { Authorization: `Bearer ${token}` } })
                        .then(r => r.json()),
                ),
            );
            const tracks = detailed
                .filter(t => t?.stream_url)
                .map(t => ({
                    id: String(t.id),
                    name: t.title,
                    artist: t.artist,
                    cover: t.avatar_url ?? undefined,
                    src: `${BASE_URL}${t.stream_url}`,
                }));
            if (tracks.length > 0) loadQueueAndPlay(tracks);
        } catch {} finally {
            feedLoadingRef.current = false;
            setFeedLoading(false);
        }
    }, [token, loadQueueAndPlay]);

    useEffect(() => {
        if (!selectedVinylId || !token) return;
        const isNew = _vinylTracksLoadedId !== selectedVinylId;
        fetch(`${BASE_URL}/vinyl/${selectedVinylId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then((v: any) => {
                const toUrl = (p: string | null) => p ? `${BASE_URL}${p}` : null;
                setVinylTab({ id: selectedVinylId, name: v.name, videoCover: toUrl(v.video_cover) });
                if (isNew && !searchParams.get('trackId')) {
                    _vinylTracksLoadedId = selectedVinylId;
                    setVinylTabActive(true);
                    setFeedMode(null);
                    loadVinylTracks(selectedVinylId);
                }
            })
            .catch(() => {});
    }, [selectedVinylId, token, loadVinylTracks, searchParams]);

    const handleFeedSelect = (mode: FeedMode) => {
        setVinylTabActive(false);
        setFeedMode(mode);
        feedSkipRef.current = 0;
        feedHasMoreRef.current = true;
        if (mode === 'feed') {
            setFeedItems([]);
            setFeedItemIndex(0);
            feedPostsSkipRef.current = 0;
            feedPostsHasMoreRef.current = true;
            loadPostsFeed(0);
            return;
        }
        loadMoreFeed(mode, 0);
    };

    const handleVinylTabSelect = () => {
        if (!vinylTab) return;
        setFeedMode(null);
        setVinylTabActive(true);
        loadVinylTracks(vinylTab.id);
    };

    // Shared post via URL (?postId=...)
    useEffect(() => {
        const postId = searchParams.get('postId');
        if (!postId || !token || sharedPostHandledRef.current) return;
        sharedPostHandledRef.current = true;
        fetch(`${BASE_URL}/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then((data: ApiPost | null) => {
                if (!data) return;
                const mapped = mapApiPost(data);
                setFeedMode('feed');
                setFeedItemIndex(0);
                feedPostsSkipRef.current = 0;
                feedPostsHasMoreRef.current = true;
                loadPostsFeedRef.current(0, mapped);
            })
            .catch(() => {});
    }, [token, searchParams]);

    // Shared track via URL
    useEffect(() => {
        const trackId = searchParams.get('trackId');
        if (!trackId || !token || sharedTrackHandledRef.current) return;
        sharedTrackHandledRef.current = true;
        fetch(`${BASE_URL}/tracks/${trackId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then((t: any) => {
                if (!t?.id) return;
                loadAndPlayExternal({
                    id: String(t.id),
                    name: t.title,
                    artist: t.artist,
                    cover: t.avatar_url ?? undefined,
                    src: `${BASE_URL}${t.stream_url}`,
                });
            })
            .catch(() => {});
    }, [token, searchParams]);

    // Wheel (debounced)
    const lastWheelRef = useRef(0);
    const handleWheel = useCallback((e: React.WheelEvent) => {
        const now = Date.now();
        if (now - lastWheelRef.current < 700) return;
        lastWheelRef.current = now;
        if (e.deltaY > 40) goNext();
        else if (e.deltaY < -40) goPrev();
    }, [goNext, goPrev]);

    // Touch
    const touchStartYRef = useRef(0);
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartYRef.current = e.touches[0].clientY;
    }, []);
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const delta = touchStartYRef.current - e.changedTouches[0].clientY;
        if (delta > 60) goNext();
        else if (delta < -60) goPrev();
    }, [goNext, goPrev]);

    const [muteValue, setMuteValue] = useState(1);
    const muteValueRef = useRef(muteValue);
    muteValueRef.current = muteValue;
    const volumeValRef = useRef(volume);
    volumeValRef.current = volume;

    // Keyboard
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 'w') goNext();
            else if (e.key === 'ArrowUp' || e.key === 's') goPrev();
            else if (e.key === 'ArrowLeft' || e.key === 'a') setVolume(Math.round((volumeValRef.current - 0.1) * 10) / 10);
            else if (e.key === 'ArrowRight' || e.key === 'd') setVolume(Math.round((volumeValRef.current + 0.1) * 10) / 10);
            else if (e.key === 'm' && muteValueRef.current !== 0) { setMuteValue(volumeValRef.current); setVolume(0); }
            else if (e.key === 'm' && muteValueRef.current === 0) { setVolume(muteValueRef.current); }
            else if (e.key === ' ') { e.preventDefault(); toggle(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goNext, goPrev, toggle]);

    const cover = currentTrack?.cover;
    const currentSec = (currentTime / 100) * durationSec;
    const currentMs = Math.round(currentSec * 1000);
    const isLiked = currentTrack ? savedIds.has(currentTrack.id) : false;

    const activeLyricIndex = useMemo(() => {
        if (!showLyrics || LYRICS.length === 0) return -1;
        let idx = -1;
        for (let i = 0; i < LYRICS.length; i++) {
            if (LYRICS[i].time <= currentSec) idx = i;
            else break;
        }
        return idx;
    }, [showLyrics, currentSec]);

    const activeWordIndex = useMemo(() => {
        if (!showLyrics || LYRICS_MS.length === 0) return -1;
        let idx = -1;
        for (let i = 0; i < LYRICS_MS.length; i++) {
            if (LYRICS_MS[i].time <= currentMs) idx = i;
            else break;
        }
        return idx;
    }, [showLyrics, currentMs]);

    const currentPhrase = activeWordIndex >= 0 ? LYRICS_MS[activeWordIndex].phrase : -1;
    const visibleWords = LYRICS_MS.filter(t => t.phrase === currentPhrase && t.time <= currentMs);

    const isFeedMode = feedMode === 'feed';
    const lyricsActive = showLyrics && !isFeedMode;

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                background: '#000',
                position: 'relative',
                userSelect: 'none',
                touchAction: 'none',
            }}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Blurred BG */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                backgroundImage: cover ? `url(${cover})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#0a0a0a',
                filter: 'blur(48px) brightness(0.28) saturate(2)',
                transform: 'scale(1.15)',
                transition: 'background-image 0.7s ease, opacity 0.7s ease',
                opacity: vinylTabActive && vinylTab?.videoCover ? 0 : 1,
            }} />

            {/* Vinyl video_cover background */}
            {vinylTab?.videoCover && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    overflow: 'hidden',
                    opacity: vinylTabActive ? 1 : 0,
                    transition: 'opacity 0.7s ease',
                    transform: 'scale(1.15)',
                    filter: 'blur(48px) brightness(0.28) saturate(2)',
                }}>
                    {/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(vinylTab.videoCover) ? (
                        <video
                            key={vinylTab.videoCover}
                            src={vinylTab.videoCover}
                            autoPlay
                            loop
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <img
                            src={vinylTab.videoCover}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                </div>
            )}

            {/* Gradient overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.05) 48%, rgba(0,0,0,0.4) 100%)',
            }} />

            {/* Top bar: nav left + feed tabs center */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 0.75rem 0.6rem',
                gap: '0.5rem',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
            }}>
                {/* Feed tabs */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', flex: 1, justifyContent: 'flex-start' }}>
                    {FEED_MODES.map(mode => (
                        <button
                            key={mode}
                            onClick={() => handleFeedSelect(mode)}
                            style={{
                                background: feedMode === mode ? 'rgba(255,255,255,0.18)' : 'transparent',
                                border: `1px solid ${feedMode === mode ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'}`,
                                color: feedMode === mode ? '#fff' : 'rgba(255,255,255,0.42)',
                                padding: '0.28rem 0.75rem',
                                borderRadius: '2rem',
                                cursor: 'pointer',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s ease',
                                backdropFilter: 'blur(6px)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {feedMode === mode && feedLoading ? '...' : FEED_LABELS[mode]}
                        </button>
                    ))}
                    {vinylTab && (
                        <button
                            onClick={handleVinylTabSelect}
                            style={{
                                background: vinylTabActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                                border: `1px solid ${vinylTabActive ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.14)'}`,
                                color: vinylTabActive ? '#fff' : 'rgba(255,255,255,0.42)',
                                padding: '0.28rem 0.75rem',
                                borderRadius: '2rem',
                                cursor: 'pointer',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s ease',
                                backdropFilter: 'blur(6px)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {vinylTabActive && feedLoading ? '...' : vinylTab.name}
                        </button>
                    )}
                </div>

                {/* Nav icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', flexShrink: 0 }}>
                    <NavBtn path="/">{NAV_ICONS.home}</NavBtn>
                    <NavBtn path="/pages/vinyl">{NAV_ICONS.vinyl}</NavBtn>
                    <NavBtn path="/pages/profile">{NAV_ICONS.profile}</NavBtn>
                </div>
            </div>


            {/* Center: feed card or spinning vinyl + lyrics */}
            <div style={{
                position: 'absolute',
                top: '4.5rem',
                bottom: '7rem',
                left: 0,
                right: 0,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: 0,
                gap: 0,
                opacity: cardVisible ? 1 : 0,
                transform: cardVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.94)',
                transition: 'opacity 0.21s ease, transform 0.21s ease',
                pointerEvents: isFeedMode ? 'auto' : 'none',
            }}>
                {isFeedMode && feedItems[feedItemIndex] ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <FeedCard item={feedItems[feedItemIndex]} author={feedAuthor} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, alignSelf: 'flex-end', paddingBottom: 12}}>
                            <button
                                onClick={handlePostLike}
                                disabled={postLikeLoading}
                                style={{
                                    background: 'none', border: 'none',
                                    cursor: postLikeLoading ? 'default' : 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                    color: postLiked ? '#FD5E5E' : 'rgba(255,255,255,0.65)',
                                    padding: 0, transition: 'color 0.15s',
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill={postLiked ? 'currentColor' : 'none'}>
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {postLikesCount > 0 && (
                                    <span style={{ fontSize: '0.65rem', letterSpacing: '0.04em' }}>{postLikesCount}</span>
                                )}
                            </button>
                            <button
                                ref={dotsRef}
                                onClick={e => {
                                    e.stopPropagation();
                                    if (dotsRef.current) {
                                        const rect = dotsRef.current.getBoundingClientRect();
                                        setDotsMenuPos({ x: rect.right, y: rect.top });
                                    }
                                    setDotsMenuOpen(v => !v);
                                }}
                                style={{
                                    background: 'none', border: 'none',
                                    cursor: 'pointer', padding: 0,
                                    color: dotsMenuOpen ? '#fff' : 'rgba(255,255,255,0.65)',
                                    display: 'flex', alignItems: 'center',
                                    transition: 'color 0.15s',
                                }}
                            >
                                <DotsIcon />
                            </button>
                        </div>
                    </div>
                ) : !isFeedMode && currentTrack ? (
                    <>
                        {!lyricsActive && (
                            <div style={{
                                position: 'relative',
                                width: 'clamp(180px, min(62vw, calc(100vh - 20rem)), 380px)',
                                height: 'clamp(180px, min(62vw, calc(100vh - 20rem)), 380px)',
                                flexShrink: 0,
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: '50%',
                                    background: `
                                        radial-gradient(circle at center, transparent 29%, rgba(255,255,255,0.035) 29.5%,
                                        rgba(255,255,255,0.035) 31%, transparent 31.5%,
                                        transparent 37%, rgba(255,255,255,0.035) 37.5%,
                                        rgba(255,255,255,0.035) 39%, transparent 39.5%),
                                        #111
                                    `,
                                    boxShadow: '0 30px 90px rgba(0,0,0,0.75), 0 0 0 3px rgba(255,255,255,0.05)',
                                    animation: isPlaying
                                        ? 'spinRecord 9s linear infinite'
                                        : 'spinRecord 9s linear infinite paused',
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '65%',
                                        height: '65%',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        background: cover ? undefined : '#1a1a1a',
                                    }}>
                                        {cover && (
                                            <img
                                                src={cover}
                                                alt={currentTrack.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        )}
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '8%',
                                        height: '8%',
                                        borderRadius: '50%',
                                        background: '#000',
                                        zIndex: 1,
                                    }} />
                                </div>
                            </div>
                        )}

                        {lyricsActive && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 2rem',
                            }}>
                                {/* <div style={{ color: '#0f0', fontFamily: 'monospace', fontSize: '0.75rem', position: 'absolute', top: 8, left: 16 }}>
                                    {currentMs} ms
                                </div> */}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    justifyContent: 'flex-end',
                                    gap: '8px 14px',
                                    maxWidth: '80vw',
                                }}>
                                    {visibleWords.length === 0 ? (
                                        <span style={{
                                            color: 'rgba(255,255,255,0.35)',
                                            fontWeight: 500,
                                            fontSize: 'clamp(1.3rem, 4vw, 2.2rem)',
                                            lineHeight: 1.2,
                                        }}>
                                            {currentTrack?.name}
                                        </span>
                                    ) : visibleWords.map((token, idx) => {
                                        const isLast = idx === visibleWords.length - 1;
                                        const text = token.text ?? '';
                                        const hasColor = text.includes('{') && text.includes('}');
                                        const customColor = hasColor ? text.split("{")[1].split("}")[0] : null;
                                        if (text.includes('://')) {
                                            return <img style={{width: 'auto', height: isLast ? 'clamp(1.6rem, 5vw, 2.8rem)' : 'clamp(1.3rem, 4vw, 2.2rem)'}} src={text} />
                                        }
                                        const displayText = hasColor ? text.split("{")[0] + (text.split("}")[1] ?? '') : text;
                                        return (
                                            <span key={token.time} style={{
                                                color: customColor ? customColor : isLast ? '#fff' : 'rgba(255,255,255,0.45)',
                                                fontWeight: isLast ? 700 : 500,
                                                fontSize: isLast ? 'clamp(1.6rem, 5vw, 2.8rem)' : 'clamp(1.3rem, 4vw, 2.2rem)',
                                                textShadow: isLast ? customColor ? `0 0 32px ${customColor}` : '0 0 32px rgba(255,255,255,0.5)' : 'none',
                                                transition: 'color 0.1s, font-size 0.1s',
                                                lineHeight: 1.2,
                                            }}>
                                                {displayText}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                ) : !feedLoading && (
                    <p style={{
                        color: 'rgba(255,255,255,0.18)',
                        fontSize: '0.7rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        margin: 0,
                    }}>
                        Выберите режим выше
                    </p>
                )}
            </div>

            {/* Bottom left: track info */}
            <div style={{
                position: 'absolute',
                bottom: '6rem',
                left: '1.5rem',
                right: '5.75rem',
                zIndex: 3,
                opacity: cardVisible ? 1 : 0,
                transform: cardVisible ? 'translateY(0)' : 'translateY(18px)',
                transition: 'opacity 0.21s ease, transform 0.21s ease',
            }}>
                {currentTrack && (
                    <>
                        <div style={{gap: 12, display: 'flex', flexDirection: 'row'}}>
                            <p style={{
                                color: '#fff',
                                margin: 0,
                                fontSize: 'clamp(1.05rem, 5vw, 1.45rem)',
                                fontWeight: 800,
                                lineHeight: 1.2,
                                textShadow: '0 2px 14px rgba(0,0,0,0.7)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {currentTrack.name}
                            </p>
                            {!isFeedMode && (
                                <button
                                    onClick={() => setShowLyrics(v => !v)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: showLyrics ? 1 : 0.5,
                                        transition: 'opacity 0.2s',
                                    }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.2088 16.1999H12.124M12.124 16.1999H14.128M12.124 16.1999V7.7999M12.124 7.7999H8.9999C8.66853 7.7999 8.3999 8.06853 8.3999 8.3999V9.28225M12.124 7.7999H14.9999C15.3313 7.7999 15.5999 8.06853 15.5999 8.3999V9.52931M4.7999 21.5999H19.1999C20.5254 21.5999 21.5999 20.5254 21.5999 19.1999V4.7999C21.5999 3.47442 20.5254 2.3999 19.1999 2.3999H4.7999C3.47442 2.3999 2.3999 3.47442 2.3999 4.7999V19.1999C2.3999 20.5254 3.47442 21.5999 4.7999 21.5999Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                        <p style={{
                            color: 'rgba(255,255,255,0.58)',
                            margin: '0.3rem 0 0',
                            fontSize: 'clamp(0.78rem, 3.5vw, 0.95rem)',
                            fontWeight: 500,
                            textShadow: '0 1px 8px rgba(0,0,0,0.6)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {currentTrack.artist}
                        </p>
                        {durationSec > 0 && (
                            <p style={{
                                color: 'rgba(255,255,255,0.28)',
                                margin: '0.45rem 0 0',
                                fontSize: '0.62rem',
                                letterSpacing: '0.06em',
                            }}>
                                {formatTime(currentSec)} / {formatTime(durationSec)}
                            </p>
                        )}
                    </>
                )}
            </div>

            {/* Right sidebar: controls */}
            <div style={{
                position: 'absolute',
                right: '1.1rem',
                bottom: '6rem',
                zIndex: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.35rem',
            }}>
                {/* Volume */}
                <div ref={volumeRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Icon
                        name="volume"
                        size={22}
                        color={showVolume ? '#fff' : 'rgba(255,255,255,0.65)'}
                        hoverColor="#fff"
                        isClick
                        onClick={() => setShowVolume(v => !v)}
                    />
                    {showVolume && (
                        <div style={{
                            position: 'absolute',
                            bottom: '140%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(15,15,15,0.92)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: 10,
                            border: '1px solid rgba(255,255,255,0.08)',
                            padding: '10px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            zIndex: 20,
                        }}>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                                {Math.round(volume * 100)}
                            </span>
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

                {/* Prev */}
                <button
                    onClick={goPrev}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '50%',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: (isFeedMode ? feedItemIndex === 0 : trackIndex === 0) ? 'default' : 'pointer',
                        color: (isFeedMode ? feedItemIndex === 0 : trackIndex === 0) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                    }}
                >
                    ↑
                </button>

                {/* Play / Pause */}
                <div
                    onClick={toggle}
                    style={{
                        background: 'rgba(255,255,255,0.96)',
                        borderRadius: '50%',
                        width: 54,
                        height: 54,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
                        flexShrink: 0,
                    }}
                >
                    {isPlaying ? (
                        <Icon name="PauseIcon" size={26} color="#000" style={{ display: 'flex' }} />
                    ) : (
                        <Icon name="PlayTwoIcon" size={26} color="#000" style={{ display: 'flex', paddingLeft: 2 }} />
                    )}
                </div>

                {/* Next */}
                <button
                    onClick={goNext}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '50%',
                        width: 44,
                        height: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                    }}
                >
                    ↓
                </button>
                {/* Like */}
                <Icon
                    name="LikeTwoIcon"
                    size={22}
                    color={isLiked ? '#FD5E5E' : 'rgba(255,255,255,0.65)'}
                    hoverColor={isLiked ? '#FD5E5E' : '#fff'}
                    isClick
                    onClick={() => currentTrack && toggleSaved(currentTrack.id)}
                />
            </div>

            {/* Progress bar */}
            <div
                onClick={e => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    seek(((e.clientX - rect.left) / rect.width) * 100);
                }}
                style={{
                    position: 'absolute',
                    bottom: '1.75rem',
                    left: 0,
                    right: 0,
                    zIndex: 5,
                    height: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    padding: '0 1.5rem',
                    boxSizing: 'border-box',
                }}
            >
                <div style={{ position: 'relative', width: '100%', height: '3px', background: 'rgba(255,255,255,0.12)' }}>
                    <div style={{
                        position: 'absolute',
                        left: 0, top: 0, bottom: 0,
                        width: `${currentTime}%`,
                        background: 'rgba(255,255,255,0.82)',
                        transition: 'width 0.5s linear',
                    }} />
                </div>
            </div>


            {dotsMenuOpen && createPortal(
                <div
                    ref={dotsMenuRef}
                    style={{
                        position: 'fixed',
                        top: dotsMenuPos.y,
                        left: dotsMenuPos.x - 172,
                        zIndex: 1000,
                        background: 'rgba(20,20,20,0.97)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        padding: '6px 0',
                        minWidth: 172,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={() => { handlePostRepost(); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            width: '100%', background: 'none', border: 'none',
                            color: postReposted ? '#4ade80' : 'rgba(255,255,255,0.85)',
                            padding: '10px 16px', cursor: 'pointer', fontSize: '0.82rem',
                            textAlign: 'left',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M17 1L21 5L17 9M21 5H8C5.79086 5 4 6.79086 4 9V11M7 23L3 19L7 15M3 19H16C18.2091 19 20 17.2091 20 15V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {postReposted ? 'Убрать репост' : 'Репост'}
                    </button>
                    <button
                        onClick={() => { handlePostShare(); setDotsMenuOpen(false); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            width: '100%', background: 'none', border: 'none',
                            color: 'rgba(255,255,255,0.85)',
                            padding: '10px 16px', cursor: 'pointer', fontSize: '0.82rem',
                            textAlign: 'left',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M7.37851 10.1907L5.14505 12.4242C4.31092 13.2583 3.83124 14.3933 3.84001 15.5861C3.84877 16.7789 4.31796 17.9208 5.19167 18.7675C6.03836 19.6413 7.18048 20.1104 8.3731 20.1192C9.59293 20.1282 10.701 19.6755 11.5352 18.8414L13.7687 16.6079M16.6215 13.8097L18.8549 11.5762C19.6891 10.7421 20.1688 9.60711 20.16 8.4143C20.1512 7.22149 19.682 6.0796 18.8083 5.23287C17.9618 4.38638 16.8199 3.91717 15.6271 3.90841C14.4343 3.89964 13.2992 4.35209 12.465 5.18625L10.2315 7.4197M8.6131 15.3274L15.3135 8.62701" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Поделиться
                    </button>
                    <button
                        onClick={() => { handlePostReport(); setDotsMenuOpen(false); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            width: '100%', background: 'none', border: 'none',
                            color: 'rgba(255,100,100,0.85)',
                            padding: '10px 16px', cursor: 'pointer', fontSize: '0.82rem',
                            textAlign: 'left',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.31 1.55 18.66 1.55 19.01C1.55 19.36 1.64 19.71 1.82 20.02C2 20.33 2.26 20.58 2.57 20.76C2.88 20.94 3.23 21.04 3.59 21.04H20.42C20.78 21.04 21.13 20.94 21.44 20.76C21.75 20.58 22.01 20.33 22.19 20.02C22.37 19.71 22.46 19.36 22.46 19.01C22.46 18.66 22.37 18.31 22.19 18L13.71 3.86C13.53 3.55 13.27 3.3 12.96 3.12C12.65 2.94 12.3 2.85 11.95 2.85C11.6 2.85 11.25 2.94 10.94 3.12C10.63 3.3 10.47 3.55 10.29 3.86Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Пожаловаться
                    </button>
                </div>,
                document.body
            )}

            <style>{`
                @keyframes spinRecord {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
