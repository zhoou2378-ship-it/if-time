# Collection Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist valid collection progress across refreshes, reset daily limits on the next local day, and prove the five-fragment, duplicate, age-switch, scene-entry, and return loop.

**Architecture:** Add a pure `collection-state.mjs` module for state creation, validation, storage, and fragment collection. Keep `App.vue` responsible for rendering and animations, loading the module state once and saving normalized snapshots after mutations.

**Tech Stack:** Vue 3, browser `localStorage`, Node.js built-in test runner, Vite.

---

### Task 1: Repository Hygiene

**Files:**
- Create: `.gitignore`
- Modify: `package.json`

- [ ] **Step 1: Ignore generated and machine-local files**

```gitignore
node_modules/
dist/
outputs/
.DS_Store
```

- [ ] **Step 2: Add a repeatable test command**

Add to `package.json` scripts:

```json
"test": "node --test tests/*.test.mjs"
```

- [ ] **Step 3: Confirm ignored files are excluded**

Run: `git status --short`

Expected: `.DS_Store`, `node_modules/`, `dist/`, and `outputs/` do not appear.

### Task 2: State Defaults And Safe Restore

**Files:**
- Create: `src/collection-state.mjs`
- Create: `tests/collection-persistence.test.mjs`

- [ ] **Step 1: Write failing default and malformed-data tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollectionState, loadCollectionState } from '../src/collection-state.mjs';

const albums = [{ id: 'teen', required: 5, fragments: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }, { name: 'E' }] }];

test('creates clean collection defaults', () => {
  assert.deepEqual(createCollectionState(albums), {
    drawsLeft: 9,
    resetsLeft: 3,
    selectedAlbumId: 'teen',
    found: { teen: [] },
    orderFound: { teen: [] },
    currentClues: {},
    pendingPickup: null,
    completed: [],
    lastCompletedId: '',
    sheetOpen: false,
    deskLayer: 0,
  });
});

