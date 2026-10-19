// Everything stays on this machine (localStorage). No accounts, no streaks.
const KEY = 'reedroom.v1';
const fresh = () => ({ stats: {}, journal: [], rounds: 0 });

function load() {
  try {
    return { ...fresh(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
  } catch {
    return fresh();
  }
}
const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));

export function recordAttempt(midi, hit) {
  const d = load();
  const s = d.stats[midi] || { tries: 0, hits: 0 };
  s.tries++;
  if (hit) s.hits++;
  d.stats[midi] = s;
  save(d);
}
export const getStats = () => load().stats;

export function bumpRounds() {
  const d = load();
  d.rounds++;
  save(d);
  return d.rounds;
}
export const getRounds = () => load().rounds;

export function addEntry({ fun, text }) {
  const d = load();
  d.journal.unshift({ ts: Date.now(), fun, text });
  save(d);
}
export const getJournal = () => load().journal;
