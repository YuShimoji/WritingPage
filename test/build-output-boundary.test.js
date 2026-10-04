const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const script = path.resolve(__dirname, '../scripts/build-dist.js');

test('explicit dist output copies to a fresh directory and preserves existing output on retry', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'writing-build-boundary-'));
  const source = path.join(fixture, 'source');
  const output = path.join(fixture, 'output');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'index.html'), '<p>synthetic</p>');
  const run = target => spawnSync(process.execPath, [script, '--out-dir', target], {cwd:source,encoding:'utf8'});
  assert.equal(run(output).status, 0);
  assert.equal(fs.readFileSync(path.join(output,'index.html'),'utf8'),'<p>synthetic</p>');
  assert.equal(fs.existsSync(path.join(source,'dist')),false);
  fs.writeFileSync(path.join(output,'retain.txt'),'preserve');
  const retry = run(output);
  assert.notEqual(retry.status,0);
  assert.match(retry.stderr,/already exists/);
  assert.equal(fs.readFileSync(path.join(output,'retain.txt'),'utf8'),'preserve');
  assert.notEqual(run(source).status,0);
  assert.equal(fs.readFileSync(path.join(source,'index.html'),'utf8'),'<p>synthetic</p>');
});
