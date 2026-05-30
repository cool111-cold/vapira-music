import { useEffect, useRef, useState } from "react";

const API = 'http://127.0.0.1:8000';
const WS_BASE = 'ws://127.0.0.1:8000';
const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
const DIFF_LABEL: Record<number, string> = { 1: 'Лёгкое', 2: 'Среднее', 3: 'Сложное' };
const DIFF_COLOR: Record<number, string> = { 1: '#059669', 2: '#d97706', 3: '#dc2626' };

const COMP_POOL = [
    'Объясняй левой рукой', 'Нельзя использовать жесты', 'Говори шёпотом',
    'Стоя на одной ноге', 'Нельзя называть цвета', 'Закрой глаза',
    'Нельзя однокоренных слов', 'Объясняй по-детски', 'Только вопросами',
    'Нельзя называть размеры', 'Объясняй задом наперёд', 'Только синонимы',
];
const INT_POOL = [
    'Мешайте случайными звуками', 'Один из вас перебивает', 'Нельзя смотреть на объясняющего',
    'Все хлопают в ладоши', 'Считайте вслух', 'Повторяйте слова объясняющего',
    'Шуршите чем-нибудь', 'Задавайте ложные подсказки', 'Напевайте мелодию', 'Нельзя говорить "да"',
];

interface Team { id: number; name: string; color: string; points?: number; }
interface Player { id: number; name: string; team_id: number | null; points?: number; is_main?: boolean; }
interface WordOption { id: number; word: string; difficult: number; }
interface LobbyData { teams: Team[]; players: Player[]; }
interface TurnData {
    currentPlayerId: number;
    wordOptions: WordOption[];
    word: string;
    difficult: number;
    timeLimit: number;
    complication: { id: number; name: string } | null;
    interference: { id: number; name: string } | null;
    opponentTeamIds: number[];
}
interface GameOverData {
    winning_team: { id: number; name: string; color: string };
    leaderboard: Array<{ id: number; name: string; points: number; team_id: number }>;
}

type Phase = 'lobby' | 'countdown' | 'word_pick' | 'pre_turn' | 'playing' | 'appeal' | 'game_over';
type GameMode = 'room' | 'remote';

const MODE_LABEL: Record<GameMode, string> = { room: 'Очно', remote: 'Дистанционно' };
const MODE_ICON: Record<GameMode, string> = { room: '', remote: '' };

