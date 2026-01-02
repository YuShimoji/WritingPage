const fs = require('fs');
const path = require('path');
const { detectSwRoot } = require('./utils/sw-path');

const FILES = [
  'docs/Windsurf_AI_Collab_Rules_v2.0.md',
  'docs/Windsurf_AI_Collab_Rules_latest.md'
];

function ensureDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function copyIfMissing(projectRoot, swRoot, relativePath) {
  const destPath = path.join(projectRoot, relativePath);
  if (fs.existsSync(destPath)) {
    return { status: 'exists', relativePath };
  }

  const source = path.join(swRoot, relativePath);
  if (!fs.existsSync(source)) {
    return { status: 'missing_source', relativePath };
  }

  ensureDirectory(destPath);
  fs.copyFileSync(source, destPath);
  return { status: 'copied', relativePath };
}

function parseArg(flag, defaultValue) {
  const args = process.argv.slice(2);
  const index = args.indexOf(flag);
  if (index === -1) return defaultValue;
  return args[index + 1];
}

function hasFlag(flag) {
  return process.argv.slice(2).includes(flag);
}

function resolveProjectRoot(initialProjectRoot) {
  const resolved = path.resolve(initialProjectRoot || process.cwd());
  return resolved;
}

function normalizeProjectRoot(projectRoot, swRoot) {
  if (!projectRoot || !swRoot) return projectRoot;

  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedSwRoot = path.resolve(swRoot);

  const base = path.basename(resolvedSwRoot);
  const looksLikeSubmodule = base === '.shared-workflows' || base === 'shared-workflows';

  if (looksLikeSubmodule) {
    const parent = path.dirname(resolvedSwRoot);
    const insideSwRoot = resolvedProjectRoot === resolvedSwRoot || resolvedProjectRoot.startsWith(resolvedSwRoot + path.sep);
    if (insideSwRoot) {
      return parent;
    }
  }

  return resolvedProjectRoot;
}

function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    console.log(`Usage: node <path>/ensure-ssot.js [options]

Options:
  --project-root <path>   Copy destination project root (default: cwd)
  --help, -h              Show help
`);
    return;
  }

  const projectRootArg = parseArg('--project-root', '');
  const initialProjectRoot = resolveProjectRoot(projectRootArg);
  const swRoot = detectSwRoot(initialProjectRoot);

  const projectRoot = normalizeProjectRoot(initialProjectRoot, swRoot);

  if (!swRoot) {
    console.error('shared-workflows の配置を検出できませんでした。SW_ROOT 環境変数を確認してください。');
    process.exit(1);
  }

  let copied = 0;
  let missingSources = [];

  FILES.forEach((relativePath) => {
    const result = copyIfMissing(projectRoot, swRoot, relativePath);
    switch (result.status) {
      case 'copied':
        copied += 1;
        console.log(`Copied: ${relativePath}`);
        break;
      case 'missing_source':
        missingSources.push(relativePath);
        console.warn(`Source file not found in shared-workflows: ${relativePath}`);
        break;
      default:
        console.log(`Exists: ${relativePath}`);
    }
  });

  if (missingSources.length) {
    console.error(`共有リポジトリに以下のファイルが見つかりませんでした: ${missingSources.join(', ')}`);
    process.exit(1);
  }

  if (!copied) {
    console.log('すべてのファイルが既に存在しています。');
  } else {
    console.log(`合計 ${copied} 件のファイルをコピーしました。`);
  }
}

main();
