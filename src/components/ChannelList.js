import React, { useMemo } from 'react';
import './ChannelList.css';

export default function ChannelList({
  playlist, channels, groups,
  activeGroup, currentChannel, favorites, search,
  onSearch, onSelectGroup, onPlayChannel, onToggleFavorite,
}) {
  const groupNames = useMemo(() => Object.keys(groups).sort(), [groups]);
  const favCount = (playlist?.channels || []).filter((c) => favorites.includes(c.id)).length;

  if (!playlist) {
    return (
      <div className="channel-list-empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="4" width="20" height="14" rx="3" stroke="var(--ink-faint)" strokeWidth="1.5"/>
          <path d="M10 9l5 3-5 3V9z" fill="var(--ink-faint)"/>
        </svg>
        <h3>No playlist selected</h3>
        <p>Add a playlist from the sidebar to get started</p>
      </div>
    );
  }

  return (
    <div className="channel-list-pane">
      {/* Search */}
      <div className="channel-search-bar">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 14 14">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search channels…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="search-input"
        />
        {search && (
          <button className="search-clear" onClick={() => onSearch('')}>✕</button>
        )}
      </div>

      {/* Group tabs */}
      <div className="group-tabs">
        <button
          className={`group-tab ${activeGroup === '__all__' ? 'active' : ''}`}
          onClick={() => onSelectGroup('__all__')}
        >
          All
          <span className="group-count">{playlist.channels?.length ?? 0}</span>
        </button>
        {favCount > 0 && (
          <button
            className={`group-tab ${activeGroup === '__favorites__' ? 'active fav' : ''}`}
            onClick={() => onSelectGroup('__favorites__')}
          >
            ★ Favorites
            <span className="group-count">{favCount}</span>
          </button>
        )}
        {groupNames.map((g) => (
          <button
            key={g}
            className={`group-tab ${activeGroup === g ? 'active' : ''}`}
            onClick={() => onSelectGroup(g)}
          >
            <span className="ellipsis">{g}</span>
            <span className="group-count">{groups[g].length}</span>
          </button>
        ))}
      </div>

      {/* Channel list */}
      <div className="channel-items">
        {channels.length === 0 && (
          <div className="no-channels">
            {search ? `No results for "${search}"` : 'No channels in this group'}
          </div>
        )}
        {channels.map((ch) => {
          const isPlaying = currentChannel?.id === ch.id;
          const isFav = favorites.includes(ch.id);
          return (
            <div
              key={ch.id}
              className={`channel-item ${isPlaying ? 'playing' : ''}`}
              onClick={() => onPlayChannel(ch)}
            >
              <div className="ch-logo-wrap">
                {ch.logo ? (
                  <img
                    src={ch.logo}
                    alt=""
                    className="ch-logo"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div className="ch-logo-fallback" style={{ display: ch.logo ? 'none' : 'flex' }}>
                  {ch.name.slice(0, 2).toUpperCase()}
                </div>
                {isPlaying && (
                  <div className="playing-indicator">
                    <span /><span /><span />
                  </div>
                )}
              </div>
              <div className="ch-info">
                <span className="ch-name ellipsis">{ch.name}</span>
                <span className="ch-group ellipsis">{ch.group || 'Ungrouped'}</span>
              </div>
              <button
                className={`fav-btn ${isFav ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(ch.id); }}
                title={isFav ? 'Remove favorite' : 'Add to favorites'}
              >
                ★
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
