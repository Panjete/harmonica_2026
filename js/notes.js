// The whole instrument as a lookup table: 10-hole diatonic, key of C (Richter tuning).
// Notes are MIDI numbers (C4 = 60, A4 = 69).

export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

// Harmonicas are tuned at the factory to A4 = 442–444 Hz (Hohner/Lee Oskar/Suzuki)
// so chords sound sweet and blowing pressure doesn't pull them flat.
// We default to 443 Hz so real harmonica notes center at 0 cents instead of reading sharp.
export let refA4 = 443;
export const setRefA4 = (hz) => { refA4 = hz; };

export const midiToFreq = (m) => refA4 * 2 ** ((m - 69) / 12);
export const freqToMidiFloat = (f) => 69 + 12 * Math.log2(f / refA4);
export const midiToName = (m) => NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
/** Just the letter (C, D, F♯…). Height is shown by position on the map, so no octave number. */
export const midiToLetter = (m) => NOTE_NAMES[((m % 12) + 12) % 12];

//            hole: [blow, draw]
const LAYOUT = [
  [60, 62], // 1:  C4  D4
  [64, 67], // 2:  E4  G4
  [67, 71], // 3:  G4  B4
  [72, 74], // 4:  C5  D5
  [76, 77], // 5:  E5  F5
  [79, 81], // 6:  G5  A5
  [84, 83], // 7:  C6  B5
  [88, 86], // 8:  E6  D6
  [91, 89], // 9:  G6  F6
  [96, 93], // 10: C7  A6
];

export const HOLES = LAYOUT.map(([blow, draw], i) => ({ hole: i + 1, blow, draw }));

export const ALL_NOTES = HOLES.flatMap((h) => [
  { id: `${h.hole}blow`, hole: h.hole, dir: 'blow', midi: h.blow },
  { id: `${h.hole}draw`, hole: h.hole, dir: 'draw', midi: h.draw },
]);

/** Every hole/direction that produces this MIDI note (G4 is on two holes). */
export const notesForMidi = (m, holes = null) =>
  ALL_NOTES.filter((n) => n.midi === m && (!holes || holes.includes(n.hole)));

/** Harmonica tab: blow = "4", draw = "−4". */
export const tab = (n) => (n.dir === 'draw' ? '−' : '') + n.hole;

/** Beginner music theory metadata for the diatonic C scale */
export const SOLFEGE = {
  'C': { syllable: 'Do', role: 'Root (Home)', family: 'C Major Chord (Blow)' },
  'D': { syllable: 'Re', role: 'Step 2 (Passing)', family: 'Inhale Note (Draw)' },
  'E': { syllable: 'Mi', role: 'Step 3 (Sweet harmony)', family: 'C Major Chord (Blow)' },
  'F': { syllable: 'Fa', role: 'Step 4 (Subdominant)', family: 'Inhale Note (Draw)' },
  'G': { syllable: 'Sol', role: 'Step 5 (Anchor harmony)', family: 'C Major Chord (Blow)' },
  'A': { syllable: 'La', role: 'Step 6 (Folk resting)', family: 'Inhale Note (Draw)' },
  'B': { syllable: 'Ti', role: 'Step 7 (Leading tone)', family: 'Inhale Note (Draw)' },
};

/** Get beginner-friendly musical context for any MIDI note */
export function getNoteRole(midi) {
  const letter = midiToLetter(midi);
  const info = SOLFEGE[letter] || { syllable: '', role: 'Note', family: '' };
  const oct = Math.floor(midi / 12) - 1;
  const freq = Math.round(midiToFreq(midi));
  const reg = oct <= 4 ? 'Low register' : oct === 5 ? 'Melody register' : 'High register';
  return { letter, ...info, oct, freq, reg };
}

