import React, { useEffect, useRef } from 'react';
import Board from '../components/Board.jsx';
import { PLAYER_COLORS, ADJACENCY } from '../game/constants.js';
import { getWinner, getWinnerByTotal } from '../game/engine.js';
import { playBlackHoleSound, playWinSound } from '../game/sounds.js';

export default function ResultsScreen({ state, onPlayAgain, onNewGame, onNextRound, isMultiRound }) {
  const soundPlayed = useRef(false);

  useEffect(() => {
    if (!soundPlayed.current) {
      soundPlayed.current = true;
      playBlackHoleSound();
      setTimeout(() => playWinSound(), 1500);
    }
  }, []);

  const roundWinner = getWinner(state);
  const isLastRound = state.round >= state.totalRounds;
  const matchWinner = isLastRound ? getWinnerByTotal(state) : null;

  const adjacentIndices = state.blackHoleIndex !== null
    ? new Set(ADJACENCY[state.blackHoleIndex])
    : new Set();

  // Build per-player breakdown of adjacent tiles
  const breakdown = state.players.map(player => {
    const adjTiles = [];
    if (state.blackHoleIndex !== null) {
      for (const ni of ADJACENCY[state.blackHoleIndex]) {
        const cell = state.board[ni];
        if (cell.playerId === player.id) {
          adjTiles.push({ index: ni, value: cell.tileValue });
        }
      }
    }
    return { player, adjTiles, total: player.score };
  });

  breakdown.sort((a, b) => a.total - b.total);

  return (
    <div className="screen results-screen">
      <div className="stars-bg">
        {Array.from({ length: 40 }).map((_, i) => (
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

      <div className="results-content">
        {/* Winner banner */}
        <div className="results-banner">
          {isLastRound && state.totalRounds > 1 ? (
            <>
              <h2 className="results-title">Match Complete!</h2>
              {matchWinner ? (
                <div className="results-winner">
                  <div
                    className="results-winner__dot"
                    style={{ background: PLAYER_COLORS.find(c => c.id === matchWinner.colorId)?.hex }}
                  />
                  <span
                    className="results-winner__name"
                    style={{ color: PLAYER_COLORS.find(c => c.id === matchWinner.colorId)?.hex }}
                  >
                    {matchWinner.name} wins the match!
                  </span>
                </div>
              ) : (
                <p className="results-tie">It's a tie!</p>
              )}
            </>
          ) : (
            <>
              <h2 className="results-title">
                {state.totalRounds > 1 ? `Round ${state.round} Complete` : 'Game Over'}
              </h2>
              {roundWinner ? (
                <div className="results-winner">
                  <div
                    className="results-winner__dot"
                    style={{ background: PLAYER_COLORS.find(c => c.id === roundWinner.colorId)?.hex }}
                  />
                  <span
                    className="results-winner__name"
                    style={{ color: PLAYER_COLORS.find(c => c.id === roundWinner.colorId)?.hex }}
                  >
                    {roundWinner.name} wins!
                  </span>
                </div>
              ) : (
                <p className="results-tie">It's a draw!</p>
              )}
            </>
          )}
          <p className="results-subtitle">Lowest score adjacent to the Black Hole wins</p>
        </div>

        {/* Board with highlights */}
        <div className="results-board">
          <Board
            board={state.board}
            blackHoleIndex={state.blackHoleIndex}
            onCellClick={() => {}}
            disabled={true}
          />
        </div>

        {/* Score breakdown */}
        <div className="results-scores glass-card">
          <h3>Score Breakdown</h3>
          <div className="results-scores__list">
            {breakdown.map(({ player, adjTiles, total }, rank) => {
              const color = PLAYER_COLORS.find(c => c.id === player.colorId);
              return (
                <div
                  key={player.id}
                  className={`results-player ${rank === 0 ? 'results-player--winner' : ''}`}
                  style={{ '--player-color': color?.hex }}
                >
                  <div className="results-player__rank">
                    {rank === 0 ? '👑' : `#${rank + 1}`}
                  </div>
                  <div className="results-player__info">
                    <div className="results-player__header">
                      <div className="results-player__dot" style={{ background: color?.hex }} />
                      <span className="results-player__name">{player.name}</span>
                    </div>
                    <div className="results-player__tiles">
                      {adjTiles.length === 0 ? (
                        <span className="results-player__none">No adjacent tiles</span>
                      ) : (
                        adjTiles.map((t, i) => (
                          <span key={i} className="results-tile-badge" style={{ background: color?.hex }}>
                            {t.value}
                          </span>
                        ))
                      )}
                      {adjTiles.length > 1 && (
                        <span className="results-player__formula">
                          = {adjTiles.map(t => t.value).join(' + ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="results-player__score">
                    <span className="results-player__score-value">{total}</span>
                    {state.totalRounds > 1 && (
                      <span className="results-player__cumulative">
                        Total: {player.cumulativeScore + total}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="results-actions">
          {state.totalRounds > 1 && !isLastRound && (
            <button className="btn btn--primary btn--large" onClick={onNextRound}>
              Next Round →
            </button>
          )}
          <button className="btn btn--primary btn--large" onClick={onPlayAgain}>
            Play Again
          </button>
          <button className="btn btn--ghost" onClick={onNewGame}>
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
