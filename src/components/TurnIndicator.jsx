import React from 'react';
import { PLAYER_COLORS } from '../game/constants.js';

export default function TurnIndicator({ currentTurn, variant, selectedTile, isLocalTurn, playerName }) {
  if (!currentTurn) return null;

  const colorDef = PLAYER_COLORS.find(c => c.id === currentTurn.playerId) || PLAYER_COLORS[0];

  let message;
  if (variant === 'free') {
    if (isLocalTurn) {
      message = selectedTile
        ? <>Place your <strong style={{ color: colorDef.hex }}>{selectedTile}</strong></>
        : <>Select a tile to place</>;
    } else {
      message = <>{playerName} is choosing…</>;
    }
  } else if (variant === 'blind') {
    if (isLocalTurn) {
      message = <>You drew <strong style={{ color: colorDef.hex }}>{currentTurn.tileValue}</strong> — place it!</>;
    } else {
      message = <>{playerName} drew a tile…</>;
    }
  } else {
    if (isLocalTurn) {
      message = <>Place your <strong style={{ color: colorDef.hex }}>{currentTurn.tileValue}</strong></>;
    } else {
      message = <>Waiting for <strong style={{ color: colorDef.hex }}>{playerName}</strong>…</>;
    }
  }

  return (
    <div className="turn-indicator" style={{ '--turn-color': colorDef.hex }}>
      <div className="turn-indicator__dot" style={{ background: colorDef.hex }} />
      <span className="turn-indicator__text">{message}</span>
    </div>
  );
}
