import React from 'react';
import { PLAYER_COLORS } from '../game/constants.js';

export default function PlayerPanel({
  player,
  isActive,
  showScore,
  maxTile,
  isLocalPlayer,
  variant,
  selectedTile,
  onSelectTile,
}) {
  const colorDef = PLAYER_COLORS.find(c => c.id === player.colorId) || PLAYER_COLORS[0];
  const tiles = Array.from({ length: maxTile }, (_, i) => i + 1);

  return (
    <div
      className={`player-panel ${isActive ? 'player-panel--active' : ''}`}
      style={{ '--player-color': colorDef.hex, '--player-glow': colorDef.glow, '--player-bg': colorDef.bg }}
    >
      <div className="player-panel__header">
        <div className="player-panel__color-dot" style={{ background: colorDef.hex }} />
        <span className="player-panel__name">{player.name}</span>
        {isActive && <span className="player-panel__turn-badge">YOUR TURN</span>}
        {isLocalPlayer && !isActive && <span className="player-panel__you-badge">YOU</span>}
      </div>

      {showScore && (
        <div className="player-panel__score">
          <span className="player-panel__score-label">Score</span>
          <span className="player-panel__score-value">{player.score}</span>
          {player.cumulativeScore > 0 && (
            <span className="player-panel__cumulative">(Total: {player.cumulativeScore + player.score})</span>
          )}
        </div>
      )}

      <div className="player-panel__tiles">
        {tiles.map(v => {
          const placed = player.tilesPlaced.includes(v);
          const isSelected = variant === 'free' && selectedTile === v && isActive;
          const canSelect = variant === 'free' && isActive && isLocalPlayer && !placed;

          return (
            <button
              key={v}
              className={`tile-chip ${placed ? 'tile-chip--placed' : ''} ${isSelected ? 'tile-chip--selected' : ''} ${canSelect ? 'tile-chip--selectable' : ''}`}
              style={!placed ? { '--chip-color': colorDef.hex } : {}}
              onClick={() => canSelect && onSelectTile && onSelectTile(v)}
              disabled={placed || !canSelect}
              aria-label={`Tile ${v}${placed ? ' (placed)' : ''}${isSelected ? ' (selected)' : ''}`}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}
