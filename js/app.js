import { ALL_NOTES, HOLES, midiToLetter, notesForMidi, tab, setRefA4, getNoteRole } from './notes.js';
import { Listener } from './mic.js';
import { playNote, playMelody, stopMelody } from './synth.js?v=4';
import { createHarp } from './harp.js';
import * as store from './store.js';
import { SONGS, getSongById, getRhythmMeta } from './songs.js?v=4';

const $ = (id) => document.getElementById(id);

// =====================================================================
// Shared: harmonica maps, mic, navigation
// =====================================================================
const harpPlay = createHarp($('harp-play'), { onPress: (n) => playNote(n.midi, { dur: 0.9 }) });
const harpEcho = createHarp($('harp-echo'), { onPress: (n) => playNote(n.midi, { dur: 0.9 }) });
const harpSong = createHarp($('harp-song'), { onPress: (n) => playNote(n.midi, { dur: 0.9 }) });
const harps = [harpPlay, harpEcho, harpSong];
const refreshHeat = () => harps.forEach((h) => h.setHeat(store.getStats()));
refreshHeat();

const mic = new Listener({ onFrame, onNote, onUnclear, onError });

const UNCLEAR_TEXT = 'I can hear sound, but not one clear note. Try covering just one hole, or breathe a little softer.';
let unclearHoldUntil = 0; // keeps the Play readout message from being wiped on the next frame

function onUnclear() {
  if (currentView === 'echo' && echo.state === 'listening') {
    setMsg(UNCLEAR_TEXT);
  } else if (currentView === 'play' && readout.dataset.state === 'idle') {
    unclearHoldUntil = performance.now() + 2500;
    $('hole-text').textContent = UNCLEAR_TEXT;
  }
}

function onError(err) {
  const text = `Something went wrong (${err?.message || err}). Still listening.`;
  $('mic-status').textContent = text;
  $('echo-status').textContent = text;
}

function centsWord(c) {
  const a = Math.abs(c);
  if (a <= 12) return 'right on';
  const side = c > 0 ? 'sharp' : 'flat';
  return a > 30 ? `quite ${side}` : `a touch ${side}`;
}

// ---------- navigation ----------
let currentView = 'play';
function go(view) {
  if (view === currentView) return;
  if (currentView === 'echo' && cancelPlayback()) setMsg('Press “Hear it” when you’re ready.');
  if (currentView === 'songs') {
    stopMelody();
    $('btn-song-full-preview')?.classList.remove('playing');
  }
  currentView = view;
  document.querySelectorAll('.view').forEach((v) => (v.hidden = v.id !== `view-${view}`));
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.view === view));
  history.replaceState(null, '', `#${view}`);

  if (view === 'songs') renderSongbook();
  if (view === 'register') renderRegister();
}
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => go(t.dataset.view)));
const startView = location.hash.replace('#', '');
if (startView && document.getElementById(`view-${startView}`)) {
  currentView = 'play';
  go(startView);
} else {
  // Pre-render register stats in background
  setTimeout(renderRegister, 100);
}

// =====================================================================
// Play tab: live readout
// =====================================================================
const readout = $('readout');
let lastVoiced = 0;

function gateFromSlider(v) {
  // 0 → 0.05 (needs loud), 85 → ~0.001, 100 → 0.0005 (very sensitive)
  return 0.05 * 10 ** (-(v / 100) * 2);
}
$('sens').addEventListener('input', (e) => mic.setGate(gateFromSlider(+e.target.value)));
mic.setGate(gateFromSlider(+$('sens').value));

function onFrame(f) {
  const now = performance.now();
  $('level-fill').style.width = `${Math.min(100, Math.sqrt(f.rms || 0) * 220)}%`;

  if (f.voiced) {
    lastVoiced = now;
    show(f);
  } else if (now - lastVoiced > 300) {
    clearReadout();
  }
}

function show(f) {
  const matches = notesForMidi(f.midi);
  const dirs = new Set(matches.map((n) => n.dir));
  const dirState = !matches.length ? 'off' : dirs.size > 1 ? 'both' : [...dirs][0];
  const isTuned = Math.abs(f.cents) <= 12;

  // Update Play view readout
  if (readout) {
    readout.dataset.state = 'live';
    readout.dataset.dir = dirState;
    readout.dataset.tuned = isTuned;
  }
  const noteLetter = midiToLetter(f.midi);
  const letterEl = $('note-big');
  if (letterEl) letterEl.textContent = noteLetter;

  const tabText = matches.length
    ? matches.map((n) => `tab ${n.dir === 'draw' ? '−' : ''}${n.hole}`).join('   or   ')
    : 'Not on the standard map — a bend or transition tone.';
  const holeTextEl = $('hole-text');
  if (holeTextEl) holeTextEl.textContent = tabText;

  const centsDot = $('cents-dot');
  if (centsDot) centsDot.style.left = `${50 + Math.max(-50, Math.min(50, f.cents))}%`;
  const centsWordEl = $('cents-word');
  if (centsWordEl) centsWordEl.textContent = centsWord(f.cents);
  const steadyFill = $('steady-fill');
  if (steadyFill) steadyFill.style.width = `${Math.max(0, Math.min(1, (f.clarity - 0.8) / 0.19)) * 100}%`;

  const role = getNoteRole(f.midi);
  const roleEl = $('note-role');
  if (roleEl) {
    roleEl.innerHTML = `<span class="solfege">${role.syllable} (${role.role})</span> · <span class="freq">~${role.freq} Hz</span> · <span class="family">${role.family}</span> · <span class="reg">${role.reg}</span>`;
  }

  // Update Song Studio Live Distance Strip & Replication Feedback
  const distStrip = $('distance-strip');
  if (distStrip && currentView === 'songs' && activeSong) {
    distStrip.dataset.state = 'live';
    const phrase = activeSong.phrases[activePhraseIdx];
    const want = phrase?.notes[activeReplication?.noteIdx || 0];

    const playedTab = matches.length
      ? (matches[0].dir === 'draw' ? '−' : '') + matches[0].hole
      : noteLetter;

    const tabBadge = $('song-tab-badge');
    if (tabBadge) {
      tabBadge.textContent = playedTab;
      tabBadge.dataset.dir = dirState;
    }

    if (want) {
      // Calculate true cents distance relative to the authentic target note
      const centsDiff = Math.round(((f.midiFloat ?? f.midi) - want.midi) * 100);
      const hzDiff = Math.round((f.freq || midiToFreq(f.midi)) - want.freq);
      const isTargetHole = matches.some((m) => m.hole === want.hole && m.dir === want.dir);

      const noteNameEl = $('song-note-name');
      if (noteNameEl) {
        noteNameEl.textContent = `${noteLetter} · ~${Math.round(f.freq || midiToFreq(f.midi))} Hz (Target: ${want.tab} / ~${Math.round(want.freq)} Hz)`;
      }

      // Distance dot on the -50c .. 0c .. +50c track
      const distDot = $('distance-dot');
      if (distDot) {
        const gaugePos = 50 + Math.max(-50, Math.min(50, centsDiff));
        distDot.style.left = `${gaugePos}%`;
      }

      const distReadout = $('distance-readout');
      if (distReadout) {
        if (isTargetHole) {
          if (Math.abs(centsDiff) <= 12) {
            distReadout.textContent = `Spot-on true pitch! (${centsDiff >= 0 ? '+' : ''}${centsDiff}¢)`;
            distReadout.className = 'distance-readout true-pitch';
          } else if (centsDiff < -12) {
            distReadout.textContent = `${Math.abs(centsDiff)}¢ flat from true (${hzDiff} Hz) · Lift breath`;
            distReadout.className = 'distance-readout flat-pitch';
          } else {
            distReadout.textContent = `+${centsDiff}¢ sharp from true (+${hzDiff} Hz) · Relax jaw`;
            distReadout.className = 'distance-readout sharp-pitch';
          }
        } else {
          const slideDir = f.midi < want.midi ? 'slide right ➔' : 'slide left ⬅';
          distReadout.textContent = `Voiced ${playedTab} · Target is ${want.tab} (${slideDir})`;
          distReadout.className = 'distance-readout wrong-hole';
        }
      }
    }

    // Single-hole embouchure clarity percentage
    const clarityPct = Math.round(Math.max(0, Math.min(100, ((f.clarity || 0.8) - 0.7) / 0.28 * 100)));
    const clarityEl = $('clarity-pct');
    if (clarityEl) clarityEl.textContent = `${clarityPct}%`;
    const songSteady = $('song-steady-fill');
    if (songSteady) songSteady.style.width = `${clarityPct}%`;
  }

  // Update per-reed quality in real-time when a single clear hole is voiced
  if (matches.length === 1 && f.clarity >= 0.55) {
    store.recordReedQuality(matches[0].hole, matches[0].dir, {
      hit: true,
      cents: f.cents,
      clarity: f.clarity,
    });
  }

  harps.forEach((h) => h.setLive(f.midi));
}

