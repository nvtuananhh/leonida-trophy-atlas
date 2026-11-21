// filters.js — search, kind / grade / state filters, and sorting for the
// Leonida Trophy Atlas checklist.
import { isSpoilerHidden } from './spoiler.js';

export const GRADE_RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
// Rarity guess, from the official descriptions and the published guides:
// story finales and the 100% gold are the rarest; broad bronze grinds
// (vehicles, shops, races) are the most common.
export const RARITY_RANK = {
  1: 0, 14: 1, 7: 2, 17: 3, 40: 4, 25: 5, 28: 6, 30: 7, 31: 8, 15: 9,
};

export function trophyMatches(trophy, earned, filters, spoilerOn) {
  if (filters.missableOnly && !trophy.missable) return false;
  if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.state === 'earned' && !earned.has(trophy.id)) return false;
  if (filters.state === 'unearned' && earned.has(trophy.id)) return false;
  const q = filters.query.trim().toLowerCase();
  if (q) {
    const hidden = isSpoilerHidden(trophy, earned, spoilerOn);
    const hay = hidden
      ? `${trophy.id} story hidden`
      : `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.mission ?? ''} ${trophy.chapter ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function filterTrophies(trophies, earned, filters, spoilerOn) {
  return trophies.filter((t) => trophyMatches(t, earned, filters, spoilerOn));
}

export function sortTrophies(list, sort) {
  const copy = [...list];
  if (sort === 'alpha') return copy.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'grade') {
    return copy.sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.name.localeCompare(b.name));
  }
  if (sort === 'rarity') {
    const rank = (t) => RARITY_RANK[t.id] ?? 20 + GRADE_RANK[t.grade];
    return copy.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  }
  // Roadmap order: stage, then id — the order to earn them in.
  return copy.sort((a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id);
}
