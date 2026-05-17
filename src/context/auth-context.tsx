import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthContextType {
    token: string | null;
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthCtx = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'vapira_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (!token) { setUser(null); return; }
        fetch('https://vapira.ru/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setUser)
            .catch(() => { setToken(null); localStorage.removeItem(TOKEN_KEY); });
    }, [token]);

    const login = async (email: string, password: string) => {
        const body = new URLSearchParams({ username: email, password });
        const res = await fetch('https://vapira.ru/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
        if (!res.ok) throw new Error((await res.json()).detail ?? 'Ошибка входа');
        const { access_token } = await res.json();
        localStorage.setItem(TOKEN_KEY, access_token);
        setToken(access_token);
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await fetch('https://vapira.ru/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) throw new Error((await res.json()).detail ?? 'Ошибка регистрации');
        const { token: t } = await res.json();
        localStorage.setItem(TOKEN_KEY, t);
        setToken(t);
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
    };

    return (
        <AuthCtx.Provider value={{ token, user, login, register, logout }}>
            {children}
        </AuthCtx.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
};
