export const STORAGE_KEY = 'time-travel-collection-v1';

const DEFAULT_LIMITS = {
  draws: 9,
  resets: 3,
  selectedAlbumId: 'teen',
};

function resolveLimits(limits) {
  return { ...DEFAULT_LIMITS, ...limits };
}

function clampInteger(value, min, max, fallback) {
  return Number.isInteger(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function knownNames(album) {
  return new Set(album.fragments.map((fragment) => fragment.name));
}

function validUniqueNames(value, album, limit = Infinity) {
  if (!Array.isArray(value)) return [];
  const known = knownNames(album);
  return [...new Set(value.filter((name) => typeof name === 'string' && known.has(name)))]
    .slice(0, limit);
}

export function createCollectionState(albums, limits = {}) {
  const resolved = resolveLimits(limits);
  const selectedAlbumId = albums.some((album) => album.id === resolved.selectedAlbumId)
    ? resolved.selectedAlbumId
    : (albums[0]?.id || '');

  return {
    drawsLeft: resolved.draws,
    resetsLeft: resolved.resets,
    selectedAlbumId,
    found: Object.fromEntries(albums.map((album) => [album.id, []])),
    orderFound: Object.fromEntries(albums.map((album) => [album.id, []])),
    currentClues: {},
    pendingPickup: null,
    completed: [],
    lastCompletedId: '',
    sheetOpen: false,
    deskLayer: 0,
  };
}

export function getLocalStorage(browser) {
  try {
    return browser?.localStorage || null;
  } catch {
    return null;
  }
}

export function getLocalDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeStoredState(value, albums, limits, sameDay) {
  const fresh = createCollectionState(albums, limits);
  if (!value || typeof value !== 'object') return fresh;
  const resolved = resolveLimits(limits);

  fresh.selectedAlbumId = albums.some((album) => album.id === value.selectedAlbumId)
    ? value.selectedAlbumId
    : fresh.selectedAlbumId;
  fresh.found = Object.fromEntries(albums.map((album) => [
    album.id,
    validUniqueNames(value.found?.[album.id], album),
  ]));
  fresh.completed = albums
    .filter((album) => fresh.found[album.id].length >= album.required)
    .map((album) => album.id);
  fresh.lastCompletedId = fresh.completed.includes(value.lastCompletedId)
    ? value.lastCompletedId
    : '';

  if (!sameDay) return fresh;

  fresh.drawsLeft = clampInteger(value.drawsLeft, 0, resolved.draws, resolved.draws);
  fresh.resetsLeft = clampInteger(value.resetsLeft, 0, resolved.resets, resolved.resets);
  fresh.currentClues = Object.fromEntries(albums.flatMap((album) => {
    const clues = validUniqueNames(value.currentClues?.[album.id], album, 3);
    return clues.length ? [[album.id, clues]] : [];
  }));
  fresh.orderFound = Object.fromEntries(albums.map((album) => {
    const clues = new Set(fresh.currentClues[album.id] || []);
    const orderFound = validUniqueNames(value.orderFound?.[album.id], album, 3)
      .filter((name) => clues.has(name));
    return [album.id, orderFound];
  }));
  fresh.deskLayer = clampInteger(value.deskLayer, 0, 3, 0);

  return fresh;
}

export function saveCollectionState(storage, state, now = new Date()) {
  const payload = {
    version: 1,
    dayKey: getLocalDayKey(now),
    state,
  };

  try {
    if (typeof storage?.setItem !== 'function') return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadCollectionState(storage, albums, now = new Date(), limits = {}) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (!raw) return createCollectionState(albums, limits);
    const payload = JSON.parse(raw);
    if (payload?.version !== 1) return createCollectionState(albums, limits);
    return normalizeStoredState(
      payload.state,
      albums,
      limits,
      payload.dayKey === getLocalDayKey(now),
    );
  } catch {
    return createCollectionState(albums, limits);
  }
}

export function collectFragment(state, album, itemName, clueNames) {
  const validNames = knownNames(album);
  const currentFound = Array.isArray(state.found?.[album.id]) ? state.found[album.id] : [];

  if (!validNames.has(itemName)) {
    return {
      accepted: false,
      alreadyCollected: false,
      progress: currentFound.length,
      orderComplete: false,
      albumComplete: currentFound.length >= album.required,
    };
  }

  const found = state.found[album.id] || (state.found[album.id] = []);
  const orderFound = state.orderFound[album.id] || (state.orderFound[album.id] = []);
  const alreadyCollected = found.includes(itemName);

  if (!alreadyCollected) found.push(itemName);
  if (!orderFound.includes(itemName)) orderFound.push(itemName);

  const requiredClues = [...new Set(
    (Array.isArray(clueNames) ? clueNames : []).filter((name) => validNames.has(name)),
  )];

  return {
    accepted: true,
    alreadyCollected,
    progress: found.length,
    orderComplete: requiredClues.length > 0
      && requiredClues.every((name) => orderFound.includes(name)),
    albumComplete: found.length >= album.required,
  };
}