function clearReadout() {
  if (readout) {
    readout.dataset.state = 'idle';
    delete readout.dataset.dir;
  }
  const letterEl = $('note-big');
  if (letterEl) letterEl.textContent = '—';
  const roleEl = $('note-role');
  if (roleEl) roleEl.textContent = '';
  if (performance.now() >= unclearHoldUntil) {
    const holeTextEl = $('hole-text');
    if (holeTextEl) {
      holeTextEl.textContent = mic.running ? 'Listening… play a note.' : 'Press “Start listening” and play a note.';
    }
  }
  const centsDot = $('cents-dot');
  if (centsDot) centsDot.style.left = '50%';
  const centsWordEl = $('cents-word');
  if (centsWordEl) centsWordEl.innerHTML = '&nbsp;';
  const steadyFill = $('steady-fill');
  if (steadyFill) steadyFill.style.width = '0';

  // Clear Song Studio Live Distance Strip
  const distStrip = $('distance-strip');
  if (distStrip) {
    distStrip.dataset.state = 'idle';
    const tabBadge = $('song-tab-badge');
    if (tabBadge) {
      tabBadge.textContent = '—';
      delete tabBadge.dataset.dir;
    }
    const distDot = $('distance-dot');
    if (distDot) distDot.style.left = '50%';
    const songSteady = $('song-steady-fill');
    if (songSteady) songSteady.style.width = '0%';
  }

  harps.forEach((h) => h.setLive(null));
}

async function startMic(statusEl) {
  try {
    statusEl.textContent = 'Asking for your microphone…';
    await mic.start();
    statusEl.textContent = '';
    return true;
  } catch (err) {
    statusEl.textContent =
      err?.name === 'NotAllowedError'
        ? 'Mic access was blocked. Allow it in the browser’s site settings, then try again.'
        : 'Couldn’t open the microphone.';
    return false;
  } finally {
    updateMicUI();
    clearReadout();
  }
}

async function toggleMic() {
  if (mic.running) {
    mic.stop();
    updateMicUI();
    clearReadout();
    onMicStopped();
    return;
  }
  await startMic($('mic-status'));
}

function updateMicUI() {
  const on = mic.running;
  $('btn-listen').textContent = on ? 'Stop listening' : 'Start listening';
  $('mic-pill').setAttribute('aria-pressed', String(on));
  $('mic-pill-text').textContent = on ? 'listening' : 'mic off';
}

$('btn-listen').addEventListener('click', toggleMic);
$('mic-pill').addEventListener('click', toggleMic);
updateMicUI();

