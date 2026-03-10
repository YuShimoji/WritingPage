const test = require('node:test');
const assert = require('node:assert/strict');

function createLocalStorageMock() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    clear() {
      map.clear();
    }
  };
}

test.beforeEach(() => {
  global.localStorage = createLocalStorageMock();
});

test.afterEach(() => {
  delete global.localStorage;
});

test('saveSettings: 全体設定オブジェクトで保存した場合は削除キーを反映する', () => {
  const storage = require('../js/storage.js');
  const initial = storage.loadSettings();
  initial.bgGradient = 'linear-gradient(#111,#222)';
  storage.saveSettings(initial);

  const updated = storage.loadSettings();
  delete updated.bgGradient;
  storage.saveSettings(updated);

  const raw = JSON.parse(global.localStorage.getItem('zenWriter_settings'));
  assert.equal(Object.prototype.hasOwnProperty.call(raw, 'bgGradient'), false);
});

test('saveSettings: clearCustomColors相当の更新でbgColor/textColorを永続化から削除できる', () => {
  const storage = require('../js/storage.js');
  const initial = storage.loadSettings();
  initial.useCustomColors = true;
  initial.bgColor = '#101010';
  initial.textColor = '#efefef';
  storage.saveSettings(initial);

  const cleared = storage.loadSettings();
  cleared.useCustomColors = false;
  delete cleared.bgColor;
  delete cleared.textColor;
  storage.saveSettings(cleared);

  const raw = JSON.parse(global.localStorage.getItem('zenWriter_settings'));
  assert.equal(raw.useCustomColors, false);
  assert.equal(Object.prototype.hasOwnProperty.call(raw, 'bgColor'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(raw, 'textColor'), false);
});

test('saveSettings: 部分更新モードは従来通り維持される', () => {
  const storage = require('../js/storage.js');
  storage.saveSettings({ editorFontSize: 20, fontSize: 18 });
  const loaded = storage.loadSettings();
  assert.equal(loaded.editorFontSize, 20);
  assert.equal(loaded.fontSize, 18);
  assert.equal(typeof loaded.theme, 'string');
  assert.equal(loaded.editor.textExpression.tier, 1);
  assert.equal(loaded.editor.textExpression.fallbackMode, 'plain');
});
