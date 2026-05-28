import { ADJACENCY, BOARD_SIZE, PLAYER_COLORS } from './constants.js';

// ─── Turn Schedule ─────────────────────────────────────────────────

export function buildTurnSchedule(players, variant) {
  const schedule = [];

  if (players.length === 2) {
    // 2-player: each gets tiles 1–10, 20 turns total
    const maxTile = 10;
    for (let value = 1; value <= maxTile; value++) {
      for (const p of players) {
        schedule.push({ playerId: p.id, tileValue: value });
      }
    }
  } else {
    // 3-player: players get 7, 7, 6 tiles on 21-circle board (20 tiles, 1 hole)
    const tileCounts = [7, 7, 6];
    const maxTile = Math.max(...tileCounts);
    for (let value = 1; value <= maxTile; value++) {
      for (let i = 0; i < players.length; i++) {
        if (value <= tileCounts[i]) {
          schedule.push({ playerId: players[i].id, tileValue: value });
        }
      }
    }
  }

  // For blind draw, shuffle the tile values within each player's pool
  if (variant === 'blind') {
    // Group by player
    const byPlayer = {};
    for (const turn of schedule) {
      if (!byPlayer[turn.playerId]) byPlayer[turn.playerId] = [];
      byPlayer[turn.playerId].push(turn.tileValue);
    }
    // Shuffle each player's values
    for (const pid in byPlayer) {
      shuffleArray(byPlayer[pid]);
    }
    // Reassign shuffled values back
    const counters = {};
    for (const turn of schedule) {
      if (!counters[turn.playerId]) counters[turn.playerId] = 0;
      turn.tileValue = byPlayer[turn.playerId][counters[turn.playerId]++];
    }
  }

  return schedule;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ─── Initial State ─────────────────────────────────────────────────

export function createPlayers(mode, names = []) {
  const count = mode === '3player' ? 3 : 2;
  return Array.from({ length: count }, (_, i) => ({
    id: PLAYER_COLORS[i].id,
    name: names[i] || PLAYER_COLORS[i].name,
    color: PLAYER_COLORS[i].hex,
    colorId: PLAYER_COLORS[i].id,
    tilesPlaced: [],
    score: 0,
    cumulativeScore: 0,
  }));
}

export function createInitialState(players, settings) {
  const board = Array.from({ length: BOARD_SIZE }, () => ({
    tileValue: null,
    playerId: null,
  }));

  const schedule = buildTurnSchedule(players, settings.variant);

  return {
    board,
    players: players.map(p => ({ ...p, tilesPlaced: [], score: 0 })),
    turnIndex: 0,
    turnSchedule: schedule,
    phase: 'playing',
    blackHoleIndex: null,
    mode: settings.mode,
    variant: settings.variant,
    round: 1,
    totalRounds: settings.totalRounds,
    turnTimer: settings.turnTimer,
    selectedTile: null, // for free placement variant
  };
}

// ─── Place Tile ────────────────────────────────────────────────────

export function placeTile(state, circleIndex, overrideTileValue = null) {
  if (state.phase !== 'playing') return state;
  if (circleIndex < 0 || circleIndex >= BOARD_SIZE) return state;
  if (state.board[circleIndex].tileValue !== null) return state;
  if (state.turnIndex >= state.turnSchedule.length) return state;

  const currentTurn = state.turnSchedule[state.turnIndex];
  const tileValue = overrideTileValue || state.selectedTile || currentTurn.tileValue;

  // For free variant, a tile must be selected
  if (state.variant === 'free' && !overrideTileValue && !state.selectedTile) {
    return state;
  }

  const newBoard = state.board.map((cell, i) =>
    i === circleIndex
      ? { tileValue, playerId: currentTurn.playerId }
      : { ...cell }
  );

  const newPlayers = state.players.map(p =>
    p.id === currentTurn.playerId
      ? { ...p, tilesPlaced: [...p.tilesPlaced, tileValue] }
      : { ...p }
  );

  const newTurnIndex = state.turnIndex + 1;
  const gameOver = newTurnIndex >= state.turnSchedule.length;

  let newState = {
    ...state,
    board: newBoard,
    players: newPlayers,
    turnIndex: newTurnIndex,
    selectedTile: null,
  };

  if (gameOver) {
    const result = calculateScores(newState);
    newState = {
      ...newState,
      phase: 'scoring',
      blackHoleIndex: result.blackHoleIndex,
      players: newState.players.map(p => ({
        ...p,
        score: result.scores[p.id] || 0,
      })),
    };
  }

  return newState;
}

// ─── Select Tile (for free placement) ──────────────────────────────

export function selectTile(state, tileValue) {
  if (state.variant !== 'free') return state;
  if (state.phase !== 'playing') return state;

  const currentTurn = state.turnSchedule[state.turnIndex];
  const player = state.players.find(p => p.id === currentTurn.playerId);
  if (!player) return state;

  // Check tile is available (not already placed)
  if (player.tilesPlaced.includes(tileValue)) return state;

  // Check tile is in player's range
  const maxTile = state.mode === '2player' ? 10 : (
    state.players.indexOf(player) < 2 ? 7 : 6
  );
  if (tileValue < 1 || tileValue > maxTile) return state;

  return { ...state, selectedTile: tileValue };
}

// ─── Scoring ───────────────────────────────────────────────────────

export function calculateScores(state) {
  // Find the black hole (empty circle)
  let blackHoleIndex = -1;
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (state.board[i].tileValue === null) {
      blackHoleIndex = i;
      break;
    }
  }

  const scores = {};
  state.players.forEach(p => { scores[p.id] = 0; });

  if (blackHoleIndex >= 0) {
    const neighbours = ADJACENCY[blackHoleIndex];
    for (const ni of neighbours) {
      const cell = state.board[ni];
      if (cell.playerId && cell.tileValue !== null) {
        scores[cell.playerId] += cell.tileValue;
      }
    }
  }

  return { blackHoleIndex, scores };
}

