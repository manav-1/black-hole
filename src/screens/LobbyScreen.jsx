import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PLAYER_COLORS, VARIANTS } from '../game/constants.js';
import { playConnectSound, playDisconnectSound } from '../game/sounds.js';

export default function LobbyScreen({
  roomCode,
  isHost,
  players,
  settings,
  onStart,
  onBack,
  onUpdateSettings,
  connectionStatus,
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const minPlayers = settings.mode === '3player' ? 3 : 2;
  const canStart = isHost && players.length >= minPlayers;

  return (
    <div className="screen lobby-screen">
      <div className="stars-bg">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="lobby-content">
        <h2 className="lobby-title">Game Lobby</h2>

        {/* Room code */}
        <div className="lobby-code glass-card" onClick={copyCode}>
          <span className="lobby-code__label">Room Code</span>
          <span className="lobby-code__value">{roomCode}</span>
          <span className="lobby-code__hint">{copied ? '✓ Copied!' : 'Click to copy'}</span>
        </div>

        {/* Connection status */}
        <div className={`lobby-status lobby-status--${connectionStatus}`}>
          <div className="lobby-status__dot" />
          <span>
            {connectionStatus === 'connecting' && 'Connecting…'}
            {connectionStatus === 'connected' && 'Connected'}
            {connectionStatus === 'waiting' && 'Waiting for players…'}
            {connectionStatus === 'error' && 'Connection error'}
          </span>
        </div>

        {/* Players list */}
        <div className="lobby-players glass-card">
          <h3>Players ({players.length}/{minPlayers})</h3>
          <div className="lobby-players__list">
            {players.map((p, i) => {
              const color = PLAYER_COLORS[i];
              return (
                <div key={p.id || i} className="lobby-player">
                  <div className="lobby-player__dot" style={{ background: color?.hex }} />
                  <span className="lobby-player__name">{p.name || color?.name}</span>
                  {i === 0 && <span className="lobby-player__badge">Host</span>}
                </div>
              );
            })}
            {Array.from({ length: Math.max(0, minPlayers - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="lobby-player lobby-player--empty">
                <div className="lobby-player__dot lobby-player__dot--empty" />
                <span className="lobby-player__name">Waiting…</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings display */}
        <div className="lobby-settings glass-card">
          <h3>Settings</h3>
          <div className="lobby-settings__grid">
            <div className="lobby-setting">
              <span className="lobby-setting__label">Mode</span>
              <span className="lobby-setting__value">{settings.mode === '3player' ? '3 Players' : '2 Players'}</span>
            </div>
            <div className="lobby-setting">
              <span className="lobby-setting__label">Variant</span>
              <span className="lobby-setting__value">{VARIANTS[settings.variant]?.label}</span>
            </div>
            <div className="lobby-setting">
              <span className="lobby-setting__label">Rounds</span>
              <span className="lobby-setting__value">{settings.totalRounds}</span>
            </div>
            <div className="lobby-setting">
              <span className="lobby-setting__label">Timer</span>
              <span className="lobby-setting__value">{settings.turnTimer === 0 ? 'Off' : `${settings.turnTimer}s`}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="lobby-actions">
          {isHost && (
            <button
              className="btn btn--primary btn--large"
              disabled={!canStart}
              onClick={onStart}
            >
              {canStart ? 'Start Game' : `Waiting for ${minPlayers - players.length} more…`}
            </button>
          )}
          {!isHost && (
            <p className="lobby-waiting-msg">Waiting for host to start the game…</p>
          )}
          <button className="btn btn--ghost" onClick={onBack}>
            Leave Lobby
          </button>
        </div>
      </div>
    </div>
  );
}
