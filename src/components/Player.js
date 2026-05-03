import React, { useRef, useEffect, useState, useCallback } from 'react';
import Hls from 'hls.js';
import './Player.css';

export default function Player({ channel, volume, onVolumeChange }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | playing | error
  const [errorMsg, setErrorMsg] = useState('');
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef(null);
  const containerRef = useRef(null);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!channel?.url) {
      setStatus('idle');
      destroyHls();
      if (videoRef.current) videoRef.current.src = '';
      return;
    }

    setStatus('loading');
    setErrorMsg('');
    destroyHls();

    const video = videoRef.current;
    const url = channel.url;

    const onSuccess = () => setStatus('playing');
    const onError = (msg) => { setStatus('error'); setErrorMsg(msg || 'Stream unavailable'); };

    if (url.includes('.m3u8') || url.includes('m3u8') || isHlsUrl(url)) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: false,
          lowLatencyMode: true,
          backBufferLength: 30,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().then(onSuccess).catch(() => onError('Playback blocked'));
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) onError('HLS error: ' + data.type);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play().then(onSuccess).catch(() => onError('Playback failed'));
      } else {
        onError('HLS not supported in this browser');
      }
    } else {
      // Direct stream (HTTP, RTSP via proxy, etc.)
      video.src = url;
      video.play().then(onSuccess).catch(() => onError('Cannot play stream'));
    }

    return destroyHls;
  }, [channel?.url, channel?.id]);

  // Auto-hide controls
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

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleRetry = () => {
    if (channel) {
      setStatus('loading');
      setErrorMsg('');
      // Re-trigger useEffect
      const v = videoRef.current;
      if (v) { v.src = ''; v.load(); }
      destroyHls();
      setTimeout(() => setStatus('idle'), 50); // Will re-trigger mount
    }
  };

  return (
    <div
      className={`player-pane ${isFullscreen ? 'fullscreen' : ''}`}
      ref={containerRef}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => status === 'playing' && setShowControls(false)}
    >
      {/* No channel state */}
      {!channel && (
        <div className="player-idle">
          <div className="player-idle-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="14" rx="3" stroke="var(--ink-faint)" strokeWidth="1.3"/>
              <path d="M10 9l5 3-5 3V9z" fill="var(--ink-faint)"/>
            </svg>
          </div>
          <h2>Select a channel</h2>
          <p>Choose a channel from the list to start watching</p>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className="player-video"
        playsInline
        style={{ display: channel ? 'block' : 'none' }}
      />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="player-overlay">
          <div className="player-spinner" />
          <span>Loading stream…</span>
        </div>
      )}

      {/* Error overlay */}
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

      {/* Controls bar */}
      {channel && (
        <div className={`player-controls ${showControls || status !== 'playing' ? 'visible' : ''}`}>
          <div className="controls-info">
            <div className="now-playing-dot" />
            <span className="now-playing-name ellipsis">{channel.name}</span>
            <span className="now-playing-group">{channel.group || ''}</span>
          </div>
          <div className="controls-right">
            {/* Mute */}
            <button
              className="ctrl-btn"
              onClick={() => setMuted((m) => !m)}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? (
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/><path d="M23 9l-6 6M17 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
              )}
            </button>
            {/* Volume */}
            <input
              type="range"
              min="0" max="100"
              value={muted ? 0 : volume}
              onChange={(e) => { onVolumeChange(+e.target.value); setMuted(false); }}
              className="volume-slider"
              title="Volume"
            />
            {/* Fullscreen */}
            <button className="ctrl-btn" onClick={handleFullscreen} title="Fullscreen">
              {isFullscreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function isHlsUrl(url) {
  return /\.(m3u8|ts)(\?|$)/i.test(url) || url.includes('/hls/') || url.includes('/live/');
}
