import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs
  .readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

const requiredSelectors = [
  '.album-chip',
  '.dock-age-rail .album-chip',
  '.sheet-albums .album-chip',
  '.ghost',
  '.panel .primary',
];

test('mobile collection controls have at least 44px touch targets', () => {
  const rule = [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find((match) => {
    const selectors = match[1].split(',').map((selector) => selector.trim());
    return requiredSelectors.every((selector) => selectors.includes(selector));
  });

  assert.ok(rule, 'shared touch-target rule should cover every visible collection control');
  const minHeight = rule[2].match(/min-height:\s*(\d+(?:\.\d+)?)px/);
  assert.ok(minHeight, 'shared touch-target rule should declare a pixel min-height');
  assert.ok(
    Number(minHeight[1]) >= 44,
    `touch-target min-height ${minHeight[1]}px is below the 44px minimum`,
  );
});
