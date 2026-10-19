import { ALL_NOTES, midiToLetter, notesForMidi, tab, setRefA4 } from './notes.js';
import { Listener } from './mic.js';
import { playNote } from './synth.js';
import { createHarp } from './harp.js';
import * as store from './store.js';

const $ = (id) => document.getElementById(id);

// =====================================================================
// Shared: harmonica maps, mic, navigation
// =====================================================================
const harpPlay = createHarp($('harp-play'), { onPress: (n) => playNote(n.midi, { dur: 0.9 }) });
const harpEcho = createHarp($('harp-echo'), { onPress: (n) => playNote(n.midi, { dur: 0.9 }) });
const harps = [harpPlay, harpEcho];
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
  currentView = view;
  document.querySelectorAll('.view').forEach((v) => (v.hidden = v.id !== `view-${view}`));
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.view === view));
  history.replaceState(null, '', `#${view}`);
}
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => go(t.dataset.view)));
const startView = location.hash.replace('#', '');
if (startView && document.getElementById(`view-${startView}`)) {
  currentView = 'play';
  go(startView);
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
  readout.dataset.state = 'live';
  readout.dataset.dir = !matches.length ? 'off' : dirs.size > 1 ? 'both' : [...dirs][0];
  readout.dataset.tuned = Math.abs(f.cents) <= 12;

  $('note-big').textContent = midiToLetter(f.midi);
  $('hole-text').textContent = matches.length
    ? matches.map((n) => `hole ${n.hole} · ${n.dir === 'blow' ? 'blow (out)' : 'draw (in)'}`).join('   or   ')
    : 'Not on the map — a bend, or between two notes.';

  $('cents-dot').style.left = `${50 + Math.max(-50, Math.min(50, f.cents))}%`;
  $('cents-word').textContent = centsWord(f.cents);
  $('steady-fill').style.width = `${Math.max(0, Math.min(1, (f.clarity - 0.8) / 0.19)) * 100}%`;
  harps.forEach((h) => h.setLive(f.midi));
}

function clearReadout() {
  readout.dataset.state = 'idle';
  delete readout.dataset.dir;
  $('note-big').textContent = '—';
  if (performance.now() >= unclearHoldUntil) {
    $('hole-text').textContent = mic.running ? 'Listening… play a note.' : 'Press “Start listening” and play a note.';
  }
  $('cents-dot').style.left = '50%';
  $('cents-word').innerHTML = '&nbsp;';
  $('steady-fill').style.width = '0';
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
      where: here.map((n) => `hole ${n.hole} ${n.dir}`).join(' or '),
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

function onNote(ev) {
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

  // Always re-arm the mic listener so the user can immediately play the next or retry note
  mic.resetRegistered();

  if (hit) {
    const el = stepEl(i);
    el?.classList.remove('hint', 'miss');
    el?.classList.add('done');
    echo.idx++;
    if (echo.idx >= echo.phrase.length) {
      store.bumpRounds();
      setState('complete');
      setMsg(`That's the whole phrase. ${Math.abs(ev.cents) > 25 ? `Last note was ${centsWord(ev.cents)} — fine.` : 'Nicely played.'}`);
    } else {
      const tune = Math.abs(ev.cents) > 25 ? ` (${centsWord(ev.cents)})` : '';
      setState('listening');
      setMsg(`${midiToLetter(ev.midi)} — yes${tune}. Next one.`);
    }
    return;
  }

  // Wrong note:
  echo.misses[i] = (echo.misses[i] || 0) + 1;
  const heard = midiToLetter(ev.midi);
  const heardHoles = notesForMidi(ev.midi)
    .map((n) => `hole ${n.hole} ${n.dir}`)
    .join(' or ');

  const resetOnMiss = $('reset-on-miss')?.checked;
  if (resetOnMiss) {
    const el = stepEl(i);
    el?.classList.add('miss');
    setTimeout(() => el?.classList.remove('miss'), 500);
    setMsg(`Heard ${heard}${heardHoles ? ` (${heardHoles})` : ''} instead of ${want.letter}. Resetting phrase to note 1 — let’s try it again!`);
    echo.idx = 0;
    clearMarks();
    refreshEchoUI();
    return;
  }

  // If "Reset on mistake" is unchecked: wait on current note
  if (echo.misses[i] >= HINT_AFTER) {
    stepEl(i)?.classList.add('hint');
    setMsg(`Here's a hint: it's ${want.letter}, ${want.where}. No rush.`);
  } else if (ev.midi % 12 === want.midi % 12) {
    const dir = ev.midi > want.midi ? 'higher' : 'lower';
    setMsg(`Sounds like the right letter, but an octave ${dir}. Try ${ev.midi > want.midi ? 'further left' : 'further right'} on the map.`);
  } else {
    setMsg(
      `I heard ${heard}${heardHoles ? ` (${heardHoles})` : ''}.` +
        (ear ? ' Not quite — try another.' : ` Looking for ${want.letter}. No rush.`)
    );
  }
}

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
