// ─── Web Audio API Sound Effects ───────────────────────────────────
let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.15, detune = 0) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio not supported or blocked — fail silently
  }
}

function playNoise(duration, volume = 0.05) {
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();
  } catch (e) {
    // fail silently
  }
}

// ─── Sound Effects ─────────────────────────────────────────────────

export function playPlaceSound() {
  playTone(600, 0.12, 'sine', 0.12);
  setTimeout(() => playTone(800, 0.08, 'sine', 0.08), 40);
}

export function playSelectSound() {
  playTone(500, 0.06, 'triangle', 0.08);
}

export function playTurnSound() {
  playTone(440, 0.15, 'sine', 0.06);
  setTimeout(() => playTone(554, 0.15, 'sine', 0.06), 80);
}

export function playBlackHoleSound() {
  // Deep rumble
  playTone(55, 2.0, 'sawtooth', 0.08);
  playTone(60, 2.0, 'sine', 0.1);
  playNoise(1.5, 0.04);
  // Descending tone
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 2.0);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2.0);
  } catch (e) {}
}

export function playWinSound() {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, 'sine', 0.1), i * 150);
  });
}

export function playTimerTickSound() {
  playTone(1000, 0.03, 'square', 0.04);
}

export function playTimerWarningSound() {
  playTone(880, 0.1, 'square', 0.08);
  setTimeout(() => playTone(880, 0.1, 'square', 0.08), 150);
}

export function playConnectSound() {
  playTone(440, 0.1, 'sine', 0.08);
  setTimeout(() => playTone(660, 0.15, 'sine', 0.08), 100);
}

export function playDisconnectSound() {
  playTone(440, 0.15, 'sine', 0.08);
  setTimeout(() => playTone(330, 0.2, 'sine', 0.08), 100);
}

// Ensure audio context is unlocked on user interaction
export function unlockAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (e) {}
}
