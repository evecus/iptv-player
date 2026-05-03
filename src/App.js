import React, { useState, useEffect, useCallback, useRef } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import ChannelList from './components/ChannelList';
import Player from './components/Player';
import AddPlaylistModal from './components/AddPlaylistModal';
import { loadState, saveState, generatePlaylistId } from './store';
import { parsePlaylist, groupChannels } from './utils/parser';
import './App.css';

export default function App() {
  const [state, setState] = useState(null);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [activeGroup, setActiveGroup] = useState('__all__');
  const [currentChannel, setCurrentChannel] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const refreshTimers = useRef({});

  // Boot: load persisted state
  useEffect(() => {
    loadState().then((s) => {
      setState(s);
      if (s.playlists.length > 0) setActivePlaylistId(s.playlists[0].id);
      if (s.lastPlayed) {
        const pl = s.playlists.find((p) => p.id === s.lastPlayed.playlistId);
        if (pl) {
          const ch = pl.channels?.find((c) => c.id === s.lastPlayed.channelId);
          if (ch) setCurrentChannel(ch);
        }
      }
    });
  }, []);

  // Auto-save on state change
  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  // Set up refresh timers for URL playlists
  useEffect(() => {
    if (!state) return;
    // Clear old timers
    Object.values(refreshTimers.current).forEach(clearInterval);
    refreshTimers.current = {};

    for (const pl of state.playlists) {
      if (pl.type === 'url' && pl.refreshInterval && pl.refreshInterval > 0) {
        const ms = pl.refreshInterval * 60 * 1000;
        refreshTimers.current[pl.id] = setInterval(() => {
          refreshPlaylist(pl.id);
        }, ms);
      }
    }
    return () => Object.values(refreshTimers.current).forEach(clearInterval);
  }, [state?.playlists?.map((p) => p.id + p.refreshInterval).join()]);

  const refreshPlaylist = useCallback(async (playlistId) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        playlists: prev.playlists.map((p) =>
          p.id === playlistId ? { ...p, refreshing: true } : p
        ),
      };
    });
    try {
      const pl = state?.playlists.find((p) => p.id === playlistId);
      if (!pl || pl.type !== 'url') return;
      const content = window.electronAPI
        ? await window.electronAPI.fetchUrl(pl.url)
        : await fetch(pl.url).then((r) => r.text());
      const channels = parsePlaylist(content);
      setState((prev) => ({
        ...prev,
        playlists: prev.playlists.map((p) =>
          p.id === playlistId
            ? { ...p, channels, lastUpdated: Date.now(), refreshing: false }
            : p
        ),
      }));
    } catch (e) {
      setState((prev) => ({
        ...prev,
        playlists: prev.playlists.map((p) =>
          p.id === playlistId ? { ...p, refreshing: false } : p
        ),
      }));
    }
  }, [state]);

  const handleAddPlaylist = useCallback(async (config) => {
    const id = generatePlaylistId();
    let channels = [];
    let content = '';

    try {
      if (config.type === 'url') {
        content = window.electronAPI
          ? await window.electronAPI.fetchUrl(config.url)
          : await fetch(config.url).then((r) => r.text());
        channels = parsePlaylist(content);
      } else if (config.type === 'file') {
        channels = parsePlaylist(config.content);
      } else if (config.type === 'text') {
        channels = parsePlaylist(config.content);
      }
    } catch (e) {
      console.error('Failed to load playlist:', e);
    }

    const playlist = {
      id,
      name: config.name,
      type: config.type,
      url: config.url || null,
      refreshInterval: config.refreshInterval || 0,
      channels,
      lastUpdated: Date.now(),
      color: config.color,
    };

    setState((prev) => ({
      ...prev,
      playlists: [...prev.playlists, playlist],
    }));
    setActivePlaylistId(id);
    setActiveGroup('__all__');
    setShowAddModal(false);
  }, []);

  const handleDeletePlaylist = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      playlists: prev.playlists.filter((p) => p.id !== id),
    }));
    setActivePlaylistId((cur) => {
      if (cur !== id) return cur;
      const remaining = state?.playlists.filter((p) => p.id !== id);
      return remaining?.[0]?.id || null;
    });
  }, [state]);

  const handlePlayChannel = useCallback((channel) => {
    setCurrentChannel(channel);
    setState((prev) => ({
      ...prev,
      lastPlayed: { playlistId: activePlaylistId, channelId: channel.id },
    }));
  }, [activePlaylistId]);

  const toggleFavorite = useCallback((channelId) => {
    setState((prev) => {
      const favs = prev.favorites || [];
      const next = favs.includes(channelId)
        ? favs.filter((f) => f !== channelId)
        : [...favs, channelId];
      return { ...prev, favorites: next };
    });
  }, []);

  const activePlaylist = state?.playlists.find((p) => p.id === activePlaylistId);
  const allChannels = activePlaylist?.channels || [];
  const groups = groupChannels(allChannels);
  const favorites = state?.favorites || [];

  let visibleChannels = activeGroup === '__favorites__'
    ? allChannels.filter((c) => favorites.includes(c.id))
    : activeGroup === '__all__'
    ? allChannels
    : allChannels.filter((c) => (c.group || 'Ungrouped') === activeGroup);

  if (search.trim()) {
    const q = search.toLowerCase();
    visibleChannels = visibleChannels.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.group || '').toLowerCase().includes(q)
    );
  }

  if (!state) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="app-root">
      <TitleBar />
      <div className="app-body">
        <Sidebar
          playlists={state.playlists}
          activePlaylistId={activePlaylistId}
          onSelectPlaylist={(id) => { setActivePlaylistId(id); setActiveGroup('__all__'); setSearch(''); }}
          onAddPlaylist={() => setShowAddModal(true)}
          onDeletePlaylist={handleDeletePlaylist}
          onRefreshPlaylist={refreshPlaylist}
        />
        <ChannelList
          playlist={activePlaylist}
          channels={visibleChannels}
          groups={groups}
          activeGroup={activeGroup}
          currentChannel={currentChannel}
          favorites={favorites}
          search={search}
          onSearch={setSearch}
          onSelectGroup={setActiveGroup}
          onPlayChannel={handlePlayChannel}
          onToggleFavorite={toggleFavorite}
        />
        <Player
          channel={currentChannel}
          volume={state.settings?.volume ?? 80}
          onVolumeChange={(v) =>
            setState((prev) => ({ ...prev, settings: { ...prev.settings, volume: v } }))
          }
        />
      </div>
      {showAddModal && (
        <AddPlaylistModal
          onAdd={handleAddPlaylist}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
