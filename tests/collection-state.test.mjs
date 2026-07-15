import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8');
const collectMatch = source.match(/function collectPendingItem\(\) \{([\s\S]*?)\n        \}/);
assert.ok(collectMatch, 'collectPendingItem should exist');
const collectBody = collectMatch[1];

assert.match(collectBody, /state\.found\[album\.id\]\.push\(itemName\)/, 'pickup should immediately add the item to the album collection state');
assert.match(collectBody, /state\.orderFound\[album\.id\]\.push\(itemName\)/, 'pickup should still update the current clue order slots');
assert.match(source, /renderAlbumDetail\(\)/, 'album detail should render from the collection state after pickup');

console.log('collection state tests passed');
