# Collection Persistence Design

## Goal

Make the mobile collection loop survive page refreshes while preserving the existing blind-draw interaction, daily limits, age albums, duplicate feedback, and memory-scene unlock behavior.

## Selected Approach

Extract collection state creation, validation, persistence, and fragment collection into `src/collection-state.mjs`. `App.vue` remains responsible for DOM rendering, random clue selection, animation, and copy. This keeps storage and progression rules testable without a browser while avoiding an unrelated visual rewrite.

Two alternatives were rejected:

- Inline `localStorage` calls in `App.vue` would be faster initially but would leave validation and rollover rules coupled to a large component and difficult to test.
- URL-encoded state would make progress shareable but would expose a long mutable payload and would not behave like durable local game progress.

## Persisted Data

The storage record uses a versioned schema and contains:

- local calendar day key;
- remaining draws and resets for that day;
- selected age album;
- collected fragment names by album;
- current three-clue order and collected order items by album;
- completed album identifiers and last completed album;
- visual desk layer.

Transient UI state is never persisted: pending pickups, open sheets, overlays, animation state, and toast text reset after reload.

## Restore Rules

- Missing, malformed, unsupported, or inaccessible storage returns a clean state.
- Only known album IDs and fragment names are restored.
- Arrays are de-duplicated and counters are clamped to configured limits.
- Completion is recomputed from valid fragment counts instead of trusted from storage.
- On a new local calendar day, collected fragments and the selected album remain, while draw counters, order progress, clues, and desk layer reset.

## Collection Rules

The pure collection action accepts an album, item name, and current clue list. A valid new item increments album progress once. A repeated item reports a duplicate without incrementing progress. The action also reports whether the current clue order and album completion thresholds have been reached so `App.vue` can retain its existing toast and scene behavior.

## Integration

`App.vue` loads state once during `onMounted`, delegates collection mutations to the pure action, and saves a normalized snapshot after each render-triggering state change. Storage failures are non-fatal; the game continues in memory.

## Verification

Automated tests cover:

- clean defaults and malformed storage fallback;
- same-day refresh restoration;
- cross-day daily-limit reset with collection preservation;
- five unique teen fragments unlocking completion;
- duplicate fragments not increasing progress;
- known-album and known-fragment validation.

The built app is then exercised at 390x844 for draw, pickup, refresh restoration, age switching, five-fragment completion, duplicate handling, memory-scene entry, and return. Desktop receives a basic no-overflow check only, matching the approved mobile-only delivery scope.
