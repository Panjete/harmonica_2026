// The harmonica drawn as a map: blow notes on top, hole numbers in the middle, draw notes below.
import { HOLES, midiToLetter } from './notes.js';

const cell = (hole, dir, midi) => `
  <button class="cell" data-id="${hole}${dir}" data-midi="${midi}" data-dir="${dir}"
          aria-label="Hole ${hole}, ${dir}, note ${midiToLetter(midi)}">
    <span class="n">${midiToLetter(midi)}</span>
    <span class="t">${dir === 'draw' ? '−' : ''}${hole}</span>
  </button>`;

/**
 * @param {HTMLElement} root
 * @param {{onPress?:(n:{id:string,hole:number,dir:string,midi:number})=>void}} opts
 */
export function createHarp(root, { onPress } = {}) {
  root.classList.add('harp');
  root.innerHTML = `
    <div class="harp-label"><span>blow</span><small>breathe out</small></div>
    <div class="harp-row blow">${HOLES.map((h) => cell(h.hole, 'blow', h.blow)).join('')}</div>
    <div class="harp-holes" aria-hidden="true">${HOLES.map((h) => `<span>${h.hole}</span>`).join('')}</div>
    <div class="harp-row draw">${HOLES.map((h) => cell(h.hole, 'draw', h.draw)).join('')}</div>
    <div class="harp-label"><span>draw</span><small>breathe in</small></div>`;

  const cells = [...root.querySelectorAll('.cell')];

  root.addEventListener('click', (e) => {
    const el = e.target.closest('.cell');
    if (!el) return;
    flashEl(el, 450);
    onPress?.({ id: el.dataset.id, hole: +el.dataset.id.match(/\d+/)[0], dir: el.dataset.dir, midi: +el.dataset.midi });
  });

  function flashEl(el, ms) {
    el.classList.add('pressed');
    setTimeout(() => el.classList.remove('pressed'), ms);
  }

  return {
    /** Light up every hole that can make this note (G4 lives on two). Pass null to clear. */
    setLive(midi) {
      for (const c of cells) c.classList.toggle('live', midi != null && +c.dataset.midi === midi);
    },
    flash(id, ms = 500) {
      const el = cells.find((c) => c.dataset.id === id);
      if (el) flashEl(el, ms);
    },
    /** Soft visual cue on a specific hole (e.g. to guide the player after a miss). Pass null to clear. */
    cue(id) {
      for (const c of cells) c.classList.toggle('cue', id != null && c.dataset.id === id);
    },
    /** stats: { [midi]: {tries, hits} } — shows a thin bar once a note has 3+ attempts. */
    setHeat(stats) {
      for (const c of cells) {
        const s = stats[c.dataset.midi];
        if (s && s.tries >= 3) {
          c.style.setProperty('--heat', (s.hits / s.tries).toFixed(2));
          c.classList.add('has-heat');
        } else {
          c.style.removeProperty('--heat');
          c.classList.remove('has-heat');
        }
      }
    },
  };
}
