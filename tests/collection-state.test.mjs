import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8');

test('resolves storage safely once, loads collection state, and saves after rendering', () => {
  assert.ok(
    source.includes("from './collection-state.mjs';"),
    'App.vue should import the collection persistence module',
  );
  assert.equal(
    source.split('getLocalStorage(window)').length - 1,
    1,
    'App.vue should resolve localStorage exactly once',
  );
  assert.equal(
    source.split('loadCollectionState(storage, albums)').length - 1,
    1,
    'App.vue should load collection state exactly once',
  );

  const renderStart = source.indexOf('function render() {');
  const listenersStart = source.indexOf("el('drawButton').addEventListener", renderStart);
  const renderSource = source.slice(renderStart, listenersStart);
  assert.ok(renderStart >= 0 && listenersStart > renderStart, 'render should exist before listeners');
  assert.ok(
    renderSource.trimEnd().endsWith('saveCollectionState(storage, state);\n        }'),
    'render should save state after all render work',
  );
});

test('delegates pickup collection while retaining reveal and order completion', () => {
  const collectStart = source.indexOf('function collectPendingItem() {');
  const shareStart = source.indexOf('function openShare(', collectStart);
  const collectSource = source.slice(collectStart, shareStart);
  assert.ok(collectStart >= 0 && shareStart > collectStart, 'collectPendingItem should exist');
  assert.ok(
    collectSource.includes('collectFragment(state, album, itemName, currentClues(album))'),
    'pickup should delegate state mutation to collectFragment',
  );
  assert.ok(
    collectSource.includes('collection.alreadyCollected'),
    'duplicate feedback should use the pure collection result',
  );
  assert.ok(collectSource.includes('revealFragment('), 'pickup should retain fragment feedback');
  assert.ok(collectSource.includes('collection.orderComplete'), 'pickup should use order completion result');
  assert.ok(collectSource.includes('completeOrder(album)'), 'pickup should retain completeOrder behavior');
  assert.equal(
    collectSource.includes('state.found[album.id].push(itemName)'),
    false,
    'pickup should not duplicate collection mutation inline',
  );
});

test('uses capped album progress for milestone presentation and completion', () => {
  assert.ok(
    source.includes('getAlbumProgress,'),
    'App.vue should import the pure album progress helper',
  );
  assert.ok(
    source.includes('const albumProgress = (album) => getAlbumProgress(state, album);'),
    'all album milestone consumers should share the capped progress projection',
  );
  assert.ok(
    source.includes('const isComplete = (album) => albumProgress(album) >= album.required;'),
    'album completion should derive from capped milestone progress',
  );
  assert.equal(
    source.includes('const albumProgress = (album) => state.found[album.id].length;'),
    false,
    'App.vue should not expose raw inventory length as milestone progress',
  );
});
