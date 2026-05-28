import React, { useState, useRef, useCallback } from 'react';
import HomeScreen from './screens/HomeScreen.jsx';
import LobbyScreen from './screens/LobbyScreen.jsx';
import GameScreen from './screens/GameScreen.jsx';
import ResultsScreen from './screens/ResultsScreen.jsx';
import { createPlayers, createInitialState, buildTurnSchedule, advanceRound, placeTile, computeStateHash } from './game/engine.js';
import { PLAYER_COLORS, DEFAULT_SETTINGS } from './game/constants.js';
import { createRoom, joinRoom, Messages } from './network/peer.js';
import { playConnectSound, playDisconnectSound } from './game/sounds.js';

export default function App() {
  const [screen, setScreen] = useState('home'); // home | lobby | game | results
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [localPlayerId, setLocalPlayerId] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const networkRef = useRef(null);
  const gameStateRef = useRef(null); // for host to track latest state

  // ─── Cleanup ─────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (networkRef.current) {
      networkRef.current.destroy();
      networkRef.current = null;
    }
  }, []);

  // ─── Local Game ──────────────────────────────────────────────────

  const startLocalGame = useCallback((gameSettings, names) => {
    const playerList = createPlayers(gameSettings.mode, names);
    const state = createInitialState(playerList, gameSettings);
    setSettings(gameSettings);
    setPlayers(playerList);
    setGameState(state);
    setIsOnline(false);
    setIsHost(false);
    setScreen('game');
  }, []);

  // ─── Create Online Game (Host) ───────────────────────────────────

  const createOnlineGame = useCallback((gameSettings, hostName) => {
    setSettings(gameSettings);
    setIsHost(true);
    setIsOnline(true);
    setLocalPlayerId(PLAYER_COLORS[0].id);
    setConnectionStatus('connecting');

    const hostPlayer = {
      id: PLAYER_COLORS[0].id,
      name: hostName || PLAYER_COLORS[0].name,
      color: PLAYER_COLORS[0].hex,
      colorId: PLAYER_COLORS[0].id,
      tilesPlaced: [],
      score: 0,
      cumulativeScore: 0,
    };

    setPlayers([hostPlayer]);

    const room = createRoom(
      // onReady
      (code) => {
        setRoomCode(code);
        setConnectionStatus('waiting');
        setScreen('lobby');
      },
      // onGuestJoin
      (conn) => {
        playConnectSound();
        // Guest will send PLAYER_JOIN message
      },
      // onMessage
      (conn, data) => {
        if (data.type === 'PLAYER_JOIN') {
          setPlayers(prev => {
            const colorIndex = prev.length;
            if (colorIndex >= 3) return prev; // max 3 players
            const guestPlayer = {
              id: PLAYER_COLORS[colorIndex].id,
              name: data.payload.name || PLAYER_COLORS[colorIndex].name,
              color: PLAYER_COLORS[colorIndex].hex,
              colorId: PLAYER_COLORS[colorIndex].id,
              tilesPlaced: [],
              score: 0,
              cumulativeScore: 0,
            };
            const newPlayers = [...prev, guestPlayer];
            // Tell guest their assigned identity
            conn.send({
              type: 'PLAYER_ASSIGNED',
              payload: { playerId: guestPlayer.id, players: newPlayers },
            });
            // Broadcast updated player list to all connections
            room.broadcast({
              type: 'PLAYER_LIST',
              payload: { players: newPlayers },
            });
            return newPlayers;
          });
          setConnectionStatus('connected');
        } else if (data.type === 'PLACE_TILE') {
          // Host validates and applies
          const currentState = gameStateRef.current;
          if (!currentState || currentState.phase !== 'playing') return;

          const currentTurn = currentState.turnSchedule[currentState.turnIndex];
          if (!currentTurn) return;
          if (currentTurn.playerId !== data.payload.playerId) return;
          if (currentState.board[data.payload.circleIndex].tileValue !== null) return;

          const newState = placeTile(
            currentState,
            data.payload.circleIndex,
            data.payload.tileValue
          );
          gameStateRef.current = newState;
          setGameState({ ...newState });

          // Broadcast validated state
          room.broadcast(Messages.gameState(newState));
        } else if (data.type === 'RESYNC_REQ') {
          const currentState = gameStateRef.current;
          if (currentState) {
            conn.send(Messages.gameState(currentState));
          }
        }
      },
      // onGuestLeave
      (conn) => {
        playDisconnectSound();
      },
      // onError
      (err) => {
        setConnectionStatus('error');
      }
    );

    networkRef.current = room;
  }, []);

  // ─── Join Online Game (Guest) ────────────────────────────────────

  const joinOnlineGame = useCallback((code, guestName) => {
    setIsHost(false);
    setIsOnline(true);
    setRoomCode(code);
    setConnectionStatus('connecting');
    setScreen('lobby');

    const guest = joinRoom(
      code,
      // onConnect
      (conn) => {
        playConnectSound();
        setConnectionStatus('connected');
        conn.send(Messages.playerJoin('', guestName || 'Guest', ''));
      },
      // onMessage
      (data) => {
        if (data.type === 'PLAYER_ASSIGNED') {
          setLocalPlayerId(data.payload.playerId);
          setPlayers(data.payload.players);
        } else if (data.type === 'PLAYER_LIST') {
          setPlayers(data.payload.players);
        } else if (data.type === 'GAME_INIT') {
          setSettings(data.payload.settings);
          setPlayers(data.payload.players);
          const state = createInitialState(data.payload.players, data.payload.settings);
          state.turnSchedule = data.payload.turnSchedule;
          setGameState(state);
          setScreen('game');
        } else if (data.type === 'GAME_STATE') {
          const newState = data.payload;
          setGameState({ ...newState });
          gameStateRef.current = newState;

          if (newState.phase === 'scoring' || newState.phase === 'finished') {
            setGameState({ ...newState });
          }
        }
      },
      // onDisconnect
      () => {
        playDisconnectSound();
        setConnectionStatus('error');
      },
      // onError
      (err) => {
        setConnectionStatus('error');
      }
    );

    networkRef.current = guest;
  }, []);

  // ─── Host starts game ───────────────────────────────────────────

  const handleLobbyStart = useCallback(() => {
    const state = createInitialState(players, settings);
    gameStateRef.current = state;
    setGameState(state);
    setScreen('game');

    // Broadcast GAME_INIT to all guests
    if (networkRef.current) {
      networkRef.current.broadcast(Messages.gameInit(players, state.turnSchedule, settings));
    }
  }, [players, settings]);

  // ─── Game end ────────────────────────────────────────────────────

  const handleGameEnd = useCallback((endState) => {
    gameStateRef.current = endState;
    setGameState(endState);
    // Small delay for dramatic effect
    setTimeout(() => {
      setScreen('results');
    }, 800);
  }, []);

  // ─── Play again / next round ─────────────────────────────────────

  const handleNextRound = useCallback(() => {
    if (!gameState) return;
    const nextState = advanceRound(gameState);
    gameStateRef.current = nextState;
    setGameState(nextState);
    setScreen('game');

    if (isOnline && isHost && networkRef.current) {
      networkRef.current.broadcast(Messages.gameState(nextState));
    }
  }, [gameState, isOnline, isHost]);

  const handlePlayAgain = useCallback(() => {
    const resetPlayers = players.map(p => ({
      ...p,
      tilesPlaced: [],
      score: 0,
      cumulativeScore: 0,
    }));
    const state = createInitialState(resetPlayers, settings);
    gameStateRef.current = state;
    setPlayers(resetPlayers);
    setGameState(state);
    setScreen('game');

    if (isOnline && isHost && networkRef.current) {
      networkRef.current.broadcast(Messages.gameInit(resetPlayers, state.turnSchedule, settings));
    }
  }, [players, settings, isOnline, isHost]);

  const handleNewGame = useCallback(() => {
    cleanup();
    setScreen('home');
    setGameState(null);
    setPlayers([]);
    setIsOnline(false);
    setIsHost(false);
    setRoomCode('');
    setConnectionStatus('connecting');
  }, [cleanup]);

  const handleBack = useCallback(() => {
    cleanup();
    handleNewGame();
  }, [cleanup, handleNewGame]);

  // ─── Update gameStateRef when GameScreen dispatches ──────────────

  // We need to sync gameStateRef for the host's message handler
  const handleGameStateUpdate = useCallback((newState) => {
    gameStateRef.current = newState;
  }, []);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen
          onStartLocal={startLocalGame}
          onCreateOnline={createOnlineGame}
          onJoinOnline={joinOnlineGame}
        />
      )}

      {screen === 'lobby' && (
        <LobbyScreen
          roomCode={roomCode}
          isHost={isHost}
          players={players}
          settings={settings}
          onStart={handleLobbyStart}
          onBack={handleBack}
          connectionStatus={connectionStatus}
        />
      )}

      {screen === 'game' && gameState && (
        <GameScreen
          settings={settings}
          playerNames={players.map(p => p.name)}
          networkRef={networkRef}
          isHost={isHost}
          isOnline={isOnline}
          localPlayerId={localPlayerId}
          initialState={gameState}
          onGameEnd={handleGameEnd}
          onStateChange={handleGameStateUpdate}
          onBack={handleBack}
        />
      )}

      {screen === 'results' && gameState && (
        <ResultsScreen
          state={gameState}
          onPlayAgain={handlePlayAgain}
          onNewGame={handleNewGame}
          onNextRound={handleNextRound}
          isMultiRound={settings.totalRounds > 1}
        />
      )}
    </div>
  );
}
