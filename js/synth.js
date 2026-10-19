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

  /** Fade out quickly and stop (used when a phrase is interrupted). */
  return () => {
    const now = c.currentTime;
    out.gain.cancelScheduledValues(now);
    out.gain.setTargetAtTime(0.0001, now, 0.03);
    try { saw.stop(now + 0.2); sq.stop(now + 0.2); } catch { /* already stopped */ }
  };
}

let currentMelodyStops = [];
let currentMelodyTimers = [];

export function stopMelody() {
  currentMelodyStops.forEach((fn) => { try { fn(); } catch {} });
  currentMelodyStops = [];
  currentMelodyTimers.forEach((t) => clearTimeout(t));
  currentMelodyTimers = [];
}

/**
 * Play a sequence of notes with accurate musical tempo.
 * @param {Array<{midi:number, beats:number}>} notes
 * @param {{bpm?:number, onNote?:(idx:number, note:object)=>void, onEnd?:()=>void}} opts
 */
export function playMelody(notes, { bpm = 90, onNote = () => {}, onEnd = () => {} } = {}) {
  stopMelody();
  const secPerBeat = 60 / bpm;
  let elapsed = 0;

  notes.forEach((note, i) => {
    const durSec = Math.max(0.2, (note.beats || 1) * secPerBeat * 0.90);
    const whenSec = elapsed;
    const whenMs = whenSec * 1000;

    const stopFn = playNote(note.midi, { dur: durSec, when: whenSec });
    currentMelodyStops.push(stopFn);

    const timer = setTimeout(() => {
      onNote(i, note);
    }, whenMs);
    currentMelodyTimers.push(timer);

    elapsed += (note.beats || 1) * secPerBeat;
  });

  const endTimer = setTimeout(() => {
    currentMelodyStops = [];
    currentMelodyTimers = [];
    onEnd();
  }, elapsed * 1000 + 150);
  currentMelodyTimers.push(endTimer);

  return stopMelody;
}
