import React, { useMemo } from 'react';
import { ADJACENCY, getCirclePosition, BOARD_SIZE, PLAYER_COLORS } from '../game/constants.js';

const SVG_WIDTH = 600;
const SVG_HEIGHT = 360;
const CIRCLE_R = 24;

export default function Board({ board, blackHoleIndex, onCellClick, disabled, currentPlayerId }) {
  const positions = useMemo(() => {
    return Array.from({ length: BOARD_SIZE }, (_, i) => getCirclePosition(i));
  }, []);

  const adjacentToHole = useMemo(() => {
    if (blackHoleIndex === null || blackHoleIndex === undefined) return new Set();
    return new Set(ADJACENCY[blackHoleIndex]);
  }, [blackHoleIndex]);

  const isFinished = blackHoleIndex !== null && blackHoleIndex !== undefined;

  return (
    <div className="board-container">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="board-svg"
        role="img"
        aria-label="Black Hole game board"
      >
        <defs>
          {/* Glow filter for adjacent tiles */}
          <filter id="glow-adj" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Black hole pulse filter */}
          <filter id="glow-hole" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Hover glow */}
          <filter id="glow-hover" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Adjacency lines gradient */}
          <linearGradient id="adj-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
          </linearGradient>
        </defs>

        {/* Adjacency lines (subtle connections) */}
        {!isFinished && Array.from({ length: BOARD_SIZE }).map((_, i) =>
          ADJACENCY[i]
            .filter(j => j > i)
            .map(j => (
              <line
                key={`line-${i}-${j}`}
                x1={positions[i].x}
                y1={positions[i].y}
                x2={positions[j].x}
                y2={positions[j].y}
                className="board-line"
              />
            ))
        )}

        {/* Adjacency lines to black hole (highlighted at end) */}
        {isFinished && ADJACENCY[blackHoleIndex].map(j => (
          <line
            key={`bhline-${j}`}
            x1={positions[blackHoleIndex].x}
            y1={positions[blackHoleIndex].y}
            x2={positions[j].x}
            y2={positions[j].y}
            className="board-line-highlight"
          />
        ))}

        {/* Circles */}
        {board.map((cell, i) => {
          const pos = positions[i];
          const isEmpty = cell.tileValue === null;
          const isBlackHole = isFinished && i === blackHoleIndex;
          const isAdjacent = isFinished && adjacentToHole.has(i);
          const playerColor = cell.playerId
            ? PLAYER_COLORS.find(c => c.id === cell.playerId)
            : null;
          const canClick = !disabled && isEmpty && !isFinished;

          return (
            <g
              key={i}
              className={[
                'board-cell',
                isEmpty ? 'board-cell--empty' : 'board-cell--filled',
                isBlackHole ? 'board-cell--blackhole' : '',
                isAdjacent ? 'board-cell--adjacent' : '',
                canClick ? 'board-cell--clickable' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => canClick && onCellClick(i)}
              role={canClick ? 'button' : undefined}
              aria-label={
                isBlackHole ? 'Black Hole' :
                isEmpty ? `Empty circle ${i}` :
                `${cell.playerId}'s tile ${cell.tileValue} at position ${i}`
              }
            >
              {/* Outer glow ring for adjacent */}
              {isAdjacent && playerColor && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={CIRCLE_R + 6}
                  fill="none"
                  stroke={playerColor.hex}
                  strokeWidth="2"
                  className="adj-glow-ring"
                  filter="url(#glow-adj)"
                  opacity="0.6"
                />
              )}

              {/* Black hole extra glow */}
              {isBlackHole && (
                <>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={CIRCLE_R + 14}
                    fill="none"
                    stroke="rgba(139, 92, 246, 0.4)"
                    strokeWidth="2"
                    className="blackhole-outer-ring"
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={CIRCLE_R + 8}
                    fill="rgba(139, 92, 246, 0.15)"
                    stroke="rgba(139, 92, 246, 0.6)"
                    strokeWidth="2"
                    className="blackhole-ring"
                  />
                </>
              )}

              {/* Main circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={CIRCLE_R}
                className={
                  isBlackHole ? 'circle-blackhole' :
                  !isEmpty ? 'circle-filled' :
                  'circle-empty'
                }
                fill={
                  isBlackHole ? '#0a0015' :
                  playerColor ? playerColor.hex :
                  'rgba(255,255,255,0.04)'
                }
                stroke={
                  isBlackHole ? 'rgba(139, 92, 246, 0.8)' :
                  playerColor ? playerColor.hex :
                  'rgba(255,255,255,0.15)'
                }
                strokeWidth={isBlackHole ? 2.5 : isEmpty ? 1.5 : 2}
                filter={isBlackHole ? 'url(#glow-hole)' : isAdjacent ? 'url(#glow-adj)' : undefined}
              />

              {/* Tile value text */}
              {!isEmpty && !isBlackHole && (
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="tile-text"
                  fill="white"
                  fontSize={cell.tileValue >= 10 ? '13' : '15'}
                  fontWeight="700"
                >
                  {cell.tileValue}
                </text>
              )}

              {/* Black hole icon */}
              {isBlackHole && (
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="blackhole-icon"
                  fontSize="22"
                >
                  ⬤
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
