/**
 * Səs və Audio Əks-Əlaqə Modulu (Web Audio API Synthesizer)
 * Papatya Kassa & Satış Paneli
 */

let isSoundMuted = false;

export function initSound() {
  isSoundMuted = localStorage.getItem('kassa_sound_muted') === 'true';
  updateSoundIcon();
}

export function toggleSound() {
  isSoundMuted = !isSoundMuted;
  localStorage.setItem('kassa_sound_muted', isSoundMuted ? 'true' : 'false');
  updateSoundIcon();
  if (!isSoundMuted) playChime(true);
}

export function updateSoundIcon() {
  const icon = document.getElementById('soundIcon');
  if (!icon) return;
  if (isSoundMuted) {
    icon.className = 'fa-solid fa-volume-xmark';
    icon.style.color = '#fda4af';
  } else {
    icon.className = 'fa-solid fa-volume-high';
    icon.style.color = '#67e8f9';
  }
}

export function playChime(isSale = true) {
  if (isSoundMuted) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq, start, dur, type = 'sine', gainVal = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(gainVal, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    if (isSale) {
      playTone(523.25, now, 0.15, 'triangle', 0.12);
      playTone(659.25, now + 0.08, 0.18, 'triangle', 0.12);
      playTone(783.99, now + 0.16, 0.22, 'sine', 0.15);
      playTone(1046.50, now + 0.24, 0.35, 'sine', 0.18);
    } else {
      playTone(880, now, 0.12, 'sine', 0.10);
      playTone(440, now + 0.08, 0.18, 'sine', 0.12);
    }
  } catch (e) {}
}

export function playLossSound() {
  if (isSoundMuted) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    playTone(280, now, 0.18);
    playTone(220, now + 0.12, 0.25);
  } catch (e) {}
}