// =====================================================================
// Echo tab: I play a phrase, you play it back
//
// STATES
//   ready      Phrase on screen, nothing playing.
//                Hear it   → playing
//                Start over→ ready at note 1
//                you play  → listening (only if you've heard it, or notes are visible)
//   playing    I'm playing the phrase; the mic is ignored so it doesn't hear me.
//                finished  → listening (mic on) / ready (mic off)
//                interrupt → ready, progress kept
//   listening  Waiting for note `idx`.
//                right note → idx+1, or complete after the last one
//                wrong note → STAY on the same note. Never resets. After 3 misses, a hint appears.
//                mic off    → ready, progress kept
//   complete   Whole phrase matched.
//                Hear it again → playing from note 1;  New phrase → ready
//
// Hear it mid-phrase replays everything, then resumes at the note you were on.
// Leaving the tab pauses playback; progress is kept.
// Changing holes / length / New phrase always starts a fresh phrase.
//
// STATS: only the FIRST attempt on each note of a phrase is recorded, so exploring
// and retrying doesn't punish you. The thin bars on the map show first-try rate.
// =====================================================================
const POOLS = {
  stair: { label: 'The staircase', sub: 'holes 4–6', holes: [4, 5, 6] },
  low: { label: 'Low end', sub: 'holes 1–4', holes: [1, 2, 3, 4] },
  high: { label: 'Up high', sub: 'holes 6–10', holes: [6, 7, 8, 9, 10] },
  all: { label: 'Everything', sub: 'holes 1–10', holes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
};
const STEP_MS = 800;   // time between notes when I play the phrase
const NOTE_MS = 620;   // how long each note rings
const HINT_AFTER = 3;  // misses on one note before the hint appears

const echo = {
  pool: 'stair', len: 3,
  phrase: [], idx: 0, state: 'ready', heard: false,
  misses: [], attempted: [],
  timers: [], stops: [],
};

function makePhrase(poolKey, len) {
  const holes = POOLS[poolKey].holes;
  const inPool = ALL_NOTES.filter((n) => holes.includes(n.hole)).sort((a, b) => a.midi - b.midi);
  const uniq = [...new Map(inPool.map((n) => [n.midi, n])).values()]; // unique by pitch
  let i = Math.floor(Math.random() * uniq.length);
  const out = [];
  for (let k = 0; k < len; k++) {
    const note = uniq[i];
    const here = notesForMidi(note.midi, holes);
    const dirs = new Set(here.map((n) => n.dir));
    out.push({
      midi: note.midi,
      id: note.id,
      letter: midiToLetter(note.midi),
      tabs: here.map(tab).join(' / '),
      where: here.map((n) => `${n.dir === 'draw' ? '−' : ''}${n.hole}`).join(' or '),
      dir: dirs.size > 1 ? 'both' : note.dir,
    });
    // random walk by 1–2 steps, never repeating the same note back-to-back
    const steps = [-2, -1, 1, 2].filter((s) => i + s >= 0 && i + s < uniq.length);
    i += steps[Math.floor(Math.random() * steps.length)];
  }
  return out;
}

const stepEl = (i) => $('phrase').querySelector(`.step[data-i="${i}"]`);
const setMsg = (text) => ($('echo-msg').textContent = text);

function renderPhrase() {
  $('phrase').innerHTML = echo.phrase
    .map(
      (s, i) => `
    <div class="step" data-i="${i}" data-dir="${s.dir}">
      <span class="sn">${s.letter}</span>
      <span class="st">${s.tabs}</span>
    </div>`
    )
    .join('');
  $('phrase').classList.toggle('ear', $('ear-only').checked);
}

function clearMarks(from = 0) {
  document.querySelectorAll('#phrase .step').forEach((el) => {
    if (+el.dataset.i >= from) el.classList.remove('done', 'hint');
  });
}

function refreshEchoUI() {
  // which note is "next"
  document.querySelectorAll('#phrase .step').forEach((el) => el.classList.remove('next'));
  if (echo.state === 'listening' || (echo.state === 'ready' && echo.idx > 0)) stepEl(echo.idx)?.classList.add('next');

  const complete = echo.state === 'complete';
  $('btn-hear').textContent = complete || echo.idx > 0 ? 'Hear it again' : 'Hear it';
  $('btn-hear').classList.toggle('primary', !complete);
  $('btn-new').classList.toggle('primary', complete);
  $('btn-restart').hidden = !(echo.idx > 0 && !complete);
  const n = store.getRounds();
  $('rounds').textContent = n ? `${n} phrase${n === 1 ? '' : 's'} played back so far` : '';
}

function setState(s) {
  echo.state = s;
  refreshEchoUI();
}

/** Stop any phrase in progress. Returns true if a playing phrase was interrupted. */
function cancelPlayback() {
  echo.timers.forEach(clearTimeout);
  echo.timers = [];
  echo.stops.forEach((stop) => stop());
  echo.stops = [];
  document.querySelectorAll('#phrase .step').forEach((el) => el.classList.remove('playing'));
  if (echo.state === 'playing') {
    setState('ready');
    return true;
  }
  return false;
}

function newPhrase() {
  cancelPlayback();
  echo.phrase = makePhrase(echo.pool, echo.len);
  echo.idx = 0;
  echo.heard = false;
  echo.misses = [];
  echo.attempted = [];
  renderPhrase();
  setMsg('Press “Hear it”.');
  setState('ready');
}

function startOver() {
  cancelPlayback();
  echo.idx = 0;
  echo.misses = [];
  clearMarks();
  setMsg('Back to the first note. Press “Hear it”, or just start playing.');
  setState('ready');
}

async function hear() {
  cancelPlayback();
  if (!mic.running) await startMic($('echo-status'));

  // Resume where you were, unless the phrase was already finished.
  if (echo.state === 'complete') echo.idx = 0;
  const resumeAt = echo.idx;
  if (resumeAt === 0) {
    echo.misses = [];
    clearMarks();
  }

  echo.heard = true;
  setState('playing');
  setMsg('Listen…');

  const total = echo.phrase.length * STEP_MS;
  mic.ignoreFor(total + 450); // don't hear my own speakers
  echo.phrase.forEach((s, i) => {
    echo.stops.push(playNote(s.midi, { when: (i * STEP_MS) / 1000, dur: NOTE_MS / 1000 }));
    echo.timers.push(
      setTimeout(() => {
        stepEl(i)?.classList.add('playing');
        harpEcho.flash(s.id, NOTE_MS);
      }, i * STEP_MS),
      setTimeout(() => stepEl(i)?.classList.remove('playing'), i * STEP_MS + NOTE_MS)
    );
  });
  echo.timers.push(
    setTimeout(() => {
      echo.stops = [];
      if (mic.running) {
        setState('listening');
        setMsg(resumeAt > 0 ? `Your turn — pick up at note ${resumeAt + 1}.` : 'Your turn — play the first note.');
      } else {
        setState('ready');
        setMsg('The mic is off. Press “Start listening” (top right), then play it back.');
      }
    }, total + 200)
  );
}

function onMicStopped() {
  if (echo.state === 'listening') {
    setState('ready');
    setMsg('The mic is off — your progress is kept. Turn it back on and carry on.');
  }
}

$('tuning-select')?.addEventListener('change', (e) => setRefA4(+e.target.value));

function onEchoNote(ev) {
  if (currentView !== 'echo') return;
  const ear = $('ear-only').checked;
  const canPlay = echo.state === 'listening' || (echo.state === 'ready' && (echo.heard || !ear));
  if (!canPlay) return;
  if (echo.state === 'ready') setState('listening');

  const i = echo.idx;
  const want = echo.phrase[i];
  if (!want) return;
  const hit = ev.midi === want.midi;

  if (!echo.attempted[i]) {            // first attempt on this note only
    echo.attempted[i] = true;
    store.recordAttempt(want.midi, hit);
    refreshHeat();
  }

  if (hit) {
    // Clear mistake visual cue on harmonica map
    harpEcho.cue(null);

    // Re-arm listener so that if the NEXT note in the phrase is the same pitch,
    // the user's re-attack (tongue or breath release) will cleanly trigger the next step
    mic.resetRegistered();

    const el = stepEl(i);
    el?.classList.remove('hint', 'miss');
    el?.classList.add('done');
    const wasRecovery = (echo.misses[i] || 0) > 0;
    echo.idx++;

    if (echo.idx >= echo.phrase.length) {
      store.bumpRounds();
      setState('complete');
      setMsg(`That's the whole phrase! ${Math.abs(ev.cents) > 25 ? `Last note was ${centsWord(ev.cents)} — great.` : 'Beautifully played.'}`);
    } else {
      const tune = Math.abs(ev.cents) > 25 ? ` (${centsWord(ev.cents)})` : '';
      setState('listening');
      setMsg(wasRecovery
        ? `Recovered! Found ${want.letter} (${want.where})${tune}. Next one!`
        : `${midiToLetter(ev.midi)} — yes${tune}. Next one.`);
    }
    return;
  }

  // Wrong note:
  // Note: we do NOT call mic.resetRegistered() here!
  // Keeping registered set to ev.midi ensures that holding this continuous wrong breath
  // will NOT spam multiple miss events. A new miss event will only fire if the user
  // slides to a different hole or releases breath and blows again.
  echo.misses[i] = (echo.misses[i] || 0) + 1;
  const heard = midiToLetter(ev.midi);
  const heardHoles = notesForMidi(ev.midi)
    .map((n) => `${n.dir === 'draw' ? '−' : ''}${n.hole}`)
    .join(' or ');

  // Gently pulse the target hole on the harmonica map so the user knows where to slide
  harpEcho.cue(want.id);

  const resetOnMiss = $('reset-on-miss')?.checked;
  const dirGuide = ev.midi < want.midi ? 'slide right' : 'slide left';

  if (resetOnMiss) {
    const el = stepEl(i);
    el?.classList.add('miss');
    setTimeout(() => el?.classList.remove('miss'), 500);

    // Give 3 distinct attempts with patience before wiping progress
    const attemptsLeft = 3 - echo.misses[i];
    if (attemptsLeft > 0) {
      setMsg(`Heard ${heard}${heardHoles ? ` (tab ${heardHoles})` : ''} — looking for ${want.letter} (tab ${want.where}). Try to ${dirGuide}! (${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} left before reset)`);
      return;
    }

    setMsg(`Heard ${heard}. Resetting phrase to note 1 — let’s build momentum together!`);
    echo.idx = 0;
    clearMarks();
    harpEcho.cue(null);
    refreshEchoUI();
    return;
  }

  // If "Reset on mistake" is unchecked: remain at status quo with helpful guidance
  if (echo.misses[i] >= HINT_AFTER) {
    stepEl(i)?.classList.add('hint');
    setMsg(`Here's a hint: it's ${want.letter}, tab ${want.where}. Try to ${dirGuide}.`);
  } else if (ev.midi % 12 === want.midi % 12) {
    const dir = ev.midi > want.midi ? 'higher' : 'lower';
    setMsg(`Right letter (${heard}), but an octave ${dir}. Try ${ev.midi > want.midi ? 'further left' : 'further right'} on the map.`);
  } else {
    setMsg(
      `Heard ${heard}${heardHoles ? ` (tab ${heardHoles})` : ''}.` +
        (ear ? ` Not quite — try to ${dirGuide}.` : ` Looking for ${want.letter} (tab ${want.where}). Try to ${dirGuide}.`)
    );
  }
}

// Click to play audio on guide scale preview
$('guide-scale')?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-midi]');
  if (!btn) return;
  playNote(+btn.dataset.midi, { dur: 0.8 });
});

