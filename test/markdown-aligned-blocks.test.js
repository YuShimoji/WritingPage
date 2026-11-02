const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const markdownit = require('../vendor/markdown-it.min.js');
const renderer = markdownit({ html: true, linkify: true, breaks: true });
const previewRenderer = markdownit({ html: false, linkify: true, breaks: true });
const context = {
  window: { markdownit, ZenWriterEditor: { richTextEditor: { markdownRenderer: renderer } } }
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/zw-markdown-it-body.js'), 'utf8'), context);
const body = context.window.ZWMdItBody;
const surfaces = {
  reader: (source) => body.renderToHtmlBeforePipeline(source),
  preview: (source) => body.renderToHtmlBeforePipeline(source, { editorManager: { _markdownRenderer: previewRenderer } })
};

test('eleven aligned paragraphs retain every distinct formatted body in order', () => {
  const source = Array.from({ length: 11 }, (_, i) => '<p data-zw-align="center">**Distinct' + i + '**</p>').join('\n\n');
  const expected = Array.from({ length: 11 }, (_, i) => '<strong>Distinct' + i + '</strong>');
  for (const [surface, render] of Object.entries(surfaces)) {
    const output = render(source);
    const paragraphs = Array.from(output.matchAll(/<p data-zw-align="center">([\s\S]*?)<\/p>/g), (match) => match[1]);
    assert.deepEqual(paragraphs, expected, surface);
  }
});

test('placeholder-like manuscript text remains literal inside and outside aligned paragraphs', () => {
  const literal = 'ZWALIGNBLOCK0 ZWALIGNBLOCK1 ZWALIGNBLOCK10 ZWALIGNBLOCK0END ZWALIGNBLOCKX0END ZWALIGNBLOCK0X0END ZWALIGNBLOCK1X1END ZWALIGNBLOCK1X10END';
  const encoded = Array.from('ZWALIGNBLOCK0X0END', (character) => '&#' + character.charCodeAt(0) + ';').join('');
  for (const [surface, render] of Object.entries(surfaces)) {
    for (const text of [literal, encoded]) {
      const source = text + '\n\n<p data-zw-align="center">**' + text + '**</p>\n\n' + text;
      const output = render(source);
      const inline = renderer.renderInline(text);
      assert.equal(output.split('<p>' + inline + '</p>').length - 1, 2, surface + ' outside');
      assert.ok(output.includes('<p data-zw-align="center"><strong>' + inline + '</strong></p>'), surface + ' inside');
    }
  }
});

test('a long placeholder-like prefix remains ordinary manuscript text', () => {
  const text = 'ZWALIGNBLOCK' + 'X'.repeat(64000);
  const expected = '<p data-zw-align="center"><strong>' + text + '</strong></p>';
  for (const [surface, render] of Object.entries(surfaces)) {
    assert.equal(render('<p data-zw-align="center">**' + text + '**</p>').trim(), expected, surface);
  }
});

test('replacement metacharacters are manuscript content in every aligned render surface', () => {
  const text = '**Dollar $& / $` / $\' / $$ / $1**';
  const expected = '<p data-zw-align="center">' + renderer.renderInline(text) + '</p>';
  for (const [surface, render] of Object.entries(surfaces)) {
    const output = render('Before\n\n<p data-zw-align="center">' + text + '</p>\n\nAfter');
    assert.ok(output.includes(expected), surface);
    assert.equal(output.split('<p>Before</p>').length - 1, 1, surface);
    assert.equal(output.split('<p>After</p>').length - 1, 1, surface);
  }
});
