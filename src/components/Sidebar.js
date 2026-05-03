import React, { useState } from 'react';
import './Sidebar.css';

const PLAYLIST_COLORS = [
  '#E8651A','#2E7D52','#1A6FE8','#9B3DB8','#C0392B','#D4860A','#0891B2','#BE185D'
];

export default function Sidebar({
  playlists, activePlaylistId,
  onSelectPlaylist, onAddPlaylist, onDeletePlaylist, onRefreshPlaylist
}) {
  const [hoverId, setHoverId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Playlists</span>
        <button className="add-btn" onClick={onAddPlaylist} title="Add playlist">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="sidebar-list">
        {playlists.length === 0 && (
          <div className="sidebar-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="13" rx="2" stroke="var(--ink-faint)" strokeWidth="1.5"/>
              <path d="M10 9.5l4 2.5-4 2.5v-5z" fill="var(--ink-faint)"/>
            </svg>
            <p>No playlists yet</p>
            <button className="empty-add-btn" onClick={onAddPlaylist}>Add playlist</button>
          </div>
        )}

        {playlists.map((pl) => (
          <div
            key={pl.id}
            className={`playlist-item ${pl.id === activePlaylistId ? 'active' : ''}`}
            onMouseEnter={() => setHoverId(pl.id)}
            onMouseLeave={() => setHoverId(null)}
            onClick={() => onSelectPlaylist(pl.id)}
          >
            <div
              className="pl-dot"
              style={{ background: pl.color || PLAYLIST_COLORS[0] }}
            />
            <div className="pl-info">
              <span className="pl-name ellipsis">{pl.name}</span>
              <span className="pl-meta">
                {pl.channels?.length ?? 0} channels
                {pl.type === 'url' && pl.refreshInterval > 0 && (
                  <span className="pl-refresh-badge">
                    ↻ {pl.refreshInterval}m
                  </span>
                )}
              </span>
            </div>

            {(hoverId === pl.id || pl.id === activePlaylistId) && (
              <div className="pl-actions" onClick={(e) => e.stopPropagation()}>
                {pl.type === 'url' && (
                  <button
                    className="pl-action-btn"
                    title="Refresh"
                    onClick={() => onRefreshPlaylist(pl.id)}
                    disabled={pl.refreshing}
                  >
                    <svg
                      width="12" height="12" viewBox="0 0 14 14"
                      style={{ animation: pl.refreshing ? 'spin 0.7s linear infinite' : 'none' }}
                    >
                      <path d="M12.5 7A5.5 5.5 0 1 1 7 1.5a5.5 5.5 0 0 1 4 1.72" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                      <path d="M11 1v3h-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                {confirmDelete === pl.id ? (
                  <>
                    <button
                      className="pl-action-btn danger"
                      title="Confirm delete"
                      onClick={() => { onDeletePlaylist(pl.id); setConfirmDelete(null); }}
                    >✓</button>
                    <button
                      className="pl-action-btn"
                      title="Cancel"
                      onClick={() => setConfirmDelete(null)}
                    >✕</button>
                  </>
                ) : (
                  <button
                    className="pl-action-btn"
                    title="Delete"
                    onClick={() => setConfirmDelete(pl.id)}
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14">
                      <path d="M2 3.5h10M5 3.5V2h4v1.5M5.5 6v4.5M8.5 6v4.5M3 3.5l.7 8h6.6l.7-8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <span className="sidebar-version">v1.0.0</span>
      </div>
    </aside>
  );
}