// ---------- controls ----------
$('pool-seg').innerHTML = Object.entries(POOLS)
  .map(
    ([k, p]) => `<button type="button" role="radio" data-pool="${k}" aria-checked="${k === echo.pool}"
      class="${k === echo.pool ? 'on' : ''}">${p.label}<small>${p.sub}</small></button>`
  )
  .join('');
$('pool-seg').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-pool]');
  if (!b) return;
  echo.pool = b.dataset.pool;
  $('pool-seg').querySelectorAll('button').forEach((x) => {
    const on = x === b;
    x.classList.toggle('on', on);
    x.setAttribute('aria-checked', String(on));
  });
  newPhrase();
});

function setLen(n) {
  echo.len = Math.max(2, Math.min(6, n));
  $('len-val').textContent = echo.len;
  newPhrase();
}
$('len-down').addEventListener('click', () => setLen(echo.len - 1));
$('len-up').addEventListener('click', () => setLen(echo.len + 1));
$('ear-only').addEventListener('change', () => $('phrase').classList.toggle('ear', $('ear-only').checked));
$('btn-hear').addEventListener('click', hear);
$('btn-new').addEventListener('click', newPhrase);
$('btn-restart').addEventListener('click', startOver);

newPhrase();

// Central note dispatcher: routes note events to Echo or Songs
function onNote(ev) {
  if (currentView === 'echo') {
    onEchoNote(ev);
  } else if (currentView === 'songs' && activeSong) {
    onSongNote(ev);
  }
}

// =====================================================================
// Songbook Studio: authentic exemplars (YouTube), HarpTabs breakdowns,
// and real-time distance-to-true-audio replication
// =====================================================================
let songFilter = 'all';
let activeSong = null;
let activePhraseIdx = 0;
let isLoopingPhrase = false;
let currentPlaybackRate = 1.0;
let exemplarTimer = null;
let activeReplication = {
  noteIdx: 0,
  attempts: [],
  misses: 0,
  completed: false,
};

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function renderSongbook() {
  const grid = $('songs-grid');
  if (!grid) return;
  const progressMap = store.getAllSongProgress();

  const filtered = SONGS.filter((s) => songFilter === 'all' || s.category === songFilter);

  grid.innerHTML = filtered.map((s) => {
    const prog = progressMap[s.id];
    let badgeText = 'Unexplored';
    let badgeClass = '';
    if (prog?.mastered) {
      badgeText = 'Mastered ★';
      badgeClass = 'style="color:var(--ok);border-color:var(--ok);"';
    } else if (prog?.phrasesCompleted > 0) {
      badgeText = `Phrase ${prog.phrasesCompleted}/${s.phrases.length}`;
      badgeClass = 'style="color:var(--amber);border-color:var(--amber);"';
    }

    return `
      <article class="song-card" data-id="${s.id}">
        <div class="song-card-top">
          <span class="guide-tag">${s.tag}</span>
          <span class="guide-tag" ${badgeClass}>${badgeText}</span>
        </div>
        <div>
          <h3 class="song-card-title">${s.title}</h3>
          <span class="song-card-artist">${s.artist} (${s.year})</span>
        </div>
        <p class="song-card-desc">${s.desc}</p>
        <div class="song-card-meta">
          <span>${s.difficulty}</span>
          <span>·</span>
          <span>${s.key || 'C Harmonica'}</span>
          <span>·</span>
          <span>${s.phrases.length} phrases</span>
        </div>
        <div class="song-card-actions">
          <button type="button" class="btn primary" data-action="practice" data-id="${s.id}">
            Study &amp; Replicate
          </button>
          <a href="https://www.youtube.com/watch?v=${s.ytId}" target="_blank" rel="noopener" class="btn ghost yt-card-link">
            🎬 YouTube ↗
          </a>
        </div>
      </article>
    `;
  }).join('');
}

