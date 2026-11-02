const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const TurndownService = require('turndown');
const markdownit = require('markdown-it');

function richEditor() {
  const context = {
    window: {}, console, TurndownService, markdownit,
    document: { readyState: 'loading', getElementById: () => null, addEventListener: () => {} }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/editor-wysiwyg.js'), 'utf8'), context);
  return new context.window.RichTextEditor(null);
}

test('actual Rich serializer preserves empty chapter boundaries and empty final body', () => {
  const rich = richEditor();
  const original = '## Body\n\nseed\n\n## \n\nalpha\n\n## \n\n## ';
  const md = markdownit();
  let current = original;
  for (let i = 0; i < 3; i++) {
    current = rich.htmlToMarkdown(md.render(current));
    assert.equal(current, original);
  }
});

test('empty H1 through H6 retain the required space after the heading marker', () => {
  const rich = richEditor();
  const html = [1, 2, 3, 4, 5, 6].map(level => '<h' + level + '></h' + level + '>').join('');
  assert.equal(rich.htmlToMarkdown(html), [1, 2, 3, 4, 5, 6].map(level => '#'.repeat(level) + ' ').join('\n\n'));
});

test('literal and entity-encoded placeholder-like text and code remain unchanged', () => {
  const rich = richEditor();
  for (const html of [
    '<p>ZWEMPTYHEADING0END</p>',
    '<h2></h2><p>ZWEMPTYHEADING0END</p>',
    '<h2></h2><p>&#90;WEMPTYHEADING0END</p>',
    '<h2></h2><p><a href="ZWEMPTYHEADI&#78;G0END">Link</a></p>',
    '<h2></h2><p><a href="safe" title="ZWEMPTYHEADI&#78;G0END">Link</a></p>',
    '<h2></h2><p><img src="safe" alt="ZWEMPTYHEADI&#78;G0END"></p>'
  ]) {
    const result = rich.htmlToMarkdown(html);
    assert(result.includes('ZWEMPTYHEADING0END'));
    if (html.startsWith('<h2>')) assert(result.startsWith('## \n\n'));
  }
  const original = '```text\n##\nZWEMPTYHEADING0END\n```';
  assert.equal(rich.htmlToMarkdown(markdownit().render(original)), original);
});
