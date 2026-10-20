// Harmonica reed voice with authentic acoustic resonance, breath attack,
// dynamic duration envelope (supporting rapid 16th flicks down to 0.06s),
// and expressive diaphragm/hand vibrato on held notes.
import { midiToFreq } from './notes.js';

let ctx = null;
let master = null;
let noiseBuffer = null;

export function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.72;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function getNoise(c) {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(c.sampleRate * 1.0);
  const b = c.createBuffer(1, len, c.sampleRate);
  const data = b.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.35;
  }
  noiseBuffer = b;
  return noiseBuffer;
}

/**
 * @param {number} midi
 * @param {{dur?:number, when?:number, gain?:number}} opts  `when` = seconds from now
 */
export function playNote(midi, { dur = 0.8, when = 0, gain = 0.18 } = {}) {
  const c = getCtx();
  const f = midiToFreq(midi);
  const t = c.currentTime + when + 0.015;

  // Enforce a sensible acoustic floor, but allow rapid 16th-note flicks (down to 0.06s)
  dur = Math.max(0.06, dur);

  // Dynamic ADSR envelope tailored to the exact note duration
  const attack = Math.min(0.022, dur * 0.15);
  const release = Math.min(0.045, dur * 0.22);
  const sustain = Math.max(0.005, dur - attack - release);

  const tAttack = t + attack;
  const tSustainEnd = tAttack + sustain;
  const tReleaseEnd = t + dur;

  // Master note gain envelope
  const noteGain = c.createGain();
  noteGain.gain.setValueAtTime(0.0001, t);
  noteGain.gain.exponentialRampToValueAtTime(gain, tAttack);
  noteGain.gain.setValueAtTime(gain, tSustainEnd);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, tReleaseEnd);

  // Comb / Chamber acoustic formant filter (simulates harmonica body & cupped hands)
  const formant = c.createBiquadFilter();
  formant.type = 'lowpass';
  const cutoff = Math.min(Math.max(f * 3.6, 1700), 5400);
  formant.frequency.setValueAtTime(cutoff, t);
  formant.Q.value = 1.35;

  // Primary reed oscillator (rich sawtooth harmonics)
  const saw = c.createOscillator();
  saw.type = 'sawtooth';
  saw.frequency.setValueAtTime(f, t);
  const sawGain = c.createGain();
  sawGain.gain.value = 0.52;

  // Secondary reed oscillator (detuned square for reed shimmer & plate coupling)
  const sq = c.createOscillator();
  sq.type = 'square';
  sq.frequency.setValueAtTime(f, t);
  sq.detune.setValueAtTime(6, t);
  const sqGain = c.createGain();
  sqGain.gain.value = 0.20;

  // Acoustic body warmth (triangle oscillator for rich woody fundamental)
  const tri = c.createOscillator();
  tri.type = 'triangle';
  tri.frequency.setValueAtTime(f, t);
  const triGain = c.createGain();
  triGain.gain.value = 0.35;

  saw.connect(sawGain).connect(formant);
  sq.connect(sqGain).connect(formant);
  tri.connect(triGain).connect(formant);

  // Subtle breath puff at note onset (tonguing attack)
  const noise = c.createBufferSource();
  noise.buffer = getNoise(c);
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 2400;
  noiseFilter.Q.value = 1.2;
  const noiseGain = c.createGain();
  noiseGain.gain.setValueAtTime(0.0001, t);
  noiseGain.gain.exponentialRampToValueAtTime(gain * 0.14, t + 0.008);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.04, dur * 0.35));
  noise.connect(noiseFilter).connect(noiseGain).connect(noteGain);

  // Expressive hand/diaphragm vibrato for held notes (> 0.40s)
  let lfo = null;
  if (dur > 0.40) {
    lfo = c.createOscillator();
    lfo.frequency.value = 4.8; // 4.8 Hz gentle vibrato
    const lfoGain = c.createGain();
    lfoGain.gain.setValueAtTime(0.0001, t);
    lfoGain.gain.setValueAtTime(0.0001, t + 0.20);
    lfoGain.gain.linearRampToValueAtTime(8, t + 0.45); // +/- 8 cents detune

    lfo.connect(lfoGain);
    lfoGain.connect(saw.detune);
    lfoGain.connect(sq.detune);
    lfoGain.connect(tri.detune);

    lfo.start(t);
    lfo.stop(tReleaseEnd + 0.05);
  }

  formant.connect(noteGain).connect(master);

  saw.start(t);
  sq.start(t);
  tri.start(t);
  noise.start(t);

  saw.stop(tReleaseEnd + 0.05);
  sq.stop(tReleaseEnd + 0.05);
  tri.stop(tReleaseEnd + 0.05);
  noise.stop(t + 0.08);

  /** Fade out quickly and stop if interrupted */
  return () => {
    const now = c.currentTime;
    noteGain.gain.cancelScheduledValues(now);
    noteGain.gain.setTargetAtTime(0.0001, now, 0.02);
    try {
      saw.stop(now + 0.08);
      sq.stop(now + 0.08);
      tri.stop(now + 0.08);
      noise.stop(now + 0.04);
      if (lfo) lfo.stop(now + 0.08);
    } catch { /* already stopped */ }
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
 * Play a sequence of notes with accurate musical tempo and phrasing.
 * @param {Array<{midi:number, beats:number}>} notes
 * @param {{bpm?:number, onNote?:(idx:number, note:object, durSec:number)=>void, onEnd?:()=>void}} opts
 */
export function playMelody(notes, { bpm = 90, onNote = () => {}, onEnd = () => {} } = {}) {
  stopMelody();
  const secPerBeat = 60 / bpm;
  let elapsed = 0;

  notes.forEach((note, i) => {
    const noteBeats = note.beats || 1;
    // Articulation: notes ring for 92% of their beat slot, creating a clean breath boundary
    const durSec = Math.max(0.07, noteBeats * secPerBeat * 0.92);
    const whenSec = elapsed;
    const whenMs = whenSec * 1000;

    const stopFn = playNote(note.midi, { dur: durSec, when: whenSec });
    currentMelodyStops.push(stopFn);

    const timer = setTimeout(() => {
      onNote(i, note, durSec);
    }, whenMs);
    currentMelodyTimers.push(timer);

    elapsed += noteBeats * secPerBeat;
  });

  const endTimer = setTimeout(() => {
    currentMelodyStops = [];
    currentMelodyTimers = [];
    onEnd();
  }, elapsed * 1000 + 120);
  currentMelodyTimers.push(endTimer);

  return stopMelody;
}