// Filter button clicks
$('song-filters')?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-filter]');
  if (!btn) return;
  songFilter = btn.dataset.filter;
  $('song-filters').querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
  renderSongbook();
});

// Song card action clicks
$('songs-grid')?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="practice"]');
  if (!btn) return;
  const songId = btn.dataset.id;
  const song = getSongById(songId);
  if (song) openSongPractice(song);
});

function openSongPractice(song) {
  stopMelody();
  activeSong = song;
  activePhraseIdx = 0;
  isLoopingPhrase = false;
  currentPlaybackRate = 1.0;

  $('song-practice-tray').hidden = false;
  $('songs-grid').hidden = true;

  $('song-practice-tag').textContent = song.tag;
  $('song-practice-title').textContent = song.title;
  $('song-practice-artist').textContent = `${song.artist} (${song.year})`;
  if ($('song-practice-key')) $('song-practice-key').textContent = song.key || 'Key: C Harmonica';
  if ($('song-source-name')) $('song-source-name').textContent = song.source || 'HarpTabs.com';

  renderPhraseStepper();
  loadSongPhrase(0);
}

function closeSongPractice() {
  if (exemplarTimer) clearTimeout(exemplarTimer);
  const iframe = $('exemplar-iframe');
  if (iframe) iframe.src = '';

  activeSong = null;
  isLoopingPhrase = false;
  $('song-practice-tray').hidden = true;
  $('songs-grid').hidden = false;
  renderSongbook();
}

$('btn-song-back')?.addEventListener('click', closeSongPractice);

function renderPhraseStepper() {
  const stepper = $('song-phrase-stepper');
  if (!stepper || !activeSong) return;
  const prog = store.getSongProgress(activeSong.id);
  const completed = prog?.phrasesCompleted || 0;

  stepper.innerHTML = activeSong.phrases.map((p, idx) => {
    const isDone = completed > idx;
    const isActive = activePhraseIdx === idx;
    const cls = ['phrase-step-btn', isActive ? 'active' : '', isDone ? 'done' : ''].filter(Boolean).join(' ');
    return `<button type="button" class="${cls}" data-idx="${idx}">Phrase ${idx + 1}${isDone ? ' ✓' : ''}</button>`;
  }).join('');
}

$('song-phrase-stepper')?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-idx]');
  if (!btn) return;
  loadSongPhrase(+btn.dataset.idx);
});

function loadSongPhrase(idx) {
  if (!activeSong) return;
  if (exemplarTimer) clearTimeout(exemplarTimer);

  activePhraseIdx = idx;
  const phrase = activeSong.phrases[idx];
  if (!phrase) return;

  activeReplication = {
    noteIdx: 0,
    attempts: [],
    misses: 0,
    completed: false,
  };

  // Update phrase status badge
  const prog = store.getSongProgress(activeSong.id);
  const isDone = (prog?.phrasesCompleted || 0) > idx;
  const badgeEl = $('song-phrase-badge');
  if (badgeEl) {
    badgeEl.textContent = isDone ? 'Mastered ✓' : 'In progress';
    badgeEl.className = `phrase-badge ${isDone ? 'mastered' : ''}`;
  }

  // Update timestamps & coach tip
  const tsEl = $('exemplar-timestamp');
  if (tsEl) tsEl.textContent = `${formatTime(phrase.start)} – ${formatTime(phrase.end)}`;

  const tipEl = $('coach-tip-text');
  if (tipEl) tipEl.textContent = phrase.coachTip || 'Focus on single-hole embouchure and breath support.';

  const ytLink = $('exemplar-yt-link');
  if (ytLink) ytLink.href = `https://www.youtube.com/watch?v=${activeSong.ytId}&t=${phrase.start}s`;

  // Set YouTube embed source
  const iframe = $('exemplar-iframe');
  if (iframe) {
    iframe.src = `https://www.youtube-nocookie.com/embed/${activeSong.ytId}?start=${phrase.start}&end=${phrase.end}&enablejsapi=1&rel=0`;
  }

  // Reset play button
  $('btn-play-exemplar')?.classList.remove('playing');
  if ($('play-exemplar-icon')) $('play-exemplar-icon').textContent = '▶';
  if ($('play-exemplar-text')) $('play-exemplar-text').textContent = 'Play Phrase Clip';

  // Hide scorecard & next phrase button
  const sc = $('replication-scorecard');
  if (sc) sc.hidden = true;
  const nextBtn = $('btn-song-next-phrase');
  if (nextBtn) nextBtn.hidden = true;

  // Render tab steps
  renderPhraseSteps(phrase.notes);
  renderPhraseStepper();

  // Reset replication distance strip & message
  const distStrip = $('distance-strip');
  if (distStrip) distStrip.dataset.state = 'idle';

  const tabBadge = $('song-tab-badge');
  if (tabBadge) {
    tabBadge.textContent = '—';
    delete tabBadge.dataset.dir;
  }

  const firstNote = phrase.notes[0];
  const noteNameEl = $('song-note-name');
  if (noteNameEl && firstNote) {
    noteNameEl.textContent = `Target note 1: ${firstNote.tab} (~${Math.round(firstNote.freq)} Hz)`;
  }

  const distReadout = $('distance-readout');
  if (distReadout && firstNote) {
    distReadout.textContent = `Play note 1 (${firstNote.tab})`;
    distReadout.className = 'distance-readout';
  }

  const distDot = $('distance-dot');
  if (distDot) distDot.style.left = '50%';

  const clarityEl = $('clarity-pct');
  if (clarityEl) clarityEl.textContent = '0%';

  const steadyFill = $('song-steady-fill');
  if (steadyFill) steadyFill.style.width = '0%';

  $('phrase-seq-counter').textContent = `Note 1 / ${phrase.notes.length}`;
  $('song-practice-msg').textContent = `Play the exemplar clip above to hear the artist, then play note 1 (${firstNote ? firstNote.tab : ''}) into your mic.`;
}

function renderPhraseSteps(notes) {
  const container = $('song-phrase-steps');
  if (!container) return;

  container.innerHTML = notes.map((n, i) => {
    const isFirst = i === 0;
    return `
      <div class="step ${isFirst ? 'active-step' : ''}" data-dir="${n.dir}" data-idx="${i}" data-tab="${n.tab}">
        <span class="sn">${midiToLetter(n.midi)}</span>
        <span class="st">${n.tab}</span>
        <span class="sfreq">~${Math.round(n.freq)} Hz</span>
        ${n.lyric ? `<span class="slyric">${n.lyric}</span>` : ''}
      </div>
    `;
  }).join('');
}

