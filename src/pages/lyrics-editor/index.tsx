import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAudioPlayer } from '../../context/audio-context';
import { useAuth } from '../../context/auth-context';

const BASE_URL = 'https://vapira.ru';

interface Token {
    time: number;
    text: string; // '|' = line break marker
    color?: string;
    sizePercent?: number;
    footnote?: string;
}

export const LyricsEditorPage = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { currentTime, durationSec, isPlaying, toggle, seek, setRate, loadAndPlayExternal } = useAudioPlayer();
    const trackId = searchParams.get('trackId');

    const [tokens, setTokens] = useState<Token[]>([]);
    const [word, setWord] = useState('');
    const [tagColor, setTagColor] = useState('#ffffff');
    const [tagSizePercent, setTagSizePercent] = useState('100');
    const [tagFootnote, setTagFootnote] = useState('');
    const [tagSettingsOpen, setTagSettingsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentSec = (currentTime / 100) * durationSec;
    const currentMs = Math.round(currentSec * 1000);

    useEffect(() => {
        if (!token || !trackId) return;
        fetch(`${BASE_URL}/tracks/${trackId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(t => {
                loadAndPlayExternal({
                    id: String(t.id),
                    name: t.title,
                    artist: t.artist,
                    cover: t.avatar_url,
                    src: `${BASE_URL}${t.stream_url}`,
                });
            });
    }, [token, trackId, loadAndPlayExternal]);

    const mark = () => {
        const text = word.trim();
        if (!text) return;
        const normalizedSize = Number(tagSizePercent);
        setTokens(prev => [...prev, {
            time: currentMs,
            text,
            color: tagColor.trim() && tagColor.trim().toLowerCase() !== '#ffffff' ? tagColor.trim() : undefined,
            sizePercent: Number.isFinite(normalizedSize) && normalizedSize > 0 && normalizedSize !== 100 ? normalizedSize : undefined,
            footnote: tagFootnote.trim() || undefined,
        }].sort((a, b) => a.time - b.time));
        setWord('');
        inputRef.current?.focus();
    };

    const addLineBreak = () => {
        setTokens(prev => [...prev, { time: currentMs, text: '|' }].sort((a, b) => a.time - b.time));
        inputRef.current?.focus();
    };

    const removeToken = (idx: number) => setTokens(prev => prev.filter((_, i) => i !== idx));

    const getPhrase = (time: number) => tokens.filter(t => t.text === '|' && t.time <= time).length;
    const currentPhraseNum = getPhrase(currentMs);
    const demoVisible = tokens.filter(t => t.text !== '|' && t.time <= currentMs && getPhrase(t.time) === currentPhraseNum);

    const serializeToken = (token: Token) => {
        if (token.text === '|') return '|';
        const meta: string[] = [];
        if (token.color) meta.push(`color: ${token.color}`);
        if (token.sizePercent) meta.push(`size: ${token.sizePercent}%`);
        if (token.footnote) meta.push(`text: ${JSON.stringify(token.footnote)}`);
        const suffix = meta.length ? ` {${meta.join(', ')}}` : '';
        return `[${token.time}] ${token.text}${suffix}`;
    };

    const generated = tokens.length > 0
        ? tokens.map(serializeToken).join(' ')
        : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generated);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const toggleRef = useRef(toggle);
    useEffect(() => { toggleRef.current = toggle; }, [toggle]);
    const markRef = useRef(mark);
    useEffect(() => { markRef.current = mark; }, [mark]);
    const seekRef = useRef(seek);
    useEffect(() => { seekRef.current = seek; }, [seek]);
    const currentTimeRef = useRef(currentTime);
    useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
    const durationSecRef = useRef(durationSec);
    useEffect(() => { durationSecRef.current = durationSec; }, [durationSec]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === ' ') {
                e.preventDefault();
                toggleRef.current();
            } else if (e.key === 'Enter' && document.activeElement !== inputRef.current) {
                markRef.current();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const dur = durationSecRef.current;
                if (dur <= 0) return;
                const delta = e.key === 'ArrowRight' ? 100 : -100;
                const currentMs = (currentTimeRef.current / 100) * dur * 1000;
                const newMs = Math.max(0, Math.min(currentMs + delta, dur * 1000));
                seekRef.current((newMs / 1000 / dur) * 100);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') mark();
    };

    const progressPercent = currentTime;

    return (
        <div style={{
            minHeight: '100vh',
            background: '#111',
            color: '#fff',
            fontFamily: 'sans-serif',
            padding: '32px 24px',
            boxSizing: 'border-box',
        }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    ...btnStyle,
                    marginBottom: 16,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <span aria-hidden="true">←</span>
                Назад
            </button>

            <h2 style={{ margin: '0 0 24px', fontSize: '1.2rem', fontWeight: 600 }}>Редактор субтитров</h2>

            {!trackId && (
                <div style={{
                    marginBottom: 24,
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: 'rgba(255,255,255,0.75)',
                }}>
                    Трек не выбран. Откройте редактор субтитров из списка треков.
                </div>
            )}

            {/* ms counter */}
            <div style={{ fontFamily: 'monospace', color: '#0f0', fontSize: '1rem', marginBottom: 16 }}>
                {currentMs} ms &nbsp; {isPlaying ? '▶' : '⏸'}
            </div>

            {/* Wide progress bar */}
            <div
                onClick={e => {
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    seek(((e.clientX - rect.left) / rect.width) * 100);
                }}
                style={{
                    width: '100%',
                    height: 48,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    position: 'relative',
                    marginBottom: 20,
                }}
            >
                <div style={{
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: `${progressPercent}%`,
                    background: '#fff',
                    borderRadius: 8,
                    transition: 'width 0.05s linear',
                }} />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.7)',
                    mixBlendMode: 'difference',
                    pointerEvents: 'none',
                }}>
                    {Math.floor(currentSec / 60)}:{String(Math.floor(currentSec % 60)).padStart(2, '0')}
                    {' / '}
                    {Math.floor(durationSec / 60)}:{String(Math.floor(durationSec % 60)).padStart(2, '0')}
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
                <button onClick={toggle} style={btnStyle}>
                    {isPlaying ? '⏸ Пауза' : '▶ Играть'}
                </button>
                {[0.25, 0.5, 0.75, 1].map(r => (
                    <button key={r} onClick={() => setRate(r)} style={btnStyle}>{r}x</button>
                ))}
            </div>

            {/* Demo preview */}
            {tokens.length > 0 && (
                <div style={{
                    marginBottom: 20,
                    padding: '16px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    minHeight: 56,
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px 10px',
                }}>
                    {demoVisible.map((t, i) => {
                        const isLast = i === demoVisible.length - 1;
                        const sizeMultiplier = t.sizePercent ? t.sizePercent / 100 : 1;
                        return (
                            <span key={t.time} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                                <span style={{
                                    color: t.color ? t.color : isLast ? '#fff' : 'rgba(255,255,255,0.4)',
                                    fontWeight: isLast ? 700 : 400,
                                    fontSize: `calc(${isLast ? '1.15rem' : '1rem'} * ${sizeMultiplier})`,
                                    textShadow: isLast ? (t.color ? `0 0 12px ${t.color}` : '0 0 12px rgba(255,255,255,0.6)') : 'none',
                                    transition: 'color 0.08s, font-size 0.08s',
                                }}>
                                    {t.text}
                                </span>
                                {t.footnote && (
                                    <span style={{
                                        color: t.color ? t.color : 'rgba(255,255,255,0.68)',
                                        fontSize: '0.72rem',
                                        lineHeight: 1.15,
                                    }}>
                                        {t.footnote}
                                    </span>
                                )}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Word input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                        ref={inputRef}
                        value={word}
                        onChange={e => setWord(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Слово / фраза..."
                        style={{
                            flex: 1,
                            minWidth: 240,
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: 8,
                            color: '#fff',
                            fontSize: '1rem',
                            padding: '10px 14px',
                            outline: 'none',
                        }}
                    />
                    <button
                        onClick={() => setTagSettingsOpen(v => !v)}
                        style={{
                            ...btnStyle,
                            padding: '10px 14px',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 48,
                        }}
                        aria-label={tagSettingsOpen ? 'Скрыть настройки тега' : 'Показать настройки тега'}
                    >
                        <span style={{
                            display: 'inline-block',
                            transform: tagSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.15s ease',
                            lineHeight: 1,
                        }}>
                            ↓
                        </span>
                    </button>
                    <button onClick={mark} style={{ ...btnStyle, padding: '10px 20px', fontSize: '1rem' }}>
                        Метка [{currentMs}]
                    </button>
                    <button onClick={addLineBreak} style={{ ...btnStyle, padding: '10px 16px', fontSize: '1rem', borderColor: 'rgba(255,200,0,0.4)', color: 'rgba(255,200,0,0.9)' }}>
                        ↵ строка
                    </button>
                </div>
                {tagSettingsOpen && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'stretch' }}>
                        <label style={fieldLabelStyle}>
                            Цвет тега
                            <input
                                type="color"
                                value={tagColor}
                                onChange={e => setTagColor(e.target.value)}
                                style={colorInputStyle}
                            />
                        </label>
                        <label style={fieldLabelStyle}>
                            Размер, %
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={tagSizePercent}
                                onChange={e => setTagSizePercent(e.target.value)}
                                style={{ ...inputStyle, width: 120 }}
                            />
                        </label>
                        <label style={{ ...fieldLabelStyle, flex: 1, minWidth: 240 }}>
                            Сноска
                            <input
                                value={tagFootnote}
                                onChange={e => setTagFootnote(e.target.value)}
                                placeholder="Пояснение под словом"
                                style={inputStyle}
                            />
                        </label>
                        <div style={{
                            minWidth: 180,
                            padding: '10px 12px',
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'inline-flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            gap: 2,
                        }}>
                            <span style={{
                                color: tagColor || '#fff',
                                fontWeight: 700,
                                fontSize: `calc(1rem * ${Math.max(Number(tagSizePercent) || 100, 1) / 100})`,
                                lineHeight: 1.2,
                            }}>
                                {word.trim() || 'Превью'}
                            </span>
                            {tagFootnote.trim() && (
                                <span style={{
                                    color: tagColor || 'rgba(255,255,255,0.68)',
                                    fontSize: '0.72rem',
                                    lineHeight: 1.15,
                                }}>
                                    {tagFootnote.trim()}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Token list */}
            {tokens.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Метки:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {tokens.map((t, i) => t.text === '|' ? (
                            <div key={i} style={{
                                background: 'rgba(255,200,0,0.08)',
                                border: '1px solid rgba(255,200,0,0.3)',
                                borderRadius: 6,
                                padding: '4px 10px',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                color: 'rgba(255,200,0,0.9)',
                            }}>
                                <span>↵ новая строка</span>
                                <button onClick={() => removeToken(i)} style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,200,0,0.4)',
                                    cursor: 'pointer',
                                    padding: 0,
                                    fontSize: '0.9rem',
                                    lineHeight: 1,
                                }}>✕</button>
                            </div>
                        ) : (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: 6,
                                padding: '4px 10px',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}>
                                <span style={{ color: '#0f0', fontFamily: 'monospace' }}>{t.time}</span>
                                <span style={{ color: t.color || '#fff' }}>{t.text}</span>
                                {t.sizePercent && <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>{t.sizePercent}%</span>}
                                {t.footnote && <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem' }}>“{t.footnote}”</span>}
                                <button onClick={() => removeToken(i)} style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    padding: 0,
                                    fontSize: '0.9rem',
                                    lineHeight: 1,
                                }}>✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Generated output */}
            {generated && (
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Результат:</div>
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 8,
                        padding: 14,
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        wordBreak: 'break-all',
                        marginBottom: 10,
                    }}>
                        {generated}
                    </div>
                    <button onClick={copyToClipboard} style={btnStyle}>
                        {copied ? '✓ Скопировано' : 'Копировать'}
                    </button>
                </div>
            )}
        </div>
    );
};

const btnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    color: '#fff',
    fontSize: '0.9rem',
    padding: '8px 14px',
    cursor: 'pointer',
};

const fieldLabelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: '0.78rem',
    color: 'rgba(255,255,255,0.65)',
};

const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    color: '#fff',
    fontSize: '0.95rem',
    padding: '10px 12px',
    outline: 'none',
};

const colorInputStyle: React.CSSProperties = {
    ...inputStyle,
    padding: 4,
    width: 76,
    height: 42,
};
