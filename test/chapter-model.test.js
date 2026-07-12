const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadChapterModel() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'chapter-model.js'), 'utf8');
  const context = {
    window: {},
    localStorage: {
      getItem: () => null,
      setItem: () => {}
    },
    console
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'chapter-model.js' });
  return context.window.ZWChapterModel;
}

test('parseChapters keeps empty-title headings as chapter boundaries', () => {
  const Model = loadChapterModel();
  const text = [
    '## Alpha',
    '',
    'alpha-body',
    '',
    '## ',
    '',
    '',
    '## Tail',
    '',
    'tail-body'
  ].join('\n');

  const chapters = Model.parseChapters(text);

  assert.equal(chapters.length, 3);
  assert.equal(chapters[0].title, 'Alpha');
  assert.equal(chapters[1].title, '');
  assert.equal(chapters[2].title, 'Tail');
  assert.equal(Model.getChapterBody(text, chapters[0]).trim(), 'alpha-body');
  assert.equal(Model.getChapterBody(text, chapters[1]).trim(), '');
  assert.equal(Model.getChapterBody(text, chapters[2]).trim(), 'tail-body');
  assert.equal(Model.getChapterBody(text, chapters[0]).includes('## '), false);
});

test('parseChapters rejects bare hash lines but accepts tab-separated empty headings', () => {
  const Model = loadChapterModel();
  const text = ['##', 'body', '###\t', 'tail'].join('\n');
  const chapters = Model.parseChapters(text);

  assert.equal(chapters.length, 1);
  assert.equal(chapters[0].level, 3);
  assert.equal(chapters[0].title, '');
  assert.equal(Model.getChapterBody(text, chapters[0]).trim(), 'tail');
});
