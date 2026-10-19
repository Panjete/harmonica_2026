// YIN pitch detection (de Cheveigné & Kawahara, 2002), tuned for harmonica range (C4–C7).
// Pure function: no DOM, no audio APIs, so it can be unit-tested in Node.

/**
 * @param {Float32Array} buf  time-domain samples (length >= 2 * W; 2048 recommended)
 * @param {number} sr         sample rate
 * @returns {{rms:number, freq:number|null, clarity:number}}
 *   clarity ∈ [0,1]: how periodic the signal is (1 = very steady tone).
 */
export function detectPitch(buf, sr, { minHz = 200, maxHz = 2400, threshold = 0.15 } = {}) {
  let sumSq = 0;
  for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
  const rms = Math.sqrt(sumSq / buf.length);
  if (rms < 1e-5) return { rms, freq: null, clarity: 0 };

  const W = buf.length >> 1;
  const tauMin = Math.max(2, Math.floor(sr / maxHz));
  const tauMax = Math.min(W - 1, Math.floor(sr / minHz));

  // 1. Difference function
  const d = new Float32Array(tauMax + 2);
  for (let tau = 1; tau <= tauMax + 1; tau++) {
    let s = 0;
    for (let j = 0; j < W; j++) {
      const diff = buf[j] - buf[j + tau];
      s += diff * diff;
    }
    d[tau] = s;
  }

  // 2. Cumulative mean normalised difference
  const cmnd = new Float32Array(tauMax + 2);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= tauMax + 1; tau++) {
    running += d[tau];
    cmnd[tau] = running === 0 ? 1 : (d[tau] * tau) / running;
  }

  // 3. Absolute threshold: first dip below threshold, then follow it to its minimum
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) {
    if (cmnd[t] < threshold) {
      while (t + 1 <= tauMax && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) return { rms, freq: null, clarity: 0 };

  // 4. Parabolic interpolation around the minimum
  const a = cmnd[tau - 1], b = cmnd[tau], c = cmnd[tau + 1];
  const denom = a - 2 * b + c;
  const shift = denom === 0 ? 0 : (a - c) / (2 * denom);
  const refined = tau + Math.max(-1, Math.min(1, shift));

  return { rms, freq: sr / refined, clarity: Math.max(0, Math.min(1, 1 - b)) };
}
