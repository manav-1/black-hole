import { Peer } from 'peerjs';
import { computeStateHash } from '../game/engine.js';

const ROOM_CODE_LENGTH = 6;
const PEER_PREFIX = 'BLACKHOLE_';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Host ──────────────────────────────────────────────────────────

export function createRoom(onReady, onGuestJoin, onMessage, onGuestLeave, onError) {
  const roomCode = generateRoomCode();
  const peerId = PEER_PREFIX + roomCode;

  const peer = new Peer(peerId, {
    debug: 0,
  });

  const connections = [];

  peer.on('open', () => {
    onReady(roomCode);
  });

  peer.on('connection', (conn) => {
    conn.on('open', () => {
      connections.push(conn);
      onGuestJoin(conn);
    });

    conn.on('data', (data) => {
      onMessage(conn, data);
    });

    conn.on('close', () => {
      const idx = connections.indexOf(conn);
      if (idx !== -1) connections.splice(idx, 1);
      onGuestLeave(conn);
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
    });
  });

  peer.on('error', (err) => {
    console.error('Peer error:', err);
    onError(err);
  });

  return {
    peer,
    roomCode,
    getConnections: () => connections,
    broadcast: (message) => {
      for (const conn of connections) {
        try { conn.send(message); } catch (e) {}
      }
    },
    send: (conn, message) => {
      try { conn.send(message); } catch (e) {}
    },
    destroy: () => {
      for (const conn of connections) {
        try { conn.close(); } catch (e) {}
      }
      peer.destroy();
    },
  };
}

// ─── Guest ─────────────────────────────────────────────────────────

export function joinRoom(roomCode, onConnect, onMessage, onDisconnect, onError) {
  const peer = new Peer(undefined, {
    debug: 0,
  });

  let conn = null;

  peer.on('open', () => {
    const hostId = PEER_PREFIX + roomCode.toUpperCase();
    conn = peer.connect(hostId, { reliable: true });

    conn.on('open', () => {
      onConnect(conn);
    });

    conn.on('data', (data) => {
      onMessage(data);
    });

    conn.on('close', () => {
      onDisconnect();
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      onError(err);
    });
  });

  peer.on('error', (err) => {
    console.error('Peer error:', err);
    onError(err);
  });

  // Reconnect logic
  peer.on('disconnected', () => {
    // Try to reconnect
    setTimeout(() => {
      if (!peer.destroyed) {
        try { peer.reconnect(); } catch (e) {}
      }
    }, 2000);
  });

  return {
    peer,
    getConnection: () => conn,
    send: (message) => {
      if (conn) {
        try { conn.send(message); } catch (e) {}
      }
    },
    destroy: () => {
      if (conn) try { conn.close(); } catch (e) {}
      peer.destroy();
    },
  };
}

// ─── Message Constructors ──────────────────────────────────────────

export const Messages = {
  playerJoin: (playerId, name, color) => ({
    type: 'PLAYER_JOIN',
    payload: { playerId, name, color },
  }),

  gameInit: (players, turnSchedule, settings) => ({
    type: 'GAME_INIT',
    payload: { players, turnSchedule, settings },
  }),

  placeTile: (circleIndex, tileValue, playerId) => ({
    type: 'PLACE_TILE',
    payload: { circleIndex, tileValue, playerId },
  }),

  selectTile: (tileValue, playerId) => ({
    type: 'SELECT_TILE',
    payload: { tileValue, playerId },
  }),

  gameState: (state) => ({
    type: 'GAME_STATE',
    payload: state,
    stateHash: computeStateHash(state),
  }),

  gameOver: (scores, blackHoleIndex) => ({
    type: 'GAME_OVER',
    payload: { scores, blackHoleIndex },
  }),

  resyncReq: () => ({
    type: 'RESYNC_REQ',
    payload: {},
  }),

  ping: () => ({
    type: 'PING',
    payload: { timestamp: Date.now() },
  }),

  advanceRound: () => ({
    type: 'ADVANCE_ROUND',
    payload: {},
  }),
};
