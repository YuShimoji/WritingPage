#!/usr/bin/env node
/**
 * セッション終端チェックスクリプト
 * 
 * セッション終端時に「やり残し（git dirty / docs/inbox / Driver入口の誤り / Orchestrator Report テンプレート）」を機械的に検知する。
 * 異常時には明確なメッセージを出力し、exit code 1 を返す。
 * 
 * shared-workflows 版をベースに、プロジェクト固有の checkDriverEntry() 機能を統合。
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', ...options });
  return {
    code: result.status ?? 1,
    stdout: (result.stdout || '').toString(),
    stderr: (result.stderr || '').toString()
  };
}

function detectGitRoot(cwd) {
  const r = run('git', ['rev-parse', '--show-toplevel'], { cwd });
  if (r.code !== 0) return null;
  return (r.stdout || '').trim() || null;
}

function listReportCandidates(projectRoot, options = {}) {
  const candidates = [];
  const includeArchived = options.includeArchived === true;
  const dirs = includeArchived
    ? [path.join(projectRoot, 'docs', 'inbox'), path.join(projectRoot, 'docs', 'reports')]
    : [path.join(projectRoot, 'docs', 'inbox')];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir);
    for (const name of entries) {
      if (!/^REPORT_ORCH_.*\.md$/i.test(name)) continue;
      const full = path.join(dir, name);
      try {
        const stat = fs.statSync(full);
        if (stat.isFile()) candidates.push({ path: full, mtimeMs: stat.mtimeMs });
      } catch {
        // ignore
      }
    }
  }
  // Prefer filename order when timestamp is embedded (to avoid mtime noise).
  candidates.sort((a, b) => path.basename(b.path).localeCompare(path.basename(a.path)));
  return candidates;
}

function checkLatestOrchestratorReportHasUserTemplate(projectRoot, options = {}) {
  const errors = [];
  const warnings = [];

  const candidates = listReportCandidates(projectRoot, { includeArchived: options.includeArchived === true });
  if (candidates.length === 0) {
    warnings.push('Orchestrator Report が見つかりません（docs/inbox に REPORT_ORCH_*.md がありません）');
    return { errors, warnings, latest: null };
  }

  const latest = candidates[0].path;
  const content = fs.readFileSync(latest, 'utf8');

  const hasUserTemplate =
    /##\s*次のアクション/i.test(content) &&
    (/完了判定/i.test(content) || /【確認】完了判定/.test(content)) &&
    (/選択肢1|選択肢2|選択肢3/.test(content) || /【次に私（ユーザー）が返す内容】/.test(content));

  if (!hasUserTemplate) {
    errors.push(
      `最新Orchestrator Reportにユーザー返信テンプレ（完了判定 + 選択肢1-3）がありません: ${path.relative(projectRoot, latest)}`
    );
  }

  return { errors, warnings, latest };
}

/**
 * ORCHESTRATOR_DRIVER.txt の入口が正しいかチェック（プロジェクト固有機能）
 */
function checkDriverEntry(projectRoot) {
  const errors = [];
  const warnings = [];
  const DRIVER_PATH = path.join(projectRoot, 'prompts', 'every_time', 'ORCHESTRATOR_DRIVER.txt');

  try {
    const content = fs.readFileSync(DRIVER_PATH, 'utf8');
    
    // 必須キーワードのチェック
    const requiredKeywords = [
      'Orchestrator',
      'MISSION_LOG',
      'Phase',
      'Driver'
    ];
    
    const missingKeywords = requiredKeywords.filter(keyword => {
      return !content.includes(keyword);
    });

    if (missingKeywords.length > 0) {
      errors.push(`ORCHESTRATOR_DRIVER.txt に必須キーワードが不足しています:`);
      missingKeywords.forEach(keyword => {
        errors.push(`  - "${keyword}"`);
      });
      errors.push('');
      errors.push('対処: ORCHESTRATOR_DRIVER.txt の内容を確認し、入口の固定が崩れていないか確認してください');
    }

    // 入口の固定が崩れていないか（特定のパターンをチェック）
    const hasCorrectEntry = 
      content.includes('prompts/every_time/ORCHESTRATOR_DRIVER.txt') ||
      content.includes('ORCHESTRATOR_DRIVER.txt');
    
    if (!hasCorrectEntry) {
      warnings.push('ORCHESTRATOR_DRIVER.txt の入口参照が不明確です');
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      errors.push(`ORCHESTRATOR_DRIVER.txt が存在しません: ${DRIVER_PATH}`);
      errors.push('');
      errors.push('対処: ORCHESTRATOR_DRIVER.txt を復元してください');
    } else {
      warnings.push(`ORCHESTRATOR_DRIVER.txt の読み取りに失敗しました: ${e.message}`);
    }
  }

  return { errors, warnings };
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    projectRoot: process.cwd(),
    noFetch: false,
    format: 'text',
    includeArchived: false
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--project-root' && i + 1 < args.length) {
      options.projectRoot = args[i + 1];
      i++;
    } else if (a.startsWith('--project-root=')) {
      options.projectRoot = a.split('=')[1];
    } else if (a === '--no-fetch') {
      options.noFetch = true;
    } else if (a === '--include-archived') {
      options.includeArchived = true;
    } else if (a === '--format' && i + 1 < args.length) {
      options.format = args[i + 1];
      i++;
    } else if (a.startsWith('--format=')) {
      options.format = a.split('=')[1];
    }
  }

  if (!['text', 'json'].includes(options.format)) options.format = 'text';
  options.projectRoot = path.resolve(options.projectRoot);
  return options;
}