test('falls back when stored JSON is malformed', () => {
  const storage = { getItem: () => '{bad json' };
  assert.deepEqual(loadCollectionState(storage, albums, new Date(2026, 6, 15)), createCollectionState(albums));
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/collection-persistence.test.mjs`

Expected: FAIL because `src/collection-state.mjs` does not exist.

- [ ] **Step 3: Implement default state and guarded storage parsing**

Implement exported constants/functions:

```js
export const STORAGE_KEY = 'time-travel-collection-v1';

const DEFAULT_LIMITS = { draws: 9, resets: 3, selectedAlbumId: 'teen' };

function resolveLimits(limits) {
  return { ...DEFAULT_LIMITS, ...limits };
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

export function loadCollectionState(storage, albums, now = new Date(), limits = {}) {
  const fresh = createCollectionState(albums, limits);
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (!raw) return fresh;
    JSON.parse(raw);
    return fresh;
  } catch {
    return fresh;
  }
}
```

The implementation must select `teen` when present, otherwise the first known album, and must return fresh arrays for every album.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node --test tests/collection-persistence.test.mjs`

Expected: 2 tests pass.

### Task 3: Same-Day Persistence And Cross-Day Reset

**Files:**
- Modify: `src/collection-state.mjs`
- Modify: `tests/collection-persistence.test.mjs`

- [ ] **Step 1: Write failing restore and rollover tests**

Create an in-memory storage helper and assert:

```js
const state = createCollectionState(albums);
state.drawsLeft = 2;
state.resetsLeft = 1;
state.found.teen = ['A'];
state.orderFound.teen = ['A'];

saveCollectionState(storage, state, new Date(2026, 6, 15));
assert.equal(loadCollectionState(storage, albums, new Date(2026, 6, 15)).drawsLeft, 2);

const tomorrow = loadCollectionState(storage, albums, new Date(2026, 6, 16));
assert.deepEqual(tomorrow.found.teen, ['A']);
assert.equal(tomorrow.drawsLeft, 9);
assert.deepEqual(tomorrow.orderFound.teen, []);
```

Also store unknown albums, duplicate names, invalid fragment names, negative counters, and transient UI state; assert the restored state contains only known unique fragments, clamped counters, and reset transient state.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/collection-persistence.test.mjs`

Expected: FAIL because `saveCollectionState` and normalization are missing.

- [ ] **Step 3: Implement versioned serialization and normalization**

Add:

```js
export function getLocalDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  return [...new Set(value.filter((name) => typeof name === 'string' && known.has(name)))].slice(0, limit);
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
  fresh.orderFound = Object.fromEntries(albums.map((album) => [
    album.id,
    validUniqueNames(value.orderFound?.[album.id], album, 3),
  ]));
  fresh.currentClues = Object.fromEntries(albums.flatMap((album) => {
    const clues = validUniqueNames(value.currentClues?.[album.id], album, 3);
    return clues.length ? [[album.id, clues]] : [];
  }));
  fresh.deskLayer = clampInteger(value.deskLayer, 0, 3, 0);
  return fresh;
}

export function saveCollectionState(storage, state, now = new Date()) {
  const payload = { version: 1, dayKey: getLocalDayKey(now), state };
  try {
    storage?.setItem?.(STORAGE_KEY, JSON.stringify(payload));
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
    if (payload.version !== 1) return createCollectionState(albums, limits);
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
```

Normalize album IDs, fragment names, arrays, counters, clues, completion, selection, and desk layer. Recompute completion from valid fragment counts. On a day mismatch preserve `found`, `completed`, `lastCompletedId`, and selection while resetting daily/session values.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node --test tests/collection-persistence.test.mjs`

Expected: all persistence tests pass.

### Task 4: Pure Fragment Collection

**Files:**
- Modify: `src/collection-state.mjs`
- Modify: `tests/collection-persistence.test.mjs`

- [ ] **Step 1: Write failing progression tests**

Collect five unique teen fragments using:

```js
const result = collectFragment(state, albums[0], name, ['A', 'B', 'C']);
```

Assert progress reaches 5 and `albumComplete` becomes true. Collect `A` again and assert progress remains 5 with `alreadyCollected: true`. Assert an unknown fragment does not change progress.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/collection-persistence.test.mjs`

Expected: FAIL because `collectFragment` is missing.

- [ ] **Step 3: Implement the minimal collection action**

```js
export function collectFragment(state, album, itemName, clueNames) {
  const validNames = knownNames(album);
  const found = state.found[album.id] || (state.found[album.id] = []);
  const orderFound = state.orderFound[album.id] || (state.orderFound[album.id] = []);
  if (!validNames.has(itemName)) {
    return {
      accepted: false,
      alreadyCollected: false,
      progress: found.length,
      orderComplete: false,
      albumComplete: found.length >= album.required,
    };
  }

  const alreadyCollected = found.includes(itemName);
  if (!alreadyCollected) found.push(itemName);
  if (!orderFound.includes(itemName)) orderFound.push(itemName);
  const requiredClues = [...new Set(clueNames.filter((name) => validNames.has(name)))];

  return {
    accepted: true,
    alreadyCollected,
    progress: found.length,
    orderComplete: requiredClues.length > 0 && requiredClues.every((name) => orderFound.includes(name)),
    albumComplete: found.length >= album.required,
  };
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node --test tests/collection-persistence.test.mjs`

Expected: all collection and persistence tests pass.

### Task 5: Vue Integration

**Files:**
- Modify: `src/App.vue`
- Modify: `tests/collection-state.test.mjs`

- [ ] **Step 1: Extend the static integration test and verify RED**

Assert `App.vue` imports and calls `loadCollectionState`, `saveCollectionState`, and `collectFragment`. Remove assertions that require direct array pushes now owned by the pure module.

Run: `node --test tests/collection-state.test.mjs`

Expected: FAIL because the component has not been integrated.

- [ ] **Step 2: Load persisted state**

Import the pure functions at the top of `<script setup>`, replace the inline state literal with:

```js
const state = loadCollectionState(window.localStorage, albums);
```

- [ ] **Step 3: Delegate pickup progression**

Call `collectFragment(state, album, itemName, currentClues(album))` inside `collectPendingItem`, use its result for duplicate feedback, and retain the existing `completeOrder` and scene-opening behavior.

- [ ] **Step 4: Persist normalized state after mutations**

Call `saveCollectionState(window.localStorage, state)` at the end of `render()`. Storage failures must be swallowed by the module so UI interaction remains available.

- [ ] **Step 5: Run all tests and verify GREEN**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass with no warnings.

### Task 6: Build And Mobile Workflow Verification

**Files:**
- Modify: none unless verification exposes a tested defect

- [ ] **Step 1: Build production assets**

Run: `pnpm build`

Expected: Vite exits 0 and writes `dist/`.

- [ ] **Step 2: Verify the mobile workflow at 390x844**

Use the local production preview and browser controls to verify draw, pickup, refresh restoration, age switching, five-fragment completion, duplicate handling, memory-scene entry, and return. Confirm `scrollWidth === clientWidth` and no interactive control is occluded.

- [ ] **Step 3: Verify basic desktop access at 1440x900**

Confirm the page renders, has no horizontal overflow, and controls remain reachable. Do not expand scope into a desktop redesign.

- [ ] **Step 4: Commit the verified implementation**

```bash
git add .gitignore package.json src/collection-state.mjs src/App.vue tests/collection-persistence.test.mjs tests/collection-state.test.mjs docs/superpowers/plans/2026-07-15-collection-persistence.md
git commit -m "feat: persist collection progress"
```
