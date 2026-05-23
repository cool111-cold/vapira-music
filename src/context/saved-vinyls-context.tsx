import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './auth-context'

const BASE = 'https://vapira.ru'

interface SavedVinylsContextType {
    savedVinylIds: Set<number>
    toggleSavedVinyl: (id: number) => Promise<void>
}

const SavedVinylsCtx = createContext<SavedVinylsContextType | undefined>(undefined)

export const SavedVinylsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useAuth()
    const [savedVinylIds, setSavedVinylIds] = useState<Set<number>>(new Set())

    useEffect(() => {
        if (!token) { setSavedVinylIds(new Set()); return }
        fetch(`${BASE}/saved-vinyls`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : [])
            .then((data: { id: number }[]) =>
                setSavedVinylIds(new Set(Array.isArray(data) ? data.map(v => v.id) : []))
            )
            .catch(() => {})
    }, [token])

    const toggleSavedVinyl = useCallback(async (id: number) => {
        if (!token) return
        const isSaved = savedVinylIds.has(id)
        await fetch(`${BASE}/saved-vinyls/${id}`, {
            method: isSaved ? 'DELETE' : 'POST',
            headers: { Authorization: `Bearer ${token}` },
        })
        setSavedVinylIds(prev => {
            const next = new Set(prev)
            if (isSaved) next.delete(id)
            else next.add(id)
            return next
        })
    }, [token, savedVinylIds])

    return <SavedVinylsCtx.Provider value={{ savedVinylIds, toggleSavedVinyl }}>{children}</SavedVinylsCtx.Provider>
}

export const useSavedVinyls = (): SavedVinylsContextType => {
    const ctx = useContext(SavedVinylsCtx)
    if (!ctx) throw new Error('useSavedVinyls must be used within <SavedVinylsProvider>')
    return ctx
}
