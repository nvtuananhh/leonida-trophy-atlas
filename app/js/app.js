// app.js — boot + state + wiring for Leonida Trophy Atlas.
// Loads the trophy data (the app's own data/trophies.json, nothing else),
// restores saved progress, wires the toolbar, tabs, export/import and the
// spoiler setting, and seeds deterministic demo states for screenshots
// through ?shot=cover|roadmap|tracker|detail.
import { loadState, saveState, setEarned, parseImport, exportProgress } from "./store.js";
import { applyFilters, filterStatusText } from "./filters.js";
import { renderList, renderDetail, renderProgress } from "./render.js";
import { renderRoadmap, renderMissables } from "./roadmap.js";

const DATA_URL = "data/trophies.json";

// Deterministic screenshot states: the same ?shot= value always produces
// the same earned set, the same open detail and the same view.
const SHOT_SEEDS = {
  cover: { earned: [2, 3, 8, 15, 16, 17, 21, 30, 35, 42, 44, 54, 55], selectedId: 17, spoiler: false, view: "checklist" },
  roadmap: { earned: [2, 3, 8, 15, 16, 17, 21, 30, 35, 42, 44, 54, 55], selectedId: 17, spoiler: false, view: "roadmap" },
  tracker: { earned: [2, 3, 4, 8, 9, 15, 16, 21, 30, 35, 42, 55], selectedId: 30, spoiler: true, view: "checklist" },
  detail: { earned: [2, 3, 8, 15, 16, 17, 21, 30, 35, 42, 44, 54, 55], selectedId: 28, spoiler: false, view: "checklist" },
};

function applyShotSeed(state, shot) {
  const seed = SHOT_SEEDS[shot];
  if (!seed) return null;
  state.earned = {};
  for (const id of seed.earned) state.earned[id] = true;
  state.selectedId = seed.selectedId;
  state.spoiler = seed.spoiler;
  saveState(state);
  return seed.view;
}

function readOptions() {
  return {
    search: document.getElementById("searchInput").value,
    kind: document.getElementById("kindFilter").value,
    grade: document.getElementById("gradeFilter").value,
    stateFilter: document.getElementById("stateFilter").value,
    sort: document.getElementById("sortSelect").value,
  };
}

async function boot() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error("Could not load " + DATA_URL);
  const data = await response.json();
  const trophies = data.trophies || data;
  const validIds = new Set(trophies.map((t) => t.id));

  const state = loadState();
  const params = new URLSearchParams(window.location.search);
  const shot = params.get("shot");
  let view = params.get("view") || "checklist";
  if (shot) {
    const seededView = applyShotSeed(state, shot);
    if (seededView) view = seededView;
  }

  const listEl = document.getElementById("trophyList");
  const detailPanel = document.getElementById("detailPanel");
  const statusEl = document.getElementById("filterStatus");
  const spoilerToggle = document.getElementById("spoilerToggle");

  function selectedTrophy() {
    return trophies.find((t) => t.id === state.selectedId) || null;
  }

  function renderAll() {
    const options = readOptions();
    const shown = applyFilters(trophies, state, options);
    renderProgress(trophies, state);
    renderList(listEl, shown, state, handlers);
    renderDetail(detailPanel, selectedTrophy(), state, handlers);
    renderRoadmap(document.getElementById("roadmapStages"), trophies, state, handlers.onSelect);
    renderMissables(document.getElementById("missableList"), trophies, state, handlers.onSelect);
    statusEl.textContent = filterStatusText(shown.length, trophies.length, options);
    document.getElementById("missableTabCount").textContent =
      String(trophies.filter((t) => t.missable).length);
  }

  const handlers = {
    onToggle(id, value) {
      setEarned(state, id, value);
      renderAll();
    },
    onSelect(id) {
      state.selectedId = id;
      saveState(state);
      showView("checklist");
      renderAll();
      const row = listEl.querySelector('[data-id="' + id + '"]');
      if (row) row.scrollIntoView({ block: "nearest" });
    },
  };

  function showView(next) {
    view = next;
    for (const tab of document.querySelectorAll(".tab")) {
      tab.classList.toggle("active", tab.dataset.view === next);
    }
    document.getElementById("checklistSection").hidden = next !== "checklist";
    document.getElementById("roadmapSection").hidden = next !== "roadmap";
    document.getElementById("missableSection").hidden = next !== "missable";
    // The detail panel belongs to the checklist; hide it on other views so
    // the roadmap and missable pages get the full width.
    detailPanel.style.display = next === "checklist" ? "" : "none";
  }

  for (const tab of document.querySelectorAll(".tab")) {
    tab.addEventListener("click", () => {
      showView(tab.dataset.view);
      renderAll();
    });
  }

  for (const id of ["searchInput", "kindFilter", "gradeFilter", "stateFilter", "sortSelect"]) {
    document.getElementById(id).addEventListener("input", renderAll);
    document.getElementById(id).addEventListener("change", renderAll);
  }

  spoilerToggle.checked = state.spoiler;
  spoilerToggle.addEventListener("change", () => {
    state.spoiler = spoilerToggle.checked;
    saveState(state);
    renderAll();
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    exportProgress(state, trophies);
    statusEl.textContent = "Progress exported — check your downloads for leonida-trophy-atlas-progress.json.";
  });

  const importFile = document.getElementById("importFile");
  document.getElementById("importBtn").addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", () => {
    const file = importFile.files && importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state.earned = parseImport(String(reader.result), validIds);
        saveState(state);
        renderAll();
        statusEl.textContent = "Progress imported — " + Object.keys(state.earned).length + " trophies marked earned.";
      } catch (err) {
        statusEl.textContent = "Import failed: " + err.message;
      }
      importFile.value = "";
    };
    reader.readAsText(file);
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!window.confirm("Clear all earned marks and the spoiler setting?")) return;
    state.earned = {};
    state.spoiler = false;
    state.selectedId = null;
    spoilerToggle.checked = false;
    saveState(state);
    renderAll();
  });

  showView(view);
  renderAll();
}

boot().catch((err) => {
  const listEl = document.getElementById("trophyList");
  listEl.textContent = "";
  const note = document.createElement("li");
  note.textContent = "The trophy data could not be loaded: " + err.message;
  listEl.appendChild(note);
});
