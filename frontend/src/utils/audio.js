/**
 * Whisper-Quiet Organic Chime Generator
 * Ultra-low gain (0.02) - extremely subtle, peaceful, non-intrusive.
 */
let audioEnabled = true;

export function setAudioEnabled(enabled) {
  audioEnabled = enabled;
}

export function playAppleChime() {
  if (!audioEnabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Harmonic 1: Ultra-soft C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

    // Whisper-quiet volume
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.03, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Harmonic 2: Soft high sparkle
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.08);

    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.02, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.55);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.65);
  } catch (e) {
    // Audio Context blocked or not supported
  }
}

/**
 * Disabled routine haptic click sound to avoid any annoyance
 */
export function playHapticTick() {
  // Silent - removed routine click noise
}
