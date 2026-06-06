import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';

const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #444',
    color: '#fff',
    fontFamily: 'inherit',
    fontSize: '1rem',
    padding: '0.5rem 0',
    outline: 'none',
    width: '100%',
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', marginBottom: '0.35rem' }}>
            {label}
        </span>
        {children}
    </div>
)

const SLIDE_COLORS = ['#000', '#f6fe40', '#01ff9a'] as const;
type SlideColor = typeof SLIDE_COLORS[number];

const fg = (c: SlideColor) => c === '#000' ? '#fff' : '#000';
const accent = (c: SlideColor) => c === '#000' ? '#f6fe40' : '#000';

type Slide =
    | { layout: 'icon-only'; icon: string }
    | { layout: 'text-icon'; text: string; sub?: string; icon: string }
    | { layout: 'icon-text'; icon: string; text: string; sub?: string }
    | { layout: 'stats'; stat1: string; label1: string; stat2: string; label2: string }
    | { layout: 'quote'; text: string }
    | { layout: 'three-icons'; icons: string[]; sub?: string };

// const SLIDES: Slide[] = [
//     { layout: 'icon-only', icon: '♫' },
//     { layout: 'text-icon', text: 'Слушай везде', sub: 'в HD качестве', icon: '▶' },
//     { layout: 'icon-text', icon: '◎', text: 'vapira', sub: 'музыкальный стриминг' },
//     { layout: 'stats', stat1: '50M+', label1: 'треков', stat2: '24/7', label2: 'онлайн' },
//     { layout: 'quote', text: 'Музыка\nдля всех' },
//     { layout: 'text-icon', text: 'Открывай новое', sub: 'каждый день', icon: '♪' },
//     { layout: 'three-icons', icons: ['♩', '♪', '♫'], sub: 'любимые жанры' },
//     { layout: 'icon-text', icon: '≋', text: 'Lossless', sub: 'без потерь' },
//     { layout: 'stats', stat1: '320', label1: 'kbps', stat2: '∞', label2: 'плейлисты' },
//     { layout: 'icon-only', icon: '◉' },
// ];

const SLIDES: Slide[] = [
    { layout: 'icon-only', icon: '♫' },
    { layout: 'text-icon', text: 'Слушай везде', sub: 'в HD качестве', icon: '▶' },
    { layout: 'icon-text', icon: '◎', text: 'vapira', sub: 'музыкальный стриминг' },
    { layout: 'stats', stat1: '100+', label1: 'треков', stat2: '24/7', label2: 'онлайн' },
    { layout: 'quote', text: 'Музыка\nдля всех' },
    { layout: 'text-icon', text: 'Собирай свою коллекцию', sub: 'каждый день', icon: '♪' },
    { layout: 'three-icons', icons: ['♩', '♪', '♫'], sub: 'любые жанры' },
    { layout: 'icon-text', icon: '≋', text: 'Делись музыкой', sub: 'бесплатно' },
    { layout: 'stats', stat1: '320', label1: 'kbps', stat2: '∞', label2: 'пластинки' },
    { layout: 'icon-only', icon: '◉' },
];

