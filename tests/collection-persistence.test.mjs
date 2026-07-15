import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectFragment,
  createCollectionState,
  getLocalStorage,
  getLocalDayKey,
  loadCollectionState,
  saveCollectionState,
  STORAGE_KEY,
} from '../src/collection-state.mjs';

const albums = [
  {
    id: 'childhood',
    required: 2,
    fragments: [{ name: 'Crayon' }, { name: 'Notebook' }],
  },
  {
    id: 'teen',
    required: 5,
    fragments: [
      { name: 'A' },
      { name: 'B' },
      { name: 'C' },
      { name: 'D' },
      { name: 'E' },
    ],
  },
];

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

test('creates clean collection defaults and selects teen when present', () => {
  assert.deepEqual(createCollectionState(albums), {
    drawsLeft: 9,
    resetsLeft: 3,
    selectedAlbumId: 'teen',
    found: { childhood: [], teen: [] },
    orderFound: { childhood: [], teen: [] },
    currentClues: {},
    pendingPickup: null,
    completed: [],
    lastCompletedId: '',
    sheetOpen: false,
    deskLayer: 0,
  });
});

test('selects the first known album and creates fresh arrays when teen is absent', () => {
  const state = createCollectionState([albums[0]]);
  const anotherState = createCollectionState([albums[0]]);

  assert.equal(state.selectedAlbumId, 'childhood');
  assert.notEqual(state.found.childhood, anotherState.found.childhood);
  assert.notEqual(state.orderFound.childhood, anotherState.orderFound.childhood);
});

test('falls back when stored JSON is malformed', () => {
  const storage = { getItem: () => '{bad json' };

  assert.deepEqual(
    loadCollectionState(storage, albums, new Date(2026, 6, 15)),
    createCollectionState(albums),
  );
});

test('falls back when storage cannot be read', () => {
  const storage = {
    getItem() {
      throw new Error('denied');
    },
  };

  assert.deepEqual(
    loadCollectionState(storage, albums, new Date(2026, 6, 15)),
    createCollectionState(albums),
  );
});

test('resolves available browser storage', () => {
  const storage = createMemoryStorage();

  assert.equal(getLocalStorage({ localStorage: storage }), storage);
});

test('returns null when the browser storage getter is inaccessible', () => {
  const browser = Object.defineProperty({}, 'localStorage', {
    get() {
      throw new Error('denied');
    },
  });

  assert.equal(getLocalStorage(browser), null);
});

test('creates a zero-padded key from the local calendar day', () => {
  assert.equal(getLocalDayKey(new Date(2026, 6, 5, 23, 59)), '2026-07-05');
});

test('restores same-day collection and session state', () => {
  const storage = createMemoryStorage();
  const state = createCollectionState(albums);
  state.drawsLeft = 2;
  state.resetsLeft = 1;
  state.selectedAlbumId = 'childhood';
  state.found.childhood = ['Crayon'];
  state.found.teen = ['A'];
  state.orderFound.teen = ['A'];
  state.currentClues.teen = ['A', 'B', 'C'];
  state.deskLayer = 2;

  assert.equal(saveCollectionState(storage, state, new Date(2026, 6, 15)), true);

  const restored = loadCollectionState(storage, albums, new Date(2026, 6, 15));
  assert.equal(restored.drawsLeft, 2);
  assert.equal(restored.resetsLeft, 1);
  assert.equal(restored.selectedAlbumId, 'childhood');
  assert.deepEqual(restored.found, { childhood: ['Crayon'], teen: ['A'] });
  assert.deepEqual(restored.orderFound, { childhood: [], teen: ['A'] });
  assert.deepEqual(restored.currentClues, { teen: ['A', 'B', 'C'] });
  assert.equal(restored.deskLayer, 2);
});

test('preserves durable progress but resets daily session state on the next local day', () => {
  const storage = createMemoryStorage();
  const state = createCollectionState(albums);
  state.drawsLeft = 2;
  state.resetsLeft = 1;
  state.selectedAlbumId = 'childhood';
  state.found.childhood = ['Crayon', 'Notebook'];
  state.orderFound.childhood = ['Crayon'];
  state.currentClues.childhood = ['Crayon', 'Notebook'];
  state.lastCompletedId = 'childhood';
  state.deskLayer = 3;
  saveCollectionState(storage, state, new Date(2026, 6, 15));

  const restored = loadCollectionState(storage, albums, new Date(2026, 6, 16));
  assert.equal(restored.drawsLeft, 9);
  assert.equal(restored.resetsLeft, 3);
  assert.equal(restored.selectedAlbumId, 'childhood');
  assert.deepEqual(restored.found.childhood, ['Crayon', 'Notebook']);
  assert.deepEqual(restored.completed, ['childhood']);
  assert.equal(restored.lastCompletedId, 'childhood');
  assert.deepEqual(restored.orderFound, { childhood: [], teen: [] });
  assert.deepEqual(restored.currentClues, {});
  assert.equal(restored.deskLayer, 0);
});

