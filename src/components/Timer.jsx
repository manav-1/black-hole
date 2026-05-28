import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playTimerTickSound, playTimerWarningSound } from '../game/sounds.js';

export default function Timer({ seconds, onExpire, isActive, turnIndex }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);
  const expiredRef = useRef(false);

  // Reset timer on turn change
  useEffect(() => {
    setRemaining(seconds);
    expiredRef.current = false;
  }, [turnIndex, seconds]);

  useEffect(() => {
    if (!isActive || seconds <= 0) return;

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1;
        if (next <= 5 && next > 0) {
          playTimerWarningSound();
        } else if (next > 5 && next <= 10) {
          playTimerTickSound();
        }
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          onExpire();
        }
        return Math.max(0, next);
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isActive, seconds, turnIndex, onExpire]);

  if (seconds <= 0) return null;

  const pct = (remaining / seconds) * 100;
  const isWarning = remaining <= 5;
  const isUrgent = remaining <= 3;

  return (
    <div className={`timer ${isWarning ? 'timer--warning' : ''} ${isUrgent ? 'timer--urgent' : ''}`}>
      <div className="timer__bar-bg">
        <div
          className="timer__bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="timer__text">{remaining}s</span>
    </div>
  );
}
