import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './auth-context'

const BASE = 'https://vapira.ru'

interface SavedContextType {
    savedIds: Set<string>
    toggleSaved: (id: string) => Promise<void>
}

const SavedCtx = createContext<SavedContextType | undefined>(undefined)

export const SavedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth()
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!token) { setSavedIds(new Set()); return }
        fetch(`${BASE}/saved`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then((data: { id: number | string }[]) =>
                setSavedIds(new Set(data.map(t => String(t.id))))
            )
            .catch(() => {})
    }, [token])

    const toggleSaved = useCallback(async (id: string) => {
        if (!token) return
        const isSaved = savedIds.has(id)
        await fetch(`${BASE}/saved/${id}`, {
            method: isSaved ? 'DELETE' : 'POST',
            headers: { Authorization: `Bearer ${token}` },
        })
        setSavedIds(prev => {
            const next = new Set(prev)
            if (isSaved) next.delete(id)
            else next.add(id)
            return next
        })
    }, [token, savedIds])

    return <SavedCtx.Provider value={{ savedIds, toggleSaved }}>{children}</SavedCtx.Provider>
}

export const useSaved = (): SavedContextType => {
    const ctx = useContext(SavedCtx)
    if (!ctx) throw new Error('useSaved must be used within <SavedProvider>')
    return ctx
}
