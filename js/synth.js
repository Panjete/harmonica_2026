// A soft, reed-ish voice for reference notes. Kept quiet on purpose.
import { midiToFreq } from './notes.js';

let ctx = null;
let master = null;

export function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/**
 * @param {number} midi
 * @param {{dur?:number, when?:number, gain?:number}} opts  `when` = seconds from now
 */
export function playNote(midi, { dur = 0.8, when = 0, gain = 0.16 } = {}) {
  const c = getCtx();
  const f = midiToFreq(midi);
  const t = c.currentTime + when + 0.02;
  dur = Math.max(0.3, dur);

  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(gain, t + 0.05);
  out.gain.setValueAtTime(gain, t + dur - 0.14);
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = Math.min(f * 4.5, 5500);
  filter.Q.value = 0.7;

  const saw = c.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.value = f;
  const sawGain = c.createGain();
  sawGain.gain.value = 0.7;

  const sq = c.createOscillator();
  sq.type = 'square';
  sq.frequency.value = f;
  sq.detune.value = 5;
  const sqGain = c.createGain();
  sqGain.gain.value = 0.22;

  saw.connect(sawGain).connect(filter);
  sq.connect(sqGain).connect(filter);
  filter.connect(out).connect(master);

  saw.start(t);
  sq.start(t);
  saw.stop(t + dur + 0.05);
  sq.stop(t + dur + 0.05);
}
