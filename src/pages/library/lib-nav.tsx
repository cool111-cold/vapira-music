import React from 'react'
import { NavLink } from 'react-router-dom'

const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '0.4rem 0',
    paddingBottom: '0.6rem',
    marginRight: '2rem',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    textDecoration: 'none',
    color: isActive ? '#fff' : '#555',
    borderBottom: `2px solid ${isActive ? '#FD5E5E' : 'transparent'}`,
    transition: 'color 0.2s',
    display: 'inline-block',
})

export const LibNav = () => (
    <nav style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid #2a2a2a' }}>
        <NavLink to="/library" end style={({ isActive }) => tabStyle(isActive)}>All</NavLink>
        <NavLink to="/tracks" style={({ isActive }) => tabStyle(isActive)}>Uploaded</NavLink>
        <NavLink to="/saved" style={({ isActive }) => tabStyle(isActive)}>Saved</NavLink>
        <NavLink to="/search" style={({ isActive }) => tabStyle(isActive)}>Search</NavLink>
    </nav>
)
