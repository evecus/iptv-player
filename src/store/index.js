/**
 * App-wide data store with Electron persistence.
 * Falls back to localStorage when running in browser (dev without electron).
 */

const DEFAULT_STATE = {
  playlists: [],     // Array of playlist objects
  favorites: [],     // Array of channel IDs
  lastPlayed: null,  // { playlistId, channelId }
  settings: {
    volume: 80,
    autoPlay: true,
  },
};

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export async function loadState() {
  try {
    if (isElectron) {
      const data = await window.electronAPI.readData();
      if (data) return { ...DEFAULT_STATE, ...data };
    } else {
      const raw = localStorage.getItem('iptv-state');
      if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return { ...DEFAULT_STATE };
}

export async function saveState(state) {
  try {
    if (isElectron) {
      await window.electronAPI.writeData(state);
    } else {
      localStorage.setItem('iptv-state', JSON.stringify(state));
    }
  } catch (e) {}
}

export function generatePlaylistId() {
  return 'pl_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}
