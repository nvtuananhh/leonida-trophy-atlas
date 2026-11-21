// app.js — boot + state + wiring for the Leonida Trophy Atlas.
// Loads app/data/trophies.json (the app's own file, nothing over the
// network), restores saved progress, and wires every control on the page.
// A ?shot=cover|roadmap|tracker|detail query seeds a deterministic demo
// state for screenshots; it never touches localStorage.
import { filterTrophies, sortTrophies } from './filters.js';
import { renderDetail, renderList, renderProgress } from './render.js';
import { renderRoadmap } from './roadmap.js';
import {
  exportProgress,
  importProgressFile,
  loadEarnedIds,
  loadSpoilerOn,
  saveEarnedIds,
  saveSpoilerOn,
} from './store.js';

const DEMO_EARNED = {
  cover: [2, 3, 4, 5, 8, 15, 17],
  roadmap: [2, 3, 4, 8, 15],
  tracker: [2, 3, 4, 8, 15, 17, 28],
  detail: [2, 3, 4, 5, 8, 15, 17],
};
const DEMO_DETAIL = { cover: 17, roadmap: null, tracker: 28, detail: 28 };

const state = {
  trophies: [],
  earned: loadEarnedIds(),
  spoilerOn: loadSpoilerOn(),
  filters: { query: '', kind: 'all', grade: 'all', state: 'all', sort: 'roadmap', missableOnly: false },
  detailId: null,
};

function el(id) {
  return document.getElementById(id);
}

function rerender() {
  const visible = sortTrophies(
    filterTrophies(state.trophies, state.earned, state.filters, state.spoilerOn),
    state.filters.sort,
  );
  renderProgress(state.trophies, state.earned);
  renderList(el('trophyList'), el('emptyNote'), el('countLine'), visible, state.earned, state.spoilerOn, {
    onToggleEarned: toggleEarned,
    onOpenDetail: openDetail,
  });
  renderRoadmap(el('roadmapStages'), state.trophies, state.earned, openDetail);
  if (state.detailId !== null) {
    const trophy = state.trophies.find((t) => t.id === state.detailId);
    if (trophy) renderDetail(el('detailPanel'), el('detailBody'), trophy, state.earned, state.spoilerOn, toggleEarned);
  }
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveEarnedIds(state.earned);
  rerender();
}

function openDetail(id) {
  state.detailId = id;
  const trophy = state.trophies.find((t) => t.id === id);
  if (trophy) renderDetail(el('detailPanel'), el('detailBody'), trophy, state.earned, state.spoilerOn, toggleEarned);
  el('detailPanel').scrollIntoView({ behavior: 'auto', block: 'nearest' });
}

function closeDetail() {
  state.detailId = null;
  el('detailPanel').hidden = true;
}

function applyShotPreset() {
  const shot = new URLSearchParams(window.location.search).get('shot');
  if (!shot || !(shot in DEMO_EARNED)) return;
  state.earned = new Set(DEMO_EARNED[shot]);
  state.spoilerOn = true;
  el('spoilerToggle').checked = true;
  if (shot === 'roadmap') {
    state.filters.sort = 'roadmap';
    setTimeout(() => el('roadmapSection').scrollIntoView(), 50);
  }
  if (DEMO_DETAIL[shot] !== null) state.detailId = DEMO_DETAIL[shot];
  document.title = `Leonida Trophy Atlas — ${shot}`;
}

async function boot() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error(`Could not load trophies.json (${res.status})`);
  const data = await res.json();
  state.trophies = Array.isArray(data) ? data : data.trophies;

  el('searchInput').addEventListener('input', (e) => {
    state.filters.query = e.target.value;
    rerender();
  });
  el('kindFilter').addEventListener('change', (e) => {
    state.filters.kind = e.target.value;
    rerender();
  });
  el('gradeFilter').addEventListener('change', (e) => {
    state.filters.grade = e.target.value;
    rerender();
  });
  el('stateFilter').addEventListener('change', (e) => {
    state.filters.state = e.target.value;
    rerender();
  });
  el('sortSelect').addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    rerender();
  });
  el('spoilerToggle').checked = state.spoilerOn;
  el('spoilerToggle').addEventListener('change', (e) => {
    state.spoilerOn = e.target.checked;
    saveSpoilerOn(state.spoilerOn);
    rerender();
  });
  el('missableToggle').addEventListener('change', (e) => {
    state.filters.missableOnly = e.target.checked;
    rerender();
  });
  el('exportBtn').addEventListener('click', () => exportProgress(state.earned, state.spoilerOn));
  el('importBtn').addEventListener('click', () => el('importFile').click());
  el('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { earned, spoilerOn } = await importProgressFile(file);
      state.earned = earned;
      if (spoilerOn !== null) {
        state.spoilerOn = spoilerOn;
        el('spoilerToggle').checked = spoilerOn;
        saveSpoilerOn(spoilerOn);
      }
      saveEarnedIds(state.earned);
      rerender();
    } catch (err) {
      window.alert(`Could not import that file: ${err.message}`);
    }
    e.target.value = '';
  });
  el('resetBtn').addEventListener('click', () => {
    if (window.confirm('Clear every earned mark? This cannot be undone.')) {
      state.earned = new Set();
      saveEarnedIds(state.earned);
      rerender();
    }
  });
  el('detailClose').addEventListener('click', closeDetail);

  applyShotPreset();
  rerender();
}

boot().catch((err) => {
  document.getElementById('countLine').textContent = `The trophy list could not be loaded: ${err.message}`;
  throw err;
});
