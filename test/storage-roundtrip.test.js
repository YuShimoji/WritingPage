const test = require('node:test');
const assert = require('node:assert/strict');

const nativeSetTimeout = global.setTimeout;

function createLocalStorageMock() {
  const map = new Map();
  const mock = {
    failKeys: new Set(),
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      const safeKey = String(key);
      if (mock.failKeys.has(safeKey)) {
        throw new Error('forced setItem failure for ' + safeKey);
      }
      map.set(safeKey, String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    clear() {
      map.clear();
    }
  };
  return mock;
}

function freshStorage() {
  const storagePath = require.resolve('../js/storage.js');
  delete require.cache[storagePath];
  return require('../js/storage.js');
}

test.beforeEach(() => {
  global.localStorage = createLocalStorageMock();
  global.window = {};
  global.setTimeout = () => 0;
});

test.afterEach(() => {
  global.setTimeout = nativeSetTimeout;
  delete global.localStorage;
  delete global.window;
  delete require.cache[require.resolve('../js/storage.js')];
});

test('importProjectJSON creates a duplicate suffix and fresh document/chapter IDs', () => {
  const storage = freshStorage();
  storage.saveDocuments([
    {
      id: 'doc_existing',
      type: 'document',
      name: 'Collision Story',
      content: 'existing body',
      chapterMode: true,
      parentId: null
    },
    {
      id: 'doc_existing_suffix',
      type: 'document',
      name: 'Collision Story (読み込み 2)',
      content: 'existing suffix body',
      chapterMode: true,
      parentId: null
    }
  ]);

  const importedId = storage.importProjectJSON(JSON.stringify({
    format: 'zenwriter-v1',
    document: {
      id: 'doc_original',
      name: 'Collision Story',
      content: 'source body',
      chapterMode: true
    },
    pages: [
      { title: 'Chapter A', content: 'body A', order: 0 },
      { title: 'Chapter B', content: 'body B', order: 1 }
    ]
  }));

  const docs = storage.loadDocuments();
  const imported = docs.find((doc) => doc.id === importedId);
  const chapters = docs.filter((doc) => doc.parentId === importedId);

  assert.match(importedId, /^doc_/);
  assert.notEqual(importedId, 'doc_original');
  assert.equal(imported.name, 'Collision Story (読み込み 3)');
  assert.equal(imported.content, 'source body');
  assert.equal(chapters.length, 2);
  assert.deepEqual(chapters.map((chapter) => chapter.name), ['Chapter A', 'Chapter B']);
  assert.equal(chapters.some((chapter) => chapter.id === 'doc_original'), false);
  assert.equal(new Set(chapters.map((chapter) => chapter.id)).size, 2);
});

test('importProjectJSON rejects invalid JSON without mutating documents', () => {
  const storage = freshStorage();
  storage.saveDocuments([
    {
      id: 'doc_keep',
      type: 'document',
      name: 'Keep Me',
      content: 'safe content',
      chapterMode: true,
      parentId: null
    }
  ]);
  const before = JSON.stringify(storage.loadDocuments());

  const importedId = storage.importProjectJSON('{');

  assert.equal(importedId, null);
  assert.equal(JSON.stringify(storage.loadDocuments()), before);
});

test('importProjectJSON leaves current documents untouched when document persistence fails', () => {
  const storage = freshStorage();
  storage.saveDocuments([
    {
      id: 'doc_keep',
      type: 'document',
      name: 'Keep Me',
      content: 'safe content',
      chapterMode: true,
      parentId: null
    }
  ]);
  const before = JSON.stringify(storage.loadDocuments());

  global.localStorage.failKeys.add('zenWriter_docs');
  const importedId = storage.importProjectJSON(JSON.stringify({
    format: 'zenwriter-v1',
    document: {
      name: 'Should Not Appear',
      content: 'new content',
      chapterMode: true
    }
  }));

  assert.equal(importedId, null);
  assert.equal(JSON.stringify(storage.loadDocuments()), before);
  assert.equal(global.localStorage.getItem('zenWriter_docs'), before);
});