function SlideContent({ slide, color }: { slide: Slide; color: SlideColor }) {
    const fgC = fg(color);
    const acC = accent(color);
    const base: React.CSSProperties = { fontFamily: 'inherit' };

    switch (slide.layout) {
        case 'icon-only':
            return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <span style={{ ...base, fontSize: '8rem', color: fgC, lineHeight: 1 }}>{slide.icon}</span>
                </div>
            );

        case 'text-icon':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '22px' }}>
                    <div>
                        <div style={{ ...base, fontSize: '1.45rem', fontWeight: 800, color: fgC, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{slide.text}</div>
                        {slide.sub && <div style={{ ...base, fontSize: '0.7rem', color: fgC, opacity: 0.55, marginTop: '0.3rem', letterSpacing: '0.06em' }}>{slide.sub}</div>}
                    </div>
                    <span style={{ ...base, fontSize: '4.5rem', color: acC, lineHeight: 1 }}>{slide.icon}</span>
                </div>
            );

        case 'icon-text':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '22px' }}>
                    <span style={{ ...base, fontSize: '4.5rem', color: acC, lineHeight: 1 }}>{slide.icon}</span>
                    <div>
                        {slide.sub && <div style={{ ...base, fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: fgC, opacity: 0.45, marginBottom: '0.3rem' }}>{slide.sub}</div>}
                        <div style={{ ...base, fontSize: '2rem', fontWeight: 900, color: fgC, lineHeight: 1, letterSpacing: '-0.03em' }}>{slide.text}</div>
                    </div>
                </div>
            );

        case 'stats':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.2rem', height: '100%', padding: '22px' }}>
                    {[{ val: slide.stat1, lbl: slide.label1 }, { val: slide.stat2, lbl: slide.label2 }].map(({ val, lbl }) => (
                        <div key={lbl}>
                            <div style={{ ...base, fontSize: '2.8rem', fontWeight: 900, color: fgC, lineHeight: 1, letterSpacing: '-0.03em' }}>{val}</div>
                            <div style={{ ...base, fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: fgC, opacity: 0.5 }}>{lbl}</div>
                        </div>
                    ))}
                </div>
            );

        case 'quote':
            return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '22px' }}>
                    <div style={{ ...base, fontSize: '2.2rem', fontWeight: 900, color: fgC, lineHeight: 1.05, letterSpacing: '-0.03em', whiteSpace: 'pre-line', textAlign: 'center' }}>{slide.text}</div>
                </div>
            );

        case 'three-icons':
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                        {slide.icons.map((ic, idx) => (
                            <span key={idx} style={{ ...base, fontSize: idx === 1 ? '3.5rem' : '2.2rem', color: idx === 1 ? acC : fgC, lineHeight: 1 }}>{ic}</span>
                        ))}
                    </div>
                    {slide.sub && <div style={{ ...base, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: fgC, opacity: 0.5, marginTop: '0.4rem' }}>{slide.sub}</div>}
                </div>
            );

        default:
            return null;
    }
}

const BLOCKS = [
    { "color": '#000' },
    { "color": '#f6fe40' },
    { "color": '#01ff9a' },
]

const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const validatePassword = (v: string): string | null => {
    if (v.length < 8) return 'Минимум 8 символов';
    if (!/[A-Z]/.test(v)) return 'Нужна хотя бы одна заглавная буква';
    if (!/[0-9]/.test(v)) return 'Нужна хотя бы одна цифра';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v)) return 'Нужен хотя бы один спецсимвол';
    return null;
};

const EyeOpen = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.3999 12.0294C14.3999 13.3192 13.3254 14.3647 11.9999 14.3647C10.6744 14.3647 9.5999 13.3192 9.5999 12.0294C9.5999 10.7396 10.6744 9.69402 11.9999 9.69402C13.3254 9.69402 14.3999 10.7396 14.3999 12.0294Z" stroke="#888" strokeWidth="2"/>
        <path d="M2.4 12C2.4 12 5.4 5.1 12 5.1C18.6 5.1 21.6 12 21.6 12C21.6 12 18.6 18.9 12 18.9C5.4 18.9 2.4 12 2.4 12Z" stroke="#888" strokeWidth="2"/>
    </svg>
);

