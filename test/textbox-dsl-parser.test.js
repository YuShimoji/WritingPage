const test = require('node:test');
const assert = require('node:assert/strict');

const Parser = require('../js/modules/editor/TextboxDslParser.js');
const Registry = require('../js/modules/editor/TextboxPresetRegistry.js');

test('TextboxDslParser.wrap: preset属性を含むDSLを生成できる', () => {
  const wrapped = Parser.wrap('テスト本文', {
    preset: 'inner-voice',
    role: 'monologue',
    tilt: -4,
    scale: 0.98,
  });
  assert.match(wrapped, /^:::zw-textbox\{/);
  assert.match(wrapped, /preset:"inner-voice"/);
  assert.match(wrapped, /role:"monologue"/);
  assert.match(wrapped, /tilt:-4/);
  assert.match(wrapped, /scale:0.98/);
  assert.match(wrapped, /テスト本文/);
});

test('TextboxDslParser.toHtml: DSLをHTML textboxに変換できる', () => {
  const src = [
    ':::zw-textbox{preset:"inner-voice", role:"monologue", tilt:-4, scale:0.98}',
    '[italic]これは心の声[/italic]',
    ':::'
  ].join('\n');

  const html = Parser.toHtml(src, {
    registry: Registry,
    settings: { editor: { extendedTextbox: { defaultPreset: 'inner-voice' } } }
  });

  assert.match(html, /class="zw-textbox\s+zw-textbox--inner-voice"/);
  assert.match(html, /data-preset="inner-voice"/);
  assert.match(html, /data-role="monologue"/);
  assert.match(html, /\[italic\]これは心の声\[\/italic\]/);
});

test('TextboxDslParser.toHtml: textbox本文の生HTMLをエスケープする', () => {
  const src = [
    ':::zw-textbox{role:"dialogue"}',
    '<img src=x onerror=alert(1)>',
    ':::'
  ].join('\n');

  const html = Parser.toHtml(src);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img src=x onerror=alert\(1\)>/);
});

test('TextboxDslParser.parseAttrs: 未知属性を除外し、範囲外数値をclampする', () => {
  const attrs = Parser.parseAttrs('preset:"typing-sequence", role:"unknown", tilt:99, scale:0.1, unknown:"x"');
  assert.equal(attrs.preset, 'typing-sequence');
  assert.equal(attrs.role, 'custom');
  assert.equal(attrs.tilt, 20);
  assert.equal(attrs.scale, 0.5);
  assert.equal(Object.prototype.hasOwnProperty.call(attrs, 'unknown'), false);
});

test('TextboxPresetRegistry.resolve: defaultPreset が userPreset を指す場合に解決できる', () => {
  const settings = {
    editor: {
      extendedTextbox: {
        defaultPreset: 'my-se',
        userPresets: [{ id: 'my-se', label: 'My SE', role: 'sfx', tilt: 3, scale: 1.2 }]
      }
    }
  };
  const preset = Registry.resolve('', settings);
  assert.equal(preset.id, 'my-se');
  assert.equal(preset.role, 'sfx');
  assert.equal(preset.tilt, 3);
  assert.equal(preset.scale, 1.2);
});
