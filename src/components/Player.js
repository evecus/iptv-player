import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import './Player.css';

export default function Player({ channel, volume, onVolumeChange }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const controlsTimer = useRef(null);
  const containerRef = useRef(null);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!channel?.url) {
      setStatus('idle'); destroyHls();
      if (videoRef.current) videoRef.current.src = '';
      return;
    }
    setStatus('loading'); setErrorMsg(''); destroyHls();
    const video = videoRef.current;
    const url = channel.url;

    const tryPlay = () => {
      const p = video.play();
      if (p !== undefined) {
        p.then(() => setStatus('playing')).catch((err) => {
          if (err.name === 'NotAllowedError') {
            video.muted = true;
            video.play()
              .then(() => { setMuted(true); setStatus('playing'); })
              .catch(() => setStatus('playing'));
          } else {
            setStatus('playing');
          }
        });
      } else {
        setStatus('playing');
      }
    };

    const onFatalError = (msg) => { setStatus('error'); setErrorMsg(msg || 'Stream unavailable'); };

    if (isHlsUrl(url)) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: false, lowLatencyMode: true, backBufferLength: 30 });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, tryPlay);
        hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) onFatalError('Stream error: ' + data.details); });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', tryPlay, { once: true });
      } else {
        onFatalError('HLS not supported');
      }
    } else {
      video.src = url;
      video.addEventListener('loadedmetadata', tryPlay, { once: true });
      video.addEventListener('error', () => onFatalError('Cannot load stream'), { once: true });
    }
    return destroyHls;
  }, [channel?.url, channel?.id, retryKey]);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    if (status === 'playing') {
      controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'playing') setShowControls(true);
    return () => clearTimeout(controlsTimer.current);
  }, [status]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) { containerRef.current?.requestFullscreen(); }
    else { document.exitFullscreen(); }
  };

  const handleRetry = () => {
    setStatus('loading'); setErrorMsg(''); destroyHls();
    if (videoRef.current) videoRef.current.src = '';
    setRetryKey((k) => k + 1);
  };

  return (
    <div
      className={`player-pane ${isFullscreen ? 'fullscreen' : ''}`}
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => status === 'playing' && setShowControls(false)}
    >
      {!channel && (
        <div className="player-idle">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="14" rx="3" stroke="var(--ink-faint)" strokeWidth="1.3"/>
            <path d="M10 9l5 3-5 3V9z" fill="var(--ink-faint)"/>
          </svg>
          <h2>Select a channel</h2>
          <p>Choose a channel from the list to start watching</p>
        </div>
      )}

      <video
        ref={videoRef}
        className="player-video"
        playsInline
        autoPlay
        style={{ display: channel ? 'block' : 'none' }}
      />

      {status === 'loading' && (
        <div className="player-overlay">
          <div className="player-spinner" />
          <span>Loading stream…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="player-overlay error">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#C0392B" strokeWidth="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="#C0392B" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>{errorMsg}</span>
          <button className="retry-btn" onClick={handleRetry}>Retry</button>
        </div>
      )}

      {status === 'playing' && muted && (
        <div className="muted-banner" onClick={() => { setMuted(false); if (videoRef.current) videoRef.current.muted = false; }}>
          🔇 Muted (autoplay policy) — click to unmute
        </div>
      )}

      {channel && (
        <div className={`player-controls ${showControls || status !== 'playing' ? 'visible' : ''}`}>
          <div className="controls-info">
            <div className="now-playing-dot" />
            <span className="now-playing-name ellipsis">{channel.name}</span>
            <span className="now-playing-group">{channel.group || ''}</span>
          </div>
          <div className="controls-right">
            <button className="ctrl-btn" onClick={() => setMuted((m) => !m)} title={muted ? 'Unmute' : 'Mute'}>
              {muted ? (
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/><path d="M23 9l-6 6M17 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
              )}
            </button>
            <input
              type="range" min="0" max="100"
              value={muted ? 0 : volume}
              onChange={(e) => { onVolumeChange(+e.target.value); setMuted(false); }}
              className="volume-slider"
            />
            <button className="ctrl-btn" onClick={handleFullscreen} title="Fullscreen">
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function isHlsUrl(url) {
  return /\.m3u8/i.test(url) || /\.(m3u8|ts)(\?|$)/i.test(url) || url.includes('/hls/') || url.includes('/live/');
}
