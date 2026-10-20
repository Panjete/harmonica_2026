// Authentic diatonic harmonica synthesis model:
// 1. Custom brass-reed PeriodicWave based on acoustic Fourier reed analysis.
// 2. Attack pitch scoop (~20 cents flat ramping into pitch in 30ms) simulating reed inertia.
// 3. Dual-formant acoustic filtering: oral cavity resonance (~1050Hz) + cover plate metal bite (~2900Hz).
// 4. Subtle reed saturation / non-linear wave shaping (reed air limits).
// 5. Natural breath onset puff and expressive diaphragm/hand vibrato on held notes.
import { midiToFreq } from './notes.js';

let ctx = null;
let master = null;
let noiseBuffer = null;
let reedWave = null;
let shaperCurve = null;

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

function getReedWave(c) {
  if (reedWave) return reedWave;
  // Diatonic harmonica brass reed harmonic coefficients (Fourier series):
  // Strong fundamental, prominent 2nd (octave) and 3rd (5th) harmonics, with brass reed falloff
  const n = 24;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  const harmonics = [0, 1.0, 0.82, 0.65, 0.48, 0.36, 0.26, 0.18, 0.12, 0.08, 0.06, 0.04, 0.03, 0.02];
  for (let i = 1; i < harmonics.length && i < n; i++) {
    imag[i] = harmonics[i];
  }
  reedWave = c.createPeriodicWave(real, imag, { disableNormalization: false });
  return reedWave;
}

function getShaperCurve() {
  if (shaperCurve) return shaperCurve;
  const samples = 512;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1;
    // Soft acoustic saturation (tanh-like compression curve)
    curve[i] = Math.tanh(1.4 * x) / 1.1;
  }
  shaperCurve = curve;
  return shaperCurve;
}

function getNoise(c) {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(c.sampleRate * 0.8);
  const b = c.createBuffer(1, len, c.sampleRate);
  const data = b.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.28;
  }
  noiseBuffer = b;
  return noiseBuffer;
}

/**
 * Play an authentic diatonic harmonica note.
 * @param {number} midi
 * @param {{dur?:number, when?:number, gain?:number}} opts  `when` = seconds from now
 */