const SlotMachine = ({ final, pool, accent, icon, label, onDone }: {
    final: string; pool: string[]; accent: string; icon: string; label: string; onDone?: () => void;
}) => {
    const STEPS = 22;
    const [step, setStep] = useState(0);
    const [done, setDone] = useState(false);
    const reel = useRef<string[]>([]);
    if (!reel.current.length) {
        reel.current = [
            ...Array.from({ length: STEPS }, () => pool[Math.floor(Math.random() * pool.length)]),
            final,
        ];
    }
    useEffect(() => {
        let s = 0;
        const run = () => {
            s++;
            setStep(s);
            if (s >= STEPS) { setDone(true); onDone?.(); return; }
            setTimeout(run, 50 + (s / STEPS) ** 2.8 * 620);
        };
        setTimeout(run, 60);
    }, []);
    const text = reel.current[Math.min(step, STEPS)];
    return (
        <div style={{
            borderRadius: 14, padding: '16px 20px', width: '100%', boxSizing: 'border-box' as const,
            background: done ? accent + '18' : '#0d1b2e',
            border: `2px solid ${done ? accent : '#1e293b'}`,
            transition: 'background 0.5s, border-color 0.4s',
        }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase' as const, letterSpacing: 1.2, marginBottom: 10 }}>
                {icon} {label}
            </div>
            <div style={{
                fontSize: 18, fontWeight: 700, textAlign: 'center' as const, minHeight: 28,
                color: done ? '#fff' : '#374151',
                filter: done ? 'none' : 'blur(3px)',
                transform: done ? 'scale(1.04)' : 'scale(1)',
                transition: done ? 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)' : 'color 0.05s',
            }}>
                {text}
            </div>
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    page: { minHeight: '100vh', backgroundColor: '#1a1a2e', color: '#eee', fontFamily: 'sans-serif', padding: '24px', boxSizing: 'border-box' },
    fullCenter: { minHeight: '100vh', backgroundColor: '#1a1a2e', color: '#eee', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, boxSizing: 'border-box' },
    h1: { margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#fff' },
    sub: { color: '#888', fontSize: 14, margin: '0 0 32px' },
    joinBox: { background: '#16213e', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400 },
    input: { width: '100%', padding: '10px 14px', background: '#0f3460', border: '1px solid #374151', borderRadius: 8, color: '#fff', fontSize: 15, boxSizing: 'border-box', marginBottom: 12 },
    btnPrimary: { width: '100%', padding: '12px', background: '#4f46e5', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 600 },
    btnSecondary: { padding: '8px 20px', background: '#374151', border: 'none', borderRadius: 8, color: '#ddd', cursor: 'pointer', fontSize: 14 },
    btnSmall: { padding: '5px 14px', background: '#4f46e5', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 },
    btnSuccess: { padding: '14px 40px', background: '#059669', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 },
    btnDanger: { padding: '14px 40px', background: '#dc2626', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 },
    btnBig: { padding: '18px 56px', background: '#059669', border: 'none', borderRadius: 14, color: '#fff', cursor: 'pointer', fontSize: 20, fontWeight: 800 },
    header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 },
    roomBadge: { padding: '4px 12px', background: '#0f3460', borderRadius: 20, fontSize: 13, color: '#93c5fd', fontWeight: 600 },
    idBadge: { padding: '4px 12px', background: '#1e3a5f', borderRadius: 20, fontSize: 13, color: '#a5b4fc' },
    wsBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 12, fontSize: 12 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 },
    teamCard: { background: '#16213e', borderRadius: 12, padding: '16px 20px', borderLeft: '4px solid' },
    teamName: { fontWeight: 700, fontSize: 16, marginBottom: 8 },
    playerList: { display: 'flex', flexDirection: 'column', gap: 6 },
    playerRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, fontSize: 14 },
    dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
    sectionTitle: { fontSize: 18, fontWeight: 600, color: '#ccc', margin: '0 0 12px' },
    unassigned: { background: '#16213e', borderRadius: 12, padding: '16px 20px', marginBottom: 32 },
    statusLine: { fontSize: 13, color: '#6b7280', marginBottom: 24 },
    noTeams: { color: '#555', fontSize: 14, padding: '12px 0' },
    bottomBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #1e293b' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal: { background: '#16213e', borderRadius: 16, padding: 32, minWidth: 340, maxWidth: 440, width: '100%' },
    modalTitle: { margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#fff' },
    label: { display: 'block', marginBottom: 14 },
    labelText: { display: 'block', marginBottom: 6, fontSize: 13, color: '#aaa', fontWeight: 600 },
    colorRow: { display: 'flex', gap: 10, flexWrap: 'wrap' as const },
    colorSwatch: { width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', border: '3px solid transparent' },
    modalActions: { display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' },
    countdownNum: { fontSize: 200, fontWeight: 900, color: '#fff', lineHeight: 1 },
    countdownSub: { fontSize: 18, color: '#6b7280', marginTop: 8, textAlign: 'center' as const },
    wordGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, width: '100%', maxWidth: 640 },
    wordCard: { background: '#16213e', borderRadius: 16, padding: '28px 20px', cursor: 'pointer', border: '2px solid transparent', textAlign: 'center' as const },
    wordText: { fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 14 },
    diffBadge: { display: 'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: '#fff' },
    gameWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 560, margin: '0 auto', paddingTop: 32 },
    timerCircle: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120, borderRadius: '50%', border: '6px solid', fontSize: 42, fontWeight: 900 },
    wordBox: { background: '#16213e', borderRadius: 16, padding: '24px 32px', textAlign: 'center' as const, width: '100%' },
    wordBig: { fontSize: 38, fontWeight: 900, color: '#fff', marginBottom: 10 },
    infoBox: { borderRadius: 12, padding: '14px 18px', width: '100%', borderLeft: '3px solid' },
    infoLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 5, color: '#9ca3af' },
    infoText: { fontSize: 16, fontWeight: 600, color: '#fff' },
    waitBox: { background: '#16213e', borderRadius: 16, padding: '32px 40px', textAlign: 'center' as const, maxWidth: 480 },
    appealBox: { background: '#16213e', borderRadius: 20, padding: '36px 40px', textAlign: 'center' as const, maxWidth: 480, width: '100%' },
    earnedPts: { fontSize: 56, fontWeight: 900, color: '#fbbf24', lineHeight: 1, marginBottom: 4 },
    scoreBar: { display: 'flex', gap: 10, flexWrap: 'wrap' as const, justifyContent: 'center' },
    scoreCard: { background: '#16213e', borderRadius: 10, padding: '8px 18px', textAlign: 'center' as const, minWidth: 90, borderLeft: '3px solid' },
    scoreName: { fontSize: 12, color: '#888', marginBottom: 2 },
    scoreVal: { fontSize: 22, fontWeight: 900 },
    winBox: { borderRadius: 20, padding: '32px 48px', textAlign: 'center' as const, marginBottom: 24 },
    lbWrap: { background: '#16213e', borderRadius: 14, padding: 20, width: '100%', maxWidth: 500 },
    lbRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, marginBottom: 6 },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const CopyIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 5 }}>
        <path d="M20 13.1251L20 6.00003C20 4.34317 18.6568 3.00002 17 3.00004L9.875 3.00012M14 21.0001L7.25 21.0001C6.00736 21.0001 5 19.9928 5 18.7501L5 9.00012C5 7.75748 6.00736 6.75012 7.25 6.75012L14 6.75012C15.2426 6.75011 16.25 7.75748 16.25 9.00012L16.25 18.7501C16.25 19.9928 15.2426 21.0001 14 21.0001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