// ─── Get Current Turn Info ─────────────────────────────────────────

export function getCurrentTurn(state) {
  if (state.turnIndex >= state.turnSchedule.length) return null;
  return state.turnSchedule[state.turnIndex];
}

export function getAvailableTiles(state, playerId) {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  const maxTile = state.mode === '2player' ? 10 : (
    state.players.findIndex(p => p.id === playerId) < 2 ? 7 : 6
  );

  const available = [];
  for (let v = 1; v <= maxTile; v++) {
    if (!player.tilesPlaced.includes(v)) {
      available.push(v);
    }
  }
  return available;
}

// ─── Winner ────────────────────────────────────────────────────────

export function getWinner(state) {
  if (state.phase !== 'scoring' && state.phase !== 'finished') return null;

  const sorted = [...state.players].sort((a, b) => a.score - b.score);
  if (sorted.length >= 2 && sorted[0].score === sorted[1].score) {
    return null; // tie
  }
  return sorted[0];
}

export function getWinnerByTotal(state) {
  if (state.phase !== 'finished') return null;

  const sorted = [...state.players].sort((a, b) => a.cumulativeScore - b.cumulativeScore);
  if (sorted.length >= 2 && sorted[0].cumulativeScore === sorted[1].cumulativeScore) {
    return null;
  }
  return sorted[0];
}

// ─── Multi-round ───────────────────────────────────────────────────

export function advanceRound(state) {
  if (state.phase !== 'scoring') return state;

  const newPlayers = state.players.map(p => ({
    ...p,
    cumulativeScore: p.cumulativeScore + p.score,
    tilesPlaced: [],
    score: 0,
  }));

  if (state.round >= state.totalRounds) {
    return {
      ...state,
      phase: 'finished',
      players: newPlayers,
    };
  }

  // Start new round
  const schedule = buildTurnSchedule(newPlayers, state.variant);
  return {
    ...state,
    board: Array.from({ length: BOARD_SIZE }, () => ({ tileValue: null, playerId: null })),
    players: newPlayers,
    turnIndex: 0,
    turnSchedule: schedule,
    phase: 'playing',
    blackHoleIndex: null,
    round: state.round + 1,
    selectedTile: null,
  };
}

// ─── State Hash (for WebRTC sync) ──────────────────────────────────

export function computeStateHash(state) {
  const data = state.board.map(c => `${c.playerId || '_'}:${c.tileValue ?? '_'}`).join(',');
  return btoa(data);
}

// ─── Auto-place (for turn timer expiry) ────────────────────────────

export function autoPlace(state) {
  const emptyCells = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (state.board[i].tileValue === null) emptyCells.push(i);
  }
  if (emptyCells.length === 0) return state;

  const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];

  if (state.variant === 'free') {
    const current = getCurrentTurn(state);
    if (current) {
      const available = getAvailableTiles(state, current.playerId);
      if (available.length > 0) {
        const randomTile = available[Math.floor(Math.random() * available.length)];
        return placeTile({ ...state, selectedTile: randomTile }, randomIndex);
      }
    }
  }

  return placeTile(state, randomIndex);
}
