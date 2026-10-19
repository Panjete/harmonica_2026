import { ALL_NOTES, midiToLetter, notesForMidi, tab } from './notes.js';
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

const mic = new Listener({ onFrame, onNote });

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
  if (currentView === 'echo') cancelPlayback();
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
  $('hole-text').textContent = mic.running ? 'Listening… play a note.' : 'Press “Start listening” and play a note.';
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
// =====================================================================
const POOLS = {
  stair: { label: 'The staircase', sub: 'holes 4–6', holes: [4, 5, 6] },
  low: { label: 'Low end', sub: 'holes 1–4', holes: [1, 2, 3, 4] },
  high: { label: 'Up high', sub: 'holes 6–10', holes: [6, 7, 8, 9, 10] },
  all: { label: 'Everything', sub: 'holes 1–10', holes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
};
const STEP_MS = 800;   // time between notes when I play the phrase
const NOTE_MS = 620;   // how long each note rings

const echo = { pool: 'stair', len: 3, phrase: [], idx: 0, state: 'idle', timers: [], done: false };

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
      dir: dirs.size > 1 ? 'both' : note.dir,
    });
    // random walk by 1–2 steps, never repeating the same note back-to-back
    const steps = [-2, -1, 1, 2].filter((s) => i + s >= 0 && i + s < uniq.length);
    i += steps[Math.floor(Math.random() * steps.length)];
  }
  return out;
}

function renderPhrase() {
  const box = $('phrase');
  box.innerHTML = echo.phrase
    .map(
      (s, i) => `
    <div class="step" data-i="${i}" data-dir="${s.dir}">
      <span class="sn">${s.letter}</span>
      <span class="st">${s.tabs}</span>
    </div>`
    )
    .join('');
  box.classList.toggle('ear', $('ear-only').checked);
  markNext();
}

const stepEl = (i) => $('phrase').querySelector(`.step[data-i="${i}"]`);

function markNext() {
  document.querySelectorAll('#phrase .step').forEach((el) => el.classList.remove('next'));
  if (echo.state === 'listening') stepEl(echo.idx)?.classList.add('next');
}

function setMsg(text) {
  $('echo-msg').textContent = text;
}

function updateEchoButtons() {
  $('btn-hear').textContent = echo.done ? 'Hear it again' : 'Hear it';
  $('btn-new').classList.toggle('primary', echo.done);
  $('btn-hear').classList.toggle('primary', !echo.done);
  const n = store.getRounds();
  $('rounds').textContent = n ? `${n} phrase${n === 1 ? '' : 's'} played back so far` : '';
}

function cancelPlayback() {
  echo.timers.forEach(clearTimeout);
  echo.timers = [];
  if (echo.state === 'playing') echo.state = 'idle';
  document.querySelectorAll('#phrase .step').forEach((el) => el.classList.remove('playing'));
}

function newPhrase() {
  cancelPlayback();
  echo.phrase = makePhrase(echo.pool, echo.len);
  echo.idx = 0;
  echo.state = 'idle';
  echo.done = false;
  renderPhrase();
  setMsg('Press “Hear it”.');
  updateEchoButtons();
}

async function hear() {
  cancelPlayback();
  if (!mic.running) await startMic($('echo-status'));
  echo.state = 'playing';
  echo.idx = 0;
  echo.done = false;
  document.querySelectorAll('#phrase .step').forEach((el) => el.classList.remove('done', 'next'));
  setMsg('Listen…');

  const total = echo.phrase.length * STEP_MS;
  mic.ignoreFor(total + 450); // don't hear my own speakers
  echo.phrase.forEach((s, i) => {
    playNote(s.midi, { when: (i * STEP_MS) / 1000, dur: NOTE_MS / 1000 });
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
      echo.state = 'listening';
      markNext();
      setMsg(mic.running ? 'Your turn — play the first note.' : 'Your turn (the mic is off, so play along by ear).');
    }, total + 200)
  );
  updateEchoButtons();
}

function onNote(ev) {
  if (currentView !== 'echo' || echo.state !== 'listening') return;
  const want = echo.phrase[echo.idx];
  const hit = ev.midi === want.midi;
  store.recordAttempt(want.midi, hit);
  const ear = $('ear-only').checked;
  const heard = midiToLetter(ev.midi);
  const heardHoles = notesForMidi(ev.midi)
    .map((n) => `hole ${n.hole} ${n.dir === 'blow' ? 'blow' : 'draw'}`)
    .join(' or ');

  if (hit) {
    stepEl(echo.idx)?.classList.add('done');
    echo.idx++;
    if (echo.idx >= echo.phrase.length) {
      echo.state = 'idle';
      echo.done = true;
      store.bumpRounds();
      setMsg(`That's the whole phrase. ${Math.abs(ev.cents) > 25 ? `Last note was ${centsWord(ev.cents)} — fine.` : 'Nicely played.'}`);
    } else {
      const tune = Math.abs(ev.cents) > 25 ? ` (${centsWord(ev.cents)})` : '';
      setMsg(`${heard} — yes${tune}. Next one.`);
    }
    markNext();
  } else if (ev.midi % 12 === want.midi % 12) {
    const dir = ev.midi > want.midi ? 'higher' : 'lower';
    setMsg(`Right letter, but that’s an octave ${dir}. Try ${ev.midi > want.midi ? 'further left' : 'further right'} on the map.`);
  } else {
    setMsg(
      `I heard ${heard}${heardHoles ? ` (${heardHoles})` : ''}.` +
        (ear ? ' Not quite — try another.' : ` Looking for ${want.letter}. No rush.`)
    );
  }
  refreshHeat();
  updateEchoButtons();
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

newPhrase();
