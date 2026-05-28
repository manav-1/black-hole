import React, { useState } from 'react';
import { VARIANTS, DEFAULT_SETTINGS } from '../game/constants.js';
import { unlockAudio } from '../game/sounds.js';

export default function HomeScreen({ onStartLocal, onCreateOnline, onJoinOnline }) {
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [playerNames, setPlayerNames] = useState(['', '']);
  const [pendingAction, setPendingAction] = useState(null); // 'local' | 'online'

  const handleAction = (action) => {
    unlockAudio();
    setPendingAction(action);
    setShowSettings(true);
  };

  const handleStartWithSettings = () => {
    const names = playerNames.filter(n => n.trim());
    if (pendingAction === 'local') {
      onStartLocal(settings, names);
    } else if (pendingAction === 'online') {
      onCreateOnline(settings, names[0] || '');
    }
    setShowSettings(false);
  };

  const handleJoin = () => {
    unlockAudio();
    if (joinCode.trim().length >= 4) {
      onJoinOnline(joinCode.trim().toUpperCase(), joinName.trim() || 'Guest');
    }
  };

  const playerCount = settings.mode === '3player' ? 3 : 2;

  return (
    <div className="screen home-screen">
      {/* Animated background */}
      <div className="stars-bg">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
            }}
          />
        ))}
      </div>

      <div className="home-content">
        {/* Logo */}
        <div className="home-logo">
          <div className="home-logo__hole">
            <div className="home-logo__ring" />
            <div className="home-logo__ring home-logo__ring--2" />
            <div className="home-logo__core" />
          </div>
          <h1 className="home-title">BLACK HOLE</h1>
          <p className="home-subtitle">A strategy game of gravity and numbers</p>
        </div>

        {/* Main actions */}
        {!showSettings && !showJoin && (
          <div className="home-actions">
            <button className="btn btn--primary btn--large" onClick={() => handleAction('local')}>
              <span className="btn__icon">🎮</span>
              Play Locally
            </button>
            <button className="btn btn--secondary btn--large" onClick={() => handleAction('online')}>
              <span className="btn__icon">🌐</span>
              Create Online Game
            </button>
            <button className="btn btn--outline btn--large" onClick={() => { unlockAudio(); setShowJoin(true); }}>
              <span className="btn__icon">🔗</span>
              Join Game
            </button>
          </div>
        )}

        {/* Join modal */}
        {showJoin && (
          <div className="home-join glass-card">
            <h3>Join a Game</h3>
            <p>Enter the room code shared by the host</p>
            <input
              type="text"
              className="input-name"
              placeholder="Your name"
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              autoFocus
            />
            <input
              type="text"
              className="input-code"
              placeholder="ROOM CODE"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <div className="home-join__actions">
              <button className="btn btn--primary" onClick={handleJoin} disabled={joinCode.trim().length < 4}>
                Join
              </button>
              <button className="btn btn--ghost" onClick={() => setShowJoin(false)}>
                Back
              </button>
            </div>
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div className="home-settings glass-card">
            <h3>Game Settings</h3>

            {/* Player count */}
            <div className="setting-group">
              <label className="setting-label">Players</label>
              <div className="setting-toggle">
                <button
                  className={`toggle-btn ${settings.mode === '2player' ? 'toggle-btn--active' : ''}`}
                  onClick={() => {
                    setSettings(s => ({ ...s, mode: '2player' }));
                    setPlayerNames(prev => prev.slice(0, 2));
                  }}
                >2 Players</button>
                <button
                  className={`toggle-btn ${settings.mode === '3player' ? 'toggle-btn--active' : ''}`}
                  onClick={() => {
                    setSettings(s => ({ ...s, mode: '3player' }));
                    setPlayerNames(prev => [...prev.slice(0, 2), prev[2] || '']);
                  }}
                >3 Players</button>
              </div>
            </div>

            {/* Player names (local only) */}
            {pendingAction === 'local' && (
              <div className="setting-group">
                <label className="setting-label">Player Names</label>
                {Array.from({ length: playerCount }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    className="input-name"
                    placeholder={`Player ${i + 1}`}
                    value={playerNames[i] || ''}
                    onChange={e => {
                      const names = [...playerNames];
                      names[i] = e.target.value;
                      setPlayerNames(names);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Online name */}
            {pendingAction === 'online' && (
              <div className="setting-group">
                <label className="setting-label">Your Name</label>
                <input
                  type="text"
                  className="input-name"
                  placeholder="Enter your name"
                  value={playerNames[0] || ''}
                  onChange={e => setPlayerNames([e.target.value])}
                />
              </div>
            )}

            {/* Variant */}
            <div className="setting-group">
              <label className="setting-label">Variant</label>
              <div className="setting-variants">
                {Object.entries(VARIANTS).map(([key, v]) => (
                  <button
                    key={key}
                    className={`variant-btn ${settings.variant === key ? 'variant-btn--active' : ''}`}
                    onClick={() => setSettings(s => ({ ...s, variant: key }))}
                  >
                    <strong>{v.label}</strong>
                    <span>{v.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rounds */}
            <div className="setting-group">
              <label className="setting-label">Rounds</label>
              <div className="setting-toggle">
                {[1, 3, 5].map(n => (
                  <button
                    key={n}
                    className={`toggle-btn ${settings.totalRounds === n ? 'toggle-btn--active' : ''}`}
                    onClick={() => setSettings(s => ({ ...s, totalRounds: n }))}
                  >{n}</button>
                ))}
              </div>
            </div>

            {/* Turn timer */}
            <div className="setting-group">
              <label className="setting-label">Turn Timer</label>
              <div className="setting-toggle">
                {[0, 15, 30, 60].map(n => (
                  <button
                    key={n}
                    className={`toggle-btn ${settings.turnTimer === n ? 'toggle-btn--active' : ''}`}
                    onClick={() => setSettings(s => ({ ...s, turnTimer: n }))}
                  >{n === 0 ? 'Off' : `${n}s`}</button>
                ))}
              </div>
            </div>

            <div className="home-settings__actions">
              <button className="btn btn--primary btn--large" onClick={handleStartWithSettings}>
                {pendingAction === 'local' ? 'Start Game' : 'Create Room'}
              </button>
              <button className="btn btn--ghost" onClick={() => { setShowSettings(false); setPendingAction(null); }}>
                Back
              </button>
            </div>
          </div>
        )}

        <footer className="home-footer">
          <p>Original design by Walter Joris</p>
        </footer>
      </div>
    </div>
  );
}
