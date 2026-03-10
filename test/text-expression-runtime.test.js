const test = require('node:test');
const assert = require('node:assert/strict');

const fixtures = require('./fixtures/text-expression-presets.json');
const Registry = require('../js/modules/editor/TextboxPresetRegistry.js');
globalThis.TextboxPresetRegistry = Registry;
globalThis.TextEffectDictionary = require('../js/modules/editor/TextEffectDictionary.js');
globalThis.TextAnimationDictionary = require('../js/modules/editor/TextAnimationDictionary.js');
globalThis.TextOrnamentDictionary = require('../js/modules/editor/TextOrnamentDictionary.js');
const Resolver = require('../js/modules/editor/TextExpressionPresetResolver.js');
globalThis.TextExpressionPresetResolver = Resolver;
const Parser = require('../js/modules/editor/TextboxDslParser.js');
const Renderer = require('../js/modules/editor/TextboxEffectRenderer.js');

test('TextExpressionPresetResolver: preset sugar を lower layer に展開できる', () => {
  const resolved = Resolver.resolveTextbox({ preset: 'inner-voice' }, {
    editor: { textExpression: { fallbackMode: 'plain' } }
  });

  assert.equal(resolved.presetId, 'inner-voice');
  assert.deepEqual(resolved.layers.textEffects, fixtures['inner-voice'].layers.textEffects);
  assert.deepEqual(resolved.layers.animations, fixtures['inner-voice'].layers.animations);
  assert.deepEqual(resolved.layers.ornaments, fixtures['inner-voice'].layers.ornaments);
});

test('TextboxEffectRenderer: Tier 1 textbox を HTML へ投影できる', () => {
  const source = ':::zw-textbox{preset:"typing-sequence", role:"system"}\nhello\n:::';
  const html = Renderer.renderSegments(Parser.parseSegments(source), {
    settings: { editor: { textExpression: { fallbackMode: 'plain' } } }
  });

  assert.match(html, /data-expression-tier="1"/);
  assert.match(html, /zw-textbox--typing-sequence/);
  assert.match(html, /zw-ornament-mono/);
  assert.match(html, /anim-typewriter/);
});

test('TextboxEffectRenderer: nested textbox は plain fallback に縮退する', () => {
  const source = ':::zw-textbox{preset:"inner-voice"}\n:::zw-textbox{preset:"typing-sequence"}\ninside\n:::\n:::';
  const html = Renderer.renderSegments(Parser.parseSegments(source), {
    settings: { editor: { textExpression: { fallbackMode: 'plain' } } }
  });

  assert.match(html, /zw-textbox--plain/);
  assert.match(html, /data-fallback-detail="nested-textbox"/);
});
