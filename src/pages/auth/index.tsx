import React, { useState } from 'react';
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

export const AuthPage = () => {
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try {
            if (tab === 'login') {
                await login(email, password);
            } else {
                await register(username, email, password);
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
            backgroundColor: '#222222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
        }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
                <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555', marginBottom: '0.5rem' }}>
                    vapira
                </p>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', borderBottom: '1px solid #333', paddingBottom: '0' }}>
                    {(['login', 'register'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setError(''); }}
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
                                borderBottom: tab === t ? '2px solid #FD5E5E' : '2px solid transparent',
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
                        style={inputStyle}
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="email"
                    />
                </Field>

                <Field label="Пароль">
                    <input
                        style={inputStyle}
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    />
                </Field>

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
                        backgroundColor: loading ? '#333' : '#FD5E5E',
                        color: loading ? '#555' : '#fff',
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
            </div>
        </div>
    );
};