// YouTube Player Controls
function playPhraseClip() {
  if (!activeSong) return;
  const phrase = activeSong.phrases[activePhraseIdx];
  if (!phrase) return;

  const iframe = $('exemplar-iframe');
  if (!iframe) return;

  // Load and autoplay clip
  iframe.src = `https://www.youtube-nocookie.com/embed/${activeSong.ytId}?start=${phrase.start}&end=${phrase.end}&autoplay=1&enablejsapi=1&rel=0`;

  const btn = $('btn-play-exemplar');
  if (btn) btn.classList.add('playing');
  if ($('play-exemplar-icon')) $('play-exemplar-icon').textContent = '⏹';
  if ($('play-exemplar-text')) $('play-exemplar-text').textContent = 'Playing Clip…';

  const clipDurationSec = (phrase.end - phrase.start) / currentPlaybackRate;
  if (exemplarTimer) clearTimeout(exemplarTimer);

  exemplarTimer = setTimeout(() => {
    if (btn) btn.classList.remove('playing');
    if ($('play-exemplar-icon')) $('play-exemplar-icon').textContent = '▶';
    if ($('play-exemplar-text')) $('play-exemplar-text').textContent = 'Play Phrase Clip';

    if (isLoopingPhrase && activeSong) {
      playPhraseClip();
    }
  }, clipDurationSec * 1000 + 400);
}

$('btn-play-exemplar')?.addEventListener('click', () => {
  if ($('btn-play-exemplar').classList.contains('playing')) {
    if (exemplarTimer) clearTimeout(exemplarTimer);
    const iframe = $('exemplar-iframe');
    const phrase = activeSong?.phrases[activePhraseIdx];
    if (iframe && phrase && activeSong) {
      iframe.src = `https://www.youtube-nocookie.com/embed/${activeSong.ytId}?start=${phrase.start}&end=${phrase.end}&enablejsapi=1&rel=0`;
    }
    $('btn-play-exemplar').classList.remove('playing');
    if ($('play-exemplar-icon')) $('play-exemplar-icon').textContent = '▶';
    if ($('play-exemplar-text')) $('play-exemplar-text').textContent = 'Play Phrase Clip';
  } else {
    playPhraseClip();
  }
});

$('btn-loop-exemplar')?.addEventListener('click', () => {
  isLoopingPhrase = !isLoopingPhrase;
  const btn = $('btn-loop-exemplar');
  if (btn) {
    btn.classList.toggle('active', isLoopingPhrase);
    btn.setAttribute('aria-pressed', String(isLoopingPhrase));
  }
});

// Speed Toggle
$('speed-slow')?.addEventListener('click', () => {
  currentPlaybackRate = 0.75;
  $('speed-slow').classList.add('active');
  $('speed-normal').classList.remove('active');
});

$('speed-normal')?.addEventListener('click', () => {
  currentPlaybackRate = 1.0;
  $('speed-normal').classList.add('active');
  $('speed-slow').classList.remove('active');
});

// Start replication manually or reset
$('btn-start-replication')?.addEventListener('click', async () => {
  if (!mic.running) await startMic($('song-mic-status'));
  restartReplication();
});

$('btn-song-restart-phrase')?.addEventListener('click', restartReplication);

function restartReplication() {
  if (!activeSong) return;
  const phrase = activeSong.phrases[activePhraseIdx];
  if (!phrase) return;

  activeReplication = {
    noteIdx: 0,
    attempts: [],
    misses: 0,
    completed: false,
  };

  const sc = $('replication-scorecard');
  if (sc) sc.hidden = true;
  const nextBtn = $('btn-song-next-phrase');
  if (nextBtn) nextBtn.hidden = true;

  const stepEls = $('song-phrase-steps')?.querySelectorAll('.step') || [];
  stepEls.forEach((el, idx) => {
    el.classList.remove('done', 'miss', 'playing', 'skipped', 'active-step', 'pulse-guide');
    const badge = el.querySelector('.step-acc-badge');
    if (badge) badge.remove();
    if (idx === 0) el.classList.add('active-step');
  });

  $('phrase-seq-counter').textContent = `Note 1 / ${phrase.notes.length}`;
  const firstNote = phrase.notes[0];
  $('song-practice-msg').textContent = `Ready! Play note 1: ${firstNote ? firstNote.tab : ''} (~${Math.round(firstNote?.freq || 0)} Hz)`;
}

$('btn-song-next-phrase')?.addEventListener('click', () => {
  if (activeSong && activePhraseIdx < activeSong.phrases.length - 1) {
    loadSongPhrase(activePhraseIdx + 1);
  }
});

// Replication logic: match sequence against true audio target frequencies
function onSongNote(ev) {
  if (!activeSong || activeReplication.completed) return;
  const phrase = activeSong.phrases[activePhraseIdx];
  if (!phrase) return;

  const want = phrase.notes[activeReplication.noteIdx];
  if (!want) return;

  const hit = ev.midi === want.midi;
  const centsDiff = Math.round(((ev.midiFloat ?? ev.midi) - want.midi) * 100);
  const stepEls = $('song-phrase-steps')?.querySelectorAll('.step') || [];

  // Record reed quality in local storage
  const matches = notesForMidi(want.midi);
  if (matches.length) {
    store.recordReedQuality(matches[0].hole, matches[0].dir, {
      hit,
      cents: centsDiff,
      clarity: ev.clarity,
    });
  }

  if (hit) {
    // Current target matched!
    mic.resetRegistered();
    activeReplication.attempts.push({
      tab: want.tab,
      cents: centsDiff,
      clarity: ev.clarity,
      hit: true,
    });

    const curStep = stepEls[activeReplication.noteIdx];
    if (curStep) {
      curStep.classList.remove('miss', 'active-step');
      curStep.classList.add('done');
      const badge = document.createElement('span');
      badge.className = 'step-acc-badge';
      badge.textContent = `${centsDiff >= 0 ? '+' : ''}${centsDiff}¢`;
      curStep.appendChild(badge);
    }

    activeReplication.noteIdx++;
    $('phrase-seq-counter').textContent = `Note ${Math.min(activeReplication.noteIdx + 1, phrase.notes.length)} / ${phrase.notes.length}`;

    if (activeReplication.noteIdx >= phrase.notes.length) {
      finishPhraseReplication(phrase);
    } else {
      stepEls.forEach((el, idx) => el.classList.toggle('active-step', idx === activeReplication.noteIdx));
      const nextNote = phrase.notes[activeReplication.noteIdx];
      $('song-practice-msg').textContent = `Great replication! Next note: ${nextNote.tab} (~${Math.round(nextNote.freq)} Hz)`;
    }
    return;
  }

  // Smooth sequence continuation: did the player slide into the next note in sequence?
  const nextTarget = phrase.notes[activeReplication.noteIdx + 1];
  if (nextTarget && ev.midi === nextTarget.midi) {
    mic.resetRegistered();
    activeReplication.attempts.push({
      tab: want.tab,
      cents: centsDiff,
      clarity: ev.clarity,
      hit: false,
      skipped: true,
    });
    activeReplication.attempts.push({
      tab: nextTarget.tab,
      cents: Math.round(((ev.midiFloat ?? ev.midi) - nextTarget.midi) * 100),
      clarity: ev.clarity,
      hit: true,
    });

    if (stepEls[activeReplication.noteIdx]) {
      stepEls[activeReplication.noteIdx].classList.remove('active-step');
      stepEls[activeReplication.noteIdx].classList.add('skipped');
    }
    if (stepEls[activeReplication.noteIdx + 1]) {
      stepEls[activeReplication.noteIdx + 1].classList.remove('active-step');
      stepEls[activeReplication.noteIdx + 1].classList.add('done');
    }

    activeReplication.noteIdx += 2;
    $('phrase-seq-counter').textContent = `Note ${Math.min(activeReplication.noteIdx + 1, phrase.notes.length)} / ${phrase.notes.length}`;

    if (activeReplication.noteIdx >= phrase.notes.length) {
      finishPhraseReplication(phrase);
    } else {
      stepEls.forEach((el, idx) => el.classList.toggle('active-step', idx === activeReplication.noteIdx));
      const nextNote = phrase.notes[activeReplication.noteIdx];
      $('song-practice-msg').textContent = `Keep the rhythm flowing! Next note: ${nextNote.tab} (~${Math.round(nextNote.freq)} Hz)`;
    }
    return;
  }

  // Non-interrupting guidance when missing:
  activeReplication.misses++;
  const playedMatches = notesForMidi(ev.midi);
  const playedTab = playedMatches.length
    ? (playedMatches[0].dir === 'draw' ? '−' : '') + playedMatches[0].hole
    : midiToLetter(ev.midi);

  if (stepEls[activeReplication.noteIdx]) {
    stepEls[activeReplication.noteIdx].classList.add('pulse-guide');
    setTimeout(() => stepEls[activeReplication.noteIdx]?.classList.remove('pulse-guide'), 350);
  }

  const slideTip = ev.midi < want.midi ? 'slide right' : 'slide left';
  $('song-practice-msg').textContent = `Target is ${want.tab} (heard ${playedTab} · ${slideTip}). Keep your breath moving!`;
}

