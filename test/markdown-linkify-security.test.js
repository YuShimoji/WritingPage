const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const vm = require('node:vm');

const HARD_TIMEOUT_MS = 4000;
const TRACKED_VENDOR_PATH = path.resolve(__dirname, '../vendor/markdown-it.min.js');
const NORMAL_MARKDOWN = [
  '# Linkify compatibility',
  '',
  'Visit https://example.com and email writer@example.com.',
  '',
  '**ordinary emphasis**',
  'first line',
  'second line'
].join('\n');
const PROBES = {
  fuzzyEmail: 'a@b.com\n'.repeat(16000),
  contiguousMailto: 'mailto:'.repeat(64000)
};

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function loadVendor(source) {
  const sandbox = { module: { exports: {} }, exports: {} };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(source.toString('utf8'), sandbox, {
    filename: 'markdown-it.min.js'
  });
  return sandbox.module.exports;
}

function versionFromJson(value) {
  return JSON.parse(value.toString('utf8')).version;
}

function createRuntime(runtimeName, sourcePath) {
  if (runtimeName === 'node') {
    return {
      factory: require('markdown-it'),
      identity: {
        runtime: 'node-package',
        markdownIt: require('markdown-it/package.json').version,
        linkifyIt: require('linkify-it/package.json').version
      }
    };
  }

  if (runtimeName === 'vendor') {
    const vendorBytes = fs.readFileSync(sourcePath || TRACKED_VENDOR_PATH);
    return {
      factory: loadVendor(vendorBytes),
      identity: {
        runtime: 'tracked-vendor',
        markdownIt: require('markdown-it/package.json').version,
        linkifyIt: require('linkify-it/package.json').version,
        sha256: sha256(vendorBytes)
      }
    };
  }

  if (runtimeName === 'asar') {
    const asar = require('@electron/asar');
    const vendorBytes = asar.extractFile(sourcePath, 'vendor/markdown-it.min.js');
    return {
      factory: loadVendor(vendorBytes),
      identity: {
        runtime: 'packaged-vendor',
        markdownIt: versionFromJson(
          asar.extractFile(sourcePath, 'node_modules/markdown-it/package.json')
        ),
        linkifyIt: versionFromJson(
          asar.extractFile(sourcePath, 'node_modules/linkify-it/package.json')
        ),
        sha256: sha256(vendorBytes)
      }
    };
  }

  throw new Error(`Unknown runtime: ${runtimeName}`);
}

function inputForProbe(probeName) {
  if (probeName === 'normal') {
    return NORMAL_MARKDOWN;
  }
  if (Object.hasOwn(PROBES, probeName)) {
    return PROBES[probeName];
  }
  throw new Error(`Unknown probe: ${probeName}`);
}

function executeProbe(runtimeName, probeName, sourcePath) {
  const runtime = createRuntime(runtimeName, sourcePath);
  const input = inputForProbe(probeName);
  const renderer = runtime.factory({
    html: false,
    linkify: true,
    breaks: true
  });
  const started = process.hrtime.bigint();
  const result = probeName === 'normal'
    ? renderer.render(input)
    : renderer.linkify.test(input);
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;

  return {
    probe: probeName,
    inputBytes: Buffer.byteLength(input),
    timeoutMs: HARD_TIMEOUT_MS,
    elapsedMs: Number(elapsedMs.toFixed(3)),
    outputBytes: probeName === 'normal' ? Buffer.byteLength(result) : undefined,
    html: probeName === 'normal' ? result : undefined,
    matched: probeName === 'normal' ? undefined : result,
    identity: runtime.identity
  };
}

function runBoundedProbe(runtimeName, probeName, sourcePath) {
  return new Promise((resolve, reject) => {
    const args = [__filename, '--probe-child', runtimeName, probeName];
    if (sourcePath) {
      args.push(sourcePath);
    }
    const child = spawn(process.execPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
      reject(new Error(
        `${runtimeName}/${probeName} exceeded the ${HARD_TIMEOUT_MS} ms hard timeout`
      ));
    }, HARD_TIMEOUT_MS);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        return;
      }
      if (code !== 0) {
        reject(new Error(
          `${runtimeName}/${probeName} failed with exit ${code}: ${stderr || stdout}`
        ));
        return;
      }
      resolve(JSON.parse(stdout));
    });
  });
}

async function runProbeSuite(runtimeName, sourcePath) {
  const normal = await runBoundedProbe(runtimeName, 'normal', sourcePath);
  const pathological = [];
  for (const probeName of Object.keys(PROBES)) {
    pathological.push(await runBoundedProbe(runtimeName, probeName, sourcePath));
  }
  return { normal, pathological };
}

function assertNormalMarkdown(result) {
  assert.match(result.html, /<h1>Linkify compatibility<\/h1>/);
  assert.match(
    result.html,
    /<a href="https:\/\/example\.com">https:\/\/example\.com<\/a>/
  );
  assert.match(
    result.html,
    /<a href="mailto:writer@example\.com">writer@example\.com<\/a>/
  );
  assert.match(result.html, /<strong>ordinary emphasis<\/strong>/);
  assert.match(result.html, /first line<br>\nsecond line/);
  assert.equal(result.identity.markdownIt, '14.3.0');
  assert.equal(result.identity.linkifyIt, '5.0.2');
}

async function main() {
  const mode = process.argv[2];
  if (mode === '--probe-child') {
    const result = executeProbe(process.argv[3], process.argv[4], process.argv[5]);
    process.stdout.write(JSON.stringify(result));
    return;
  }
  if (mode === '--probe-suite') {
    const result = await runProbeSuite(process.argv[3], process.argv[4]);
    process.stdout.write(JSON.stringify(result, null, 2));
    return;
  }

  test('markdown-it dependency and tracked vendor identities are patched', () => {
    const vendorBytes = fs.readFileSync(TRACKED_VENDOR_PATH);
    const officialBytes = fs.readFileSync(
      require.resolve('markdown-it/dist/markdown-it.min.js')
    );

    assert.equal(require('markdown-it/package.json').version, '14.3.0');
    assert.equal(require('linkify-it/package.json').version, '5.0.2');
    assert.match(vendorBytes.toString('utf8', 0, 120), /markdown-it 14\.3\.0/);
    assert.equal(sha256(vendorBytes), sha256(officialBytes));
  });

  test('Node and tracked vendor preserve normal Markdown and autolink parity', async (t) => {
    const nodeResult = await runBoundedProbe('node', 'normal');
    const vendorResult = await runBoundedProbe(
      'vendor',
      'normal',
      TRACKED_VENDOR_PATH
    );

    assertNormalMarkdown(nodeResult);
    assertNormalMarkdown(vendorResult);
    assert.equal(vendorResult.html, nodeResult.html);
    t.diagnostic(JSON.stringify([nodeResult, vendorResult]));
  });

  test('Node and tracked vendor bound both linkify pathological inputs', async (t) => {
    for (const runtimeName of ['node', 'vendor']) {
      for (const probeName of Object.keys(PROBES)) {
        const sourcePath = runtimeName === 'vendor' ? TRACKED_VENDOR_PATH : undefined;
        const result = await runBoundedProbe(runtimeName, probeName, sourcePath);
        assert.equal(result.identity.markdownIt, '14.3.0');
        assert.equal(result.identity.linkifyIt, '5.0.2');
        assert.ok(result.elapsedMs < HARD_TIMEOUT_MS);
        t.diagnostic(JSON.stringify(result));
      }
    }
  });
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
