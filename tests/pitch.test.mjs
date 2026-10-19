// Sanity-check the detector against every note on the harmonica, using a
// harmonic-rich synthetic tone (reeds are buzzy, not sine-like).
import { detectPitch } from '../js/pitch.js';
import { ALL_NOTES, midiToFreq, freqToMidiFloat, midiToName } from '../js/notes.js';

const sr = 48000;
const N = 2048;
let failures = 0;

function tone(freq, harmonics = 8) {
  const buf = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let s = 0;
    for (let k = 1; k <= harmonics; k++) s += Math.sin((2 * Math.PI * k * freq * i) / sr) / k;
    buf[i] = 0.2 * s;
  }
  return buf;
}

for (const n of ALL_NOTES) {
  const f = midiToFreq(n.midi);
  const r = detectPitch(tone(f), sr);
  const m = r.freq ? freqToMidiFloat(r.freq) : NaN;
  const ok = r.freq && Math.abs(m - n.midi) < 0.25 && r.clarity > 0.9;
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} hole ${n.hole} ${n.dir.padEnd(4)} ${midiToName(n.midi)}  -> ${r.freq ? r.freq.toFixed(1) : '—'} Hz (clarity ${r.clarity.toFixed(2)})`);
}

// Noise and silence should not register as a note.
const noise = new Float32Array(N).map(() => (Math.random() - 0.5) * 0.3);
const rn = detectPitch(noise, sr);
const noiseOk = rn.freq === null || rn.clarity < 0.85;
if (!noiseOk) failures++;
console.log(`${noiseOk ? 'ok  ' : 'FAIL'} white noise rejected (clarity ${rn.clarity.toFixed(2)})`);

const rs = detectPitch(new Float32Array(N), sr);
if (rs.freq !== null) failures++;
console.log(`${rs.freq === null ? 'ok  ' : 'FAIL'} silence rejected`);

console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);