const Header = ({ room, myId, isMain, wsOn, mode }: { room: string; myId: number; isMain: boolean; wsOn: boolean; mode: GameMode }) => {
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText(room);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div style={s.header}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Crocodile +</span>
            <span
                style={{ ...s.roomBadge, cursor: 'pointer', userSelect: 'none', transition: 'background 0.2s', background: copied ? '#064e3b' : '#0f3460', color: copied ? '#6ee7b7' : '#93c5fd' }}
                onClick={copyCode}
                title="Скопировать код"
            >
                {copied ? '✓ скопировано' : <>#{room}<CopyIcon /></>}
            </span>
            <span style={s.idBadge}>ID {myId}</span>
            {isMain && <span style={{ ...s.idBadge, background: '#3b1f6e', color: '#c4b5fd' }}>хост</span>}
            <span style={{ ...s.idBadge, background: mode === 'remote' ? '#0f3a2e' : '#1a2f4e', color: mode === 'remote' ? '#6ee7b7' : '#93c5fd' }}>
                {MODE_ICON[mode]} {MODE_LABEL[mode]}
            </span>
            <span style={{
                ...s.wsBadge,
                marginLeft: 'auto',
                background: wsOn ? '#064e3b' : '#450a0a',
                color: wsOn ? '#6ee7b7' : '#fca5a5',
            }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: wsOn ? '#10b981' : '#ef4444', display: 'inline-block' }} />
                {wsOn ? 'подключён' : 'отключён'}
            </span>
        </div>
    );
};