const EyeClosed = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.3999 19.5L5.3999 4.5M10.1999 10.4416C9.82648 10.8533 9.5999 11.394 9.5999 11.9863C9.5999 13.2761 10.6744 14.3217 11.9999 14.3217C12.611 14.3217 13.1688 14.0994 13.5926 13.7334M20.4387 14.3217C21.2649 13.0848 21.5999 12.0761 21.5999 12.0761C21.5999 12.0761 19.4153 5.1 11.9999 5.1C11.5836 5.1 11.1838 5.12199 10.7999 5.16349M17.3999 17.3494C16.0225 18.2281 14.2492 18.8495 11.9999 18.8127C4.67683 18.693 2.3999 12.0761 2.3999 12.0761C2.3999 12.0761 3.45776 8.69808 6.5999 6.64332" stroke="#888" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export const AuthPage = () => {
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [highlights, setHighlights] = useState<{ x: number; y: number, color: string }[]>([]);

    const [blockStates, setBlockStates] = useState(() =>
        [0, 3, 6].map((offset, i) => ({
            slideIdx: offset % SLIDES.length,
            colorIdx: i % SLIDE_COLORS.length,
            animKey: 0,
            prevSlideIdx: offset % SLIDES.length,
            prevColorIdx: i % SLIDE_COLORS.length,
        }))
    );

    useEffect(() => {
        const STAGGER = 350;
        const updateBlock = (blockIdx: number) => {
            setBlockStates(prev => prev.map((b, i) => i !== blockIdx ? b : {
                prevSlideIdx: b.slideIdx,
                prevColorIdx: b.colorIdx,
                slideIdx: (b.slideIdx + 1) % SLIDES.length,
                colorIdx: Math.floor(Math.random() * SLIDE_COLORS.length),
                animKey: b.animKey + 1,
            }));
        };
        const tick = () => {
            updateBlock(0);
            setTimeout(() => updateBlock(1), STAGGER * 2);
            setTimeout(() => updateBlock(2), STAGGER);
        };
        const id = setInterval(tick, 7000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const el = videoContainerRef.current;
        if (!el) return;
        const calc = () => {
            const { width, height } = el.getBoundingClientRect();
            const size = 250;
            const xOrigin = (width - size) * 0.5 + 125;
            const yOrigin = (height - size) * 0.9;
            const xOffset = ((xOrigin % size) + size) % size;
            const yOffset = ((yOrigin % size) + size) % size;
            const rowsFromOrigin = Math.round((height / 2 - yOffset) / size);
            const y = yOffset + rowsFromOrigin * size;
            const inset = -12;
            setHighlights([
                { x: xOffset - size + inset, y: y + 3, ...BLOCKS[0] },
                { x: xOffset + inset, y: y + 3, ...BLOCKS[1] },
                { x: xOffset + size + inset, y: y + 3, ...BLOCKS[2]},
            ]);
        };
        calc();
        const ro = new ResizeObserver(calc);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const testAuth = async ({emailTest, passwordTest}: {emailTest: string, passwordTest: string}) => {
        await login(emailTest, passwordTest);
        const token = localStorage.getItem('vapira_token');
        if (token) {
            const me = await fetch('https://vapira.ru/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.ok ? r.json() : null).catch(() => null);
            if (me?.is_admin === 1) {
                navigate('/pages/admin');
                return;
            }
        }
        navigate('/');
    }

    const handleSubmit = async () => {
        setError('');
        setFieldErrors({});

        if (tab === 'register') {
            const errors: { email?: string; password?: string; confirmPassword?: string } = {};
            if (!validateEmail(email)) errors.email = 'Некорректный email';
            const pwErr = validatePassword(password);
            if (pwErr) errors.password = pwErr;
            if (!errors.password && password !== confirmPassword) errors.confirmPassword = 'Пароли не совпадают';
            if (Object.keys(errors).length > 0) {
                setFieldErrors(errors);
                return;
            }
        }

        setLoading(true);
        try {
            if (tab === 'login') {
                await login(email, password);
            } else {
                await register(username, email, password);
            }
            const token = localStorage.getItem('vapira_token');
            if (token) {
                const me = await fetch('https://vapira.ru/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                }).then(r => r.ok ? r.json() : null).catch(() => null);
                if (me?.is_admin === 1) {
                    navigate('/pages/admin');
                    return;
                }
            }
            navigate('/');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '1rem',
        }}>
            <div style={{ width: '100%', maxWidth: '300px', marginRight: '3rem', marginLeft: '3rem' }}>
                <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555', marginBottom: '0.5rem' }}>
                    vapira
                </p>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', borderBottom: '1px solid #333', paddingBottom: '0' }}>
                    {(['login', 'register'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setError(''); setFieldErrors({}); setConfirmPassword(''); setShowPassword(false); setShowConfirmPassword(false); }}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                letterSpacing: '-0.02em',
                                color: tab === t ? '#fff' : '#444',
                                paddingBottom: '0.75rem',
                                borderBottom: tab === t ? '2px solid #fff' : '2px solid transparent',
                                marginBottom: '-1px',
                                transition: 'color 0.2s',
                            }}
                        >
                            {t === 'login' ? 'войти' : 'регистрация'}
                        </button>
                    ))}
                </div>

                {tab === 'register' && (
                    <Field label="Имя пользователя">
                        <input
                            style={inputStyle}
                            placeholder="username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoComplete="username"
                        />
                    </Field>
                )}

                <Field label="Email">
                    <input
                        style={{ ...inputStyle, borderBottomColor: fieldErrors.email ? '#FD5E5E' : '#444' }}
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: undefined })); }}
                        onKeyDown={handleKeyDown}
                        autoComplete="email"
                    />
                    {fieldErrors.email && (
                        <span style={{ fontSize: '0.72rem', color: '#FD5E5E', marginTop: '0.3rem' }}>{fieldErrors.email}</span>
                    )}
                </Field>

                <Field label="Пароль">
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            style={{ ...inputStyle, borderBottomColor: fieldErrors.password ? '#FD5E5E' : '#444', paddingRight: '2rem' }}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); }}
                            onKeyDown={handleKeyDown}
                            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            style={{ position: 'absolute', right: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                        >
                            {showPassword ? <EyeOpen /> : <EyeClosed />}
                        </button>
                    </div>
                    {fieldErrors.password && (
                        <span style={{ fontSize: '0.72rem', color: '#FD5E5E', marginTop: '0.3rem' }}>{fieldErrors.password}</span>
                    )}
                </Field>

                {tab === 'register' && (
                    <Field label="Подтверждение пароля">
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                style={{ ...inputStyle, borderBottomColor: fieldErrors.confirmPassword ? '#FD5E5E' : '#444', paddingRight: '2rem' }}
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: undefined })); }}
                                onKeyDown={handleKeyDown}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(v => !v)}
                                style={{ position: 'absolute', right: 0, background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
                            >
                                {showConfirmPassword ? <EyeOpen /> : <EyeClosed />}
                            </button>
                        </div>
                        {tab === 'register' && !fieldErrors.password && (
                            <span style={{ fontSize: '0.68rem', color: '#555', marginTop: '0.3rem' }}>
                                8+ символов, заглавная буква, цифра, спецсимвол
                            </span>
                        )}
                        {fieldErrors.confirmPassword && (
                            <span style={{ fontSize: '0.72rem', color: '#FD5E5E', marginTop: '0.3rem' }}>{fieldErrors.confirmPassword}</span>
                        )}
                    </Field>
                )}

                {error && (
                    <p style={{ color: '#FD5E5E', fontSize: '0.8rem', marginBottom: '1rem' }}>
                        {error}
                    </p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: loading ? '#333' : '#fff',
                        color: loading ? '#555' : '#000',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontFamily: 'inherit',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                    }}
                >
                    {loading ? '...' : tab === 'login' ? 'войти' : 'зарегистрироваться'}
                </button>
                {process.env.NODE_ENV === 'development' && (
                    <>
                        <button onClick={() => testAuth({emailTest:'test@gmail.com', passwordTest: '123'})}>
                            vadim
                        </button>
                        <button onClick={() => testAuth({emailTest: '1111', passwordTest: '1111'})}>
                            1111
                        </button>
                        <button onClick={() => testAuth({emailTest: 'test2@gmail.com', passwordTest: 'Qwer123)'})}>
                            test
                        </button>
                    </>
                )}
            </div>
            <div ref={videoContainerRef} style={{width: '100%', height: '100%', borderRadius: 25, overflow: 'hidden', position: 'relative'}}>
                <style>{`@keyframes slideUpIn{from{transform:translateY(105%)}to{transform:translateY(0)}}`}</style>
                <video src='/video/back.mp4' style={{width: '100%', height: '100%', objectFit: 'cover'}} autoPlay muted loop />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1000,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cpath fill-rule='evenodd' fill='black' d='M0,0 H250 V250 H0 Z M20,4 H230 Q246,4 246,20 V230 Q246,246 230,246 H20 Q4,246 4,230 V20 Q4,4 20,4 Z'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'calc(50% + 110px) 90%',
                    pointerEvents: 'none',
                }} />
                {highlights.map((pos, i) => {
                    const { slideIdx, colorIdx, animKey, prevSlideIdx, prevColorIdx } = blockStates[i];
                    const currentColor = SLIDE_COLORS[colorIdx];
                    const prevColor = SLIDE_COLORS[prevColorIdx];
                    return (
                        <div key={i} style={{
                            position: 'absolute',
                            left: pos.x,
                            top: pos.y,
                            width: 245,
                            height: 245,
                            borderRadius: 16,
                            overflow: 'hidden',
                            zIndex: 1001,
                            pointerEvents: 'none',
                        }}>
                            {/* предыдущий слайд остаётся на месте */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: 16,
                                background: prevColor,
                            }}>
                                <SlideContent slide={SLIDES[prevSlideIdx]} color={prevColor} />
                            </div>
                            {/* новый слайд выезжает поверх */}
                            <div
                                key={animKey}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: 16,
                                    background: currentColor,
                                    animation: animKey > 0 ? 'slideUpIn 0.65s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
                                }}
                            >
                                <SlideContent slide={SLIDES[slideIdx]} color={currentColor} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