export function playNote(midi, { dur = 0.8, when = 0, gain = 0.22 } = {}) {
  const c = getCtx();
  const f = midiToFreq(midi);
  const t = c.currentTime + when + 0.015;

  // Realistic duration bounds (from quick 16th-note flicks to full holds)
  dur = Math.max(0.06, dur);

  // Dynamic ADSR envelope tailored to the exact note duration
  const attack = Math.min(0.024, dur * 0.18);
  const release = Math.min(0.048, dur * 0.24);
  const sustain = Math.max(0.006, dur - attack - release);

  const tAttack = t + attack;
  const tSustainEnd = tAttack + sustain;
  const tReleaseEnd = t + dur;

  // Master note gain envelope with natural breath swell
  const noteGain = c.createGain();
  noteGain.gain.setValueAtTime(0.0001, t);
  noteGain.gain.exponentialRampToValueAtTime(gain, tAttack);
  noteGain.gain.setValueAtTime(gain, tSustainEnd);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, tReleaseEnd);

  // Dual-Formant Acoustic Chamber:
  // 1. Oral cavity resonance peak (~1050 Hz)
  const oralFormant = c.createBiquadFilter();
  oralFormant.type = 'peaking';
  oralFormant.frequency.value = Math.min(Math.max(f * 1.5, 850), 1250);
  oralFormant.Q.value = 1.8;
  oralFormant.gain.value = 4.0;

  // 2. Harmonica metal cover plates / reed edge formant (~2800 Hz)
  const plateFormant = c.createBiquadFilter();
  plateFormant.type = 'peaking';
  plateFormant.frequency.value = 2800;
  plateFormant.Q.value = 2.4;
  plateFormant.gain.value = 3.5;

  // 3. Acoustic chamber rolloff (eliminates harsh digital buzz)
  const bodyFilter = c.createBiquadFilter();
  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.value = Math.min(Math.max(f * 3.8, 2200), 5200);
  bodyFilter.Q.value = 1.2;

  // Reed saturation (soft non-linear compression)
  const shaper = c.createWaveShaper();
  shaper.curve = getShaperCurve();
  shaper.oversample = '2x';

  // Primary reed oscillator (custom periodic wave)
  const reedWaveTable = getReedWave(c);
  const osc1 = c.createOscillator();
  osc1.setPeriodicWave(reedWaveTable);
  osc1.frequency.setValueAtTime(f, t);

  // Characteristic harmonica attack pitch scoop:
  // As breath pulls the reed into motion, it catches air ~22 cents flat and stabilizes in 28ms
  const scoopTime = Math.min(0.032, dur * 0.25);
  osc1.detune.setValueAtTime(-22, t);
  osc1.detune.linearRampToValueAtTime(0, t + scoopTime);

  const osc1Gain = c.createGain();
  osc1Gain.gain.value = 0.65;

  // Secondary detuned reed oscillator (simulates adjacent chamber coupling & natural acoustic beating)
  const osc2 = c.createOscillator();
  osc2.setPeriodicWave(reedWaveTable);
  osc2.frequency.setValueAtTime(f, t);
  osc2.detune.setValueAtTime(5, t);
  osc2.detune.linearRampToValueAtTime(4, t + scoopTime);

  const osc2Gain = c.createGain();
  osc2Gain.gain.value = 0.32;

  // Subtle woody body undertone (triangle for deep reed slot acoustic resonance)
  const tri = c.createOscillator();
  tri.type = 'triangle';
  tri.frequency.setValueAtTime(f, t);
  const triGain = c.createGain();
  triGain.gain.value = 0.22;

  osc1.connect(osc1Gain).connect(shaper);
  osc2.connect(osc2Gain).connect(shaper);
  tri.connect(triGain).connect(shaper);

  // Airflow breath noise puff on note attack
  const noise = c.createBufferSource();
  noise.buffer = getNoise(c);
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 2200;
  noiseFilter.Q.value = 1.4;
  const noiseGain = c.createGain();
  noiseGain.gain.setValueAtTime(0.0001, t);
  noiseGain.gain.exponentialRampToValueAtTime(gain * 0.12, t + 0.008);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(0.038, dur * 0.35));
  noise.connect(noiseFilter).connect(noiseGain).connect(noteGain);

  // Expressive hand/diaphragm vibrato for held notes (> 0.35s)
  let lfo = null;
  if (dur > 0.35) {
    lfo = c.createOscillator();
    lfo.frequency.value = 5.2; // 5.2 Hz hand tremolo / vibrato
    const lfoGain = c.createGain();
    lfoGain.gain.setValueAtTime(0.0001, t);
    lfoGain.gain.setValueAtTime(0.0001, t + 0.18);
    lfoGain.gain.linearRampToValueAtTime(7, t + 0.40); // +/- 7 cents

    lfo.connect(lfoGain);
    lfoGain.connect(osc1.detune);
    lfoGain.connect(osc2.detune);

    lfo.start(t);
    lfo.stop(tReleaseEnd + 0.05);
  }

  // Audio chain: Shaper -> Oral Formant -> Plate Formant -> Body Lowpass -> Note Gain -> Master
  shaper.connect(oralFormant);
  oralFormant.connect(plateFormant);
  plateFormant.connect(bodyFilter);
  bodyFilter.connect(noteGain).connect(master);

  osc1.start(t);
  osc2.start(t);
  tri.start(t);
  noise.start(t);

  osc1.stop(tReleaseEnd + 0.05);
  osc2.stop(tReleaseEnd + 0.05);
  tri.stop(tReleaseEnd + 0.05);
  noise.stop(t + 0.06);

  /** Fade out quickly and stop if interrupted */
  return () => {
    const now = c.currentTime;
    noteGain.gain.cancelScheduledValues(now);
    noteGain.gain.setTargetAtTime(0.0001, now, 0.02);
    try {
      osc1.stop(now + 0.08);
      osc2.stop(now + 0.08);
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

