# Reedroom

A calm, dark, listening practice room for learning a 10-hole C diatonic harmonica from zero.
Fun first, no goals: the app listens through your mic and shows what it hears.

## Run it

```bash
python3 -m http.server 5173
```

Then open <http://localhost:5173>. The mic works on `localhost` (and on any HTTPS page).

## What's in it

- **Play**: an interactive harmonica map. Tap a key to hear it; use the mic and the map lights up with the note you play, plus how in-tune and steady it is.
- **Echo**: the app plays a short phrase and you play it back. It tells you what it heard, with no score.

Planned next: a "Try" tab of low-pressure things to try, and a journal.

## How it's built

Plain HTML, CSS and JavaScript. There is no framework, no backend and no database. Mic audio is analysed in your browser and never leaves it. Notes and journal data stay in your browser's localStorage.

| File | Role |
|---|---|
| `js/notes.js` | The harmonica layout as a lookup table |
| `js/pitch.js` | YIN pitch detector (pure function) |
| `js/mic.js` | Mic listener and stable note events |
| `js/synth.js` | Quiet reference-note synth |
| `js/harp.js` | The harmonica map component |
| `js/store.js` | localStorage persistence |
| `js/app.js` | Wiring: Play and Echo tabs |
| `tests/pitch.test.mjs` | Detector test (needs Node) |