function finishPhraseReplication(phrase) {
  activeReplication.completed = true;
  store.updateSongProgress(activeSong.id, activePhraseIdx, activeSong.phrases.length);
  store.addLogEntry(`Replicated ${activeSong.title} — Phrase ${activePhraseIdx + 1}`);
  refreshHeat();

  const attempts = activeReplication.attempts;
  const hitCount = attempts.filter((a) => a.hit).length;
  const totalNotes = phrase.notes.length;

  const centsList = attempts.filter((a) => a.hit).map((a) => Math.abs(a.cents));
  const avgCents = centsList.length
    ? Math.round(centsList.reduce((a, b) => a + b, 0) / centsList.length)
    : 0;

  const clarities = attempts.map((a) => a.clarity || 0.85);
  const avgClarity = clarities.length
    ? Math.round((clarities.reduce((a, b) => a + b, 0) / clarities.length) * 100)
    : 90;

  // Render scorecard
  const sc = $('replication-scorecard');
  if (sc) {
    sc.hidden = false;
    $('sc-title').textContent = `Phrase ${activePhraseIdx + 1} Replication Scorecard`;
    $('sc-matched').textContent = `${hitCount} / ${totalNotes}`;
    $('sc-avg-cents').textContent = `±${avgCents}¢`;
    $('sc-clarity').textContent = `${avgClarity}%`;

    let verdict = '';
    if (avgCents <= 8 && avgClarity >= 85) {
      verdict = '🌟 <b>Studio-grade intonation!</b> Your pitch and embouchure align tightly with the true exemplar performance.';
    } else if (avgCents <= 15) {
      verdict = '✨ <b>Solid replication!</b> Clean single notes with close harmonic alignment to the original recording.';
    } else {
      verdict = '👍 <b>Good sequence flow!</b> Focus on steady breath support to pull your intonation closer to the center line.';
    }
    $('sc-verdict').innerHTML = verdict;
  }

  const isLast = activePhraseIdx >= activeSong.phrases.length - 1;
  $('song-practice-msg').innerHTML = isLast
    ? `🎉 <b>Full tune completed!</b> You mastered all phrases in ${activeSong.title}.`
    : `✨ <b>Phrase ${activePhraseIdx + 1} mastered!</b> Review your replication stats above.`;

  if (!isLast) {
    const nextBtn = $('btn-song-next-phrase');
    if (nextBtn) {
      nextBtn.hidden = false;
      nextBtn.textContent = `Next phrase (${activePhraseIdx + 2}/${activeSong.phrases.length}) →`;
    }
  }
  renderPhraseStepper();
}

// =====================================================================
// Register & Stats: exploration checklist, hole health matrix, activity
// =====================================================================
function renderRegister() {
  const songs = SONGS;
  const songProgress = store.getAllSongProgress();
  const reedStats = store.getReedQuality();
  const journal = store.getJournal();

  // Summary counts
  let exploredCount = 0;
  let masteredPhrasesCount = 0;
  songs.forEach((s) => {
    const prog = songProgress[s.id];
    if (prog && prog.phrasesCompleted > 0) exploredCount++;
    if (prog) masteredPhrasesCount += (prog.phrasesCompleted || 0);
  });

  if ($('stat-songs-explored')) $('stat-songs-explored').textContent = `${exploredCount} / ${songs.length}`;
  if ($('stat-phrases-mastered')) $('stat-phrases-mastered').textContent = masteredPhrasesCount;

  // Average clarity
  const reedEntries = Object.values(reedStats);
  let totalAttempts = 0;
  let claritySum = 0;
  reedEntries.forEach((r) => {
    totalAttempts += (r.attempts || 0);
    claritySum += (r.avgClarity || 0.8) * (r.attempts || 1);
  });
  const avgClarity = totalAttempts > 0 ? Math.round((claritySum / (totalAttempts || 1)) * 100) : null;
  if ($('stat-overall-clarity')) $('stat-overall-clarity').textContent = avgClarity ? `${avgClarity}%` : '—';
  if ($('stat-total-notes')) $('stat-total-notes').textContent = totalAttempts;

  // Render Hole Health Matrix
  renderHoleHealthMatrix(reedStats);

  // Render Songbook Checklist
  renderSongChecklist(songProgress);

  // Render Activity Log
  renderActivityLog(journal);
}