test('normalizes untrusted same-day state against known albums and fragments', () => {
  const storage = createMemoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    dayKey: '2026-07-15',
    state: {
      drawsLeft: -8,
      resetsLeft: 99,
      selectedAlbumId: 'unknown',
      found: {
        childhood: ['Crayon', 'Crayon', 'Unknown'],
        teen: ['A', 'B', 'C', 'D', 'E', 'A', 'Unknown'],
        unknown: ['Anything'],
      },
      orderFound: {
        teen: ['A', 'A', 'B', 'C', 'D', 'Unknown'],
        unknown: ['Anything'],
      },
      currentClues: {
        teen: ['A', 'A', 'Unknown', 'B', 'C', 'D'],
        unknown: ['Anything'],
      },
      pendingPickup: { albumId: 'teen', itemName: 'A' },
      completed: ['childhood', 'unknown'],
      lastCompletedId: 'teen',
      sheetOpen: true,
      deskLayer: 99,
    },
  }));

  const restored = loadCollectionState(storage, albums, new Date(2026, 6, 15));
  assert.equal(restored.drawsLeft, 0);
  assert.equal(restored.resetsLeft, 3);
  assert.equal(restored.selectedAlbumId, 'teen');
  assert.deepEqual(restored.found, {
    childhood: ['Crayon'],
    teen: ['A', 'B', 'C', 'D', 'E'],
  });
  assert.deepEqual(restored.orderFound, { childhood: [], teen: ['A', 'B', 'C'] });
  assert.deepEqual(restored.currentClues, { teen: ['A', 'B', 'C'] });
  assert.deepEqual(restored.completed, ['teen']);
  assert.equal(restored.lastCompletedId, 'teen');
  assert.equal(restored.pendingPickup, null);
  assert.equal(restored.sheetOpen, false);
  assert.equal(restored.deskLayer, 3);
});

test('restores order progress only for the current clue set', () => {
  const storage = createMemoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    dayKey: '2026-07-15',
    state: {
      orderFound: {
        childhood: ['Crayon'],
        teen: ['A', 'D', 'E'],
      },
      currentClues: {
        teen: ['A', 'B', 'C'],
      },
    },
  }));

  const restored = loadCollectionState(storage, albums, new Date(2026, 6, 15));

  assert.deepEqual(restored.orderFound, { childhood: [], teen: ['A'] });
  assert.deepEqual(restored.currentClues, { teen: ['A', 'B', 'C'] });
});

test('falls back when the stored schema version is unsupported', () => {
  const storage = createMemoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify({
    version: 2,
    dayKey: '2026-07-15',
    state: { drawsLeft: 0 },
  }));

  assert.deepEqual(
    loadCollectionState(storage, albums, new Date(2026, 6, 15)),
    createCollectionState(albums),
  );
});

test('reports storage write failures without throwing', () => {
  const storage = {
    setItem() {
      throw new Error('denied');
    },
  };

  assert.equal(saveCollectionState(storage, createCollectionState(albums)), false);
});

test('collects five unique teen fragments and reports album completion', () => {
  const state = createCollectionState(albums);
  const teen = albums.find((album) => album.id === 'teen');
  let result;

  for (const name of ['A', 'B', 'C', 'D', 'E']) {
    result = collectFragment(state, teen, name, ['A', 'B', 'C']);
  }

  assert.deepEqual(state.found.teen, ['A', 'B', 'C', 'D', 'E']);
  assert.deepEqual(state.orderFound.teen, ['A', 'B', 'C', 'D', 'E']);
  assert.deepEqual(result, {
    accepted: true,
    alreadyCollected: false,
    progress: 5,
    orderComplete: true,
    albumComplete: true,
  });
});

test('does not increment progress when a fragment is collected twice', () => {
  const state = createCollectionState(albums);
  const teen = albums.find((album) => album.id === 'teen');
  collectFragment(state, teen, 'A', ['A', 'B', 'C']);

  const result = collectFragment(state, teen, 'A', ['A', 'B', 'C']);

  assert.equal(result.accepted, true);
  assert.equal(result.alreadyCollected, true);
  assert.equal(result.progress, 1);
  assert.deepEqual(state.found.teen, ['A']);
  assert.deepEqual(state.orderFound.teen, ['A']);
});

test('lets an already-owned fragment advance the current clue order once', () => {
  const state = createCollectionState(albums);
  const teen = albums.find((album) => album.id === 'teen');
  state.found.teen = ['A'];

  const result = collectFragment(state, teen, 'A', ['A', 'B', 'C']);

  assert.equal(result.alreadyCollected, true);
  assert.equal(result.orderComplete, false);
  assert.deepEqual(state.orderFound.teen, ['A']);
});

test('rejects an unknown fragment without mutating state', () => {
  const state = createCollectionState(albums);
  const teen = albums.find((album) => album.id === 'teen');
  const before = structuredClone(state);

  const result = collectFragment(state, teen, 'Unknown', ['A', 'B', 'C']);

  assert.deepEqual(result, {
    accepted: false,
    alreadyCollected: false,
    progress: 0,
    orderComplete: false,
    albumComplete: false,
  });
  assert.deepEqual(state, before);
});