function main() {
  const options = parseArgs(process.argv);
  const projectRoot = options.projectRoot;

  const results = [];
  const errors = [];
  const warnings = [];

  const gitRoot = detectGitRoot(projectRoot);
  if (!gitRoot) {
    warnings.push('Gitリポジトリではないため、git clean / push pending の検査をスキップします');
    results.push({ id: 'git.detect', severity: 'WARN', message: 'not a git repository', context: { projectRoot } });
  } else {
    results.push({ id: 'git.detect', severity: 'OK', message: 'git repository detected', context: { gitRoot } });

    const status = run('git', ['status', '--porcelain'], { cwd: gitRoot });
    const porcelain = (status.stdout || '').trim();
    if (porcelain.length > 0) {
      errors.push('作業ツリーがクリーンではありません（git status -sb で M/?? が残っています）');
      results.push({ id: 'git.clean', severity: 'ERROR', message: 'working tree is not clean', context: { sample: porcelain.split('\n').slice(0, 20) } });
    } else {
      results.push({ id: 'git.clean', severity: 'OK', message: 'working tree is clean' });
    }

    if (!options.noFetch) {
      run('git', ['fetch', '--all', '--prune'], { cwd: gitRoot });
    }

    const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: gitRoot });
    const currentBranch = (branch.stdout || '').trim();

    if (currentBranch && currentBranch !== 'HEAD') {
      const upstream = run('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: gitRoot });
      if (upstream.code !== 0) {
        warnings.push('upstream が設定されていないため、push pending の検査をスキップします');
        results.push({ id: 'git.upstream', severity: 'WARN', message: 'no upstream', context: { branch: currentBranch } });
      } else {
        const upstreamRef = (upstream.stdout || '').trim();
        const aheadBehind = run('git', ['rev-list', '--left-right', '--count', `${upstreamRef}...${currentBranch}`], { cwd: gitRoot });
        const ab = (aheadBehind.stdout || '').trim();
        const [behindStr, aheadStr] = ab.split(/\s+/);
        const behind = Number(behindStr || 0);
        const ahead = Number(aheadStr || 0);
        if (ahead > 0) {
          warnings.push(`push pending: ローカルが upstream より ahead (${ahead}) です`);
          results.push({ id: 'git.push-pending', severity: 'WARN', message: 'push pending', context: { upstream: upstreamRef, ahead, behind } });
        } else {
          results.push({ id: 'git.push-pending', severity: 'OK', message: 'no push pending', context: { upstream: upstreamRef, ahead, behind } });
        }
      }
    } else {
      warnings.push('現在ブランチ名を取得できないため、push pending の検査をスキップします');
      results.push({ id: 'git.branch', severity: 'WARN', message: 'cannot determine branch' });
    }
  }

  // Orchestrator report template presence check
  const reportCheck = checkLatestOrchestratorReportHasUserTemplate(projectRoot, { includeArchived: options.includeArchived });
  errors.push(...reportCheck.errors);
  warnings.push(...reportCheck.warnings);
  results.push({
    id: 'report.user-template',
    severity: reportCheck.errors.length ? 'ERROR' : reportCheck.warnings.length ? 'WARN' : 'OK',
    message: reportCheck.errors.length
      ? 'latest orchestrator report missing stable user reply template'
      : reportCheck.warnings.length
        ? 'no orchestrator report found'
        : 'latest orchestrator report includes user reply template',
    context: { latest: reportCheck.latest ? path.relative(projectRoot, reportCheck.latest) : null }
  });

  // Driver entry check (project-specific)
  const driverCheck = checkDriverEntry(projectRoot);
  errors.push(...driverCheck.errors);
  warnings.push(...driverCheck.warnings);
  results.push({
    id: 'driver.entry',
    severity: driverCheck.errors.length ? 'ERROR' : driverCheck.warnings.length ? 'WARN' : 'OK',
    message: driverCheck.errors.length
      ? 'ORCHESTRATOR_DRIVER.txt missing required keywords or file'
      : driverCheck.warnings.length
        ? 'ORCHESTRATOR_DRIVER.txt entry reference unclear'
        : 'ORCHESTRATOR_DRIVER.txt entry is valid'
  });

  const ok = errors.length === 0;
  if (options.format === 'json') {
    console.log(JSON.stringify({ ok, errors, warnings, results }, null, 2));
  } else {
    console.log('Session End Check');
    console.log(`Project Root: ${projectRoot}`);
    console.log(`Result: ${ok ? 'OK' : 'NOT OK'}`);
    if (errors.length) {
      console.log('\nErrors:');
      for (const e of errors) console.log(`  - ${e}`);
    }
    if (warnings.length) {
      console.log('\nWarnings:');
      for (const w of warnings) console.log(`  - ${w}`);
    }
  }

  process.exit(ok ? 0 : 1);
}

main();
