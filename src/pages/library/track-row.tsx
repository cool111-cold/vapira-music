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
                <div style={{ color: isCurrentTrack ? '#fff' : '#fff', fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                <div style={{ color: '#666', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artist}</div>
            </div>
            <button
                onClick={handlePlay}
                title={isThisPlaying ? 'pause' : 'play'}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.4rem 0.5rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}
            >
                {isThisPlaying
                    ? <Icon name="PauseIcon" size={18} color="#fff" />
                    : <Icon name="PlayTwoIcon" size={18} color="#fff" />
                }
            </button>
            <button
                onClick={handleSave}
                disabled={toggling}
                title={isSaved ? 'unsave' : 'save'}
                style={{ background: 'none', border: 'none', color: isSaved ? '#fff' : '#444', cursor: toggling ? 'default' : 'pointer', fontSize: '1.2rem', padding: '0.4rem 0.5rem', lineHeight: 1 }}
            >
                ♥
            </button>
            {onDelete && (
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    title="delete"
                    style={{ background: 'none', border: 'none', color: '#444', cursor: deleting ? 'default' : 'pointer', padding: '0.4rem 0.5rem', lineHeight: 1, transition: 'color 0.2s', display: 'flex' }}
                    onMouseEnter={e => { if (!deleting) e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#444' }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 6.17647H20M9 3H15M15.5 21H8.5C7.39543 21 6.5 20.0519 6.5 18.8824L6.0434 7.27937C6.01973 6.67783 6.47392 6.17647 7.04253 6.17647H16.9575C17.5261 6.17647 17.9803 6.67783 17.9566 7.27937L17.5 18.8824C17.5 20.0519 16.6046 21 15.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </button>
            )}
        </div>
    )
}
