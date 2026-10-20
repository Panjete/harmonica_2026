// Songbook catalog arranged specifically for 10-hole Richter Diatonic Harmonica in C.
// Focuses on middle octave (holes 4–7) with clean blow/draw transitions.
// Every note includes exact MIDI, tab, direction, hole, and authentic musical beat duration.

export function getRhythmMeta(beats) {
  if (beats <= 0.35) {
    return { cls: 'dur-quick', label: '⚡ Quick', badge: '16th' };
  } else if (beats <= 0.65) {
    return { cls: 'dur-short', label: '♪ Short', badge: '8th' };
  } else if (beats <= 1.25) {
    return { cls: 'dur-beat', label: '♩ 1 beat', badge: '1b' };
  } else if (beats <= 1.75) {
    return { cls: 'dur-med', label: '1.5 beats', badge: '1.5b' };
  } else if (beats <= 2.25) {
    return { cls: 'dur-hold', label: '〰 Hold (2b)', badge: '2b' };
  } else {
    return { cls: 'dur-long', label: `〰 Hold (${beats}b)`, badge: `${beats}b` };
  }
}

export const SONGS = [
  {
    id: 'piano_man',
    title: 'Piano Man (Intro Riff)',
    artist: 'Billy Joel',
    year: 1973,
    category: 'classic',
    tag: 'Harmonica Icon',
    bpm: 86,
    difficulty: 'Beginner',
    desc: 'The most legendary harmonica hook in rock history. Played in 3/4 waltz time with rapid ornament flicks on holes 5 & 6.',
    phrases: [
      {
        id: 'p1',
        label: 'Phrase 1: The Iconic Opening Lick',
        notes: [
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.75 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.25 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.25 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.25 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 3.0 },
        ],
      },
      {
        id: 'p2',
        label: 'Phrase 2: The Rising Turn',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.75 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.25 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 4.0 },
        ],
      },
      {
        id: 'p3',
        label: 'Phrase 3: The High Cascade',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.75 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.25 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.25 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.25 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 2.0 },
        ],
      },
      {
        id: 'p4',
        label: 'Phrase 4: The Signature Finish',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 1.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 3.0 },
        ],
      },
    ],
  },

  {
    id: 'blinding_lights',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    year: 2019,
    category: 'modern',
    tag: 'Synth Pop',
    bpm: 104,
    difficulty: 'Moderate',
    desc: 'The iconic 80s-inspired synth hook. Driving, punchy syncopated rhythm on holes 4, 5, and 6.',
    phrases: [
      {
        id: 'p1',
        label: 'Phrase 1: The Synth Run',
        notes: [
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.25 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.25 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 2.5 },
        ],
      },
      {
        id: 'p2',
        label: 'Phrase 2: The Step Down',
        notes: [
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 2.5 },
        ],
      },
      {
        id: 'p3',
        label: 'Phrase 3: The Repeat Hook',
        notes: [
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.25 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.25 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 2.5 },
        ],
      },
      {
        id: 'p4',
        label: 'Phrase 4: The Cadence',
        notes: [
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 2.0 },
        ],
      },
    ],
  },

  {
    id: 'someone_like_you',
    title: 'Someone Like You',
    artist: 'Adele',
    year: 2011,
    category: 'modern',
    tag: 'Ballad',
    bpm: 76,
    difficulty: 'Gentle',
    desc: 'The soaring vocal chorus (“Never mind, I’ll find someone like you”). Melodic and expressive.',
    phrases: [
      {
        id: 'p1',
        label: 'Phrase 1: “Never mind, I’ll find…”',
        notes: [
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 0.5 },
          { midi: 84, tab: '7', dir: 'blow', hole: 7, beats: 1.5 },
          { midi: 84, tab: '7', dir: 'blow', hole: 7, beats: 0.5 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 2.5 },
        ],
      },
      {
        id: 'p2',
        label: 'Phrase 2: “…someone like you”',
        notes: [
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 0.5 },
          { midi: 84, tab: '7', dir: 'blow', hole: 7, beats: 1.0 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 3.0 },
        ],
      },
      {
        id: 'p3',
        label: 'Phrase 3: “I wish nothing but the best…”',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.0 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 2.5 },
        ],
      },
      {
        id: 'p4',
        label: 'Phrase 4: “…for you too”',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 3.5 },
        ],
      },
    ],
  },

  {
    id: 'stand_by_me',
    title: 'Stand By Me',
    artist: 'Ben E. King',
    year: 1961,
    category: 'classic',
    tag: 'Soul Anthem',
    bpm: 80,
    difficulty: 'Gentle',
    desc: 'Deeply relaxed walking soul rhythm. Perfect for relaxed breath control and clean single holes.',
    phrases: [
      {
        id: 'p1',
        label: 'Phrase 1: “When the night has come…”',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.25 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.25 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 2.0 },
        ],
      },
      {
        id: 'p2',
        label: 'Phrase 2: “…and the land is dark”',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 2.5 },
        ],
      },
      {
        id: 'p3',
        label: 'Phrase 3: “And the moon is the only light…”',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.0 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 2.0 },
        ],
      },
      {
        id: 'p4',
        label: 'Phrase 4: “Stand by me…”',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 3.0 },
        ],
      },
    ],
  },

  {
    id: 'stay_with_me',
    title: 'Stay With Me',
    artist: 'Sam Smith',
    year: 2014,
    category: 'modern',
    tag: 'Gospel Pop',
    bpm: 84,
    difficulty: 'Gentle',
    desc: 'Soulful gospel-style ballad with deliberate swing and warm stepwise breath control.',
    phrases: [
      {
        id: 'p1',
        label: 'Phrase 1: “Won’t you stay with me?”',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.75 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.25 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 2.5 },
        ],
      },
      {
        id: 'p2',
        label: 'Phrase 2: “’Cause you’re all I need”',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.75 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.25 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 2.5 },
        ],
      },
      {
        id: 'p3',
        label: 'Phrase 3: “This ain’t love, it’s clear to see…”',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.75 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 2.0 },
        ],
      },
      {
        id: 'p4',
        label: 'Phrase 4: “…darling, stay with me”',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.75 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.25 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 3.0 },
        ],
      },
    ],
  },

  {
    id: 'counting_stars',
    title: 'Counting Stars',
    artist: 'OneRepublic',
    year: 2013,
    category: 'modern',
    tag: 'Folk Pop',
    bpm: 96,
    difficulty: 'Moderate',
    desc: 'Lively, driving folk-pop acoustic melody (“Lately I been, I been losing sleep”). Great for rhythmic agility.',
    phrases: [
      {
        id: 'p1',
        label: 'Phrase 1: “Lately I been, I been losing sleep…”',
        notes: [
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.25 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.25 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 1.5 },
        ],
      },
      {
        id: 'p2',
        label: 'Phrase 2: “…dreaming about the things that we could be”',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.25 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.25 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 2.0 },
        ],
      },
      {
        id: 'p3',
        label: 'Phrase 3: “No more counting dollars…”',
        notes: [
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.25 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.25 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 1.5 },
        ],
      },
      {
        id: 'p4',
        label: 'Phrase 4: “…we’ll be counting stars”',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 3.0 },
        ],
      },
    ],
  },

  {
    id: 'shallow',
    title: 'Shallow',
    artist: 'Lady Gaga & Bradley Cooper',
    year: 2018,
    category: 'modern',
    tag: 'Acoustic Rock',
    bpm: 80,
    difficulty: 'Moderate',
    desc: 'The soaring Oscar-winning chorus hook (“I’m off the deep end, watch as I dive in”). Wide, expressive intervals.',
    phrases: [
      {
        id: 'p1',
        label: 'Phrase 1: “I’m off the deep end…”',
        notes: [
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 0.5 },
          { midi: 84, tab: '7', dir: 'blow', hole: 7, beats: 1.25 },
          { midi: 84, tab: '7', dir: 'blow', hole: 7, beats: 0.25 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 2.0 },
        ],
      },
      {
        id: 'p2',
        label: 'Phrase 2: “…watch as I dive in”',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 1.25 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 2.25 },
        ],
      },
      {
        id: 'p3',
        label: 'Phrase 3: “I’ll never meet the ground…”',
        notes: [
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 0.5 },
          { midi: 84, tab: '7', dir: 'blow', hole: 7, beats: 1.25 },
          { midi: 84, tab: '7', dir: 'blow', hole: 7, beats: 0.25 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 2.0 },
        ],
      },
      {
        id: 'p4',
        label: 'Phrase 4: “…far from the shallow now”',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 3.0 },
        ],
      },
    ],
  },

  {
    id: 'shape_of_you',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    year: 2017,
    category: 'modern',
    tag: 'Pop Groove',
    bpm: 96,
    difficulty: 'Moderate',
    desc: 'The viral syncopated marimba riff that topped charts worldwide. Staccato bounce on holes 4, 5, and 6.',
    phrases: [
      {
        id: 'p1',
        label: 'Phrase 1: The Marimba Hook A',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.25 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.75 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.5 },
        ],
      },
      {
        id: 'p2',
        label: 'Phrase 2: The Return',
        notes: [
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.75 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.25 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 2.0 },
        ],
      },
      {
        id: 'p3',
        label: 'Phrase 3: The High Accent',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.25 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.75 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.5 },
        ],
      },
      {
        id: 'p4',
        label: 'Phrase 4: The Cadence',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 2.5 },
        ],
      },
    ],
  },

  {
    id: 'ode_to_joy',
    title: 'Ode to Joy',
    artist: 'Beethoven',
    year: 1824,
    category: 'classic',
    tag: 'Stepwise Warmup',
    bpm: 88,
    difficulty: 'Gentle',
    desc: 'The best first song for harmonica. Smooth stepwise progression with subtle dotted rhythm in the cadence.',
    phrases: [
      {
        id: 'p1',
        label: 'Phrase 1: The Ascending Steps',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 1.0 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.0 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.0 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 1.0 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 1.0 },
        ],
      },
      {
        id: 'p2',
        label: 'Phrase 2: The Step Down',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 1.0 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 1.0 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 1.0 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 2.0 },
        ],
      },
      {
        id: 'p3',
        label: 'Phrase 3: The Ascending Repeat',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 1.0 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.0 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.0 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 1.0 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 1.0 },
        ],
      },
      {
        id: 'p4',
        label: 'Phrase 4: Resolving to C',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 1.0 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 1.0 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 1.0 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 1.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 2.5 },
        ],
      },
    ],
  },

  {
    id: 'bella_ciao',
    title: 'Bella Ciao',
    artist: 'Italian Folk / Money Heist',
    year: 1944,
    category: 'classic',
    tag: 'Folk Anthem',
    bpm: 104,
    difficulty: 'Moderate',
    desc: 'The viral resistance anthem made world-famous by Money Heist. Upbeat, staccato, and driving.',
    phrases: [
      {
        id: 'p1',
        label: 'Phrase 1: The Call A',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 2.5 },
        ],
      },
      {
        id: 'p2',
        label: 'Phrase 2: The Call B',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 2.5 },
        ],
      },
      {
        id: 'p3',
        label: 'Phrase 3: “O bella ciao, bella ciao…”',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 2.0 },
        ],
      },
      {
        id: 'p4',
        label: 'Phrase 4: The Climax',
        notes: [
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 2.5 },
        ],
      },
    ],
  },

  {
    id: 'saints',
    title: 'When the Saints Go Marching In',
    artist: 'Traditional / Louis Armstrong',
    year: 1938,
    category: 'classic',
    tag: 'Brass & Blues',
    bpm: 96,
    difficulty: 'Gentle',
    desc: 'The joyful New Orleans standard with pickup quarter notes and ringing sustained cadence chords.',
    phrases: [
      {
        id: 'p1',
        label: 'Phrase 1: “Oh when the saints…”',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.75 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.75 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 3.0 },
        ],
      },
      {
        id: 'p2',
        label: 'Phrase 2: “…go marching in”',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.75 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.75 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 3.0 },
        ],
      },
      {
        id: 'p3',
        label: 'Phrase 3: “Lord I want to be in that number…”',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.75 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.75 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 1.0 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 2.5 },
        ],
      },
      {
        id: 'p4',
        label: 'Phrase 4: The Grand Resolution',
        notes: [
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 1.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.0 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 1.0 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 1.0 },
          { midi: 74, tab: '−4', dir: 'draw', hole: 4, beats: 1.0 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 3.0 },
        ],
      },
    ],
  },

  {
    id: 'sound_of_silence',
    title: 'The Sound of Silence',
    artist: 'Simon & Garfunkel',
    year: 1964,
    category: 'classic',
    tag: 'Folk Poetry',
    bpm: 76,
    difficulty: 'Gentle',
    desc: 'Gentle, haunting folk melody with quiet sustained resonance and deliberate melodic steps.',
    phrases: [
      {
        id: 'p1',
        label: 'Phrase 1: “Hello darkness my old friend…”',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 1.0 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 1.0 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 2.5 },
        ],
      },
      {
        id: 'p2',
        label: 'Phrase 2: “…I’ve come to talk with you again”',
        notes: [
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 2.5 },
        ],
      },
      {
        id: 'p3',
        label: 'Phrase 3: “Because a vision softly creeping…”',
        notes: [
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 0.5 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 1.0 },
          { midi: 81, tab: '−6', dir: 'draw', hole: 6, beats: 1.0 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 2.5 },
        ],
      },
      {
        id: 'p4',
        label: 'Phrase 4: “…within the sound of silence”',
        notes: [
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 79, tab: '6', dir: 'blow', hole: 6, beats: 1.0 },
          { midi: 77, tab: '−5', dir: 'draw', hole: 5, beats: 0.5 },
          { midi: 76, tab: '5', dir: 'blow', hole: 5, beats: 0.5 },
          { midi: 72, tab: '4', dir: 'blow', hole: 4, beats: 3.0 },
        ],
      },
    ],
  },
];

export const getSongById = (id) => SONGS.find((s) => s.id === id);
