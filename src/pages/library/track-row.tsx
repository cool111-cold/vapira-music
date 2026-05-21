import React, { useState } from 'react'
import { useAudioPlayer } from '../../context/audio-context'
import { useAuth } from '../../context/auth-context'
import { useSaved } from '../../context/saved-context'
import { Icon } from '../../components/icon'

const BASE = 'https://vapira.ru'

export interface LibTrack {
    id: string
    title: string
    artist: string
    cover?: string
    src: string
}

interface TrackRowProps {
    track: LibTrack
    onRemove?: (id: string) => void
    onDelete?: (id: string) => void
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, onRemove, onDelete }) => {
    const { token } = useAuth()
    const { loadAndPlayExternal, currentTrack, isPlaying, toggle } = useAudioPlayer()
    const { savedIds, toggleSaved } = useSaved()
    const [toggling, setToggling] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const isCurrentTrack = currentTrack?.id === track.id
    const isThisPlaying = isCurrentTrack && isPlaying
    const isSaved = savedIds.has(track.id)

    const handlePlay = () => {
        if (isCurrentTrack) {
            toggle()
        } else {
            loadAndPlayExternal({
                id: track.id,
                name: track.title,
                artist: track.artist,
                cover: track.cover,
                src: track.src,
            })
        }
    }

    const handleSave = async () => {
        if (!token || toggling) return
        setToggling(true)
        try {
            await toggleSaved(track.id)
            if (isSaved) onRemove?.(track.id)
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
            <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0, cursor: 'pointer' }} onClick={handlePlay}>
                {track.cover
                    ? <img src={track.cover} alt="" style={{ width: 44, height: 44, borderRadius: 4, objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: 44, height: 44, borderRadius: 4, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '1.2rem' }}>♪</div>
                }
                <div style={{
                    position: 'absolute', inset: 0, borderRadius: 4,
                    background: isCurrentTrack ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                }}>
                    {isCurrentTrack && (
                        isThisPlaying
                            ? <Icon name="PauseIcon" size={20} color="#fff" />
                            : <Icon name="PlayTwoIcon" size={20} color="#fff" />
                    )}
                </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: isCurrentTrack ? '#FD5E5E' : '#fff', fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                <div style={{ color: '#666', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</div>
            </div>
            <button
                onClick={handlePlay}
                title={isThisPlaying ? 'pause' : 'play'}
                style={{ background: 'none', border: 'none', color: isCurrentTrack ? '#FD5E5E' : '#aaa', cursor: 'pointer', padding: '0.4rem 0.5rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}
            >
                {isThisPlaying
                    ? <Icon name="PauseIcon" size={18} color="#FD5E5E" />
                    : <Icon name="PlayTwoIcon" size={18} color={isCurrentTrack ? '#FD5E5E' : '#aaa'} />
                }
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