function renderHoleHealthMatrix(reedStats) {
  const container = $('hole-health-matrix');
  if (!container) return;

  container.innerHTML = HOLES.map((h) => {
    const bId = `${h.hole}blow`;
    const dId = `${h.hole}draw`;
    const bStat = reedStats[bId] || { attempts: 0, hits: 0, avgCents: 0, avgClarity: 0.8 };
    const dStat = reedStats[dId] || { attempts: 0, hits: 0, avgCents: 0, avgClarity: 0.8 };

    const bAcc = bStat.attempts > 0 ? Math.round((bStat.hits / bStat.attempts) * 100) : 25;
    const dAcc = dStat.attempts > 0 ? Math.round((dStat.hits / dStat.attempts) * 100) : 25;

    return `
      <div class="hm-col">
        <button type="button" class="hm-cell blow" data-hole="${h.hole}" data-dir="blow" data-midi="${h.blow}" aria-label="Hole ${h.hole} Blow details">
          <span class="hm-note">${midiToLetter(h.blow)}</span>
          <span class="hm-tab">${h.hole}</span>
          <div class="hm-bar"><div class="hm-bar-fill" style="width:${bAcc}%"></div></div>
          <span class="hm-cents">${bStat.attempts > 0 ? (bStat.avgCents >= 0 ? `+${bStat.avgCents}¢` : `${bStat.avgCents}¢`) : '—'}</span>
        </button>
        <span class="hm-hole-num">${h.hole}</span>
        <button type="button" class="hm-cell draw" data-hole="${h.hole}" data-dir="draw" data-midi="${h.draw}" aria-label="Hole ${h.hole} Draw details">
          <span class="hm-note">${midiToLetter(h.draw)}</span>
          <span class="hm-tab">−${h.hole}</span>
          <div class="hm-bar"><div class="hm-bar-fill" style="width:${dAcc}%"></div></div>
          <span class="hm-cents">${dStat.attempts > 0 ? (dStat.avgCents >= 0 ? `+${dStat.avgCents}¢` : `${dStat.avgCents}¢`) : '—'}</span>
        </button>
      </div>
    `;
  }).join('');
}

$('hole-health-matrix')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.hm-cell');
  if (!btn) return;
  const hole = +btn.dataset.hole;
  const dir = btn.dataset.dir;
  const midi = +btn.dataset.midi;

  // Highlight active inspection cell
  $('hole-health-matrix').querySelectorAll('.hm-cell').forEach((c) => c.classList.toggle('active-inspect', c === btn));

  inspectHole(hole, dir, midi);
});

function inspectHole(hole, dir, midi) {
  const detailEl = $('hole-health-detail');
  if (!detailEl) return;

  const role = getNoteRole(midi);
  const id = `${hole}${dir}`;
  const stat = store.getReedQuality()[id] || { attempts: 0, hits: 0, avgCents: 0, avgClarity: 0.8 };
  const acc = stat.attempts > 0 ? Math.round((stat.hits / stat.attempts) * 100) : 0;
  const clarity = Math.round((stat.avgClarity || 0.8) * 100);

  // Personalized coaching tip based on acoustics & reed location
  let tip = '';
  if (hole <= 3) {
    tip = '<b>Rhythm & Chords Zone:</b> Foundation of the harmonica. For clean single notes, drop your jaw slightly and relax your tongue to avoid sounding neighbors.';
  } else if (hole === 2 && dir === 'draw') {
    tip = '<b>Tab −2 (G4):</b> The infamous beginner challenge. If it sounds flat or chokes, breathe gently from your belly with an open throat, like saying “ahhh”.';
  } else if (hole >= 4 && hole <= 7) {
    tip = '<b>Core Melody Zone:</b> Contains your full Do-Re-Mi scale. Pucker your lips like sipping through a narrow coffee straw to maintain isolation.';
  } else {
    tip = '<b>High Register (Holes 8–10):</b> Short, delicate reeds. Whisper your breath gently. Too much breath pressure causes these high reeds to choke or bend flat!';
  }

  detailEl.hidden = false;
  detailEl.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:.5rem;">
      <h4 style="margin:0; font-size:1.15rem; font-family:var(--display);">
        Tab ${dir === 'draw' ? '−' : ''}${hole} · ${role.letter} (${role.syllable})
      </h4>
      <span style="font-size:.85rem; color:var(--amber); font-weight:600;">${role.role}</span>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap:1.4rem; font-size:.85rem; color:var(--dim); margin-bottom:.6rem;">
      <span>Attempts: <b style="color:var(--text);">${stat.attempts}</b></span>
      <span>Accuracy: <b style="color:var(--text);">${acc}%</b></span>
      <span>Tone Clarity: <b style="color:var(--text);">${clarity}%</b></span>
      <span>Intonation Bias: <b style="color:var(--text);">${stat.attempts > 0 ? (stat.avgCents >= 0 ? `+${stat.avgCents}¢` : `${stat.avgCents}¢`) : 'Centered'}</b></span>
    </div>
    <p style="margin:0; font-size:.88rem; color:var(--text);">${tip}</p>
  `;
}

function renderSongChecklist(songProgress) {
  const container = $('song-checklist');
  if (!container) return;

  container.innerHTML = SONGS.map((s) => {
    const prog = songProgress[s.id];
    let statusText = 'Unexplored';
    let statusClass = '';
    if (prog?.mastered) {
      statusText = 'Mastered ★';
      statusClass = 'mastered';
    } else if (prog?.phrasesCompleted > 0) {
      statusText = `Phrase ${prog.phrasesCompleted}/${s.phrases.length}`;
      statusClass = 'in-progress';
    }

    return `
      <div class="cli-item">
        <div class="cli-meta">
          <h5>${s.title}</h5>
          <small>${s.artist} · ${s.difficulty}</small>
        </div>
        <span class="cli-status ${statusClass}">${statusText}</span>
      </div>
    `;
  }).join('');
}

function renderActivityLog(journal) {
  const list = $('activity-log');
  if (!list) return;

  if (!journal.length) {
    list.innerHTML = `<li class="log-item" style="color:var(--faint);">No practice activity recorded yet. Start playing in Play, Songs, or Echo!</li>`;
    return;
  }

  list.innerHTML = journal.map((item) => {
    const d = new Date(item.ts);
    const timeStr = `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return `
      <li class="log-item">
        <span class="log-time">${timeStr}</span>
        <span class="log-text">${item.text}</span>
      </li>
    `;
  }).join('');
}

// Data Export & Reset Handlers
$('btn-export-data')?.addEventListener('click', () => {
  const json = store.exportDataJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `harmonica_lessons_record_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

$('btn-reset-data')?.addEventListener('click', () => {
  if (confirm('Are you sure you want to reset your practice stats and records? This will clear your locally stored matrix.')) {
    store.resetAllData();
    renderRegister();
    refreshHeat();
    alert('Practice data has been reset.');
  }
});
