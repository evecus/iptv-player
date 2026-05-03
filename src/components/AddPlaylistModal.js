import React, { useState, useRef } from 'react';
import './AddPlaylistModal.css';

const COLORS = [
  '#E8651A','#2E7D52','#1A6FE8','#9B3DB8',
  '#C0392B','#D4860A','#0891B2','#BE185D',
];

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export default function AddPlaylistModal({ onAdd, onClose }) {
  const [step, setStep] = useState('type'); // type | config
  const [type, setType] = useState(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleSelectType = (t) => {
    setType(t);
    setStep('config');
  };

  const handleFileSelect = async () => {
    if (isElectron) {
      const result = await window.electronAPI.openFileDialog();
      if (result) {
        setTextContent(result.content);
        if (!name) setName(result.filePath.split(/[\\/]/).pop().replace(/\.[^.]+$/, ''));
      }
    } else {
      fileRef.current?.click();
    }
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setTextContent(ev.target.result);
      if (!name) setName(file.name.replace(/\.[^.]+$/, ''));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Please enter a playlist name'); return; }
    if (type === 'url' && !url.trim()) { setError('Please enter a URL'); return; }
    if ((type === 'file' || type === 'text') && !textContent.trim()) {
      setError('No content to import');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onAdd({
        type,
        name: name.trim(),
        url: url.trim(),
        content: textContent,
        refreshInterval: type === 'url' ? Number(refreshInterval) : 0,
        color,
      });
    } catch (e) {
      setError('Failed to load playlist: ' + e.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{step === 'type' ? 'Add Playlist' : 'Configure Playlist'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {step === 'type' && (
          <div className="modal-type-grid">
            <button className="type-card" onClick={() => handleSelectType('url')}>
              <div className="type-icon" style={{ background: '#FDF0E8' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#E8651A" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#E8651A" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>From URL</h3>
              <p>Import via http/https link.<br/>Supports auto-refresh.</p>
            </button>
            <button className="type-card" onClick={() => handleSelectType('file')}>
              <div className="type-icon" style={{ background: '#EBF5EE' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#2E7D52" strokeWidth="2"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="#2E7D52" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>From File</h3>
              <p>Open a local .m3u, .m3u8,<br/>or .txt file.</p>
            </button>
            <button className="type-card" onClick={() => handleSelectType('text')}>
              <div className="type-icon" style={{ background: '#EEF2FF' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="#1A6FE8" strokeWidth="2"/>
                  <path d="M7 8h10M7 12h10M7 16h6" stroke="#1A6FE8" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Paste Text</h3>
              <p>Paste M3U or URL list<br/>directly.</p>
            </button>
          </div>
        )}

        {step === 'config' && (
          <div className="modal-config">
            {/* Name */}
            <div className="form-row">
              <label>Playlist Name</label>
              <input
                type="text"
                placeholder="My Playlist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* Color picker */}
            <div className="form-row">
              <label>Color</label>
              <div className="color-row">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={`color-dot ${color === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            {/* URL input */}
            {type === 'url' && (
              <>
                <div className="form-row">
                  <label>Playlist URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/playlist.m3u8"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label>Auto-refresh interval</label>
                  <div className="refresh-row">
                    {[0, 30, 60, 120, 360].map((v) => (
                      <button
                        key={v}
                        className={`refresh-chip ${refreshInterval === v ? 'active' : ''}`}
                        onClick={() => setRefreshInterval(v)}
                      >
                        {v === 0 ? 'Off' : `${v}m`}
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      placeholder="Custom min"
                      className="refresh-custom"
                      value={![0,30,60,120,360].includes(refreshInterval) ? refreshInterval : ''}
                      onChange={(e) => setRefreshInterval(+e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* File picker */}
            {type === 'file' && (
              <div className="form-row">
                <label>Playlist File</label>
                <button className="file-pick-btn" onClick={handleFileSelect}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v8M4 6l3-3 3 3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {textContent ? 'File loaded ✓' : 'Choose file (.m3u, .m3u8, .txt)'}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".m3u,.m3u8,.txt"
                  style={{ display: 'none' }}
                  onChange={handleFilePick}
                />
              </div>
            )}

            {/* Text area */}
            {type === 'text' && (
              <div className="form-row">
                <label>Playlist Content</label>
                <textarea
                  placeholder={'#EXTM3U\n#EXTINF:-1,Channel Name\nhttp://...'}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={7}
                  className="content-textarea"
                />
              </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setStep('type')}>← Back</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <><span className="btn-spinner" /> Loading…</>
                ) : 'Add Playlist'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
