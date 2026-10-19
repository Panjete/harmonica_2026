// Microphone listener: raw frames for live display + "registered notes" (a note held
// steadily for a moment) for games. Browser processing is switched off so it doesn't
// mangle the signal.
import { detectPitch } from './pitch.js';
import { freqToMidiFloat } from './notes.js';
import { getCtx } from './synth.js';

const HOLD_MS = 110;       // how long a pitch must stay put to count as a played note
const RELEASE_MS = 90;     // silence needed before the same note can be played again
const MIN_CLARITY = 0.8;
const UNCLEAR_MS = 400;    // loud-but-no-clear-note for this long → tell the player

export class Listener {
  /**
   * @param {{onFrame?:(f:object)=>void, onNote?:(n:{midi:number,cents:number,clarity:number})=>void}} cb
   */
  constructor({ onFrame = () => {}, onNote = () => {}, onUnclear = () => {}, onError = () => {} } = {}) {
    this.onFrame = onFrame;
    this.onNote = onNote;
    this.onUnclear = onUnclear;
    this.onError = onError;
    this.gate = 0.01;
    this.running = false;
    this.ignoreUntil = 0;
    this._reset();
  }

  _reset() {
    this.cand = null;
    this.candSince = 0;
    this.centsAcc = [];
    this.registered = null;
    this.unvoicedSince = null;
    this.unclearSince = null;
    this.unclearFired = false;
  }

  async start() {
    if (this.running) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.stream = stream;
    this.ctx = getCtx();
    this.src = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0;
    this.src.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    this.running = true;
    this._reset();
    this._tick();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this._raf);
    this.src?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.onFrame({ voiced: false, rms: 0 });
  }

  setGate(g) { this.gate = g; }

  /** Ignore the mic for a while (e.g. while the app itself is playing a phrase). */
  ignoreFor(ms) {
    this.ignoreUntil = performance.now() + ms;
    this._reset();
  }

  _tick = () => {
    if (!this.running) return;
    const now = performance.now();
    let frame = { voiced: false, rms: 0 };
    let loud = false;

    if (now >= this.ignoreUntil) {
      this.analyser.getFloatTimeDomainData(this.buf);
      const r = detectPitch(this.buf, this.ctx.sampleRate);
      const voiced = r.freq && r.rms >= this.gate && r.clarity >= MIN_CLARITY;
      loud = r.rms >= this.gate;
      frame = { voiced: !!voiced, rms: r.rms, clarity: r.clarity };
      if (voiced) {
        const mf = freqToMidiFloat(r.freq);
        frame.midiFloat = mf;
        frame.midi = Math.round(mf);
        frame.cents = (mf - frame.midi) * 100;
        frame.freq = r.freq;
      }
    }

    // A broken callback must never stop the listening loop.
    try {
      this._trackUnclear(frame, loud, now);
      this._process(frame, now);
      this.onFrame(frame);
    } catch (err) {
      console.error('Reedroom listener error:', err);
      try { this.onError(err); } catch { /* ignore */ }
    }
    this._raf = requestAnimationFrame(this._tick);
  };

  /** Sound is coming in, but there's no clear single note (two holes at once, very breathy…). */
  _trackUnclear(f, loud, now) {
    if (f.voiced || !loud) {
      this.unclearSince = null;
      this.unclearFired = false;
      return;
    }
    if (this.unclearSince === null) this.unclearSince = now;
    if (!this.unclearFired && now - this.unclearSince >= UNCLEAR_MS) {
      this.unclearFired = true;
      this.onUnclear();
    }
  }

  _process(f, now) {
    if (!f.voiced) {
      if (this.unvoicedSince === null) this.unvoicedSince = now;
      if (now - this.unvoicedSince > RELEASE_MS) {
        this.cand = null;
        this.registered = null;
        this.centsAcc = [];
      }
      return;
    }
    this.unvoicedSince = null;
    if (f.midi !== this.cand) {
      this.cand = f.midi;
      this.candSince = now;
      this.centsAcc = [f.cents];
      return;
    }
    this.centsAcc.push(f.cents);
    if (now - this.candSince >= HOLD_MS && this.registered !== f.midi) {
      this.registered = f.midi;
      const cents = this.centsAcc.reduce((a, b) => a + b, 0) / this.centsAcc.length;
      this.onNote({ midi: f.midi, cents, clarity: f.clarity });
    }
  }
}
