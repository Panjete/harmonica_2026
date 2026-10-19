// YIN pitch detection (de Cheveigné & Kawahara, 2002), tuned for harmonica range (C4–C7).
// Enhanced with octave-subharmonic protection for high reeds (holes 7–10).

/**
 * @param {Float32Array} buf  time-domain samples (length >= 2 * W; 2048 recommended)
 * @param {number} sr         sample rate
 * @param {object} [o]
 * @param {number} [o.minHz]     lowest frequency (default 180 Hz, covers C4 and bends)
 * @param {number} [o.maxHz]     highest frequency (default 2500 Hz, covers C7 with headroom)
 * @param {number} [o.threshold] YIN dip threshold (default 0.22)
 * @returns {{rms:number, freq:number|null, clarity:number}}
 *   clarity ∈ [0,1]: how periodic the signal is (1 = very steady tone).
 */
export function detectPitch(
  buf,
  sr,
  { minHz = 180, maxHz = 2500, threshold = 0.22 } = {}
) {
  let sumSq = 0;
  for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
  const rms = Math.sqrt(sumSq / buf.length);
  if (rms < 1e-4) return { rms, freq: null, clarity: 0 };

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

  // 3. Find all local dips in [tauMin, tauMax]
  const dips = [];
  for (let t = tauMin + 1; t < tauMax; t++) {
    if (cmnd[t] <= cmnd[t - 1] && cmnd[t] <= cmnd[t + 1]) {
      dips.push({ t, val: cmnd[t] });
    }
  }

  if (dips.length === 0) return { rms, freq: null, clarity: 0 };

  // First dip below threshold (smallest lag = highest fundamental)
  let bestT = null;
  for (const dip of dips) {
    if (dip.val < threshold) {
      bestT = dip.t;
      break;
    }
  }

  // Fallback: lowest dip if sufficiently periodic (clarity >= 0.50)
  if (bestT === null) {
    let minDip = dips[0];
    for (const dip of dips) {
      if (dip.val < minDip.val) minDip = dip;
    }
    if (minDip.val < 0.50) {
      bestT = minDip.t;
    }
  }

  if (bestT === null) return { rms, freq: null, clarity: 0 };

  // 3b. Anti-octave halving check (crucial for Holes 7-10 blow):
  // If bestT is an integer multiple (2x, 3x, 4x...) of an earlier dip,
  // and that earlier dip is also a respectable dip, prefer the earlier one (fundamental).
  for (const dip of dips) {
    if (dip.t < bestT && dip.val < 0.40) {
      const ratio = bestT / dip.t;
      const nearestInt = Math.round(ratio);
      if (nearestInt >= 2 && nearestInt <= 8 && Math.abs(ratio - nearestInt) < 0.16) {
        bestT = dip.t;
        break;
      }
    }
  }

  // 4. Parabolic interpolation around the chosen minimum
  const a = cmnd[bestT - 1], b = cmnd[bestT], c = cmnd[bestT + 1];
  const denom = a - 2 * b + c;
  const shift = denom === 0 ? 0 : (a - c) / (2 * denom);
  const refined = bestT + Math.max(-1, Math.min(1, shift));

  return {
    rms,
    freq: sr / refined,
    clarity: Math.max(0, Math.min(1, 1 - b)),
  };
}
