import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import Board from '../components/Board.jsx';
import PlayerPanel from '../components/PlayerPanel.jsx';
import TurnIndicator from '../components/TurnIndicator.jsx';
import Timer from '../components/Timer.jsx';
import { gameReducer, ACTIONS } from '../game/reducer.js';
import { getCurrentTurn, createInitialState, createPlayers, computeStateHash } from '../game/engine.js';
import { playPlaceSound, playSelectSound, playTurnSound } from '../game/sounds.js';
import { Messages } from '../network/peer.js';

export default function GameScreen({
  settings,
  playerNames,
  networkRef,
  isHost,
  isOnline,
  localPlayerId,
  initialState,
  onGameEnd,
  onStateChange,
  onBack,
}) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const prevTurnRef = useRef(0);

  const currentTurn = getCurrentTurn(state);
  const isLocalTurn = isOnline
    ? (currentTurn && currentTurn.playerId === localPlayerId)
    : true; // in local hot-seat, everyone is local

  // Play turn change sound
  useEffect(() => {
    if (state.turnIndex !== prevTurnRef.current && state.turnIndex > 0) {
      playTurnSound();
      prevTurnRef.current = state.turnIndex;
    }
  }, [state.turnIndex]);

  // Detect game end
  useEffect(() => {
    if (state.phase === 'scoring' || state.phase === 'finished') {
      onGameEnd(state);
    }
  }, [state.phase]);

  // Sync incoming state from App.jsx (network updates) into local reducer
  const initialStateRef = useRef(initialState);
  useEffect(() => {
    if (initialState !== initialStateRef.current && isOnline) {
      initialStateRef.current = initialState;
      dispatch({ type: ACTIONS.SET_STATE, state: initialState });
    }
  }, [initialState, isOnline]);

  // Sync local reducer state back to App.jsx so host can validate guest moves
  useEffect(() => {
    if (isOnline && onStateChange) {
      onStateChange(state);
    }
  }, [state.turnIndex, state.phase]);

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleCellClick = useCallback((circleIndex) => {
    if (!currentTurn) return;
    if (state.phase !== 'playing') return;

    // In online mode, only the local player can act
    if (isOnline && currentTurn.playerId !== localPlayerId) return;

    // For free variant, must have selected a tile
    if (state.variant === 'free' && !state.selectedTile) return;

    playPlaceSound();

    if (isOnline && isHost) {
      // Host: apply locally and broadcast
      const tileValue = state.variant === 'free' ? state.selectedTile : currentTurn.tileValue;
      dispatch({ type: ACTIONS.PLACE_TILE, circleIndex, tileValue });
    } else if (isOnline && !isHost) {
      // Guest: send to host for validation
      const tileValue = state.variant === 'free' ? state.selectedTile : currentTurn.tileValue;
      networkRef.current?.send(Messages.placeTile(circleIndex, tileValue, localPlayerId));
    } else {
      // Local: apply directly
      dispatch({ type: ACTIONS.PLACE_TILE, circleIndex });
    }
  }, [currentTurn, state.phase, state.variant, state.selectedTile, isOnline, isHost, localPlayerId]);

  const handleSelectTile = useCallback((tileValue) => {
    if (state.variant !== 'free') return;
    playSelectSound();
    dispatch({ type: ACTIONS.SELECT_TILE, tileValue });

    if (isOnline && !isHost) {
      networkRef.current?.send(Messages.selectTile(tileValue, localPlayerId));
    }
  }, [state.variant, isOnline, isHost, localPlayerId]);

  const handleTimerExpire = useCallback(() => {
    if (!isLocalTurn && isOnline) return;
    dispatch({ type: ACTIONS.AUTO_PLACE });
  }, [isLocalTurn, isOnline]);

  // Broadcast state after each local dispatch (host only)
  useEffect(() => {
    if (isOnline && isHost && networkRef.current) {
      networkRef.current.broadcast(Messages.gameState(state));
    }
  }, [state.turnIndex, state.phase, isOnline, isHost]);

  // ─── Max tile per player ───────────────────────────────────────────

  const getMaxTile = (playerIndex) => {
    if (settings.mode === '2player') return 10;
    return playerIndex < 2 ? 7 : 6;
  };

  // ─── Render ────────────────────────────────────────────────────────

  const activePlayerName = currentTurn
    ? state.players.find(p => p.id === currentTurn.playerId)?.name || currentTurn.playerId
    : '';

  return (
    <div className="screen game-screen">
      <div className="game-header">
        <button className="btn btn--ghost btn--small" onClick={onBack}>
          ← Leave
        </button>
        <div className="game-header__info">
          {state.totalRounds > 1 && (
            <span className="game-header__round">Round {state.round}/{state.totalRounds}</span>
          )}
          <span className="game-header__turn">
            Turn {Math.min(state.turnIndex + 1, state.turnSchedule.length)}/{state.turnSchedule.length}
          </span>
        </div>
      </div>

      <TurnIndicator
        currentTurn={currentTurn}
        variant={state.variant}
        selectedTile={state.selectedTile}
        isLocalTurn={isLocalTurn}
        playerName={activePlayerName}
      />

      {settings.turnTimer > 0 && state.phase === 'playing' && (
        <Timer
          seconds={settings.turnTimer}
          onExpire={handleTimerExpire}
          isActive={isLocalTurn || !isOnline}
          turnIndex={state.turnIndex}
        />
      )}

      <Board
        board={state.board}
        blackHoleIndex={state.blackHoleIndex}
        onCellClick={handleCellClick}
        disabled={!isLocalTurn && isOnline}
        currentPlayerId={currentTurn?.playerId}
      />

      <div className="game-players">
        {state.players.map((player, i) => (
          <PlayerPanel
            key={player.id}
            player={player}
            isActive={currentTurn && currentTurn.playerId === player.id}
            showScore={state.phase !== 'playing'}
            maxTile={getMaxTile(i)}
            isLocalPlayer={!isOnline || player.id === localPlayerId}
            variant={state.variant}
            selectedTile={state.selectedTile}
            onSelectTile={handleSelectTile}
          />
        ))}
      </div>
    </div>
  );
}
