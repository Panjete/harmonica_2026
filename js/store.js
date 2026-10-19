// LocalStorage persistence: 100% private and offline on your computer.
// Uses fixed-size aggregate matrices (~10 KB total) so storage never grows indefinitely.
const KEY = 'reedroom.v1';

const fresh = () => ({
  stats: {},       // [midi]: { tries, hits }
  reeds: {},       // [holeDir]: { attempts, hits, avgCents, avgClarity, lastPracticed }
  songs: {},       // [songId]: { phrasesCompleted, totalPhrases, mastered, bestAccuracy, lastPlayed }
  journal: [],     // capped ring buffer of recent sessions (max 50)
  rounds: 0,
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
  } catch {
    return fresh();
  }
}

const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));

// ---------- per-midi accuracy (used by Echo heat bars) ----------
export function recordAttempt(midi, hit) {
  const d = load();
  const s = d.stats[midi] || { tries: 0, hits: 0 };
  s.tries++;
  if (hit) s.hits++;
  d.stats[midi] = s;
  save(d);
}
export const getStats = () => load().stats;

// ---------- per-reed quality matrix (all 20 physical holes/directions) ----------
export function recordReedQuality(hole, dir, { hit = true, cents = 0, clarity = 0.8 } = {}) {
  const d = load();
  d.reeds = d.reeds || {};
  const id = `${hole}${dir}`;
  const r = d.reeds[id] || { attempts: 0, hits: 0, avgCents: 0, avgClarity: 0.8, lastPracticed: 0 };

  r.attempts++;
  if (hit) r.hits++;
  const n = r.attempts;

  // Online running mean (Welford's algorithm)
  r.avgCents = +(r.avgCents + (cents - r.avgCents) / n).toFixed(1);
  r.avgClarity = +(r.avgClarity + (clarity - r.avgClarity) / n).toFixed(3);
  r.lastPracticed = Date.now();

  d.reeds[id] = r;
  save(d);
  return r;
}

export const getReedQuality = () => load().reeds || {};

// ---------- songbook progress tracking ----------
export function updateSongProgress(songId, phraseIndex, totalPhrases, { accuracy = 100 } = {}) {
  const d = load();
  d.songs = d.songs || {};
  const s = d.songs[songId] || { phrasesCompleted: 0, totalPhrases, mastered: false, bestAccuracy: 0, lastPlayed: 0 };

  s.phrasesCompleted = Math.max(s.phrasesCompleted, phraseIndex + 1);
  s.totalPhrases = totalPhrases;
  if (s.phrasesCompleted >= totalPhrases) {
    s.mastered = true;
  }
  s.bestAccuracy = Math.max(s.bestAccuracy || 0, accuracy);
  s.lastPlayed = Date.now();

  d.songs[songId] = s;
  save(d);
  return s;
}

export const getSongProgress = (songId) => (load().songs || {})[songId] || null;
export const getAllSongProgress = () => load().songs || {};

// ---------- capped session journal (ring buffer: max 50 entries) ----------
export function addLogEntry(text) {
  const d = load();
  d.journal = d.journal || [];
  d.journal.unshift({ ts: Date.now(), text });
  if (d.journal.length > 50) d.journal.length = 50; // hard ring buffer bound
  save(d);
}

export const getJournal = () => load().journal || [];

// ---------- echo rounds counter ----------
export function bumpRounds() {
  const d = load();
  d.rounds = (d.rounds || 0) + 1;
  save(d);
  return d.rounds;
}
export const getRounds = () => load().rounds || 0;

// ---------- data export & reset ----------
export function exportDataJSON() {
  return JSON.stringify(load(), null, 2);
}

export function resetAllData() {
  localStorage.removeItem(KEY);
}

