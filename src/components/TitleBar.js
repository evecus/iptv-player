import React, { useState, useEffect } from 'react';
import './TitleBar.css';

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (isElectron) {
      window.electronAPI.onWindowMaximized((val) => setMaximized(val));
    }
  }, []);

  return (
    <div className="titlebar">
      <div className="titlebar-logo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="4" width="20" height="14" rx="3" stroke="var(--accent)" strokeWidth="2"/>
          <path d="M10 9l5 3-5 3V9z" fill="var(--accent)"/>
        </svg>
        <span className="titlebar-name">IPTV Player</span>
      </div>
      <div className="titlebar-drag" />
      <div className="titlebar-controls">
        <button
          className="win-btn minimize"
          onClick={() => isElectron && window.electronAPI.minimizeWindow()}
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>
        </button>
        <button
          className="win-btn maximize"
          onClick={() => isElectron && window.electronAPI.maximizeWindow()}
          title={maximized ? 'Restore' : 'Maximize'}
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M3 1H9V7M1 3H7V9H1V3Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <rect x="1" y="1" width="8" height="8" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            </svg>
          )}
        </button>
        <button
          className="win-btn close"
          onClick={() => isElectron && window.electronAPI.closeWindow()}
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
