const test = require('node:test');
const assert = require('node:assert/strict');
const hello = require('../hello.js');

test('基本的な挨拶を返す', () => {
  assert.equal(hello('World'), 'Hello, World!');
});

test('空文字を扱える', () => {
  assert.equal(hello(''), 'Hello, !');
});

test('特殊文字や空白を含む入力をそのまま返す', () => {
  assert.equal(hello('Alice & Bob'), 'Hello, Alice & Bob!');
  assert.equal(hello('  spaced  '), 'Hello,   spaced  !');
});

test('非文字列入力でも文字列として結果を返す', () => {
  assert.equal(hello(42), 'Hello, 42!');
  assert.equal(hello(null), 'Hello, null!');
});

test('ユニコード文字列をサポートする', () => {
  assert.equal(hello('こんにちは'), 'Hello, こんにちは!');
});
