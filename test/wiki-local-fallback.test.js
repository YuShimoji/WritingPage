const test = require('node:test');
const assert = require('node:assert/strict');
const originalSetTimeout = global.setTimeout;

function reloadStorage() {
  delete require.cache[require.resolve('../js/storage.js')];
  return require('../js/storage.js');
}

test.beforeEach(() => {
  const values = new Map();
  global.localStorage = {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
  global.window = {};
  global.setTimeout = () => 0;
});

test.afterEach(() => {
  global.setTimeout = originalSetTimeout;
  delete global.localStorage;
  delete global.window;
  delete require.cache[require.resolve('../js/storage.js')];
});

test('Wiki deletion and surviving content persist with no IDB available', () => {
  const storage = reloadStorage();
  const a = storage.createStoryWikiEntry({ title: 'Copy A', content: 'survivor' });
  const b = storage.createStoryWikiEntry({ title: 'Copy B', content: 'removed' });
  storage.deleteStoryWikiEntry(b.id);
  const reloaded = reloadStorage();
  assert.equal(reloaded.getStoryWikiEntry(b.id), null);
  assert.equal(reloaded.getStoryWikiEntry(a.id).content, 'survivor');
  assert.deepEqual(JSON.parse(localStorage.getItem('zenWriter_story_wiki_deleted_ids')), [b.id]);
});

test('Explicit restoration before a flush cancels that entry deletion intent', () => {
  const storage = reloadStorage();
  const entry = storage.createStoryWikiEntry({ title: 'Copy Restore', content: 'restored' });
  const copy = JSON.parse(JSON.stringify(entry));
  storage.deleteStoryWikiEntry(entry.id);
  storage.saveStoryWiki(storage.loadStoryWiki().concat(copy));
  assert.equal(localStorage.getItem('zenWriter_story_wiki_deleted_ids'), null);
  assert.equal(reloadStorage().getStoryWikiEntry(entry.id).content, 'restored');
});
