import React, { useState } from 'react'
import { useAudioPlayer } from '../../context/audio-context'
import { useAuth } from '../../context/auth-context'

const BASE = 'https://vapira.ru'

export interface LibTrack {
    id: string
    title: string
    artist: string
    cover?: string
}

interface TrackRowProps {
    track: LibTrack
    saved?: boolean
    onRemove?: (id: string) => void
    onDelete?: (id: string) => void
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, saved = false, onRemove, onDelete }) => {
    const { token } = useAuth()
    const { tracks, playTrack } = useAudioPlayer()
    const [isSaved, setIsSaved] = useState(saved)
    const [toggling, setToggling] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handlePlay = () => {
        const idx = tracks.findIndex(t => t.id === track.id)
        if (idx >= 0) playTrack(idx)
    }

    const handleSave = async () => {
        if (!token || toggling) return
        setToggling(true)
        try {
            await fetch(`${BASE}/saved/${track.id}`, {
                method: isSaved ? 'DELETE' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (isSaved) onRemove?.(track.id)
            setIsSaved(s => !s)
        } finally {
            setToggling(false)
        }
    }

    const handleDelete = async () => {
        if (!token || deleting) return
        setDeleting(true)
        try {
            await fetch(`${BASE}/tracks/${track.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            onDelete?.(track.id)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 0',
            borderBottom: '1px solid #2a2a2a',
        }}>
            {track.cover
                ? <img src={track.cover} alt="" style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 44, height: 44, borderRadius: 4, background: '#333', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '1.2rem' }}>♪</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                <div style={{ color: '#666', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</div>
            </div>
            <button
                onClick={handlePlay}
                title="play"
                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1rem', padding: '0.4rem 0.5rem', lineHeight: 1 }}
            >
                ▶
            </button>
            <button
                onClick={handleSave}
                disabled={toggling}
                title={isSaved ? 'unsave' : 'save'}
                style={{ background: 'none', border: 'none', color: isSaved ? '#FD5E5E' : '#444', cursor: toggling ? 'default' : 'pointer', fontSize: '1.2rem', padding: '0.4rem 0.5rem', lineHeight: 1 }}
            >
                ♥
            </button>
            {onDelete && (
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    title="delete"
                    style={{ background: 'none', border: 'none', color: '#444', cursor: deleting ? 'default' : 'pointer', fontSize: '1rem', padding: '0.4rem 0.5rem', lineHeight: 1, transition: 'color 0.2s' }}
                    onMouseEnter={e => { if (!deleting) e.currentTarget.style.color = '#FD5E5E' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                >
                    ✕
                </button>
            )}
        </div>
    )
}
