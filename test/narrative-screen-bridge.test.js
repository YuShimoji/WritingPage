const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Parser = require('../js/modules/editor/TextboxDslParser.js');
const Bridge = require('../js/modules/narrative/NarrativeScreenBridge.js');

const fixture = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'narrativegen', name), 'utf8'));

// A Zen Writer project written with the Reader syntax (zw-dialog, ruby, chapter links).
function sampleProject() {
  return {
    format: 'zenwriter-v1',
    version: '0.3.15',
    document: { id: 'sample-branching', name: '試験', content: '', chapterMode: true },
    pages: [
      {
        title: '受付', order: 0, level: 2, visibility: 'visible', metadata: {},
        content: ':::zw-dialog{speaker:"受付係", position:"left", style:"bubble"}\nここは試験用の受付です。\n:::\n\n'
          + ':::zw-dialog{speaker:"受付係"}\n[bold]用件[/bold]を選んでください。\n:::\n\n'
          + '- [書類を出す](chapter://書類)\n- [帰る](chapter://終わり#style=choice)'
      },
      {
        title: '書類', order: 1, level: 2, visibility: 'visible', metadata: {},
        content: ':::zw-dialog{speaker:"受付係"}\n{書類|しょるい}を受け取りました。\n:::\n\n[帰る](chapter://終わり)'
      },
      { title: '下書き', order: 2, level: 2, visibility: 'draft', metadata: {}, content: '渡さない章' },
      { title: '終わり', order: 3, level: 2, visibility: 'visible', metadata: {}, content: '試験の場面はここで終わります。' }
    ]
  };
}

test('a Zen Writer project becomes the same wp-ng-0.2 envelope as the NarrativeGen sample', () => {
  const { envelope, warnings } = Bridge.projectToContract(sampleProject());
  assert.deepEqual(envelope, fixture('wp-ng-0.2-branching.json'));
  assert.deepEqual(warnings, ['下書き: 非表示の章は渡しません', '受付: 装飾タグは渡らないため外しました']);
});

test('an envelope becomes chapters that read back to the same envelope', () => {
  const sample = fixture('wp-ng-0.2-branching.json');
  const project = Bridge.contractToProject({ contractVersion: sample.contractVersion, modelId: sample.sourceDocumentId, nodes: sample.nodes });
  assert.equal(project.format, 'zenwriter-v1');
  assert.deepEqual(project.pages.map((p) => p.title), ['受付', '書類', '終わり']);
  assert.match(project.pages[0].content, /^:::zw-dialog\{speaker:"受付係", position:"left", style:"bubble"\}\nここは試験用の受付です。\n:::/);
  assert.match(project.pages[0].content, /- \[書類を出す\]\(chapter:\/\/%E6%9B%B8%E9%A1%9E\)/);
  const back = Bridge.projectToContract(project);
  assert.deepEqual(back.envelope.nodes, sample.nodes);
  assert.deepEqual(back.warnings, []);
});

test('screen frames render as Reader blocks with the same order as the Unity chat', () => {
  const route = fixture('screen-route-blue-selvedge.json');
  const md = Bridge.framesToMarkdown(route.frames);
  const blocks = Parser.parseSegments(md).filter((s) => s.type !== 'text');
  const dialogs = blocks.filter((s) => s.type === 'dialog');

  assert.equal(blocks[0].type, 'textbox');
  assert.equal(blocks[0].content, '灰渡りの港｜藍布の耳\n' + route.frames[0].header.goal);
  // One right-side bubble per choice the player made, in order.
  assert.deepEqual(dialogs.filter((d) => d.attrs.position === 'right').map((d) => d.content),
    route.frames.slice(1).map((f) => f.choiceText));
  // Every paragraph of every frame is a left bubble of that frame's speaker.
  const expected = route.frames.flatMap((f) => f.paragraphs.map((p) => [f.speaker, p.map((s) => s.text).join('').trim()]));
  assert.deepEqual(dialogs.filter((d) => d.attrs.position === 'left').map((d) => [d.attrs.speaker, d.content]), expected);
  const system = blocks.filter((s) => s.attrs.role === 'system').map((s) => s.content);
  assert.equal(system.filter((s) => s.startsWith('旅の手帳に記した — ')).length, route.frames.at(-1).notes.length);
  assert.deepEqual(system.slice(-3, -2), ['依頼完了']);
  assert.equal(system.at(-1), '再生終了');
  assert.match(Parser.toHtml(md), /class="zw-dialog zw-dialog--right zw-dialog--bubble"/);
});

test('a transcript that stops mid-story lists the choices of the last frame', () => {
  const route = fixture('screen-route-blue-selvedge.json');
  const md = Bridge.framesToMarkdown(route.frames.slice(0, 2));
  assert.match(md, /\*\*話題\*\*\n\n- 白糸の署名/);
  assert.match(md, /\*\*行き先\*\*\n\n- 干し場の藍布\n- 布改め小屋\n$/);
});

test('incompatible input stops with the reason', () => {
  assert.throws(() => Bridge.contractToProject({ contractVersion: 'wp-ng-1.0', modelId: 'x', nodes: [] }), /wp-ng-1\.0 は互換がありません/);
  assert.throws(() => Bridge.contractToProject({ contractVersion: 'wp-ng-0.2', modelId: 'x', nodes: [{ nodeId: 'a', text: '' }, { nodeId: 'a', text: '' }] }), /nodeId a が重複しています/);
  const dup = sampleProject();
  dup.pages[1].title = '受付';
  assert.throws(() => Bridge.projectToContract(dup), /nodeId 受付 が重複しています/);
  assert.throws(() => Bridge.framesToMarkdown([{ format: 'narrativegen-screen-frame', version: 2 }]), /version 1 ではありません/);
});

test('speaker names that would break the attribute syntax are kept readable', () => {
  const md = Bridge.framesToMarkdown([{
    format: 'narrativegen-screen-frame', version: 1, layout: 'standard', step: 0, nodeId: 'a', choiceId: null, choiceText: null,
    header: null, place: '', speaker: '甲, "乙"}', paragraphs: [[{ text: '本文' }]], choiceGroups: [], notes: [], newNote: false, ending: true
  }]);
  const dialog = Parser.parseSegments(md).find((s) => s.type === 'dialog');
  assert.equal(dialog.attrs.speaker, '甲， ”乙”｝');
  assert.equal(dialog.content, '本文');
});
