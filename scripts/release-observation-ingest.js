const { execFileSync } = require('node:child_process');
const path = require('node:path');
const {
  BLOCKED,
  ObservationIngestionError,
  ingestObservation,
} = require('./release-observation-lib');

const projectRoot = path.join(__dirname, '..');

function parseArgs(argv) {
  const options = {};
  const keys = new Map([
    ['--checkpoint', 'checkpointPath'],
    ['--package', 'packagePath'],
    ['--observation', 'observationPath'],
    ['--out', 'outDir'],
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (keys.has(arg) && argv[index + 1]) {
      options[keys.get(arg)] = argv[index + 1];
      index += 1;
      continue;
    }
    const equalsEntry = [...keys.entries()].find(([flag]) => arg.startsWith(`${flag}=`));
    if (equalsEntry) {
      options[equalsEntry[1]] = arg.slice(equalsEntry[0].length + 1);
      continue;
    }
    throw new ObservationIngestionError(
      'UNKNOWN_ARGUMENT',
      `未対応の引数です: ${arg}`,
      ['command.arguments'],
    );
  }
  const missing = [...keys.values()].filter((key) => !options[key]);
  if (missing.length > 0) {
    throw new ObservationIngestionError(
      'MISSING_ARGUMENT',
      `必須引数がありません: ${missing.join(', ')}`,
      ['command.arguments'],
    );
  }
  return options;
}

function gitHead() {
  return execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: projectRoot,
    encoding: 'utf8',
    windowsHide: true,
  }).trim();
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = ingestObservation({
      ...options,
      synthesisToolCommit: gitHead(),
    });
    console.log(`Electron observation derivative: ${result.outDir}`);
    console.log(`Decision: ${result.internalReview.derivativeDecision.overall}`);
    if (result.internalReview.derivativeDecision.overall === BLOCKED) process.exitCode = 1;
  } catch (error) {
    if (error instanceof ObservationIngestionError) {
      console.error(JSON.stringify({
        code: error.code,
        message: error.message,
        decision: error.decision,
      }, null, 2));
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

main();