const ScoreBar = ({ teams, style }: { teams: Team[]; style?: React.CSSProperties }) => (
    <div style={{ ...s.scoreBar, ...style }}>
        {teams.map(t => (
            <div key={t.id} style={{ ...s.scoreCard, borderLeftColor: t.color }}>
                <div style={s.scoreName}>{t.name}</div>
                <div style={{ ...s.scoreVal, color: t.color }}>{t.points ?? 0}</div>
            </div>
        ))}
    </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const Crocodile = () => {
    // connection
    const [joined, setJoined] = useState(false);
    const [room, setRoom] = useState('');
    const [myId, setMyId] = useState(0);
    const [isMain, setIsMain] = useState(false);
    const [wsOn, setWsOn] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    // join inputs
    const [codeInput, setCodeInput] = useState('');
    const [nameInput, setNameInput] = useState(() => localStorage.getItem('croc_name') ?? '');
    const [selectedMode, setSelectedMode] = useState<GameMode>('room');  // выбирается при создании комнаты
    const [roomMode, setRoomMode] = useState<GameMode>('room');          // режим текущей комнаты

    // lobby
    const [lobby, setLobby] = useState<LobbyData>({ teams: [], players: [] });
    const [teamModal, setTeamModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamColor, setNewTeamColor] = useState(COLORS[0]);
    const [nameModal, setNameModal] = useState(false);
    const [nameForTeam, setNameForTeam] = useState<number | null>(null);
    const [nameValue, setNameValue] = useState('');

    // game phases
    const [phase, setPhase] = useState<Phase>('lobby');
    const [cdVal, setCdVal] = useState(3);
    const [turn, setTurn] = useState<TurnData | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [appealLeft, setAppealLeft] = useState(5);
    const [appealInfo, setAppealInfo] = useState<{ guessed: boolean; earned: number } | null>(null);
    const [gameOver, setGameOver] = useState<GameOverData | null>(null);
    const [animDone, setAnimDone] = useState(false);

    // mutable refs to avoid stale closures in timers/ws
    const roomRef = useRef('');
    const myIdRef = useRef(0);
    const turnRef = useRef<TurnData | null>(null);
    const turnStartTs = useRef(0);
    roomRef.current = room;
    myIdRef.current = myId;
    turnRef.current = turn;

    // ─── WS ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!joined || !room || !myId) return;
        const ws = new WebSocket(`${WS_BASE}/game/ws/${room}/${myId}`);
        wsRef.current = ws;
        ws.onopen = () => setWsOn(true);
        ws.onclose = () => setWsOn(false);
        ws.onerror = () => setWsOn(false);
        ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                switch (msg.type) {
                    case 'state':
                    case 'lobby_update': {
                        const players: Player[] = msg.players ?? (msg.teams ?? []).flatMap(
                            (t: any) => (t.players ?? []).map((p: any) => ({ ...p, team_id: t.id }))
                        );
                        setLobby({ teams: msg.teams ?? [], players });
                        if (msg.mode) setRoomMode(msg.mode as GameMode);
                        break;
                    }
                    case 'countdown':
                        setCdVal(msg.seconds ?? 3);
                        setPhase('countdown');
                        break;
                    case 'word_pick':
                        setTurn(prev => ({
                            ...(prev ?? {} as TurnData),
                            currentPlayerId: msg.current_player_id,
                            wordOptions: msg.word_options ?? [],
                            word: '', difficult: 1, timeLimit: 60,
                            complication: null, interference: null, opponentTeamIds: [],
                        }));
                        setPhase('word_pick');
                        break;
                    case 'turn_start':
                        setTurn(prev => ({
                            ...(prev ?? {} as TurnData),
                            word: msg.word ?? '',
                            difficult: msg.difficult ?? 1,
                            timeLimit: msg.time_limit ?? 60,
                            complication: msg.complication ?? null,
                            interference: msg.interference ?? null,
                            opponentTeamIds: msg.opponent_team_ids ?? [],
                        }));
                        setTimerActive(false);
                        setAnimDone(msg.complication == null);
                        setPhase('pre_turn');
                        break;
                    case 'turn_begun':
                        turnStartTs.current = Date.now();
                        setTimerActive(true);
                        setPhase('playing');
                        break;
                    case 'appeal_window':
                        setAppealLeft(msg.seconds ?? 5);
                        setAppealInfo({ guessed: !!msg.guessed, earned: msg.earned ?? 0 });
                        if (msg.teams) {
                            const players: Player[] = msg.players ?? (msg.teams ?? []).flatMap(
                                (t: any) => (t.players ?? []).map((p: any) => ({ ...p, team_id: t.id }))
                            );
                            setLobby({ teams: msg.teams, players });
                        }
                        setPhase('appeal');
                        break;
                    case 'appeal_accepted':
                        break;
                    case 'game_over':
                        setGameOver({ winning_team: msg.winning_team, leaderboard: msg.leaderboard ?? [] });
                        setPhase('game_over');
                        break;
                }
            } catch {}
        };
        return () => ws.close();
    }, [joined, room, myId]);

    // ─── Timers ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'countdown' || cdVal <= 0) return;
        const t = setTimeout(() => setCdVal(v => v - 1), 1000);
        return () => clearTimeout(t);
    }, [phase, cdVal]);

    useEffect(() => {
        if (phase !== 'playing' || !timerActive) return;
        const limit = turnRef.current?.timeLimit ?? 60;
        setTimeLeft(limit);
        const iv = setInterval(() => {
            setTimeLeft(v => {
                if (v <= 1) {
                    clearInterval(iv);
                    if (myIdRef.current === turnRef.current?.currentPlayerId) {
                        postFinishTurn(false, turnRef.current?.timeLimit ?? 60);
                    }
                    return 0;
                }
                return v - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [phase, timerActive]);

    useEffect(() => {
        if (phase !== 'appeal' || appealLeft <= 0) return;
        const t = setTimeout(() => setAppealLeft(v => v - 1), 1000);
        return () => clearTimeout(t);
    }, [phase, appealLeft]);

    // ─── API ─────────────────────────────────────────────────────────────────
    const apiPost = (path: string, body: object) =>
        fetch(`${API}/game/${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

    const join = async () => {
        const body: Record<string, string> = {};
        if (codeInput.trim()) {
            body.code = codeInput.trim().toUpperCase();
        } else {
            body.mode = selectedMode;
        }
        const res = await fetch(`${API}/game/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const d = await res.json();
        if (nameInput.trim()) localStorage.setItem('croc_name', nameInput.trim());
        setRoom(d.room_code ?? '');
        setMyId(d.user_id ?? 0);
        setIsMain(!!d.is_main);
        setRoomMode((d.mode as GameMode) ?? 'room');
        setNameValue(nameInput.trim());
        setJoined(true);
    };

    const createTeam = async () => {
        if (!newTeamName.trim()) return;
        await apiPost('create-team', { room_code: room, user_id: myId, name: newTeamName.trim(), color: newTeamColor });
        setTeamModal(false);
        setNewTeamName('');
        setNewTeamColor(COLORS[0]);
    };

    const saveName = async () => {
        if (!nameValue.trim() || nameForTeam == null) return;
        await apiPost('set-name', { room_code: room, user_id: myId, name: nameValue.trim(), team_id: nameForTeam });
        setNameModal(false);
        setNameValue('');
    };

    const startGame = () => apiPost('start', { room_code: room, user_id: myId });

    const chooseWord = (wordId: number) =>
        apiPost('choose-word', { room_code: room, user_id: myId, word_id: wordId });

    const startExplaining = () =>
        apiPost('begin-turn', { room_code: room, user_id: myId });

    const postFinishTurn = (guessed: boolean, elapsed?: number) => {
        const secs = elapsed ?? Math.floor((Date.now() - turnStartTs.current) / 1000);
        return apiPost('finish-turn', {
            room_code: roomRef.current,
            user_id: myIdRef.current,
            guessed,
            elapsed_seconds: secs,
            word_difficult: turnRef.current?.difficult ?? 1,
        });
    };

    const doAppeal = () => apiPost('appeal', { room_code: room, user_id: myId });

    const cleanup = async () => {
        await fetch(`${API}/game/room/${room}/cleanup`, { method: 'DELETE' });
        setJoined(false); setRoom(''); setMyId(0); setIsMain(false);
        setPhase('lobby'); setLobby({ teams: [], players: [] });
        setGameOver(null); setTurn(null); setWsOn(false);
    };

    // ─── Derived ─────────────────────────────────────────────────────────────
    const myPlayer = lobby.players.find(p => p.id === myId);
    const isCurrentPlayer = turn?.currentPlayerId === myId;
    const isOpponent = turn ? turn.opponentTeamIds.includes(myPlayer?.team_id ?? -1) : false;
    const timerColor = turn ? (timeLeft / turn.timeLimit > 0.5 ? '#10b981' : timeLeft / turn.timeLimit > 0.25 ? '#f59e0b' : '#ef4444') : '#10b981';
    const pName = (id: number) => lobby.players.find(p => p.id === id)?.name || `Игрок ${id}`;

    // ─── Join screen ─────────────────────────────────────────────────────────
    if (!joined) return (
        <div style={s.fullCenter}>
            <h1 style={s.h1}>Crocodile +</h1>
            <p style={s.sub}>Создай комнату или войди по коду</p>
            <div style={s.joinBox}>
                <label style={s.labelText}>Код комнаты (пусто = создать новую)</label>
                <input style={s.input} placeholder="ABC123" value={codeInput}
                    onChange={e => setCodeInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && join()} />
                <input style={{ ...s.input, marginBottom: 16 }} placeholder="Твоё имя" value={nameInput}
                    onChange={e => setNameInput(e.target.value)} />
                {!codeInput.trim() && (
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ ...s.labelText, marginBottom: 8 }}>Режим игры</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {(['room', 'remote'] as GameMode[]).map(m => (
                                <button key={m} onClick={() => setSelectedMode(m)} style={{
                                    flex: 1, padding: '10px 8px', border: '2px solid',
                                    borderColor: selectedMode === m ? '#4f46e5' : '#374151',
                                    borderRadius: 8, background: selectedMode === m ? '#2d2a6e' : '#0f3460',
                                    color: selectedMode === m ? '#a5b4fc' : '#9ca3af',
                                    cursor: 'pointer', fontSize: 14, fontWeight: 600,
                                    transition: 'all 0.15s',
                                }}>
                                    {MODE_ICON[m]} {MODE_LABEL[m]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <button style={s.btnPrimary} onClick={join}>
                    {codeInput.trim() ? 'Войти в комнату' : 'Создать комнату'}
                </button>
            </div>
        </div>
    );

    // ─── Countdown ───────────────────────────────────────────────────────────
    if (phase === 'countdown') return (
        <div style={s.fullCenter}>
            <div style={s.countdownNum}>{cdVal > 0 ? cdVal : '!'}</div>
            <div style={s.countdownSub}>{cdVal > 0 ? 'Приготовьтесь...' : 'Старт!'}</div>
        </div>
    );

    // ─── Word pick ───────────────────────────────────────────────────────────
    if (phase === 'word_pick') {
        if (isCurrentPlayer) return (
            <div style={s.fullCenter}>
                <p style={{ color: '#a5b4fc', fontWeight: 700, fontSize: 18, margin: 0 }}>Выбери слово</p>
                <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 8px' }}>Чем сложнее — тем больше очков</p>
                <div style={s.wordGrid}>
                    {(turn?.wordOptions ?? []).map(w => (
                        <div key={w.id}
                            style={{ ...s.wordCard, borderColor: DIFF_COLOR[w.difficult] + '55' }}
                            onClick={() => chooseWord(w.id)}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = DIFF_COLOR[w.difficult])}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = DIFF_COLOR[w.difficult] + '55')}
                        >
                            <div style={s.wordText}>{w.word}</div>
                            <span style={{ ...s.diffBadge, background: DIFF_COLOR[w.difficult] }}>
                                {DIFF_LABEL[w.difficult]}
                            </span>
                        </div>
                    ))}
                </div>
                <ScoreBar teams={lobby.teams} style={{ marginTop: 8 }} />
            </div>
        );
        return (
            <div style={s.fullCenter}>
                <div style={s.waitBox}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                        {pName(turn?.currentPlayerId ?? 0)} выбирает слово...
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 14 }}>Ждём</div>
                </div>
                <ScoreBar teams={lobby.teams} />
            </div>
        );
    }

    // ─── Pre-turn (word chosen, waiting for "начать") ─────────────────────────
    if (phase === 'pre_turn') {
        if (isCurrentPlayer) return (
            <div style={s.fullCenter}>
                <div style={s.wordBox}>
                    <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 8 }}>Твоё слово</div>
                    <div style={s.wordBig}>{turn?.word}</div>
                    <span style={{ ...s.diffBadge, background: DIFF_COLOR[turn?.difficult ?? 1] }}>
                        {DIFF_LABEL[turn?.difficult ?? 1]} · {turn?.timeLimit}с
                    </span>
                </div>
                {turn?.complication && (
                    <div style={{ width: '100%', maxWidth: 480 }}>
                        <SlotMachine
                            final={turn.complication.name}
                            pool={COMP_POOL}
                            accent="#f59e0b"
                            icon="⚡"
                            label="Усложнение"
                            onDone={() => setAnimDone(true)}
                        />
                    </div>
                )}
                <button
                    style={{ ...s.btnBig, opacity: animDone ? 1 : 0.35, cursor: animDone ? 'pointer' : 'default' }}
                    onClick={animDone ? startExplaining : undefined}
                >
                    {animDone ? 'Начать объяснять' : '...'}
                </button>
                <ScoreBar teams={lobby.teams} />
            </div>
        );

        return (
            <div style={s.fullCenter}>
                <div style={{ ...s.waitBox, width: '100%', maxWidth: 480 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
                        {pName(turn?.currentPlayerId ?? 0)} готовится...
                    </div>
                    {turn?.complication && (
                        <div style={{ marginTop: 16 }}>
                            <SlotMachine
                                final={turn.complication.name}
                                pool={COMP_POOL}
                                accent="#f59e0b"
                                icon="⚡"
                                label="Усложнение"
                            />
                        </div>
                    )}
                    {isOpponent && turn?.interference && (
                        <div style={{ marginTop: 16 }}>
                            <SlotMachine
                                final={turn.interference.name}
                                pool={INT_POOL}
                                accent="#dc2626"
                                icon="🎭"
                                label="Ваша помеха"
                            />
                        </div>
                    )}
                </div>
                <ScoreBar teams={lobby.teams} />
            </div>
        );
    }

    // ─── Playing ─────────────────────────────────────────────────────────────
    if (phase === 'playing') return (
        <div style={s.page}>
            <Header room={room} myId={myId} isMain={isMain} wsOn={wsOn} mode={roomMode} />
            <div style={s.gameWrap}>
                <div style={{ ...s.timerCircle, borderColor: timerColor, color: timerColor }}>{timeLeft}</div>

                {isCurrentPlayer && (
                    <div style={s.wordBox}>
                        <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 6 }}>Объясняй!</div>
                        <div style={s.wordBig}>{turn?.word}</div>
                    </div>
                )}

                {!isCurrentPlayer && (
                    <div style={{ color: '#888', fontSize: 15 }}>
                        Объясняет: <strong style={{ color: '#fff' }}>{pName(turn?.currentPlayerId ?? 0)}</strong>
                    </div>
                )}

                {turn?.complication && (
                    <div style={{ ...s.infoBox, background: '#1c1a10', borderLeftColor: '#f59e0b' }}>
                        <div style={s.infoLabel}>⚡ Усложнение</div>
                        <div style={s.infoText}>{turn.complication.name}</div>
                    </div>
                )}

                {isOpponent && turn?.interference && (
                    <div style={{ ...s.infoBox, background: '#1a0f0f', borderLeftColor: '#dc2626' }}>
                        <div style={s.infoLabel}>🎭 Помеха</div>
                        <div style={s.infoText}>{turn.interference.name}</div>
                    </div>
                )}

                {isCurrentPlayer && (
                    <button style={s.btnSuccess} onClick={() => postFinishTurn(true)}>
                        Команда угадала!
                    </button>
                )}
            </div>
            <ScoreBar teams={lobby.teams} style={{ marginTop: 32, justifyContent: 'center' }} />
        </div>
    );

    // ─── Appeal ───────────────────────────────────────────────────────────────
    if (phase === 'appeal') return (
        <div style={s.fullCenter}>
            <div style={s.appealBox}>
                <div style={{ fontSize: 15, color: '#9ca3af', marginBottom: 6 }}>
                    {appealInfo?.guessed ? '✅ Команда угадала' : '❌ Не угадали'}
                </div>
                {appealInfo?.guessed && (appealInfo.earned > 0) && (
                    <div style={s.earnedPts}>+{appealInfo.earned}</div>
                )}
                <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
                    {appealInfo?.guessed ? 'очков начислено' : ''}
                </div>
                <div style={{ ...s.timerCircle, margin: '0 auto 16px', borderColor: appealLeft > 2 ? '#f59e0b' : '#ef4444', color: appealLeft > 2 ? '#f59e0b' : '#ef4444' }}>
                    {appealLeft}
                </div>
                <p style={{ color: '#9ca3af', fontSize: 14, margin: '0 0 20px' }}>
                    Если правила нарушены — обжалуйте
                </p>
                <button style={{ ...s.btnDanger, opacity: appealLeft <= 0 ? 0.4 : 1 }}
                    onClick={doAppeal} disabled={appealLeft <= 0}>
                    Обжаловать
                </button>
            </div>
            <ScoreBar teams={lobby.teams} />
        </div>
    );

    // ─── Game over ────────────────────────────────────────────────────────────
    if (phase === 'game_over' && gameOver) {
        const w = gameOver.winning_team;
        const medals = ['🥇', '🥈', '🥉'];
        return (
            <div style={s.fullCenter}>
                <div style={{ ...s.winBox, background: '#16213e', borderTop: `4px solid ${w.color}` }}>
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>Победитель</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: w.color }}>{w.name}</div>
                </div>
                <p style={{ ...s.sectionTitle, marginBottom: 16 }}>Рейтинг игроков</p>
                <div style={s.lbWrap}>
                    {gameOver.leaderboard.map((p, i) => {
                        const team = lobby.teams.find(t => t.id === p.team_id);
                        return (
                            <div key={p.id} style={{
                                ...s.lbRow,
                                background: p.id === myId ? 'rgba(79,70,229,0.25)' : 'rgba(255,255,255,0.03)',
                            }}>
                                <span style={{ fontSize: 22, width: 32, textAlign: 'center' as const }}>
                                    {medals[i] ?? `${i + 1}`}
                                </span>
                                <span style={{ flex: 1, fontWeight: 600 }}>{p.name || `Игрок ${p.id}`}</span>
                                {team && (
                                    <span style={{ ...s.diffBadge, background: team.color + '33', color: team.color, fontSize: 12, marginRight: 8 }}>
                                        {team.name}
                                    </span>
                                )}
                                <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: 16 }}>{p.points} pts</span>
                            </div>
                        );
                    })}
                </div>
                <ScoreBar teams={lobby.teams} style={{ marginTop: 8 }} />
                {isMain && (
                    <button style={{ ...s.btnDanger, marginTop: 16 }} onClick={cleanup}>
                        Завершить и выйти
                    </button>
                )}
            </div>
        );
    }

    // ─── Lobby ────────────────────────────────────────────────────────────────
    const unassigned = lobby.players.filter(p => p.team_id === null);

    return (
        <div style={s.page}>
            <Header room={room} myId={myId} isMain={isMain} wsOn={wsOn} mode={roomMode} />

            {myPlayer && (
                <p style={s.statusLine}>
                    Ты: <strong style={{ color: '#fff' }}>{myPlayer.name || `Игрок ${myId}`}</strong>
                    {myPlayer.team_id != null && (() => {
                        const t = lobby.teams.find(t => t.id === myPlayer.team_id);
                        return t ? <> · <span style={{ color: t.color }}>{t.name}</span></> : null;
                    })()}
                </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <span style={s.sectionTitle}>Команды</span>
                {isMain && (
                    <button style={{ ...s.btnSmall, marginLeft: 'auto' }} onClick={() => setTeamModal(true)}>
                        + Команда
                    </button>
                )}
            </div>

            {lobby.teams.length === 0
                ? <p style={s.noTeams}>Команд ещё нет</p>
                : (
                    <div style={s.grid}>
                        {lobby.teams.map(team => {
                            const members = lobby.players.filter(p => p.team_id === team.id);
                            const inThisTeam = myPlayer?.team_id === team.id;
                            return (
                                <div key={team.id} style={{ ...s.teamCard, borderLeftColor: team.color }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                        <span style={{ ...s.dot, background: team.color, width: 12, height: 12 }} />
                                        <span style={s.teamName}>{team.name}</span>
                                        <span style={{ marginLeft: 'auto', color: '#888', fontSize: 13 }}>{team.points ?? 0} pts</span>
                                    </div>
                                    <div style={s.playerList}>
                                        {members.length === 0
                                            ? <span style={{ color: '#555', fontSize: 13 }}>Нет игроков</span>
                                            : members.map(p => (
                                                <div key={p.id} style={s.playerRow}>
                                                    <span style={{ ...s.dot, background: p.id === myId ? '#4f46e5' : '#4b5563' }} />
                                                    <span style={{ flex: 1 }}>{p.name || `Игрок ${p.id}`}</span>
                                                    {p.id === myId && <span style={{ color: '#6b7280', fontSize: 12 }}>ты</span>}
                                                </div>
                                            ))
                                        }
                                    </div>
                                    {!inThisTeam && (
                                        <button style={{ ...s.btnSmall, marginTop: 12, background: '#1e3a5f' }}
                                            onClick={() => { setNameForTeam(team.id); setNameValue(myPlayer?.name || nameInput); setNameModal(true); }}>
                                            Войти
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )
            }

            {unassigned.length > 0 && (
                <div style={s.unassigned}>
                    <p style={{ ...s.sectionTitle, marginBottom: 12 }}>Без команды</p>
                    <div style={s.playerList}>
                        {unassigned.map(p => (
                            <div key={p.id} style={s.playerRow}>
                                <span style={{ ...s.dot, background: p.id === myId ? '#4f46e5' : '#4b5563' }} />
                                <span style={{ flex: 1 }}>{p.name || `Игрок ${p.id}`}</span>
                                {p.id === myId && <span style={{ color: '#6b7280', fontSize: 12 }}>ты</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={s.bottomBar}>
                {myPlayer?.team_id != null && (
                    <button style={s.btnSecondary}
                        onClick={() => { setNameForTeam(myPlayer.team_id!); setNameValue(myPlayer.name || nameInput); setNameModal(true); }}>
                        Изменить имя
                    </button>
                )}
                {isMain && (
                    <button style={{ ...s.btnSuccess, marginLeft: 'auto' }} onClick={startGame}>
                        Начать игру
                    </button>
                )}
            </div>

            {/* Create team modal */}
            {teamModal && (
                <div style={s.overlay} onClick={() => setTeamModal(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <p style={s.modalTitle}>Новая команда</p>
                        <label style={s.label}>
                            <span style={s.labelText}>Название</span>
                            <input style={s.input} value={newTeamName} autoFocus
                                onChange={e => setNewTeamName(e.target.value)} placeholder="Красные драконы" />
                        </label>
                        <label style={s.label}>
                            <span style={s.labelText}>Цвет</span>
                            <div style={s.colorRow}>
                                {COLORS.map(c => (
                                    <div key={c} style={{ ...s.colorSwatch, background: c, borderColor: newTeamColor === c ? '#fff' : 'transparent' }}
                                        onClick={() => setNewTeamColor(c)} />
                                ))}
                            </div>
                        </label>
                        <div style={s.modalActions}>
                            <button style={s.btnSecondary} onClick={() => setTeamModal(false)}>Отмена</button>
                            <button style={s.btnSmall} onClick={createTeam}>Создать</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Set name modal */}
            {nameModal && (
                <div style={s.overlay} onClick={() => setNameModal(false)}>
                    <div style={s.modal} onClick={e => e.stopPropagation()}>
                        <p style={s.modalTitle}>
                            {nameForTeam != null
                                ? `Войти в ${lobby.teams.find(t => t.id === nameForTeam)?.name ?? 'команду'}`
                                : 'Изменить имя'}
                        </p>
                        <label style={s.label}>
                            <span style={s.labelText}>Твоё имя</span>
                            <input style={s.input} value={nameValue} autoFocus
                                onChange={e => setNameValue(e.target.value)} placeholder="Введи имя"
                                onKeyDown={e => e.key === 'Enter' && saveName()} />
                        </label>
                        <div style={s.modalActions}>
                            <button style={s.btnSecondary} onClick={() => setNameModal(false)}>Отмена</button>
                            <button style={s.btnSmall} onClick={saveName}>Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
