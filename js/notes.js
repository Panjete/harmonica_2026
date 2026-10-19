// The whole instrument as a lookup table: 10-hole diatonic, key of C (Richter tuning).
// Notes are MIDI numbers (C4 = 60, A4 = 69).

export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

export const midiToFreq = (m) => 440 * 2 ** ((m - 69) / 12);
export const freqToMidiFloat = (f) => 69 + 12 * Math.log2(f / 440);
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
