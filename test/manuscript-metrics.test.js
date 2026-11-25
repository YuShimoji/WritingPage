const test = require('node:test');
const assert = require('node:assert/strict');

const Metrics = require('../js/modules/editor/ManuscriptMetrics.js');

test('visibleText: 装飾・傍点・ルビ・揃え用HTMLの記号を除き、本文だけを残す', () => {
  assert.equal(Metrics.visibleText('[bold][underline]駅[/underline][/bold]を出る'), '駅を出る');
  assert.equal(Metrics.visibleText('**駅**と*雨*と~~傘~~'), '駅と雨と傘');
  assert.equal(Metrics.visibleText('{kenten|傍点}です'), '傍点です');
  assert.equal(Metrics.visibleText('{漢字|かんじ}です'), '漢字です');
  assert.equal(Metrics.visibleText('<p data-zw-align="center">中央</p>'), '中央');
  assert.equal(Metrics.visibleText('## 第一章'), '第一章');
});

test('visibleText: 一覧にない括弧書きや、数式の * は本文として残す', () => {
  assert.equal(Metrics.visibleText('[メモ]と[a]'), '[メモ]と[a]');
  assert.equal(Metrics.visibleText('2*3*4'), '2*3*4');
});

test('count: 下線を付けた17文字は17文字（装飾タグで膨らまない）', () => {
  const body = '駅を出ると、雨はもう上がっていた。';
  assert.equal(Metrics.count('[underline]' + body + '[/underline]', 'all'), 17);
  assert.equal(Metrics.count('[underline]' + body + '[/underline]', 'noSpaces'), 17);
});

test('count: 数え方ごとに改行と空白の扱いが変わる', () => {
  const text = '朝になった。\n\n　雨は止んだ。';
  assert.equal(Metrics.count(text, 'noSpaces'), 12);
  assert.equal(Metrics.count(text, 'noBreaks'), 13);
  assert.equal(Metrics.count(text, 'all'), 15);
});

test('count: 未知の数え方は既定（改行・空白を除く）に戻る', () => {
  assert.equal(Metrics.count('あ い\nう', 'unknown'), 3);
  assert.equal(Metrics.DEFAULT_MODE, 'noSpaces');
});

test('countRendered: 画面上の文字列（選択範囲）へは数え方だけを適用する', () => {
  assert.equal(Metrics.countRendered('駅を\n出る', 'noSpaces'), 4);
  assert.equal(Metrics.countRendered('[メモ]', 'noSpaces'), 4);
});

test('sheets: 400字詰め原稿用紙の枚数を小数1桁で返す', () => {
  assert.equal(Metrics.sheets(0), 0);
  assert.equal(Metrics.sheets(17), 0);
  assert.equal(Metrics.sheets(1000), 2.5);
  assert.equal(Metrics.sheets(1000, 200), 5);
});
